<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
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
     * Menjalankan perintah console secara manual oleh Super Admin.
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

        // ⚠️ LOG WARNING: Dipicu sebagai penanda bahwa command console dieksekusi secara manual
        Log::warning("PERINGATAN: Command console '{$commandSignature}' dijalankan secara MANUAL oleh Super Admin!", [
            'command_key' => $key,
            'signature' => $commandSignature,
            'title' => $commandMeta['title'],
            'executed_by_id' => $user?->id,
            'executed_by_name' => $user?->name,
            'executed_by_email' => $user?->email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now('Asia/Jakarta')->toIso8601String(),
            'input_options' => $request->input('options', []),
        ]);

        try {
            $params = [];
            $requestedOptions = $request->input('options', []);

            if (! empty($requestedOptions['dry_run'])) {
                $params['--dry-run'] = true;
            }
            if (! empty($requestedOptions['recalculate'])) {
                $params['--recalculate'] = true;
            }
            if (! empty($requestedOptions['limit'])) {
                $params['--limit'] = (int) $requestedOptions['limit'];
            }

            // Eksekusi Artisan Command
            $exitCode = Artisan::call($commandSignature, $params);
            $output = Artisan::output();

            return response()->json([
                'success' => $exitCode === 0,
                'command' => $commandSignature,
                'title' => $commandMeta['title'],
                'exit_code' => $exitCode,
                'output' => $output ?: '(Perintah selesai tanpa pesan terminal)',
                'executed_at' => now('Asia/Jakarta')->format('Y-m-d H:i:s'),
                'message' => "Command '{$commandMeta['title']}' berhasil dieksekusi secara manual.",
            ]);
        } catch (Throwable $e) {
            Log::error("Gagal mengeksekusi manual command '{$commandSignature}': ".$e->getMessage(), [
                'exception' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Gagal mengeksekusi command: '.$e->getMessage(),
            ], 500);
        }
    }
}
