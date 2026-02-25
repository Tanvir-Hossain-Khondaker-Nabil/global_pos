<?php

use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\UserDepositController ;
use App\Http\Controllers\Api\UserSubscriptionsController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json(['message' => 'API works']);
});


// user deposits route
Route::post('/deposits', [UserDepositController::class, 'store'])->name('api.deposits.store');

//subscription routes
Route::post('/subscriptions', [UserSubscriptionsController::class, 'store'])->name('api.subscriptions.store');

//plan routes
Route::get('/plans', [PlanController::class, 'index'])->name('api.plans.index');