<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDailyQuestClaim extends Model
{
    protected $table = 'student_daily_quest_claims';

    protected $fillable = [
        'student_id',
        'quest_key',
        'date',
        'reward_xp',
        'reward_coins',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
