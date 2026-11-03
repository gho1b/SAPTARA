<?php

namespace App\Console\Commands;

use App\Models\LogbookEntry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CleanMigratedPhotosCommand extends Command
{
    protected $signature = 'logbook:clean-migrated-local
                            {--directory=logbook : Direktori relatif di storage/app/public yang dipindai (default: logbook)}
                            {--bulk= : Batasi jumlah file yang dihapus per eksekusi (contoh: 10, 50, 100)}
                            {--limit= : Alias untuk parameter bulk}
                            {--dry-run : Mode simulasi tanpa menghapus file fisik di file manager cPanel}
                            {--update-db : Otomatis perbarui photo_url di database ke R2 jika terbukti ada di R2 namun DB masih menunjuk ke lokal}';

    protected $description = 'Membersihkan foto upload di file manager cPanel yang sudah terbukti ada di Cloudflare R2 (static.saptara.id) untuk membebaskan ruang disk hosting.';

    public function handle(): int
    {
        $directory = trim((string) ($this->option('directory') ?: 'logbook'), '/');
        $bulkOption = $this->option('bulk') ?: $this->option('limit');
        $limit = ($bulkOption !== null && $bulkOption !== '') ? (int) $bulkOption : null;
        $isDryRun = (bool) $this->option('dry-run');
        $updateDb = (bool) $this->option('update-db');

        $r2DiskName = (string) config('filesystems.logbook_disk', 'r2');
        $targetDirectory = trim((string) config('filesystems.logbook_directory', $directory), '/');
        $r2BaseUrl = rtrim((string) config("filesystems.disks.{$r2DiskName}.url", env('R2_URL', 'https://static.saptara.id')), '/');

        $this->info('=== SAPTARA: Pembersihan Foto Lokal cPanel (Sudah di R2) ===');
        $this->line("Direktori Lokal cPanel: <comment>storage/app/public/{$directory}</comment>");
        $this->line("Target R2 Disk        : <comment>{$r2DiskName}</comment>");
        $this->line("Prefix URL R2         : <comment>{$r2BaseUrl}</comment>");
        $this->line('Mode                  : '.($isDryRun ? '<comment>DRY-RUN (Simulasi)</comment>' : '<info>LIVE (Hapus File Lokal cPanel)</info>'));
        if ($limit !== null && $limit > 0) {
            $this->line("Mode Bulking          : <comment>Maksimal {$limit} file per batch</comment>");
        } else {
            $this->line('Mode Bulking          : <comment>Semua File (Tanpa Batasan)</comment>');
        }
        $this->newLine();

        $localDisk = Storage::disk('public');
        $r2Disk = Storage::disk($r2DiskName);

        if (! $localDisk->exists($directory)) {
            $this->warn("Direktori lokal '{$directory}' tidak ditemukan atau kosong di file manager cPanel.");

            return self::SUCCESS;
        }

        // Ambil semua file lokal di direktori target
        $localFiles = $localDisk->files($directory);
        $totalFiles = count($localFiles);

        $this->info("Ditemukan <comment>{$totalFiles}</comment> file fisik di direktori lokal '{$directory}'.");
        if ($totalFiles === 0) {
            $this->info('Tidak ada file yang perlu diperiksa.');

            return self::SUCCESS;
        }

        DB::disableQueryLog();

        $deletedCount = 0;
        $skippedNotOnR2 = 0;
        $failedCount = 0;
        $dbUpdatedCount = 0;
        $freedBytes = 0;

        $targetTotal = ($limit && $limit < $totalFiles) ? $limit : $totalFiles;
        $bar = $this->output->createProgressBar($targetTotal);
        $bar->start();

        foreach ($localFiles as $file) {
            if ($limit !== null && $deletedCount >= $limit) {
                break;
            }

            $filename = basename($file);
            $targetPath = $targetDirectory !== '' ? $targetDirectory.'/'.$filename : $filename;

            // 1. Verifikasi keberadaan file di Cloudflare R2 (static.saptara.id)
            $existsOnR2 = false;
            try {
                $existsOnR2 = $r2Disk->exists($targetPath);
            } catch (Throwable $e) {
                $failedCount++;
                $this->error("\n[Error] Gagal cek R2 untuk {$targetPath}: ".$e->getMessage());
                $bar->advance();

                continue;
            }

            // Jika file BELUM ada di R2, JANGAN HAPUS demi keamanan data!
            if (! $existsOnR2) {
                $skippedNotOnR2++;
                $bar->advance();

                continue;
            }

            $fileSize = (int) $localDisk->size($file);

            // 2. Jika opsi update-db aktif dan ada data logbook yang masih pakai URL lokal lama
            if ($updateDb) {
                try {
                    $entries = LogbookEntry::where('photo_url', 'like', "%{$filename}%")
                        ->where('photo_url', 'not like', $r2BaseUrl.'%')
                        ->get();

                    foreach ($entries as $entry) {
                        $newR2Url = $r2Disk->url($targetPath);
                        $entry->update(['photo_url' => $newR2Url]);
                        $dbUpdatedCount++;
                    }
                } catch (Throwable $e) {
                    // Abaikan error DB jika skema/koneksi terkendala
                }
            }

            // 3. Mode Simulasi vs Eksekusi Nyata
            if ($isDryRun) {
                $deletedCount++;
                $freedBytes += $fileSize;
                $bar->advance();

                continue;
            }

            // 4. HAPUS file fisik dari file manager cPanel untuk membebaskan ruang disk hosting
            $deleted = $localDisk->delete($file);
            if ($deleted) {
                $deletedCount++;
                $freedBytes += $fileSize;
            } else {
                $failedCount++;
                $this->error("\n[Error] Gagal menghapus file cPanel: {$file}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info('================ RINGKASAN PEMBERSIHAN ================');
        $this->info("Total File cPanel Dicek : <comment>{$totalFiles}</comment> file");
        $this->info("Terbukti di R2 & Dihapus: <info>{$deletedCount}</info> file");
        $this->info("Belum di R2 (Dilewati)  : <comment>{$skippedNotOnR2}</comment> file");
        if ($failedCount > 0) {
            $this->error("Gagal Dihapus           : {$failedCount} file");
        }
        if ($updateDb) {
            $this->info("Database URL Diperbarui : <info>{$dbUpdatedCount}</info> record");
        }
        $this->info('Ruang Disk cPanel Bebas : <info>'.$this->formatBytes($freedBytes).'</info>');

        if ($limit !== null && $limit > 0 && ($totalFiles - ($deletedCount + $skippedNotOnR2)) > 0) {
            $remaining = $totalFiles - $deletedCount;
            $this->newLine();
            $this->comment("👉 Batch selesai ({$deletedCount} file dibersihkan). Masih ada {$remaining} file di cPanel.");
            $this->comment("   Jalankan kembali batch berikutnya dengan bulk={$limit} untuk melanjutkan pembersihan.");
        }
        $this->info('=======================================================');

        Log::warning('PERINGATAN: Pembersihan foto upload cPanel (logbook:clean-migrated-local) dijalankan.', [
            'directory' => $directory,
            'dry_run' => $isDryRun,
            'limit' => $limit,
            'deleted_count' => $deletedCount,
            'skipped_count' => $skippedNotOnR2,
            'freed_bytes' => $freedBytes,
            'freed_formatted' => $this->formatBytes($freedBytes),
        ]);

        return self::SUCCESS;
    }

    /**
     * Memformat ukuran byte ke satuan yang mudah dibaca.
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' B';
    }
}
