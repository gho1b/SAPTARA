<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CommandExecution extends Model
{
    use HasUuids;

    protected $table = 'command_executions';

    protected $fillable = [
        'id',
        'command_key',
        'command',
        'title',
        'status',
        'exit_code',
        'output_log_path',
        'options',
        'executed_by_id',
        'executed_by_name',
        'executed_by_email',
        'ip_address',
        'started_at',
        'finished_at',
        'duration_seconds',
    ];

    protected $casts = [
        'options' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'exit_code' => 'integer',
        'duration_seconds' => 'integer',
    ];
}
