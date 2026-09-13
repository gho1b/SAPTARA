# Panduan Deploy SAPTARA ke Shared Hosting cPanel (Zero-Node & Zero-Shell)

Aplikasi SAPTARA dirancang agar dapat di-deploy ke shared hosting PHP murah (seperti cPanel) **tanpa memerlukan akses terminal/SSH** dan **tanpa memerlukan runtime Node.js di server**.

---

## 🚀 Ringkasan Solusi Tanpa Node & Shell

| Masalah Umum di Shared Hosting | Solusi Otomatis SAPTARA |
|---|---|
| **Tidak ada Node.js di server** | GitHub Actions CI mengompilasi seluruh aplikasi React + Tailwind menjadi aset statis murni (`public/build/`). Server hanya bertugas melayani file statis via PHP/web server. |
| **Tidak ada akses SSH / Terminal** | Database dapat diatur melalui **Import phpMyAdmin** (`database/saptara_production.sql`) ATAU via browser menggunakan script **Web Installer** (`public/install.php`). |
| **Tidak bisa jalankan `composer` di hosting** | Seluruh folder `vendor/` produksi sudah dipaketkan lengkap ke dalam file arsip rilis (`.zip`). |
| **Folder `public_html` cPanel** | Telah disediakan file `.htaccess` di root direktori sehingga ekstraksi langsung ke `public_html` otomatis diarahkan ke `public/` tanpa perlu memindah-mindahkan folder. |

---

## 📦 Cara Mendapatkan Artefak Produksi Siap Pakai

1. Buka repositori GitHub SAPTARA.
2. Buat git tag versi baru di branch `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions CI akan otomatis memproses dan mengunggah artefak:
   - Buka tab **Releases** atau tab **Actions** di GitHub.
   - Unduh file `saptara-production-v1.0.0.zip`.

---

## 🛠️ Langkah-Langkah Deploy ke cPanel (Hanya Menggunakan Browser)

### Langkah 1: Buat Database MySQL di cPanel
1. Masuk ke cPanel hosting Anda.
2. Buka menu **MySQL® Databases**.
3. Buat database baru (misal: `usercpanel_saptara`).
4. Buat user database baru (misal: `usercpanel_dbuser`) dan simpan password-nya.
5. Pada bagian **Add User to Database**, pilih user dan database tadi, centang **ALL PRIVILEGES**, lalu klik **Make Changes**.

---

### Langkah 2: Upload & Ekstrak Artefak di File Manager
1. Di cPanel, buka **File Manager**.
2. Masuk ke direktori domain Anda (biasanya `public_html` atau folder subdomain).
3. Klik tombol **Upload** di bagian atas, pilih file `saptara-production-v1.0.0.zip` yang telah diunduh dari GitHub.
4. Setelah proses upload 100%, klik kanan file `.zip` tersebut lalu pilih **Extract** ke dalam folder saat ini (`public_html`).
5. Hapus file `.zip` setelah ekstraksi selesai untuk menghemat kuota hosting.

---

### Langkah 3: Konfigurasi File `.env`
1. Di File Manager cPanel, pastikan opsi **Show Hidden Files (dotfiles)** aktif (ikon Settings di kanan atas).
2. Temukan file bernama `.env.cpanel.example`, klik kanan lalu pilih **Rename** menjadi `.env`.
3. Klik kanan file `.env` baru tersebut, lalu pilih **Edit**.
4. Sesuaikan nilai-nilai berikut:
   ```env
   APP_NAME=SAPTARA
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://namadomainanda.com

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_DATABASE=usercpanel_saptara
   DB_USERNAME=usercpanel_dbuser
   DB_PASSWORD=PasswordDatabaseAndaTadi
   ```
5. Klik **Save Changes**. *(Catatan: `APP_KEY` sudah otomatis di-generate unik pada file konfigurasi ini).*

---

### Langkah 4: Setup Database (Pilih Salah Satu)

#### Cara A: Menggunakan Web Installer Browser (Paling Mudah)
1. Buka peramban (browser) Anda dan akses:
   ```
   https://namadomainanda.com/install.php
   ```
2. Klik tombol **"Mulai Migrasi & Setup Database Sekarang"**.
3. Sistem secara otomatis menjalankan migrasi, seeding 7 kebiasaan anak, membuat akun Super Admin, dan mengoptimasi cache.
4. **PENTING:** Setelah berhasil, kembali ke File Manager cPanel dan **HAPUS file `public/install.php`** demi keamanan server.

#### Cara B: Menggunakan phpMyAdmin (Alternatif)
1. Di cPanel, buka menu **phpMyAdmin**.
2. Klik nama database Anda di sisi kiri (`usercpanel_saptara`).
3. Klik tab **Import** di bagian atas.
4. Klik **Choose File**, lalu pilih file `database/saptara_production.sql` dari komputer Anda (atau unduh dari folder yang baru diekstrak).
5. Klik **Import / Kirim**. Seluruh tabel, data habit, dan akun default akan langsung terpasang dalam hitungan detik.

---

## 🔑 Kredensial Login Bawaan Setelah Instalasi

| Peran Pengguna | URL Masuk | Kredensial Akun | Keterangan |
|---|---|---|---|
| **Super Admin** | `https://domainanda.com/admin/login` | **Email:** `admin@saptara.id`<br>**Password:** `password123` | Kelola master sekolah & buat akun operator sekolah |
| **Admin Sekolah** | `https://domainanda.com/school-admin/login` | **Sekolah:** `SMP Negeri 1 Samudra`<br>**Email:** `admin@samudra.sch.id`<br>**Password:** `password123` | Kelola guru, kelas, siswa (NIS & PIN), dan ortu |
| **Guru** | `https://domainanda.com` | **Sekolah:** `SMP Negeri 1 Samudra`<br>**Email:** `firman@school.id`<br>**Password:** `password123` | Masuk ke kelas/kapal & pantau logbook siswa |
| **Siswa** | `https://domainanda.com` | **Sekolah:** `SMP Negeri 1 Samudra`<br>**NIS:** `100001`<br>**PIN:** `123456` | Siswa: Kaisara Aqilla |

---

## ⏱️ Konfigurasi Cron Job (Opsional - Notifikasi Mingguan)
Di cPanel → **Cron Jobs**, tambahkan perintah berikut setiap menit atau setiap hari:
```bash
* * * * * php /home/username/public_html/artisan schedule:run >> /dev/null 2>&1
```
