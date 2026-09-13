<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthenticateParent
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();

            if ($payload->get('role') !== 'parent') {
                return response()->json(['error' => 'Forbidden — parent access only'], 403);
            }

            $request->merge([
                '_student_id' => $payload->get('studentId'),
                '_class_id' => $payload->get('classId'),
                '_student_name' => $payload->get('studentName'),
                '_role' => 'parent',
            ]);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Unauthorized — parent login required'], 401);
        }

        return $next($request);
    }
}
