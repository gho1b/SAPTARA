<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentBadge extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'habit_id', 'awarded_by_teacher_id', 'awarded_at'];

    protected $casts = [
        'awarded_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }

    public function awardedBy(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'awarded_by_teacher_id');
    }
}
