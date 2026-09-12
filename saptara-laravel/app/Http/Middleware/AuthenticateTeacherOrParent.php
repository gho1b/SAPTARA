<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Allows both teacher (Sanctum) and parent (JWT role=parent).
 */
class AuthenticateTeacherOrParent
{
    public function handle(Request $request, Closure $next): Response
    {
        // Try Sanctum teacher first
        if ($request->user()) {
            return $next($request);
        }

        // Try JWT parent
        try {
            $payload = JWTAuth::parseToken()->getPayload();

            if ($payload->get('role') === 'parent') {
                $request->merge([
                    '_student_id'   => $payload->get('studentId'),
                    '_class_id'     => $payload->get('classId'),
                    '_student_name' => $payload->get('studentName'),
                    '_role'         => 'parent',
                ]);
                return $next($request);
            }
        } catch (JWTException) {
            // Fall through
        }

        return response()->json(['error' => 'Unauthorized — teacher or parent login required'], 401);
    }
}
