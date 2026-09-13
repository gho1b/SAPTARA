<?php

use App\Http\Middleware\AuthenticateParent;
use App\Http\Middleware\AuthenticateStudent;
use App\Http\Middleware\AuthenticateTeacher;
use App\Http\Middleware\AuthenticateTeacherOrParent;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsSchoolAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register custom middleware aliases
        $middleware->alias([
            'auth.teacher' => AuthenticateTeacher::class,
            'auth.student' => AuthenticateStudent::class,
            'auth.parent' => AuthenticateParent::class,
            'auth.teacher.or.parent' => AuthenticateTeacherOrParent::class,
            'auth.admin' => EnsureUserIsAdmin::class,
            'auth.school_admin' => EnsureUserIsSchoolAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
