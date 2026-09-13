<?php
/**
 * SAPTARA Web Installer (Zero-Shell Deployment Helper)
 * 
 * Khusus shared hosting cPanel tanpa akses terminal / SSH.
 * Akses melalui browser: https://domain-anda.com/install.php
 * Setelah instalasi selesai, HAPUS file ini demi keamanan server!
 */

// Basic security check: require ?run=saptara_install
if (!isset($_GET['run']) || $_GET['run'] !== 'saptara_install') {
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAPTARA Web Installer - Shared Hosting</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; margin: 0; }
        .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        h1 { margin-top: 0; color: #38bdf8; font-size: 22px; display: flex; items-center; gap: 8px; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        .checklist { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; }
        .checklist li { margin-bottom: 8px; color: #cbd5e1; }
        .btn { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; transition: background 0.2s; }
        .btn:hover { background: #0369a1; }
        .warning { background: #451a03; border: 1px solid #78350f; color: #fde047; padding: 12px; border-radius: 8px; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 SAPTARA Web Installer (Zero-Shell)</h1>
        <p>Alat bantu setup database dan konfigurasi otomatis untuk shared hosting cPanel tanpa akses terminal/SSH.</p>
        
        <div class="checklist">
            <strong>Sebelum melanjutkan, pastikan Anda telah:</strong>
            <ul>
                <li>✅ Mengisi konfigurasi database di file <code>.env</code> (DB_DATABASE, DB_USERNAME, DB_PASSWORD).</li>
                <li>✅ Memastikan database MySQL sudah dibuat di cPanel & user memiliki hak akses penuh (ALL PRIVILEGES).</li>
                <li>✅ Memastikan file <code>.env</code> sudah memiliki <code>APP_KEY</code>.</li>
            </ul>
        </div>

        <p>Mengklik tombol di bawah akan menjalankan: <code>migrate --force</code>, <code>db:seed --force</code>, <code>storage:link</code>, dan optimasi cache aplikasi.</p>

        <a href="install.php?run=saptara_install" class="btn">Mulai Migrasi & Setup Database Sekarang</a>

        <div class="warning">
            ⚠️ <strong>Perhatian:</strong> Setelah proses selesai dan website dapat diakses, segera <strong>HAPUS</strong> file <code>install.php</code> ini melalui File Manager cPanel Anda.
        </div>
    </div>
</body>
</html>
<?php
    exit;
}

// Find vendor/autoload.php and bootstrap/app.php
$possiblePaths = [
    __DIR__ . '/../',                  // public/ is child of root
    __DIR__ . '/../../saptara-laravel/', // separate folder outside public_html
    __DIR__ . '/../saptara-laravel/',
];

$autoloadPath = null;
$appPath = null;

foreach ($possiblePaths as $base) {
    if (file_exists($base . 'vendor/autoload.php') && file_exists($base . 'bootstrap/app.php')) {
        $autoloadPath = $base . 'vendor/autoload.php';
        $appPath = $base . 'bootstrap/app.php';
        break;
    }
}

if (!$autoloadPath || !$appPath) {
    die("<div style='background:#7f1d1d;color:#fecaca;padding:20px;font-family:sans-serif;'>
        ❌ Error: Tidak dapat menemukan folder core Laravel (vendor/autoload.php atau bootstrap/app.php).
        Pastikan struktur direktori di server sudah sesuai.
    </div>");
}

require $autoloadPath;
$app = require_once $appPath;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<!DOCTYPE html><html><head><title>SAPTARA Installer Log</title></head><body style='background:#0f172a;color:#38bdf8;font-family:monospace;padding:30px;'>";
echo "<pre style='font-size: 13px; line-height: 1.5;'>";
echo "======================================================\n";
echo "       SAPTARA ZERO-SHELL INSTALLATION LOG           \n";
echo "======================================================\n\n";

try {
    echo "1. Menjalankan migrasi basis data (migrate --force)...\n";
    $kernel->call('migrate', ['--force' => true]);
    echo $kernel->output() . "\n";

    echo "2. Menjalankan seeding data master & kebiasaan maritim (db:seed --force)...\n";
    $kernel->call('db:seed', ['--force' => true]);
    echo $kernel->output() . "\n";

    echo "3. Menghubungkan storage publik (storage:link)...\n";
    try {
        $kernel->call('storage:link');
        echo $kernel->output() . "\n";
    } catch (\Throwable $ex) {
        echo "   (Catatan storage: " . $ex->getMessage() . ")\n\n";
    }

    echo "4. Mengoptimasi cache konfigurasi & rute...\n";
    $kernel->call('config:cache');
    $kernel->call('route:cache');
    echo "   Konfigurasi dan rute berhasil di-cache untuk performa maksimal.\n\n";

    echo "======================================================\n";
    echo "🎉 INSTALASI SELESAI DENGAN SUKSES!\n";
    echo "======================================================\n\n";
    echo "Kredensial Default:\n";
    echo "- Super Admin  : admin@saptara.id / password123 (Rute: /admin/login)\n";
    echo "- Admin Sekolah: admin@samudra.sch.id / password123 (Rute: /school-admin/login)\n";
    echo "- Guru         : firman@school.id / password123 (Sekolah: SMP Negeri 1 Samudra)\n";
    echo "- Siswa        : NIS: 100001 / PIN: 123456 (Sekolah: SMP Negeri 1 Samudra)\n\n";
    echo "⚠️ PENTING: Segera hapus file 'install.php' dari File Manager cPanel sekarang!\n";
    echo "<a href='/' style='color:#4ade80;font-weight:bold;text-decoration:underline;'>Buka Beranda SAPTARA &rarr;</a>\n";

} catch (\Throwable $e) {
    echo "\n❌ GAGAL MENJALANKAN SETUP:\n";
    echo $e->getMessage() . "\n\n";
    echo "Detail error:\n" . $e->getTraceAsString();
}

echo "</pre></body></html>";

