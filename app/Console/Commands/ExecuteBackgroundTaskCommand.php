<?php

namespace App\Console\Commands;

use App\Models\CommandExecution;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ExecuteBackgroundTaskCommand extends Command
{
    protected $signature = 'saptara:execute-task {id : UUID dari task eksekusi yang akan dijalankan}';

    protected $description = 'Worker internal untuk mengeksekusi console command di latar belakang (background) dan mencatat outputnya secara mandiri.';

    public function handle(): int
    {
        $id = $this->argument('id');
        $logDir = storage_path('logs/tasks');
        $stateDir = storage_path('app/command_executions');

        if (! File::exists($logDir)) {
            File::makeDirectory($logDir, 0755, true, true);
        }
        if (! File::exists($stateDir)) {
            File::makeDirectory($stateDir, 0755, true, true);
        }

        $logPath = $logDir.'/'.$id.'.log';
        $statePath = $stateDir.'/'.$id.'.json';

        // 1. Ambil data eksekusi dari database atau file fallback
        $execution = null;
        $hasDbTable = false;

        try {
            if (Schema::hasTable('command_executions')) {
                $hasDbTable = true;
                $execution = CommandExecution::find($id);
            }
        } catch (Throwable) {
            $hasDbTable = false;
        }

        $stateData = [];
        if (File::exists($statePath)) {
            $stateData = json_decode(File::get($statePath), true) ?: [];
        }

        $commandSignature = $execution?->command ?? $stateData['command'] ?? null;
        $title = $execution?->title ?? $stateData['title'] ?? 'Task';
        $options = $execution?->options ?? $stateData['options'] ?? [];

        if (! $commandSignature) {
            $err = "Task dengan ID '{$id}' tidak ditemukan.";
            File::put($logPath, "[FATAL ERROR] {$err}\n");
            $this->error($err);

            return self::FAILURE;
        }

        $startedAt = Carbon::now('Asia/Jakarta');

        // Update status menjadi running
        $runningPayload = [
            'status' => 'running',
            'started_at' => $startedAt->toDateTimeString(),
            'output_log_path' => $logPath,
        ];

        if ($hasDbTable && $execution) {
            $execution->update($runningPayload);
        }
        $stateData = array_merge($stateData, $runningPayload);
        File::put($statePath, json_encode($stateData, JSON_PRETTY_PRINT));

        // Tulis header log
        $header = "============================================================\n".
                  "SAPTARA BACKGROUND TASK RUNNER\n".
                  "Task ID   : {$id}\n".
                  "Command   : {$commandSignature}\n".
                  "Title     : {$title}\n".
                  'Started At: '.$startedAt->format('Y-m-d H:i:s')."\n".
                  "============================================================\n\n";
        File::put($logPath, $header);

        $exitCode = 0;
        $output = '';

        try {
            // Siapkan parameter Artisan
            $params = [];
            if (! empty($options['dry_run'])) {
                $params['--dry-run'] = true;
            }
            if (! empty($options['recalculate'])) {
                $params['--recalculate'] = true;
            }
            if (! empty($options['bulk'])) {
                $params['--bulk'] = (int) $options['bulk'];
            } elseif (! empty($options['limit'])) {
                $params['--limit'] = (int) $options['limit'];
            }
            if (! empty($options['all_running'])) {
                $params['--all-running'] = true;
            }
            if (! empty($options['timeout'])) {
                $params['--timeout'] = (int) $options['timeout'];
            }
            if (! empty($options['sweep_orphans'])) {
                $params['--sweep-orphans'] = true;
            }
            if (! empty($options['directory'])) {
                $params['--directory'] = (string) $options['directory'];
            }
            if (! empty($options['update_db'])) {
                $params['--update-db'] = true;
            }

            // Jalankan command
            $exitCode = Artisan::call($commandSignature, $params);
            $output = Artisan::output();

            File::append($logPath, $output);
        } catch (Throwable $e) {
            $exitCode = 1;
            $errorText = "\n[EXCEPTION OCCURRED]\n".$e->getMessage()."\n\nStack Trace:\n".$e->getTraceAsString()."\n";
            File::append($logPath, $errorText);
            Log::error("Background task {$id} ({$commandSignature}) gagal: ".$e->getMessage());
        }

        $finishedAt = Carbon::now('Asia/Jakarta');
        $durationSeconds = $startedAt->diffInSeconds($finishedAt);
        $finalStatus = $exitCode === 0 ? 'completed' : 'failed';

        // Tulis footer log
        $footer = "\n\n============================================================\n".
                  'Status    : '.strtoupper($finalStatus)."\n".
                  "Exit Code : {$exitCode}\n".
                  "Duration  : {$durationSeconds} detik\n".
                  'Finished  : '.$finishedAt->format('Y-m-d H:i:s')."\n".
                  "============================================================\n";
        File::append($logPath, $footer);

        // Update status final
        $finalPayload = [
            'status' => $finalStatus,
            'exit_code' => $exitCode,
            'finished_at' => $finishedAt->toDateTimeString(),
            'duration_seconds' => $durationSeconds,
        ];

        if ($hasDbTable && $execution) {
            $execution->update($finalPayload);
        }
        $stateData = array_merge($stateData, $finalPayload);
        File::put($statePath, json_encode($stateData, JSON_PRETTY_PRINT));

        Log::info("Background task {$id} ({$commandSignature}) selesai dengan status {$finalStatus} dalam {$durationSeconds}s.");

        return $exitCode === 0 ? self::SUCCESS : self::FAILURE;
    }
}
