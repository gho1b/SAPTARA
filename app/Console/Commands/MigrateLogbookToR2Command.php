<?php

namespace App\Console\Commands;

use App\Models\LogbookEntry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MigrateLogbookToR2Command extends Command
{
    protected $signature = 'logbook:migrate-to-r2
                            {--bulk= : Jumlah batch/bulk data yang diproses per eksekusi (contoh: 1, 10, 50, 100)}
                            {--limit= : Alias untuk batasi jumlah file yang diproses per eksekusi}
                            {--dry-run : Simulasi migrasi tanpa upload ke R2 dan tanpa menghapus file lokal}
                            {--sweep-orphans : Migrasikan juga file fisik lokal yang tidak terdaftar di database}';

    protected $description = 'Migrasikan foto logbook dari storage lokal hosting ke Cloudflare R2 secara 1-by-1 dan langsung hapus file lokal untuk menghemat storage';

    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');
        $bulkOption = $this->option('bulk') ?: $this->option('limit');
        $limit = ($bulkOption !== null && $bulkOption !== '') ? (int) $bulkOption : null;
        $sweepOrphans = (bool) $this->option('sweep-orphans');

        $r2DiskName = (string) config('filesystems.logbook_disk', 'r2');
        $targetDirectory = trim((string) config('filesystems.logbook_directory', 'logbook'), '/');
        $r2BaseUrl = rtrim((string) config("filesystems.disks.{$r2DiskName}.url", env('R2_URL', 'https://static.saptara.id')), '/');

        $this->info('=== SAPTARA: Migrasi Storage Logbook ke Cloudflare R2 ===');
        $this->line("Target R2 Disk      : <comment>{$r2DiskName}</comment>");
        $this->line("Target Directory    : <comment>{$targetDirectory}</comment>");
        $this->line("Public URL Prefix   : <comment>{$r2BaseUrl}</comment>");
        $this->line('Mode                : '.($isDryRun ? '<comment>DRY-RUN (Simulasi)</comment>' : '<info>LIVE (Upload & Langsung Hapus Lokal)</info>'));
        if ($limit !== null && $limit > 0) {
            $this->line("Mode Bulking        : <comment>{$limit} file per batch</comment>");
        } else {
            $this->line('Mode Bulking        : <comment>Semua File (Tanpa Batasan)</comment>');
        }

        $localDisk = Storage::disk('public');
        $r2Disk = Storage::disk($r2DiskName);

        // Matikan query log agar tidak memakan RAM saat iterasi banyak data
        DB::disableQueryLog();

        $query = LogbookEntry::whereNotNull('photo_url')
            ->where('photo_url', '!=', '')
            ->where('photo_url', 'not like', $r2BaseUrl.'%');

        $totalFound = $query->count();
        $this->info("Ditemukan <comment>{$totalFound}</comment> entri logbook dengan foto yang perlu dimigrasikan.");

        if ($limit !== null && $limit > 0) {
            $this->line("Membatasi pemrosesan batch ke <comment>{$limit}</comment> entri teratas.");
            $query->limit($limit);
        }

        $migratedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;
        $freedBytes = 0;

        $bar = $this->output->createProgressBar($limit && $limit < $totalFound ? $limit : $totalFound);
        $bar->start();

        foreach ($query->cursor() as $entry) {
            $photoUrl = (string) $entry->photo_url;
            $relativePath = $this->extractRelativePath($photoUrl, $targetDirectory);

            if (! $localDisk->exists($relativePath)) {
                $skippedCount++;
                $bar->advance();

                continue;
            }

            $filename = basename($relativePath);
            $targetPath = $targetDirectory !== '' ? $targetDirectory.'/'.$filename : $filename;
            $fileSize = (int) $localDisk->size($relativePath);

            if ($isDryRun) {
                $migratedCount++;
                $freedBytes += $fileSize;
                $bar->advance();

                continue;
            }

            // 1. Baca stream file lokal (hemat memori)
            $stream = $localDisk->readStream($relativePath);
            if ($stream === false) {
                $failedCount++;
                $this->error("\n[Error] Gagal membaca stream file: {$relativePath} (ID: {$entry->id})");
                $bar->advance();

                continue;
            }

            // 2. Upload stream ke R2
            $uploaded = $r2Disk->put($targetPath, $stream, 'public');
            if (is_resource($stream)) {
                fclose($stream);
            }

            if (! $uploaded) {
                $failedCount++;
                $this->error("\n[Error] Gagal upload ke R2: {$targetPath} (ID: {$entry->id})");
                $bar->advance();

                continue;
            }

            // 3. Verifikasi file sudah ada di R2 sebelum menyentuh file lokal
            if (! $r2Disk->exists($targetPath)) {
                $failedCount++;
                $this->error("\n[Error] Verifikasi keberadaan di R2 gagal: {$targetPath} (ID: {$entry->id})");
                $bar->advance();

                continue;
            }

            // 4. Update data photo_url di database ke alamat R2 baru
            $newR2Url = $r2Disk->url($targetPath);
            $entry->update(['photo_url' => $newR2Url]);

            // 5. HAPUS SEGERA file lokal untuk membebaskan disk space hosting (99% full)
            $localDisk->delete($relativePath);

            $migratedCount++;
            $freedBytes += $fileSize;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Opsi membersihkan file fisik yatim (orphan) yang ada di storage lokal tapi tidak ada di DB
        if ($sweepOrphans) {
            $this->info("--- Memeriksa File Yatim Piatu (Orphans) di folder lokal '{$targetDirectory}' ---");
            $localFiles = $localDisk->files($targetDirectory);
            $orphanMigrated = 0;
            $orphanFreedBytes = 0;

            foreach ($localFiles as $file) {
                $filename = basename($file);
                // Cek apakah file ini masih dipakai di DB
                $isReferenced = LogbookEntry::where('photo_url', 'like', "%{$filename}%")->exists();
                if (! $isReferenced) {
                    $fileSize = (int) $localDisk->size($file);
                    $targetPath = $targetDirectory !== '' ? $targetDirectory.'/'.$filename : $filename;

                    if ($isDryRun) {
                        $this->line("[DRY-RUN Orphan] {$file} (".$this->formatBytes($fileSize).')');
                        $orphanMigrated++;
                        $orphanFreedBytes += $fileSize;

                        continue;
                    }

                    // Pindahkan ke R2 lalu hapus dari lokal
                    $stream = $localDisk->readStream($file);
                    if ($stream !== false) {
                        $uploaded = $r2Disk->put($targetPath, $stream, 'public');
                        if (is_resource($stream)) {
                            fclose($stream);
                        }
                        if ($uploaded && $r2Disk->exists($targetPath)) {
                            $localDisk->delete($file);
                            $orphanMigrated++;
                            $orphanFreedBytes += $fileSize;
                        }
                    }
                }
            }

            $this->info("Orphan files diproses : <comment>{$orphanMigrated}</comment>");
            $this->info('Disk space orphan freed: <comment>'.$this->formatBytes($orphanFreedBytes).'</comment>');
            $freedBytes += $orphanFreedBytes;
        }

        $this->info('================ RINGKASAN MIGRASI ================');
        $this->info("Berhasil dimigrasikan : <info>{$migratedCount}</info> file");
        $this->info("File dilewati/hilang  : <comment>{$skippedCount}</comment> file");
        $this->info('Gagal diproses        : '.($failedCount > 0 ? "<error>{$failedCount}</error>" : '<info>0</info>').' file');
        $this->info('Total Space Dibebaskan: <info>'.$this->formatBytes($freedBytes).'</info>');

        if ($limit !== null && $limit > 0 && ($totalFound - $migratedCount) > 0) {
            $remaining = max(0, $totalFound - $migratedCount);
            $this->newLine();
            $this->comment("👉 Batch selesai ({$migratedCount} file diproses). Masih ada perkiraan {$remaining} file tersisa.");
            $this->comment("   Jalankan kembali batch berikutnya dengan bulk={$limit} untuk melanjutkan migrasi.");
        }
        $this->info('===================================================');

        return self::SUCCESS;
    }

    /**
     * Mengekstrak relative path dari URL photo_url lama.
     */
    private function extractRelativePath(string $url, string $defaultDirectory): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $clean = preg_replace('#^/?storage/#', '', $path);
        $clean = ltrim((string) $clean, '/');

        // Jika path tidak memiliki folder prefix, gunakan default directory
        if (! str_contains($clean, '/') && $defaultDirectory !== '') {
            $clean = $defaultDirectory.'/'.$clean;
        }

        return $clean;
    }

    /**
     * Memformat ukuran byte ke satuan yang mudah dibaca manusia.
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
