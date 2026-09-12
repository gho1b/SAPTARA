<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthenticateStudent
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();

            if ($payload->get('role') !== 'student') {
                return response()->json(['error' => 'Forbidden — student access only'], 403);
            }

            $request->merge([
                '_student_id' => $payload->get('studentId'),
                '_class_id'   => $payload->get('classId'),
                '_role'       => 'student',
            ]);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Unauthorized — student login required'], 401);
        }

        return $next($request);
    }
}
