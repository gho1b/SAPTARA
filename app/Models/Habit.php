<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Habit extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name', 'icon', 'island', 'badge', 'badge_icon',
        'color', 'description', 'position_x', 'position_y',
        'is_custom', 'created_by_teacher_id', 'class_id',
    ];

    protected $casts = [
        'is_custom' => 'boolean',
    ];

    protected $appends = [
        'badgeIcon',
        'positionX',
        'positionY',
    ];

    public function getBadgeIconAttribute(): ?string
    {
        return $this->attributes['badge_icon'] ?? null;
    }

    public function getPositionXAttribute(): int
    {
        return (int) ($this->attributes['position_x'] ?? 0);
    }

    public function getPositionYAttribute(): int
    {
        return (int) ($this->attributes['position_y'] ?? 0);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(HabitCompletion::class);
    }

    public function logbookEntries(): HasMany
    {
        return $this->hasMany(LogbookEntry::class);
    }

    public function badges(): HasMany
    {
        return $this->hasMany(StudentBadge::class);
    }

    // Scopes for Phase 16 (custom habits)
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->where('is_custom', false);
    }

    public function scopeForClass(Builder $query, int $classId): Builder
    {
        return $query->where(function ($q) use ($classId) {
            $q->where('is_custom', false)
              ->orWhere('class_id', $classId);
        });
    }
}
