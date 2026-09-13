# Panduan Deploy ke Shared PHP Hosting

## File yang perlu diupload ke hosting

Upload **seluruh folder `saptara-laravel/`** ke server. Struktur di hosting:

```
public_html/          ← atau httpdocs/, www/, dll
├── index.php         ← dari saptara-laravel/public/index.php
├── .htaccess         ← dari saptara-laravel/public/.htaccess
├── storage/          ← symlink atau copy manual
└── [aset lainnya]

saptara-laravel/      ← di luar public_html (lebih aman)
├── app/
├── bootstrap/
├── config/
├── database/
├── routes/
├── storage/
└── ...
```

> **Catatan penting:** Tempatkan folder `saptara-laravel` di luar `public_html`, lalu arahkan `public_html` ke folder `public/` Laravel.

---

## Opsi A: Public HTML = Laravel public/ (paling umum di shared hosting)

Jika hosting hanya punya `public_html/`, upload semua isi `saptara-laravel/` ke root hosting, lalu **pindahkan isi folder `public/` ke `public_html/`** dan update path di `index.php`:

```php
// public_html/index.php — update path ini:
require __DIR__.'/../saptara-laravel/bootstrap/autoload.php';
$app = require_once __DIR__.'/../saptara-laravel/bootstrap/app.php';
```

---

## .htaccess (sudah ada di Laravel public/)

File `saptara-laravel/public/.htaccess` sudah dikonfigurasi Laravel. Tidak perlu diubah.

Jika hosting menggunakan LiteSpeed, tambahkan:
```apache
<IfModule LiteSpeed>
    RewriteEngine On
</IfModule>
```

---

## Langkah Deploy

### 0. Build Frontend di Komputer Lokal (Sebelum Upload)
Karena shared hosting tidak memiliki runtime Node.js native, build aset frontend React secara lokal:
```bash
npm run build
```
Ini akan menghasilkan file terkompilasi di dalam folder `public/build/`. Pastikan folder `public/build/` ini ikut terupload ke hosting!

### 1. Upload via FTP/cPanel File Manager
```
Upload folder saptara-laravel/ ke luar public_html
Upload isi public/ ke dalam public_html (termasuk public/build/)
```

### 2. Konfigurasi .env di server
Edit `.env` di server:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domainkamu.com

DB_CONNECTION=mysql
DB_HOST=localhost          # biasanya localhost di shared hosting
DB_DATABASE=nama_database  # buat di cPanel → MySQL Databases
DB_USERNAME=user_database
DB_PASSWORD=password_database

FILESYSTEM_DISK=public
```

### 3. Jalankan via SSH (jika tersedia)
```bash
cd /path/to/saptara-laravel
php artisan migrate --force
php artisan db:seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

### 4. Jika tidak ada SSH (shared hosting tanpa SSH)

#### Migrasi database manual:
- Gunakan phpMyAdmin di cPanel
- Import file SQL yang dihasilkan dari `php artisan schema:dump` (jalankan lokal dulu)

#### Storage link manual:
Buat symlink manual di cPanel File Manager:
```
public_html/storage → saptara-laravel/storage/app/public
```
Atau copy file foto ke `public_html/storage/logbook/`

#### Konfigurasi via web installer:
Buat script sementara `public_html/install.php`:
```php
<?php
// Jalankan sekali, hapus setelah selesai!
require '../saptara-laravel/vendor/autoload.php';
$app = require '../saptara-laravel/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->call('migrate', ['--force' => true]);
$kernel->call('db:seed', ['--force' => true]);
echo "Done!";
```

---

## Konfigurasi Cron Job (untuk fitur notifikasi email mingguan - Phase 14)

Di cPanel → Cron Jobs, tambahkan:
```
* * * * * php /path/to/saptara-laravel/artisan schedule:run >> /dev/null 2>&1
```

---

## Checklist Deploy

- [ ] Database MySQL dibuat di cPanel
- [ ] .env dikonfigurasi (DB credentials, APP_URL, APP_KEY)
- [ ] `php artisan migrate --force` berhasil
- [ ] `php artisan db:seed` berhasil (7 habits terseed)
- [ ] Storage link terpasang (foto bisa diakses)
- [ ] `.htaccess` berfungsi (pretty URLs)
- [ ] `APP_DEBUG=false` di production
- [ ] Test endpoint: `GET /api/health` → `{"status": "ok"}`

---

## Otomatisasi CI GitHub: Artefak Produksi Siap Pakai

Sistem telah dilengkapi dengan GitHub Actions Workflow (`.github/workflows/production-artifact.yml`) yang secara otomatis membuat file arsip produksi (`.zip` dan `.tar.gz`) setiap kali tag rilis dibuat di branch `main`.

### Cara Memicu Pembuatan Artefak:
1. Pastikan seluruh perubahan sudah di-merge ke branch `main`:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Buat git tag versi baru:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions akan secara otomatis:
   - Memvalidasi bahwa tag berada pada branch `main`.
   - Mengompilasi aset frontend React & Tailwind via Vite (`public/build/`).
   - Mengunduh paket Composer produksi (`--no-dev --optimize-autoloader`).
   - Memaketkan seluruh aplikasi (termasuk `vendor/`, `public/build/`, dan struktur `storage/` bersih) tanpa file development / testing / `.git`.
   - Mengunggah artefak ke GitHub Actions Artifacts dan membuat GitHub Release dengan lampiran `.zip` & `.tar.gz`.
