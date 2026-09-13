<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklySnapshot extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'student_id', 'week_start_date',
        'day_of_week', 'completed_count', 'created_at',
    ];

    protected $casts = [
        'week_start_date' => 'date',
        'created_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
