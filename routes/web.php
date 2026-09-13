<?php

use Illuminate\Support\Facades\Route;

// All non-API, non-storage routes serve the React SPA view
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$');
