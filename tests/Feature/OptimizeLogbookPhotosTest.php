<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OptimizeLogbookPhotosTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    /**
     * Membantu membuat file gambar JPEG asli dengan ukuran spesifik.
     */
    private function createJpegContent(int $width, int $height): string
    {
        $im = imagecreatetruecolor($width, $height);
        $color = imagecolorallocate($im, 80, 160, 240);
        imagefill($im, 0, 0, $color);

        ob_start();
        imagejpeg($im, null, 90);
        $data = ob_get_clean();
        imagedestroy($im);

        return $data;
    }

    public function test_already_standard_file_is_skipped_and_not_modified(): void
    {
        // Buat file yang sudah tepat 960x1280
        $exactContent = $this->createJpegContent(960, 1280);
        Storage::disk('public')->put('logbook/already_standard.jpg', $exactContent);

        $beforeContent = Storage::disk('public')->get('logbook/already_standard.jpg');

        $this->artisan('logbook:optimize-photos', ['--disk' => 'public'])
            ->expectsOutputToContain('Sudah standar (TIDAK DISENTUH): 1 file')
            ->assertSuccessful();

        // Konten file tidak boleh berubah sama sekali
        $afterContent = Storage::disk('public')->get('logbook/already_standard.jpg');
        $this->assertEquals($beforeContent, $afterContent);
    }

    public function test_oversized_file_is_cropped_and_overwritten_to_960x1280(): void
    {
        // Buat file landscape berukuran 1920x1080
        $largeContent = $this->createJpegContent(1920, 1080);
        Storage::disk('public')->put('logbook/oversized.jpg', $largeContent);

        $this->artisan('logbook:optimize-photos', ['--disk' => 'public'])
            ->expectsOutputToContain('Berhasil di-crop & ditimpa : 1 file')
            ->assertSuccessful();

        $savedContent = Storage::disk('public')->get('logbook/oversized.jpg');
        $savedImage = imagecreatefromstring($savedContent);

        $this->assertEquals(960, imagesx($savedImage));
        $this->assertEquals(1280, imagesy($savedImage));

        imagedestroy($savedImage);
    }

    public function test_dry_run_does_not_modify_oversized_file(): void
    {
        $largeContent = $this->createJpegContent(1920, 1080);
        Storage::disk('public')->put('logbook/dry_run_photo.jpg', $largeContent);

        $this->artisan('logbook:optimize-photos', ['--disk' => 'public', '--dry-run' => true])
            ->assertSuccessful();

        $content = Storage::disk('public')->get('logbook/dry_run_photo.jpg');
        $image = imagecreatefromstring($content);

        // Di dry-run, gambar tidak diubah ukurannya
        $this->assertEquals(1920, imagesx($image));
        $this->assertEquals(1080, imagesy($image));

        imagedestroy($image);
    }
}
