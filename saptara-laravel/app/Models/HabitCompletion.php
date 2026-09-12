<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HabitCompletion extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'habit_id', 'date', 'completed_at'];

    protected $casts = [
        'date'         => 'date',
        'completed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }
}
