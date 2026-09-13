<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Student extends Model implements JWTSubject
{
    // Required by JWTSubject
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    protected $fillable = [
        'school_id', 'class_id', 'name', 'nis', 'access_code',
        'avatar', 'xp', 'coins', 'streak',
        'last_active_date', 'parent_email',
    ];

    protected $casts = [
        'last_active_date' => 'date',
    ];

    protected $appends = [
        'schoolId',
        'classId',
        'accessCode',
        'lastActiveDate',
        'parentEmail',
        'ship_level',
        'nautical_miles',
    ];

    public function getSchoolIdAttribute(): ?int
    {
        return isset($this->attributes['school_id']) ? (int) $this->attributes['school_id'] : null;
    }

    public function getClassIdAttribute(): int
    {
        return (int) ($this->attributes['class_id'] ?? 0);
    }

    public function getAccessCodeAttribute(): ?string
    {
        return $this->attributes['access_code'] ?? null;
    }

    public function getLastActiveDateAttribute(): ?string
    {
        return isset($this->attributes['last_active_date']) && $this->attributes['last_active_date']
            ? substr($this->attributes['last_active_date'], 0, 10)
            : null;
    }

    public function getParentEmailAttribute(): ?string
    {
        return $this->attributes['parent_email'] ?? null;
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function habitCompletions(): HasMany
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

    public function accessories(): HasMany
    {
        return $this->hasMany(StudentAccessory::class);
    }

    public function weeklySnapshots(): HasMany
    {
        return $this->hasMany(WeeklySnapshot::class);
    }

    /**
     * Get ship level based on XP (nautical miles).
     */
    public function getShipLevelAttribute(): array
    {
        $xp = $this->xp;
        if ($xp >= 600) {
            return ['level' => 4, 'name' => 'Kapten Saptara',    'emoji' => '🚢', 'minXP' => 600,  'maxXP' => 1000, 'ship' => 'saptara'];
        }
        if ($xp >= 300) {
            return ['level' => 3, 'name' => 'Kapal Pinisi',      'emoji' => '⛵', 'minXP' => 300,  'maxXP' => 600,  'ship' => 'pinisi'];
        }
        if ($xp >= 100) {
            return ['level' => 2, 'name' => 'Sampan Dayung',     'emoji' => '🚣', 'minXP' => 100,  'maxXP' => 300,  'ship' => 'rowboat'];
        }

        return ['level' => 1, 'name' => 'Rakit Bambu',      'emoji' => '🪵', 'minXP' => 0,    'maxXP' => 100,  'ship' => 'raft'];
    }

    public function getNauticalMilesAttribute(): int
    {
        return (int) $this->xp;
    }

    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(ParentProfile::class, 'parent_student', 'student_id', 'parent_id')
            ->withTimestamps();
    }

    public function questClaims(): HasMany
    {
        return $this->hasMany(StudentDailyQuestClaim::class);
    }

    public function classMissionClaims(): HasMany
    {
        return $this->hasMany(ClassMissionClaim::class, 'student_id');
    }
}
