<?php

namespace App\Console\Commands;

use App\Models\LogbookEntry;
use App\Services\LogbookImageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class OptimizeLogbookPhotosCommand extends Command
{
    protected $signature = 'logbook:optimize-photos
                            {--dry-run : Simulasi pengecekan tanpa menimpa file fisik}
                            {--limit= : Batasi jumlah file yang diproses per eksekusi}
                            {--disk=public : Disk storage yang ingin dioptimasi (default: public)}';

    protected $description = 'Konversi foto logbook lama ke standar 960x1280 JPEG dan langsung menimpa file lama. File yang sudah sesuai standar tidak akan disentuh.';

    public function handle(LogbookImageService $imageService): int
    {
        $isDryRun = (bool) $this->option('dry-run');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $diskName = (string) $this->option('disk');
        $directory = trim((string) config('filesystems.logbook_directory', 'logbook'), '/');

        $this->info('=== SAPTARA: Optimasi Foto Logbook ke Standar 960x1280 ===');
        $this->line("Storage Disk Target : <comment>{$diskName}</comment>");
        $this->line("Direktori           : <comment>{$directory}</comment>");
        $this->line('Mode                : '.($isDryRun ? '<comment>DRY-RUN (Simulasi)</comment>' : '<info>LIVE (In-Place Overwrite)</info>'));

        $disk = Storage::disk($diskName);
        $allFiles = $disk->files($directory);

        $totalFiles = count($allFiles);
        $this->info("Ditemukan <comment>{$totalFiles}</comment> file di direktori '{$directory}'.");

        if ($limit !== null && $limit > 0) {
            $this->line("Membatasi pemrosesan ke <comment>{$limit}</comment> file teratas.");
            $allFiles = array_slice($allFiles, 0, $limit);
        }

        $processedCount = 0;
        $skippedStandardCount = 0;
        $optimizedCount = 0;
        $failedCount = 0;
        $freedBytes = 0;

        $bar = $this->output->createProgressBar(count($allFiles));
        $bar->start();

        foreach ($allFiles as $relativePath) {
            $processedCount++;
            $filename = basename($relativePath);
            $fullPath = $disk->path($relativePath);

            // 1. CEK SPESIFIKASI STANDAR TERBARU (960x1280 JPEG)
            // Jika sudah sesuai spesifikasi, file TIDAK BOLEH disentuh sama sekali!
            if ($imageService->isStandardSpecification($fullPath)) {
                $skippedStandardCount++;
                $bar->advance();

                continue;
            }

            $origSize = (int) ($disk->size($relativePath) ?? 0);

            // 2. JIKA DRY RUN, CUKUP CATAT TANPA MENIMPA FILE
            if ($isDryRun) {
                $optimizedCount++;
                // Estimasi rata-rata ukuran standar 960x1280 kualitas 88 adalah ~100 KB
                $estimatedNewSize = min($origSize, 102400);
                $freedBytes += max(0, $origSize - $estimatedNewSize);
                $bar->advance();

                continue;
            }

            // 3. PROSES RESIZE & SMART CROP KE 960x1280 JPEG
            $newImageData = $imageService->processToStandard($fullPath);

            if ($newImageData === null) {
                $failedCount++;
                $this->error("\n[Gagal Decode] Format tidak didukung / file corrupt: {$filename}");
                $bar->advance();

                continue;
            }

            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            // 4. TIMPA FILE LAMA DENGAN HASIL RESIZE
            if (in_array($extension, ['jpg', 'jpeg'])) {
                // Untuk file JPG/JPEG: Timpa langsung di path yang sama
                $disk->put($relativePath, $newImageData, 'public');
            } else {
                // Untuk file non-JPEG (.png, .webp, dll): Simpan sebagai .jpg baru, lalu hapus file lama
                $newFilename = pathinfo($filename, PATHINFO_FILENAME).'.jpg';
                $newRelativePath = ($directory !== '' ? $directory.'/' : '').$newFilename;

                $disk->put($newRelativePath, $newImageData, 'public');
                $disk->delete($relativePath);

                // Perbarui referensi photo_url di database jika ada entri yang merujuk file ini
                LogbookEntry::where('photo_url', 'like', "%{$filename}")
                    ->get()
                    ->each(function ($entry) use ($filename, $newFilename) {
                        $updatedUrl = str_replace($filename, $newFilename, (string) $entry->photo_url);
                        $entry->update(['photo_url' => $updatedUrl]);
                    });
            }

            $newSize = strlen($newImageData);
            $saved = max(0, $origSize - $newSize);
            $freedBytes += $saved;
            $optimizedCount++;

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info('================ RINGKASAN OPTIMASI FOTO ================');
        $this->info("Total file diperiksa      : <info>{$processedCount}</info>");
        $this->info("Sudah standar (TIDAK DISENTUH): <comment>{$skippedStandardCount}</comment> file");
        $this->info("Berhasil di-crop & ditimpa : <info>{$optimizedCount}</info> file");
        $this->info('Gagal / format unsupported : '.($failedCount > 0 ? "<error>{$failedCount}</error>" : '<info>0</info>').' file');
        $this->info('Estimasi Disk Space Dihemat: <info>'.$this->formatBytes($freedBytes).'</info>');
        $this->info('=========================================================');

        return self::SUCCESS;
    }

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
