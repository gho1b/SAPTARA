<?php

namespace Database\Seeders;

use App\Models\Habit;
use Illuminate\Database\Seeder;

class HabitSeeder extends Seeder
{
    public function run(): void
    {
        if (Habit::where('is_custom', false)->count() > 0) {
            $this->command->info('Habits already seeded, skipping.');
            return;
        }

        $habits = [
            ['name' => 'Bangun Pagi',          'icon' => '🌅', 'island' => 'Pulau Fajar',         'badge' => 'Lencana Fajar',         'badge_icon' => '🌄', 'color' => '#FFB703', 'description' => 'Bangun pagi sebelum matahari terbit',  'position_x' => 50, 'position_y' => 13],
            ['name' => 'Beribadah',             'icon' => '🕌', 'island' => 'Pulau Ibadah',        'badge' => 'Lencana Ibadah',        'badge_icon' => '🌙', 'color' => '#8338EC', 'description' => 'Beribadah tepat waktu',                  'position_x' => 78, 'position_y' => 30],
            ['name' => 'Berolahraga',           'icon' => '🏃', 'island' => 'Pulau Perkasa',       'badge' => 'Lencana Perkasa',       'badge_icon' => '💪', 'color' => '#E76F51', 'description' => 'Berolahraga minimal 30 menit',           'position_x' => 80, 'position_y' => 52],
            ['name' => 'Makan Sehat dan Bergizi','icon' => '🥗', 'island' => 'Pulau Rendang',      'badge' => 'Lencana Rendang',       'badge_icon' => '🍛', 'color' => '#06D6A0', 'description' => 'Makan makanan bergizi',                  'position_x' => 72, 'position_y' => 75],
            ['name' => 'Belajar Mandiri',       'icon' => '📚', 'island' => 'Pulau Cerdas',        'badge' => 'Lencana Cerdas',        'badge_icon' => '🎓', 'color' => '#118AB2', 'description' => 'Membaca buku secara mandiri',            'position_x' => 45, 'position_y' => 88],
            ['name' => 'Bermasyarakat',         'icon' => '🤝', 'island' => 'Pulau Gotong Royong', 'badge' => 'Lencana Gotong Royong', 'badge_icon' => '👐', 'color' => '#EF476F', 'description' => 'Membantu dan berbuat baik',              'position_x' => 20, 'position_y' => 68],
            ['name' => 'Tidur Cepat',           'icon' => '😴', 'island' => 'Pulau Mimpi',         'badge' => 'Lencana Mimpi',         'badge_icon' => '⭐', 'color' => '#6C63FF', 'description' => 'Tidur sebelum jam 9 malam',              'position_x' => 22, 'position_y' => 35],
        ];

        foreach ($habits as $habit) {
            Habit::create(array_merge($habit, ['is_custom' => false]));
        }

        $this->command->info('Seeded 7 habits successfully!');
    }
}
