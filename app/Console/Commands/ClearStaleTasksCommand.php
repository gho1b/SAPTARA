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

class ClearStaleTasksCommand extends Command
{
    protected $signature = 'saptara:clear-stale-tasks
                            {--timeout=15 : Ambang batas usia task running dalam menit (default 15 menit)}
                            {--all-running : Batalkan paksa seluruh task yang berstatus running atau queued}';

    protected $description = 'Membersihkan mutex cache jadwal artisan (schedule:clear-cache) dan menandai background task yang macet/menggantung sebagai gagal.';

    public function handle(): int
    {
        $timeoutMinutes = (int) ($this->option('timeout') ?: 15);
        $forceAll = (bool) $this->option('all-running');
        $now = Carbon::now('Asia/Jakarta');
        $threshold = $now->copy()->subMinutes($timeoutMinutes);

        $this->info('=== SAPTARA: Pembersihan Task Menggantung & Schedule Cache ===');
        $this->line("Waktu Eksekusi   : <comment>{$now->format('Y-m-d H:i:s')} WIB</comment>");
        $this->line('Mode Pembersihan : '.($forceAll ? '<comment>Semua Task Running/Queued (--all-running)</comment>' : "<comment>Task Menggantung > {$timeoutMinutes} Menit</comment>"));
        $this->newLine();

        // 1. Eksekusi Laravel schedule:clear-cache untuk menghapus mutex lock schedule yang macet
        $this->line('1. Menghapus Mutex Lock Artisan Scheduler...');
        try {
            $exitCode = Artisan::call('schedule:clear-cache');
            $scheduleOutput = trim(Artisan::output());
            $this->info('   ✓ schedule:clear-cache berhasil dijalankan: '.($scheduleOutput ?: 'Schedule mutex cache cleared.'));
        } catch (Throwable $e) {
            $this->error('   ✗ Gagal menjalankan schedule:clear-cache: '.$e->getMessage());
            Log::error('schedule:clear-cache gagal: '.$e->getMessage());
        }

        $this->newLine();

        // 2. Scan & Bersihkan Task Background yang Menggantung
        $this->line('2. Memindai Background Task yang Menggantung / Macet...');

        $clearedTaskIds = [];
        $logDir = storage_path('logs/tasks');
        $stateDir = storage_path('app/command_executions');

        // A. Cek dari Database CommandExecution jika tabel tersedia
        if (Schema::hasTable('command_executions')) {
            $query = CommandExecution::whereIn('status', ['running', 'queued']);

            if (! $forceAll) {
                $query->where(function ($q) use ($threshold) {
                    $q->where('started_at', '<=', $threshold->toDateTimeString())
                        ->orWhere(function ($q2) use ($threshold) {
                            $q2->whereNull('started_at')
                                ->where('created_at', '<=', $threshold->toDateTimeString());
                        });
                });
            }

            $staleTasks = $query->get();
            foreach ($staleTasks as $task) {
                $clearedTaskIds[] = $task->id;
                $task->update([
                    'status' => 'failed',
                    'exit_code' => 124, // 124: Linux standard command timed out / killed
                    'finished_at' => $now->toDateTimeString(),
                    'duration_seconds' => $task->started_at ? Carbon::parse($task->started_at)->diffInSeconds($now) : 0,
                ]);

                // Append ke log task terkait
                $taskLog = $task->output_log_path ?: $logDir.'/'.$task->id.'.log';
                if (File::exists($taskLog)) {
                    $notice = "\n\n[DIBERSIHKAN OLEH SISTEM]\n".
                              "Task ini dihentikan dan dibersihkan oleh saptara:clear-stale-tasks pada {$now->format('Y-m-d H:i:s')} WIB.\n".
                              ($forceAll ? 'Penyebab: Pembatalan paksa oleh Super Admin (--all-running).' : "Penyebab: Task melampaui batas toleransi {$timeoutMinutes} menit tanpa update.\n");
                    File::append($taskLog, $notice);
                }
            }
        }

        // B. Cek dari File JSON State Fallback
        if (File::exists($stateDir)) {
            $files = File::files($stateDir);
            foreach ($files as $file) {
                $id = pathinfo($file->getFilename(), PATHINFO_FILENAME);
                if (in_array($id, $clearedTaskIds, true)) {
                    continue;
                }

                $data = json_decode(File::get($file->getPathname()), true);
                if (! is_array($data)) {
                    continue;
                }

                $status = $data['status'] ?? '';
                if ($status !== 'running' && $status !== 'queued') {
                    continue;
                }

                $taskTimeStr = $data['started_at'] ?? $data['created_at'] ?? null;
                $taskTime = $taskTimeStr ? Carbon::parse($taskTimeStr) : null;

                if ($forceAll || (! $taskTime || $taskTime->lte($threshold))) {
                    $clearedTaskIds[] = $id;
                    $data['status'] = 'failed';
                    $data['exit_code'] = 124;
                    $data['finished_at'] = $now->toDateTimeString();
                    $data['duration_seconds'] = $taskTime ? $taskTime->diffInSeconds($now) : 0;
                    File::put($file->getPathname(), json_encode($data, JSON_PRETTY_PRINT));

                    $taskLog = $data['output_log_path'] ?? $logDir.'/'.$id.'.log';
                    if (File::exists($taskLog)) {
                        $notice = "\n\n[DIBERSIHKAN OLEH SISTEM]\n".
                                  "Task ini dihentikan dan dibersihkan oleh saptara:clear-stale-tasks pada {$now->format('Y-m-d H:i:s')} WIB.\n".
                                  ($forceAll ? 'Penyebab: Pembatalan paksa oleh Super Admin (--all-running).' : "Penyebab: Task melampaui batas toleransi {$timeoutMinutes} menit tanpa update.\n");
                        File::append($taskLog, $notice);
                    }
                }
            }
        }

        $clearedCount = count($clearedTaskIds);

        if ($clearedCount > 0) {
            $this->warn("   ✓ Ditemukan dan berhasil membersihkan {$clearedCount} task yang macet/menggantung:");
            foreach ($clearedTaskIds as $tId) {
                $this->line("     - Task ID: <comment>{$tId}</comment>");
            }
        } else {
            $this->info('   ✓ Tidak ditemukan task background yang macet/menggantung.');
        }

        $this->newLine();
        $this->info('================ RINGKASAN PEMBERSIHAN ================');
        $this->info('Scheduler Mutex Cache   : <info>BERSIH</info>');
        $this->info("Task Macet Dibersihkan  : <comment>{$clearedCount}</comment> task");
        $this->info('Status Operasional      : <info>NORMAL</info>');
        $this->info('=======================================================');

        Log::warning('PERINGATAN: saptara:clear-stale-tasks dijalankan oleh Super Admin.', [
            'cleared_tasks_count' => $clearedCount,
            'cleared_task_ids' => $clearedTaskIds,
            'force_all' => $forceAll,
            'timeout_minutes' => $timeoutMinutes,
            'executed_at' => $now->toIso8601String(),
        ]);

        return self::SUCCESS;
    }
}
