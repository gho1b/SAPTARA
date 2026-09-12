<?php

namespace App\Http\Middleware;

use App\Models\Teacher;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateTeacher
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized — teacher login required'], 401);
        }

        // Load or auto-create teacher profile
        $teacher = Teacher::firstOrCreate(
            ['user_id' => $user->id],
            ['display_name' => $user->name ?: explode('@', $user->email)[0]]
        );

        $request->merge(['_teacher' => $teacher]);

        return $next($request);
    }
}
