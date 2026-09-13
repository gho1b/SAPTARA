<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Default Super Admin
        User::updateOrCreate(
            ['email' => 'admin@saptara.id'],
            [
                'name'              => 'Super Administrator SAPTARA',
                'password'          => Hash::make('password123'),
                'role'              => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // 2. Master Data Sekolah Percontohan
        $schools = [
            [
                'npsn'       => '20101234',
                'name'       => 'SMP Negeri 1 Samudra',
                'address'    => 'Jl. Maritim Merdeka No. 45',
                'village'    => 'Gambir',
                'district'   => 'Gambir',
                'city'       => 'Kota Jakarta Pusat',
                'province'   => 'DKI Jakarta',
                'phone'      => '021-34567890',
                'email'      => 'info@smpn1samudra.sch.id',
                'website'    => 'https://smpn1samudra.sch.id',
                'logo'       => null,
                'is_active'  => true,
            ],
            [
                'npsn'       => '20205678',
                'name'       => 'SMP Bintang Bahari',
                'address'    => 'Jl. Tanjung Perak Timur No. 12',
                'village'    => 'Perak Timur',
                'district'   => 'Pabean Cantian',
                'city'       => 'Kota Surabaya',
                'province'   => 'Jawa Timur',
                'phone'      => '031-7654321',
                'email'      => 'kontak@bintangbahari.sch.id',
                'website'    => 'https://bintangbahari.sch.id',
                'logo'       => null,
                'is_active'  => true,
            ],
            [
                'npsn'       => '20309876',
                'name'       => 'MTs Al-Falah Bahari',
                'address'    => 'Jl. Terusan Buah Batu No. 88',
                'village'    => 'Kujangsari',
                'district'   => 'Bandung Kidul',
                'city'       => 'Kota Bandung',
                'province'   => 'Jawa Barat',
                'phone'      => '022-87654321',
                'email'      => 'admin@mtsalfalahbahari.sch.id',
                'website'    => 'https://mtsalfalahbahari.sch.id',
                'logo'       => null,
                'is_active'  => true,
            ],
            [
                'npsn'       => '20401122',
                'name'       => 'SD Nusantara',
                'address'    => 'Jl. Bahari Indah No. 5',
                'village'    => 'Hargorejo',
                'district'   => 'Kokap',
                'city'       => 'Kab. Kulon Progo',
                'province'   => 'D.I. Yogyakarta',
                'phone'      => '0274-774001',
                'email'      => 'sdnusantara@school.id',
                'website'    => null,
                'logo'       => null,
                'is_active'  => true,
            ],
            [
                'npsn'       => '20403344',
                'name'       => 'SD Kokap',
                'address'    => 'Jl. Waduk Sermo Km. 3',
                'village'    => 'Hargowilis',
                'district'   => 'Kokap',
                'city'       => 'Kab. Kulon Progo',
                'province'   => 'D.I. Yogyakarta',
                'phone'      => '0274-774002',
                'email'      => 'sdkokap@school.id',
                'website'    => null,
                'logo'       => null,
                'is_active'  => true,
            ],
            [
                'npsn'       => '20405566',
                'name'       => 'SD Blumbang',
                'address'    => 'Jl. Menoreh Raya No. 17',
                'village'    => 'Temon',
                'district'   => 'Temon',
                'city'       => 'Kab. Kulon Progo',
                'province'   => 'D.I. Yogyakarta',
                'phone'      => '0274-774003',
                'email'      => 'sdblumbang@school.id',
                'website'    => null,
                'logo'       => null,
                'is_active'  => true,
            ],
            [
                'npsn'       => '20407788',
                'name'       => 'SDIT Budi Mulyo',
                'address'    => 'Jl. Kaliurang Km. 9',
                'village'    => 'Minomartani',
                'district'   => 'Ngaglik',
                'city'       => 'Kab. Sleman',
                'province'   => 'D.I. Yogyakarta',
                'phone'      => '0274-884001',
                'email'      => 'info@budimulyo.sch.id',
                'website'    => null,
                'logo'       => null,
                'is_active'  => true,
            ],
        ];

        foreach ($schools as $data) {
            School::updateOrCreate(
                ['npsn' => $data['npsn']],
                $data
            );
        }

        // 3. Create Default School Admin for SMP Negeri 1 Samudra
        $smp1 = School::where('npsn', '20101234')->first();
        if ($smp1) {
            User::updateOrCreate(
                ['email' => 'admin@samudra.sch.id'],
                [
                    'name'              => 'Admin SMPN 1 Samudra',
                    'password'          => Hash::make('password123'),
                    'role'              => 'school_admin',
                    'school_id'         => $smp1->id,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}

