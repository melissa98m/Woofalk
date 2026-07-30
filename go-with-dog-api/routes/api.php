<?php

use App\Http\Controllers\API\AddressController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BalladeController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ContactController;
use App\Http\Controllers\API\ExportController;
use App\Http\Controllers\API\PlaceController;
use App\Http\Controllers\API\TagController;
use App\Http\Controllers\API\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::controller(AuthController::class)->group(function () {
    Route::post('login', 'login')->middleware('throttle:api');
    Route::post('register', 'register')->middleware('throttle:api');
    Route::post('logout', 'logout');
    Route::post('refresh', 'refresh');
    Route::get('current-user', 'currentUser');
    Route::post('forgot-password', 'forgotPassword');
    Route::post('reset-password', 'resetPassword');
});

Route::controller(AddressController::class)->group(function () {
    Route::get('addresses', 'index');
    Route::get('addresses/{address}', 'show');
    Route::post('addresses', 'store')->middleware('auth:api');
    Route::patch('addresses/{address}', 'update')->middleware('auth:api');
    Route::delete('addresses/{address}', 'destroy')->middleware('auth:api');
});
Route::controller(BalladeController::class)->group(function () {
    Route::get('ballades', 'index');
    Route::get('ballades-user', 'byUser')->middleware('auth:api');
    Route::get('ballades-liked', 'likedByUser')->middleware('auth:api');
    Route::get('ballades/{ballade}', 'show');
    Route::get('ballades/sortDateDesc', 'sortByDateDesc');
    Route::post('ballades', 'store')->middleware(['auth:api', 'throttle:api']);
    Route::post('ballades/{ballade}/like', 'like')->middleware('auth:api');
    Route::delete('ballades/{ballade}/like', 'unlike')->middleware('auth:api');
    Route::patch('ballades/{ballade}', 'update')->middleware('auth:api');
    Route::delete('ballades/{ballade}', 'destroy')->middleware('auth:api');
});
Route::controller(CategoryController::class)->group(function () {
    Route::get('categories', 'index');
    Route::get('categories/{category}', 'show');
    Route::post('categories', 'store')->middleware('auth:api');
    Route::patch('categories/{category}', 'update')->middleware('auth:api');
    Route::delete('categories/{category}', 'destroy')->middleware('auth:api');
});
Route::controller(PlaceController::class)->group(function () {
    Route::get('places', 'index');
    Route::get('places-user', 'byUser')->middleware('auth:api');
    Route::get('places-liked', 'likedByUser')->middleware('auth:api');
    Route::get('places/{place}', 'show');
    Route::post('places', 'store')->middleware(['auth:api', 'throttle:api']);
    Route::post('places/{place}/like', 'like')->middleware('auth:api');
    Route::delete('places/{place}/like', 'unlike')->middleware('auth:api');
    Route::patch('places/{place}', 'update')->middleware('auth:api');
    Route::delete('places/{place}', 'destroy')->middleware('auth:api');
});
Route::controller(TagController::class)->group(function () {
    Route::get('tags', 'index');
    Route::get('tags/{tag}', 'show');
    Route::post('tags', 'store')->middleware('auth:api');
    Route::patch('tags/{tag}', 'update')->middleware('auth:api');
    Route::delete('tags/{tag}', 'destroy')->middleware('auth:api');
});
Route::controller(ContactController::class)->group(function () {
    Route::post('contact', 'store')->middleware('throttle:contact');
    Route::get('contacts', 'index')->middleware(['auth:api', 'admin']);
    Route::post('contacts/{contact}/reply', 'reply')->middleware(['auth:api', 'admin', 'throttle:api']);
});

Route::controller(UserController::class)->group(function () {
    Route::get('users/current-user', 'Current');
    // Must precede users/{user} below, or "me" gets swallowed as a {user} id.
    Route::get('users/me/export', 'exportMyData')->middleware('auth:api');
    Route::get('users', 'index')->middleware(['auth:api', 'admin']);
    Route::get('users/{user}', 'show')->middleware('auth:api');
    Route::post('users/change-password', 'updatePassword')->middleware('auth:api');
    Route::delete('users/{user}', 'destroy')->middleware('auth:api');
});

Route::controller(ExportController::class)->middleware(['auth:api', 'admin'])->group(function () {
    Route::get('export/options', 'options');
    Route::post('export/csv', 'csv');
    Route::get('export/sql', 'sql');
});
