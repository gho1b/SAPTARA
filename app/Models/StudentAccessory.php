<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAccessory extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'accessory_id', 'purchased_at'];

    protected $casts = [
        'purchased_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
