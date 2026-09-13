<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    protected $fillable = ['user_id', 'school_id', 'display_name'];

    protected $appends = ['displayName'];

    public function getDisplayNameAttribute(): string
    {
        return $this->attributes['display_name'] ?? '';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'teacher_id');
    }

    public function reviewedLogbookEntries(): HasMany
    {
        return $this->hasMany(LogbookEntry::class, 'reviewed_by_teacher_id');
    }
}
