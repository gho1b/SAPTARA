<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassMissionClaim extends Model
{
    protected $table = 'class_mission_claims';

    protected $fillable = [
        'class_mission_id',
        'student_id',
        'reward_xp',
        'reward_coins',
    ];

    protected $casts = [
        'reward_xp' => 'integer',
        'reward_coins' => 'integer',
    ];

    public function classMission(): BelongsTo
    {
        return $this->belongsTo(ClassMission::class, 'class_mission_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
