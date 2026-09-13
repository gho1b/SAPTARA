<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassMission extends Model
{
    protected $table = 'class_missions';

    protected $fillable = [
        'class_id',
        'title',
        'description',
        'type',
        'target_count',
        'reward_xp_each',
        'reward_coins_each',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'target_count' => 'integer',
        'reward_xp_each' => 'integer',
        'reward_coins_each' => 'integer',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function claims(): HasMany
    {
        return $this->hasMany(ClassMissionClaim::class, 'class_mission_id');
    }
}
