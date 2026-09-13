<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolClass extends Model
{
    protected $table = 'classes';

    protected $fillable = [
        'teacher_id', 'school_id', 'school_name', 'class_code',
        'ship_name', 'semester', 'tahun_ajaran',
    ];

    protected $appends = [
        'schoolId',
        'schoolName',
        'classCode',
        'shipName',
        'teacherId',
    ];

    public function getSchoolIdAttribute(): ?int
    {
        return isset($this->attributes['school_id']) ? (int) $this->attributes['school_id'] : null;
    }

    public function getSchoolNameAttribute(): string
    {
        return $this->attributes['school_name'] ?? '';
    }

    public function getClassCodeAttribute(): string
    {
        return $this->attributes['class_code'] ?? '';
    }

    public function getShipNameAttribute(): ?string
    {
        return $this->attributes['ship_name'] ?? null;
    }

    public function getTeacherIdAttribute(): ?int
    {
        return isset($this->attributes['teacher_id']) ? (int) $this->attributes['teacher_id'] : null;
    }

    protected static function booted(): void
    {
        static::creating(function (SchoolClass $class) {
            if (empty($class->school_name) && ! empty($class->school_id)) {
                $class->school_name = School::find($class->school_id)?->name ?? 'Sekolah';
            }
        });
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function classMissions(): HasMany
    {
        return $this->hasMany(ClassMission::class, 'class_id');
    }
}
