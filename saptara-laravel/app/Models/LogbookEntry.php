<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogbookEntry extends Model
{
    protected $fillable = [
        'student_id', 'habit_id', 'date', 'time',
        'photo_url', 'caption', 'status',
        'reviewed_by_teacher_id', 'teacher_comment',
        'teacher_sticker', 'parent_comment', 'xp_earned',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    protected $appends = [
        'studentId',
        'habitId',
        'photoUrl',
        'teacherComment',
        'teacherSticker',
        'parentComment',
        'xpEarned',
        'studentName',
        'studentAvatar',
        'habitName',
        'habitIcon',
    ];

    public function getStudentIdAttribute(): int
    {
        return (int) ($this->attributes['student_id'] ?? 0);
    }

    public function getHabitIdAttribute(): int
    {
        return (int) ($this->attributes['habit_id'] ?? 0);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->attributes['photo_url'] ?? null;
    }

    public function getTeacherCommentAttribute(): ?string
    {
        return $this->attributes['teacher_comment'] ?? null;
    }

    public function getTeacherStickerAttribute(): ?string
    {
        return $this->attributes['teacher_sticker'] ?? null;
    }

    public function getParentCommentAttribute(): ?string
    {
        return $this->attributes['parent_comment'] ?? null;
    }

    public function getXpEarnedAttribute(): int
    {
        return (int) ($this->attributes['xp_earned'] ?? 0);
    }

    public function getStudentNameAttribute(): ?string
    {
        return $this->student?->name;
    }

    public function getStudentAvatarAttribute(): ?string
    {
        return $this->student?->avatar;
    }

    public function getHabitNameAttribute(): ?string
    {
        return $this->habit?->name;
    }

    public function getHabitIconAttribute(): ?string
    {
        return $this->habit?->icon;
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'reviewed_by_teacher_id');
    }
}
