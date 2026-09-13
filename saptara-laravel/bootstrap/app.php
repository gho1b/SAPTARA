<?php

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
            'auth.teacher'          => \App\Http\Middleware\AuthenticateTeacher::class,
            'auth.student'          => \App\Http\Middleware\AuthenticateStudent::class,
            'auth.parent'           => \App\Http\Middleware\AuthenticateParent::class,
            'auth.teacher.or.parent'=> \App\Http\Middleware\AuthenticateTeacherOrParent::class,
            'auth.admin'            => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();

