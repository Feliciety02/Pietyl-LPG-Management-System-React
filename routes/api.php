<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['ok' => true]);
});

Route::get('/me', function (Request $request) {
    return response()->json([
        'authenticated' => $request->user() !== null,
        'user' => $request->user(),
    ]);
})->middleware('auth');
