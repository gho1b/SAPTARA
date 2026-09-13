<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Development SAPTARA

Jalankan semua perintah berikut dari folder `saptara-laravel`. Tersedia dua
pilihan: Laravel Sail (Docker) atau PHP lokal. Keduanya menggunakan MySQL,
termasuk untuk session, cache, dan queue. Sail menyediakan MySQL 8.4.

### Dengan Laravel Sail

Siapkan Docker Engine/Desktop dengan Docker Compose (Windows: gunakan WSL2).
Sail memakai PHP 8.4 dan Node.js 24. Untuk clone baru:

```bash
cp .env.example .env
composer install
```

Jika PHP/Composer belum terpasang di komputer, ganti `composer install` dengan:

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$PWD:/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs
```

Pengabaian persyaratan platform hanya untuk container bootstrap Composer;
persyaratan sebenarnya diperiksa kembali di container Sail.
Jangan menimpa `.env` yang sudah digunakan. Lanjutkan dengan:

```bash
./vendor/bin/sail up -d --build --wait --wait-timeout 180
./vendor/bin/sail composer check-platform-reqs
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan storage:link
./vendor/bin/sail npm ci
./vendor/bin/sail npm run dev
```

Buka http://localhost:8000. Vite berjalan di port 5173 dan mendukung hot reload.
`key:generate` hanya diperlukan saat setup baru. Jika perlu mengganti port,
ubah `APP_PORT` beserta `APP_URL`, atau `VITE_PORT`, di `.env`, lalu jalankan
`sail up -d` dan mulai ulang Vite. Untuk akses dari perangkat lain, sesuaikan
host HMR pada `vite.config.js`.

Jika migrasi gagal dengan `getaddrinfo for mysql failed`, periksa apakah
container MySQL sudah berjalan. `sail artisan migrate` menjalankan perintah
di container aplikasi yang aktif; perintah itu tidak menyalakan MySQL.
Jalankan dari folder `saptara-laravel`:

```bash
./vendor/bin/sail ps -a
./vendor/bin/sail up -d --wait --wait-timeout 180
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan migrate
```

Pastikan MySQL berstatus `healthy`. Jika `up` gagal, periksa
`./vendor/bin/sail logs --tail=100 mysql` dan pesan error dari `up`.
Jika port host 3306 sudah dipakai, ubah `FORWARD_DB_PORT` di `.env`, lalu
ulangi `up`; port koneksi aplikasi di dalam container tetap 3306.

Jika MySQL sudah `healthy` tetapi hostname `mysql` tetap tidak ditemukan,
periksa `./vendor/bin/sail exec laravel.test getent hosts mysql`. Container
MySQL yang terlepas dari jaringan dapat diperbaiki dengan membuat ulang
container tanpa menghapus volume database:

```bash
./vendor/bin/sail up -d --force-recreate --wait --wait-timeout 180 mysql
./vendor/bin/sail artisan migrate
```

Perintah tambahan, dijalankan pada terminal lain:

```bash
./vendor/bin/sail artisan queue:work
./vendor/bin/sail test
./vendor/bin/sail down
```

MySQL menyimpan data pada volume `sail-mysql`, yang tetap ada setelah
`sail down`. `sail down -v` menghapus volume beserta datanya. Aplikasi menunggu
MySQL sehat sebelum dimulai. Di dalam container, Sail menetapkan
`DB_CONNECTION=mysql`, `DB_HOST=mysql`, dan `DB_PORT=3306`. Nama database serta
kredensial mengikuti `.env`; nilai contoh hanya untuk development lokal.
Port MySQL di host dapat diubah melalui `FORWARD_DB_PORT` jika 3306 sudah dipakai.
Database `testing` dibuat saat volume MySQL pertama kali diinisialisasi;
PHPUnit memakai database tersebut secara terpisah dari `saptara`.
Sail menyesuaikan UID/GID pengguna shell; jika menjalankan Compose secara
langsung di Linux, set `WWWUSER` dan `WWWGROUP` sesuai `id -u` dan `id -g`.

### Tanpa Docker

Siapkan PHP 8.4 beserta ekstensi yang dibutuhkan Composer dan `pdo_mysql`,
Composer, Node.js 24, serta server MySQL 8.4 lokal. Buat database `saptara`
dan user dengan hak akses ke database tersebut. Buat juga database `testing`
dan beri user yang sama akses ke sana jika menjalankan PHPUnit. Untuk clone baru:

```bash
cp .env.example .env
# Sesuaikan DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, dan DB_PASSWORD
# di .env dengan server MySQL lokal sebelum melanjutkan.
composer install
composer check-platform-reqs
php artisan key:generate
php artisan migrate
php artisan storage:link
npm ci
php artisan serve
```

Pada terminal lain, jalankan `npm run dev` dan, jika diperlukan,
`php artisan queue:work`. Buka http://localhost:8000.

Saat berpindah dari Sail ke PHP lokal, hentikan Vite dan jalankan
`./vendor/bin/sail down` terlebih dahulu agar port tidak bentrok, lalu jalankan
`php artisan config:clear`. Gunakan langkah sebaliknya untuk kembali ke Sail.
Sesuaikan kredensial `.env` untuk server MySQL yang dipakai. MySQL lokal dan
MySQL Sail memiliki penyimpanan data terpisah; pemindahan data memerlukan
export/import. Tidak perlu membuat ulang key aplikasi.

Jika sebelumnya menggunakan SQLite, ubah bagian `DB_*` di `.env` mengikuti
`.env.example`, jalankan `php artisan config:clear` (atau melalui Sail), lalu
jalankan migrasi di MySQL. Migrasi membuat skema; data SQLite tidak otomatis
dipindahkan.

Konfigurasi Sail berada di `compose.yaml` dan memakai Dockerfile bawaan paket
`laravel/sail`. Dockerfile pada root repository menjalankan aplikasi Node.js
yang terpisah. Sail ini ditujukan untuk development.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
