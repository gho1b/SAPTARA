<?php

namespace App\Services;

use Imagick;
use Throwable;

class LogbookImageService
{
    public const TARGET_WIDTH = 960;

    public const TARGET_HEIGHT = 1280;

    public const TARGET_QUALITY = 88;

    /**
     * Mengecek apakah file foto sudah memenuhi spesifikasi standar terbaru:
     * - Lebar tepat 960 px
     * - Tinggi tepat 1280 px
     * - Format image/jpeg
     */
    public function isStandardSpecification(string $filePath): bool
    {
        if (! file_exists($filePath)) {
            return false;
        }

        $info = @getimagesize($filePath);
        if (! $info) {
            return false;
        }

        [$width, $height] = $info;
        $mime = $info['mime'] ?? '';

        return $width === self::TARGET_WIDTH
            && $height === self::TARGET_HEIGHT
            && $mime === 'image/jpeg';
    }

    /**
     * Memproses file gambar menjadi standar 960x1280 JPEG (rasio 3:4).
     * Menggunakan Imagick jika tersedia (mendukung auto-orient EXIF & marker Samsung/Android),
     * atau fallback ke GD.
     *
     * @return string|null Mengembalikan binary JPEG atau null jika gagal decode
     */
    public function processToStandard(string $filePath): ?string
    {
        if (! file_exists($filePath)) {
            return null;
        }

        // Coba gunakan Imagick terlebih dahulu jika ekstensi aktif
        if (class_exists(Imagick::class)) {
            $result = $this->processWithImagick($filePath);
            if ($result !== null) {
                return $result;
            }
        }

        // Fallback ke GD jika Imagick tidak tersedia atau gagal
        if (extension_loaded('gd')) {
            return $this->processWithGd($filePath);
        }

        return null;
    }

    /**
     * Pemrosesan gambar menggunakan Imagick (sangat handal menangani EXIF & Samsung markers).
     */
    private function processWithImagick(string $filePath): ?string
    {
        try {
            $im = new Imagick($filePath);

            // Koreksi rotasi berdasarkan orientasi EXIF kamera ponsel
            if (method_exists($im, 'autoOrient')) {
                $im->autoOrient();
            }

            $origW = $im->getImageWidth();
            $origH = $im->getImageHeight();

            if ($origW <= 0 || $origH <= 0) {
                $im->clear();

                return null;
            }

            $targetRatio = self::TARGET_WIDTH / self::TARGET_HEIGHT;
            $currentRatio = $origW / $origH;

            if ($currentRatio > $targetRatio) {
                // Foto landscape / lebih lebar dari 3:4 -> crop sisi kiri & kanan simetris
                $srcH = $origH;
                $srcW = (int) round($origH * $targetRatio);
                $srcX = (int) round(($origW - $srcW) / 2);
                $srcY = 0;
            } else {
                // Foto lebih tinggi dari 3:4 -> crop sisi atas & bawah simetris
                $srcW = $origW;
                $srcH = (int) round($origW / $targetRatio);
                $srcX = 0;
                $srcY = (int) round(($origH - $srcH) / 2);
            }

            $im->cropImage($srcW, $srcH, $srcX, $srcY);
            $im->resizeImage(self::TARGET_WIDTH, self::TARGET_HEIGHT, Imagick::FILTER_LANCZOS, 1);
            $im->setImageFormat('jpeg');
            $im->setImageCompressionQuality(self::TARGET_QUALITY);

            $blob = $im->getImageBlob();
            $im->clear();

            return $blob;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Pemrosesan gambar menggunakan library GD.
     */
    private function processWithGd(string $filePath): ?string
    {
        try {
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mime = (string) (@mime_content_type($filePath) ?: '');

            $source = null;
            if (str_contains($mime, 'jpeg') || str_contains($mime, 'jpg') || in_array($extension, ['jpg', 'jpeg'])) {
                $source = @imagecreatefromjpeg($filePath);
            } elseif (str_contains($mime, 'png') || $extension === 'png') {
                $source = @imagecreatefrompng($filePath);
            } elseif (str_contains($mime, 'webp') || $extension === 'webp') {
                $source = @imagecreatefromwebp($filePath);
            }

            // Jika belum berhasil, coba imagecreatefromstring
            if (! $source) {
                $content = @file_get_contents($filePath);
                if ($content !== false) {
                    $source = @imagecreatefromstring($content);
                }
            }

            if (! $source) {
                return null;
            }

            // Tangani EXIF Orientation untuk JPEG
            if (function_exists('exif_read_data') && ($extension === 'jpg' || $extension === 'jpeg')) {
                $exif = @exif_read_data($filePath);
                if ($exif && ! empty($exif['Orientation'])) {
                    switch ($exif['Orientation']) {
                        case 3:
                            $rotated = imagerotate($source, 180, 0);
                            imagedestroy($source);
                            $source = $rotated;
                            break;
                        case 6:
                            $rotated = imagerotate($source, -90, 0);
                            imagedestroy($source);
                            $source = $rotated;
                            break;
                        case 8:
                            $rotated = imagerotate($source, 90, 0);
                            imagedestroy($source);
                            $source = $rotated;
                            break;
                    }
                }
            }

            $origW = imagesx($source);
            $origH = imagesy($source);

            $targetRatio = self::TARGET_WIDTH / self::TARGET_HEIGHT;
            $currentRatio = $origW / $origH;

            if ($origW === self::TARGET_WIDTH && $origH === self::TARGET_HEIGHT) {
                $canvas = $source;
            } else {
                if ($currentRatio > $targetRatio) {
                    $srcH = $origH;
                    $srcW = (int) round($origH * $targetRatio);
                    $srcX = (int) round(($origW - $srcW) / 2);
                    $srcY = 0;
                } else {
                    $srcW = $origW;
                    $srcH = (int) round($origW / $targetRatio);
                    $srcX = 0;
                    $srcY = (int) round(($origH - $srcH) / 2);
                }

                $canvas = imagecreatetruecolor(self::TARGET_WIDTH, self::TARGET_HEIGHT);
                imagecopyresampled($canvas, $source, 0, 0, $srcX, $srcY, self::TARGET_WIDTH, self::TARGET_HEIGHT, $srcW, $srcH);
                imagedestroy($source);
            }

            ob_start();
            imagejpeg($canvas, null, self::TARGET_QUALITY);
            $imageData = ob_get_clean();
            imagedestroy($canvas);

            return $imageData ?: null;
        } catch (Throwable) {
            return null;
        }
    }
}
