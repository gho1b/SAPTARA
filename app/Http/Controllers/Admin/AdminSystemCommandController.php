<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommandExecution;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class AdminSystemCommandController extends Controller
{
    /**
     * Daftar perintah console yang diizinkan untuk dieksekusi secara manual oleh Super Admin.
     */
    protected array $allowedCommands = [
        'backup_db' => [
            'name' => 'db:backup',
            'title' => 'Backup Basis Data',
            'description' => 'Melakukan full dump database MySQL ke file .sql.gz dengan retensi rotasi.',
            'badge' => 'Database',
            'color' => 'emerald',
        ],
        'migrate_r2' => [
            'name' => 'logbook:migrate-to-r2',
            'title' => 'Migrasi Foto ke Cloudflare R2',
            'description' => 'Stream foto logbook lama 1-by-1 ke R2 dan hapus file lokal untuk bebaskan storage hosting.',
            'badge' => 'Storage',
            'color' => 'sky',
        ],
        'optimize_photos' => [
            'name' => 'logbook:optimize-photos',
            'title' => 'Optimasi Ukuran Foto Logbook',
            'description' => 'Crop & kompres foto logbook lama ke standar 960x1280 JPEG dan langsung menimpa file lama.',
            'badge' => 'Media',
            'color' => 'amber',
        ],
        'send_weekly_reports' => [
            'name' => 'saptara:send-weekly-reports',
            'title' => 'Kirim Laporan Mingguan',
            'description' => 'Kirim rekap mingguan pembiasaan karakter ke email orang tua siswa.',
            'badge' => 'Notifikasi',
            'color' => 'indigo',
        ],
        'sync_streaks' => [
            'name' => 'saptara:sync-streaks',
            'title' => 'Sinkronisasi Streak Siswa',
            'description' => 'Sinkronisasi streak harian siswa dan reset streak yang sudah kedaluwarsa.',
            'badge' => 'Gamifikasi',
            'color' => 'purple',
        ],
        'clear_stale_tasks' => [
            'name' => 'saptara:clear-stale-tasks',
            'title' => 'Pembersihan Task & Schedule Cache',
            'description' => 'Hapus mutex lock schedule artisan yang menggantung (schedule:clear-cache) dan tandai task yang macet sebagai failed.',
            'badge' => 'Maintenance',
            'color' => 'rose',
        ],
        'clean_migrated_photos' => [
            'name' => 'logbook:clean-migrated-local',
            'title' => 'Pembersihan Foto cPanel (Sudah di R2)',
            'description' => 'Hapus foto upload lokal di file manager cPanel yang sudah terbukti ada di static.saptara (R2) untuk membebaskan kuota hosting.',
            'badge' => 'Disk Cleaner',
            'color' => 'teal',
        ],
    ];

    /**
     * GET /api/admin/commands
     * Mendapatkan daftar perintah yang tersedia.
     */
    public function index()
    {
        $list = [];
        foreach ($this->allowedCommands as $key => $meta) {
            $list[] = [
                'key' => $key,
                'signature' => $meta['name'],
                'title' => $meta['title'],
                'description' => $meta['description'],
                'badge' => $meta['badge'],
                'color' => $meta['color'],
            ];
        }

        return response()->json($list);
    }

    /**
     * POST /api/admin/commands/run
     * Meluncurkan proses console command di latar belakang (asynchronous) untuk mencegah Cloudflare 524 Timeout.
     */
    public function run(Request $request)
    {
        $request->validate([
            'command' => 'required|string',
            'options' => 'nullable|array',
        ]);

        $key = $request->input('command');
        if (! isset($this->allowedCommands[$key])) {
            return response()->json([
                'success' => false,
                'error' => "Command '{$key}' tidak diizinkan atau tidak terdaftar.",
            ], 422);
        }

        $commandMeta = $this->allowedCommands[$key];
        $commandSignature = $commandMeta['name'];
        $user = $request->user();
        $id = (string) Str::uuid();
        $options = $request->input('options', []);

        // ⚠️ LOG WARNING: Dipicu sebagai penanda bahwa command console dieksekusi secara manual oleh Super Admin
        Log::warning("PERINGATAN: Command console '{$commandSignature}' dijalankan secara MANUAL oleh Super Admin di background!", [
            'execution_id' => $id,
            'command_key' => $key,
            'signature' => $commandSignature,
            'title' => $commandMeta['title'],
            'executed_by_id' => $user?->id,
            'executed_by_name' => $user?->name,
            'executed_by_email' => $user?->email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now('Asia/Jakarta')->toIso8601String(),
            'options' => $options,
        ]);

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

        $initialState = [
            'id' => $id,
            'command_key' => $key,
            'command' => $commandSignature,
            'title' => $commandMeta['title'],
            'status' => 'queued',
            'exit_code' => null,
            'output_log_path' => $logPath,
            'options' => $options,
            'executed_by_id' => $user?->id,
            'executed_by_name' => $user?->name,
            'executed_by_email' => $user?->email,
            'ip_address' => $request->ip(),
            'started_at' => Carbon::now('Asia/Jakarta')->toDateTimeString(),
            'finished_at' => null,
            'duration_seconds' => null,
            'created_at' => Carbon::now('Asia/Jakarta')->toDateTimeString(),
        ];

        // 1. Simpan ke database jika tabel sudah siap
        try {
            if (Schema::hasTable('command_executions')) {
                CommandExecution::create($initialState);
            }
        } catch (Throwable $e) {
            Log::debug('Gagal menyimpan command execution ke DB, menggunakan file fallback: '.$e->getMessage());
        }

        // 2. Simpan ke file JSON sebagai fallback pasti (zero dependency)
        File::put($statePath, json_encode($initialState, JSON_PRETTY_PRINT));
        File::put($logPath, "Menunggu antrean eksekusi background...\n");

        // 3. Jalankan detached PHP CLI process di latar belakang
        $phpBinary = PHP_BINARY && file_exists(PHP_BINARY) ? PHP_BINARY : '/usr/bin/php';
        $artisanPath = base_path('artisan');

        $commandToRun = sprintf(
            '%s %s saptara:execute-task %s > /dev/null 2>&1 &',
            escapeshellarg($phpBinary),
            escapeshellarg($artisanPath),
            escapeshellarg($id)
        );

        if (function_exists('exec')) {
            @exec($commandToRun);
        } else {
            $process = proc_open($commandToRun, [], $pipes);
            if (is_resource($process)) {
                proc_close($process);
            }
        }

        // 4. Langsung kembalikan respons 202 Accepted dalam < 50ms ke Cloudflare
        return response()->json([
            'success' => true,
            'execution_id' => $id,
            'status' => 'running',
            'command' => $commandSignature,
            'title' => $commandMeta['title'],
            'message' => "Command '{$commandMeta['title']}' telah diluncurkan di background.",
        ], 202);
    }

    /**
     * GET /api/admin/commands/status/{id}
     * Memeriksa status eksekusi dan mengambil potongan log terbaru.
     */
    public function status(string $id)
    {
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

        $statePath = storage_path("app/command_executions/{$id}.json");
        $stateData = [];
        if (File::exists($statePath)) {
            $stateData = json_decode(File::get($statePath), true) ?: [];
        }

        if (! $execution && empty($stateData)) {
            return response()->json([
                'success' => false,
                'error' => "Task dengan ID '{$id}' tidak ditemukan.",
            ], 404);
        }

        $logPath = $execution?->output_log_path ?? $stateData['output_log_path'] ?? storage_path("logs/tasks/{$id}.log");
        $output = '';
        if (File::exists($logPath)) {
            $output = File::get($logPath);
        }

        $status = $execution?->status ?? $stateData['status'] ?? 'unknown';
        $startedAtStr = $execution?->started_at ?? $stateData['started_at'] ?? null;
        $finishedAtStr = $execution?->finished_at ?? $stateData['finished_at'] ?? null;
        $exitCode = $execution?->exit_code ?? $stateData['exit_code'] ?? null;
        $durationSeconds = $execution?->duration_seconds ?? $stateData['duration_seconds'] ?? null;

        // Hitung durasi live jika masih berjalan
        if ($status === 'running' && $startedAtStr) {
            $startedAt = Carbon::parse($startedAtStr);
            $durationSeconds = $startedAt->diffInSeconds(Carbon::now('Asia/Jakarta'));
        }

        return response()->json([
            'success' => true,
            'id' => $id,
            'command' => $execution?->command ?? $stateData['command'] ?? '',
            'title' => $execution?->title ?? $stateData['title'] ?? 'Task',
            'status' => $status,
            'exit_code' => $exitCode,
            'output' => $output,
            'started_at' => $startedAtStr,
            'finished_at' => $finishedAtStr,
            'duration_seconds' => $durationSeconds,
        ]);
    }

    /**
     * GET /api/admin/commands/history
     * Mengambil daftar riwayat 15 eksekusi terakhir.
     */
    public function history()
    {
        $list = [];

        try {
            if (Schema::hasTable('command_executions')) {
                return response()->json(
                    CommandExecution::latest()->limit(15)->get()
                );
            }
        } catch (Throwable) {
            // Fallback ke pembacaan file
        }

        $stateDir = storage_path('app/command_executions');
        if (File::exists($stateDir)) {
            $files = File::files($stateDir);
            // Urutkan file berdasarkan waktu modifikasi terbaru
            usort($files, fn ($a, $b) => $b->getMTime() - $a->getMTime());
            $files = array_slice($files, 0, 15);

            foreach ($files as $file) {
                $data = json_decode(File::get($file->getPathname()), true);
                if ($data) {
                    $list[] = $data;
                }
            }
        }

        return response()->json($list);
    }

    /**
     * POST /api/admin/commands/cancel/{id}
     * Membatalkan/membersihkan task background yang sedang berjalan secara spesifik.
     */
    public function cancel(string $id, Request $request)
    {
        $user = $request->user();
        $execution = null;
        $now = Carbon::now('Asia/Jakarta');

        try {
            if (Schema::hasTable('command_executions')) {
                $execution = CommandExecution::find($id);
            }
        } catch (Throwable) {
            // Fallback
        }

        $statePath = storage_path("app/command_executions/{$id}.json");
        $stateData = [];
        if (File::exists($statePath)) {
            $stateData = json_decode(File::get($statePath), true) ?: [];
        }

        if (! $execution && empty($stateData)) {
            return response()->json([
                'success' => false,
                'error' => "Task dengan ID '{$id}' tidak ditemukan.",
            ], 404);
        }

        $currentStatus = $execution?->status ?? $stateData['status'] ?? 'unknown';
        if ($currentStatus === 'completed' || $currentStatus === 'failed') {
            return response()->json([
                'success' => true,
                'message' => "Task sudah dalam status {$currentStatus}.",
            ]);
        }

        $commandTitle = $execution?->title ?? $stateData['title'] ?? 'Task';
        $logPath = $execution?->output_log_path ?? $stateData['output_log_path'] ?? storage_path("logs/tasks/{$id}.log");

        $updatePayload = [
            'status' => 'failed',
            'exit_code' => 124,
            'finished_at' => $now->toDateTimeString(),
        ];

        if ($execution) {
            $updatePayload['duration_seconds'] = $execution->started_at ? Carbon::parse($execution->started_at)->diffInSeconds($now) : 0;
            $execution->update($updatePayload);
        }

        if (! empty($stateData)) {
            $taskTime = isset($stateData['started_at']) ? Carbon::parse($stateData['started_at']) : null;
            $stateData = array_merge($stateData, $updatePayload, [
                'duration_seconds' => $taskTime ? $taskTime->diffInSeconds($now) : 0,
            ]);
            File::put($statePath, json_encode($stateData, JSON_PRETTY_PRINT));
        }

        if (File::exists($logPath)) {
            $notice = "\n\n============================================================\n".
                      "[TASK DIBATALKAN SECARA MANUAL]\n".
                      "Task dibatalkan oleh Super Admin ({$user?->name}) pada {$now->format('Y-m-d H:i:s')} WIB.\n".
                      "============================================================\n";
            File::append($logPath, $notice);
        }

        Log::warning("PERINGATAN: Super Admin {$user?->name} ({$user?->email}) membatalkan task background '{$id}' ({$commandTitle}) secara MANUAL.", [
            'execution_id' => $id,
            'command' => $execution?->command ?? $stateData['command'] ?? '',
            'canceled_by_id' => $user?->id,
            'timestamp' => $now->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Task '{$commandTitle}' berhasil dibatalkan dan status dibersihkan.",
        ]);
    }
}
