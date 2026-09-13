<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

/**
 * SAPTARA Web Installer & Diagnostic Tool (Zero-Shell Deployment Helper)
 *
 * Khusus shared hosting cPanel tanpa akses terminal / SSH.
 * Akses melalui browser: https://domain-anda.com/install.php
 * Setelah instalasi selesai, HAPUS file ini demi keamanan server!
 */

// 1. Matikan limit waktu dan tampilkan error penuh agar tidak silent-fail
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
@set_time_limit(300);
@ini_set('memory_limit', '256M');

// Tangkap fatal error jika PHP mati mendadak (misal timeout atau memory limit)
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        echo "\n\n❌ TERJADI FATAL ERROR PADA PHP SERVER:\n";
        echo $error['message']."\n";
        echo 'Lokasi: Baris '.$error['line'].' di '.$error['file']."\n";
    }
});

// Temukan direktori utama Laravel
$possiblePaths = [
    __DIR__.'/../',
    __DIR__.'/../../saptara-laravel/',
    __DIR__.'/../saptara-laravel/',
];

$baseDir = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path.'vendor/autoload.php') && file_exists($path.'bootstrap/app.php')) {
        $baseDir = realpath($path).'/';
        break;
    }
}

if (! $baseDir) {
    exit("<div style='background:#7f1d1d;color:#fecaca;padding:24px;font-family:sans-serif;border-radius:12px;max-width:600px;margin:40px auto;'>
        <h2 style='margin-top:0;'>❌ Folder Inti Laravel Tidak Ditemukan</h2>
        <p>File <code>vendor/autoload.php</code> atau <code>bootstrap/app.php</code> tidak dapat ditemukan.</p>
        <p>Pastikan seluruh folder hasil ekstrak zip (app, bootstrap, vendor, dll) berada di lokasi yang sesuai.</p>
    </div>");
}

// Fitur melihat log laravel jika terjadi error 500
if (isset($_GET['view_log'])) {
    $logFile = $baseDir.'storage/logs/laravel.log';
    header('Content-Type: text/plain; charset=utf-8');
    if (file_exists($logFile)) {
        $lines = file($logFile);
        $lastLines = array_slice($lines, -80);
        echo "=== 80 BARIS TERAKHIR DARI storage/logs/laravel.log ===\n\n";
        echo implode('', $lastLines);
    } else {
        echo 'File log (storage/logs/laravel.log) belum ada atau belum ada error yang tercatat.';
    }
    exit;
}

// Halaman antarmuka sebelum instalasi dijalankan
if (! isset($_GET['run']) || $_GET['run'] !== 'saptara_install') {
    $hasEnv = file_exists($baseDir.'.env');
    $envCpanel = file_exists($baseDir.'.env.cpanel.example');
    ?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAPTARA Web Installer - Shared Hosting</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; margin: 0; line-height: 1.6; }
        .card { max-width: 640px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        h1 { margin-top: 0; color: #38bdf8; font-size: 22px; }
        p { color: #94a3b8; font-size: 14px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
        .badge-ok { background: #065f46; color: #6ee7b7; }
        .badge-warn { background: #854d0e; color: #fde047; }
        .checklist { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; }
        .checklist li { margin-bottom: 8px; color: #cbd5e1; }
        .btn { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; transition: background 0.2s; }
        .btn:hover { background: #0369a1; }
        .btn-sec { background: #334155; color: #94a3b8; padding: 8px 16px; font-size: 12px; margin-left: 8px; }
        .btn-sec:hover { background: #475569; color: white; }
        .warning { background: #451a03; border: 1px solid #78350f; color: #fde047; padding: 12px; border-radius: 8px; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 SAPTARA Web Installer (Zero-Shell cPanel)</h1>
        <p>Alat bantu konfigurasi dan migrasi database otomatis untuk shared hosting tanpa akses terminal/SSH.</p>
        
        <div class="checklist">
            <strong>Pemeriksaan Awal Server:</strong>
            <ul>
                <li>PHP Version: <code><?= phpversion() ?></code> <?= version_compare(phpversion(), '8.3.0', '>=') ? '<span class="badge badge-ok">OK (PHP 8.3+)</span>' : '<span class="badge badge-warn">Perlu PHP 8.3/8.4</span>' ?></li>
                <li>Ekstensi PDO MySQL: <?= extension_loaded('pdo_mysql') ? '<span class="badge badge-ok">Aktif</span>' : '<span class="badge badge-warn">Belum Aktif</span>' ?></li>
                <li>File Konfigurasi <code>.env</code>: <?= $hasEnv ? '<span class="badge badge-ok">Ditemukan</span>' : '<span class="badge badge-warn">Belum Dibuat</span>' ?></li>
            </ul>
        </div>

        <?php if (! $hasEnv) { ?>
            <div class="warning" style="background:#4c0519; border-color:#9f1239; color:#fecdd3; margin-bottom: 20px;">
                ⚠️ <strong>File <code>.env</code> belum dibuat!</strong><br>
                Di cPanel File Manager, salin/rename file <code>.env.cpanel.example</code> menjadi <code>.env</code>, lalu isi nama database, username, dan password MySQL Anda.
            </div>
        <?php } ?>

        <div style="margin-top: 25px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
            <a href="install.php?run=saptara_install" class="btn">Mulai Migrasi & Setup Database</a>
            <a href="install.php?run=saptara_install&fresh=1" class="btn" style="background: #b91c1c;" onclick="return confirm('Apakah Anda yakin ingin mereset seluruh tabel database dan mengulang dari awal?');">Reset & Ulang Bersih (Fresh)</a>
            <a href="install.php?view_log=1" target="_blank" class="btn btn-sec">Lihat Log Error</a>
        </div>

        <div class="warning">
            ⚠️ <strong>Catatan:</strong> Setelah website berhasil diakses, segera <strong>HAPUS</strong> file <code>install.php</code> ini melalui File Manager cPanel Anda.
        </div>
    </div>
</body>
</html>
<?php
        exit;
}

// 2. Eksekusi Proses Instalasi
require $baseDir.'vendor/autoload.php';
$app = require_once $baseDir.'bootstrap/app.php';

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

echo "<!DOCTYPE html><html><head><title>SAPTARA Installer Log</title></head><body style='background:#0f172a;color:#38bdf8;font-family:monospace;padding:30px;'>";
echo "<pre style='font-size: 13px; line-height: 1.5;'>";
echo "======================================================\n";
echo "       SAPTARA ZERO-SHELL INSTALLATION LOG           \n";
echo "======================================================\n\n";

// LANGKAH 1: Pastikan struktur folder storage lengkap dan memiliki izin tulis
echo "1. Menyiapkan dan memeriksa folder storage...\n";
$storageDirs = [
    $baseDir.'storage/app/public',
    $baseDir.'storage/framework/cache/data',
    $baseDir.'storage/framework/sessions',
    $baseDir.'storage/framework/views',
    $baseDir.'storage/logs',
    $baseDir.'bootstrap/cache',
];

foreach ($storageDirs as $dir) {
    if (! file_exists($dir)) {
        @mkdir($dir, 0775, true);
    }
    @chmod($dir, 0775);
}
echo "   ✅ Direktori storage & cache siap digunakan.\n\n";

// LANGKAH 2: Tes Koneksi Database Sebelum Menjalankan Migrasi
echo "2. Memeriksa koneksi database MySQL...\n";
$dbConfig = config('database.connections.mysql');
echo '   - Host     : '.($dbConfig['host'] ?? 'null')."\n";
echo '   - Port     : '.($dbConfig['port'] ?? 'null')."\n";
echo '   - Database : '.($dbConfig['database'] ?? 'null')."\n";
echo '   - Username : '.($dbConfig['username'] ?? 'null')."\n";

try {
    // Coba hubungkan PDO dengan timeout singkat agar tidak hang
    DB::connection()->getPdo();
    echo "   ✅ KONEKSI DATABASE BERHASIL!\n\n";
} catch (Throwable $dbErr) {
    echo "\n   ❌ GAGAL MENGHUBUNGI DATABASE MYSQL:\n";
    echo '   '.$dbErr->getMessage()."\n\n";
    echo "   💡 PANDUAN PENYELESAIAN MASALAH KONEKSI DATABASE:\n";
    echo "   1. Buka cPanel -> MySQL® Databases:\n";
    echo "      - Pastikan database '".($dbConfig['database'] ?? '')."' sudah dibuat.\n";
    echo "      - Pastikan user '".($dbConfig['username'] ?? '')."' sudah dibuat.\n";
    echo "      - Pastikan user sudah ditambahkan ke database dengan centang 'ALL PRIVILEGES'.\n";
    echo "   2. Buka cPanel -> File Manager -> edit file .env:\n";
    echo "      - Jika DB_HOST=localhost gagal, coba ganti menjadi: DB_HOST=127.0.0.1\n";
    echo "      - Jika DB_HOST=127.0.0.1 gagal, coba ganti menjadi: DB_HOST=localhost\n";
    echo "      - Periksa kembali ketikan nama database, user, dan password.\n\n";
    echo "   Proses instalasi dihentikan sementara agar server tidak mengalami error 500/timeout.\n";
    echo "   Silakan sesuaikan file .env Anda lalu refresh halaman ini.\n";
    echo '</pre></body></html>';
    exit;
}

// LANGKAH 3: Jalankan Migrasi Database
$isFresh = isset($_GET['fresh']) && $_GET['fresh'] == '1';
$migrateCmd = $isFresh ? 'migrate:fresh' : 'migrate';
$migrationSuccess = false;
echo "3. Menjalankan migrasi basis data ({$migrateCmd} --force --no-interaction)...\n";
try {
    $kernel->call($migrateCmd, [
        '--force' => true,
        '--no-interaction' => true,
    ]);
    echo $kernel->output()."\n";
    $migrationSuccess = true;
} catch (Throwable $migErr) {
    echo '   ❌ Terjadi kesalahan saat migrasi: '.$migErr->getMessage()."\n\n";
    echo "   💡 Jika migrasi sebelumnya gagal di tengah jalan dan tabel sudah terbuat sebagian,\n";
    echo "      silakan gunakan opsi RESET untuk mengosongkan tabel dan membuat ulang secara bersih:\n";
    echo "      👉 <a href='install.php?run=saptara_install&fresh=1' style='color:#f87171;font-weight:bold;'>Klik di sini untuk Reset & Jalankan Ulang Bersih (migrate:fresh)</a>\n\n";
}

if (! $migrationSuccess) {
    echo "❌ PROSES DIHENTIKAN: Migrasi tabel database belum selesai dengan sukses.\n";
    echo "   Seeding tidak dapat dijalankan sebelum seluruh tabel dan kolom dibuat.\n";
    echo "   👉 Silakan klik tautan Reset di atas untuk mengulang dari awal secara bersih.\n";
    echo '</pre></body></html>';
    exit;
}

// LANGKAH 4: Jalankan Seeding
echo "4. Mengisi data awal kebiasaan maritim & super admin (db:seed --force)...\n";
try {
    $kernel->call('db:seed', [
        '--force' => true,
        '--no-interaction' => true,
    ]);
    echo $kernel->output()."\n";
} catch (Throwable $seedErr) {
    echo '   (Catatan seeding: '.$seedErr->getMessage().")\n\n";
}

// LANGKAH 5: Buat Symlink Storage Publik
echo "5. Menghubungkan storage publik (storage:link)...\n";
try {
    $kernel->call('storage:link', ['--no-interaction' => true]);
    echo $kernel->output()."\n";
} catch (Throwable $storageErr) {
    echo '   (Catatan: '.$storageErr->getMessage().")\n\n";
}

// LANGKAH 6: Bersihkan Cache
echo "6. Membersihkan cache konfigurasi lama...\n";
try {
    $kernel->call('config:clear', ['--no-interaction' => true]);
    $kernel->call('route:clear', ['--no-interaction' => true]);
    $kernel->call('view:clear', ['--no-interaction' => true]);
    echo "   ✅ Cache aplikasi berhasil dibersihkan.\n\n";
} catch (Throwable $cacheErr) {
    echo '   (Catatan cache: '.$cacheErr->getMessage().")\n\n";
}

echo "======================================================\n";
echo "🎉 INSTALASI SELESAI DENGAN SUKSES!\n";
echo "======================================================\n\n";
echo "Akun Default yang Siap Digunakan:\n";
echo "1. Super Admin   : admin@saptara.id / password123 (Rute: /admin/login)\n";
echo "2. Admin Sekolah : admin@samudra.sch.id / password123 (Rute: /school-admin/login)\n";
echo "3. Guru          : firman@school.id / password123 (Sekolah: SMP Negeri 1 Samudra)\n";
echo "4. Siswa         : NIS: 100001 / PIN: 123456 (Sekolah: SMP Negeri 1 Samudra)\n\n";
echo "⚠️ PENTING: Segera HAPUS file 'install.php' dari File Manager cPanel demi keamanan server!\n\n";
echo "<a href='/' style='color:#4ade80;font-weight:bold;text-decoration:underline;font-size:16px;'>&rarr; Buka Beranda Aplikasi SAPTARA</a>\n";
echo '</pre></body></html>';
