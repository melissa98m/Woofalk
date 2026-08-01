<?php

use App\Http\Controllers\API\AddressController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BalladeController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ContactController;
use App\Http\Controllers\API\ExportController;
use App\Http\Controllers\API\HebergementController;
use App\Http\Controllers\API\ImportController;
use App\Http\Controllers\API\PlaceController;
use App\Http\Controllers\API\ReportController;
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
    Route::post('auth/google', 'loginWithGoogle')->middleware('throttle:api');
    Route::post('register', 'register')->middleware('throttle:api');
    Route::post('logout', 'logout');
    Route::post('refresh', 'refresh');
    Route::get('current-user', 'currentUser');
    Route::post('forgot-password', 'forgotPassword')->middleware('throttle:api');
    Route::post('reset-password', 'resetPassword')->middleware('throttle:api');
});

Route::controller(AddressController::class)->group(function () {
    Route::get('addresses', 'index');
    // Must precede addresses/{address} below, or "bulk" gets swallowed as a {address} id.
    Route::delete('addresses/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('addresses/{address}', 'show');
    // store stays open to any authenticated user: creating a place/ballade/
    // hebergement lets the user create a brand-new address inline. Editing
    // an existing address (shared by other listings) or deleting one is
    // admin-only, matching bulkDestroy above.
    Route::post('addresses', 'store')->middleware('auth:api');
    Route::patch('addresses/{address}', 'update')->middleware(['auth:api', 'admin']);
    Route::delete('addresses/{address}', 'destroy')->middleware(['auth:api', 'admin']);
});
Route::controller(BalladeController::class)->group(function () {
    Route::get('ballades', 'index');
    Route::get('ballades-user', 'byUser')->middleware('auth:api');
    Route::get('ballades-liked', 'likedByUser')->middleware('auth:api');
    // Must precede ballades/{ballade} below, or "bulk*"/"sortDateDesc" gets swallowed as a {ballade} id.
    Route::patch('ballades/bulk-status', 'bulkUpdateStatus')->middleware(['auth:api', 'moderate']);
    Route::delete('ballades/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('ballades/sortDateDesc', 'sortByDateDesc');
    Route::get('ballades/{ballade}', 'show');
    Route::post('ballades', 'store')->middleware(['auth:api', 'throttle:api']);
    Route::post('ballades/{ballade}/like', 'like')->middleware('auth:api');
    Route::delete('ballades/{ballade}/like', 'unlike')->middleware('auth:api');
    Route::post('ballades/{ballade}/report', 'report')->middleware('auth:api');
    Route::patch('ballades/{ballade}', 'update')->middleware('auth:api');
    Route::delete('ballades/{ballade}', 'destroy')->middleware('auth:api');
});
Route::controller(CategoryController::class)->group(function () {
    Route::get('categories', 'index');
    // Must precede categories/{category} below, or "bulk" gets swallowed as a {category} id.
    Route::delete('categories/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('categories/{category}', 'show');
    Route::post('categories', 'store')->middleware(['auth:api', 'admin']);
    Route::patch('categories/{category}', 'update')->middleware(['auth:api', 'admin']);
    Route::delete('categories/{category}', 'destroy')->middleware(['auth:api', 'admin']);
});
Route::controller(PlaceController::class)->group(function () {
    Route::get('places', 'index');
    Route::get('places-user', 'byUser')->middleware('auth:api');
    Route::get('places-liked', 'likedByUser')->middleware('auth:api');
    // Must precede places/{place} below, or "bulk*" gets swallowed as a {place} id.
    Route::patch('places/bulk-status', 'bulkUpdateStatus')->middleware(['auth:api', 'moderate']);
    Route::delete('places/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('places/{place}', 'show');
    Route::post('places', 'store')->middleware(['auth:api', 'throttle:api']);
    Route::post('places/{place}/like', 'like')->middleware('auth:api');
    Route::delete('places/{place}/like', 'unlike')->middleware('auth:api');
    Route::post('places/{place}/report', 'report')->middleware('auth:api');
    Route::patch('places/{place}', 'update')->middleware('auth:api');
    Route::delete('places/{place}', 'destroy')->middleware('auth:api');
});
Route::controller(HebergementController::class)->group(function () {
    Route::get('hebergements', 'index');
    Route::get('hebergements-user', 'byUser')->middleware('auth:api');
    Route::get('hebergements-liked', 'likedByUser')->middleware('auth:api');
    // Must precede hebergements/{hebergement} below, or "bulk*" gets swallowed as a {hebergement} id.
    Route::patch('hebergements/bulk-status', 'bulkUpdateStatus')->middleware(['auth:api', 'moderate']);
    Route::delete('hebergements/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('hebergements/{hebergement}', 'show');
    Route::post('hebergements', 'store')->middleware(['auth:api', 'throttle:api']);
    Route::post('hebergements/{hebergement}/like', 'like')->middleware('auth:api');
    Route::delete('hebergements/{hebergement}/like', 'unlike')->middleware('auth:api');
    Route::post('hebergements/{hebergement}/report', 'report')->middleware('auth:api');
    Route::patch('hebergements/{hebergement}', 'update')->middleware('auth:api');
    Route::delete('hebergements/{hebergement}', 'destroy')->middleware('auth:api');
});
Route::controller(TagController::class)->group(function () {
    Route::get('tags', 'index');
    // Must precede tags/{tag} below, or "bulk" gets swallowed as a {tag} id.
    Route::delete('tags/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('tags/{tag}', 'show');
    Route::post('tags', 'store')->middleware(['auth:api', 'admin']);
    Route::patch('tags/{tag}', 'update')->middleware(['auth:api', 'admin']);
    Route::delete('tags/{tag}', 'destroy')->middleware(['auth:api', 'admin']);
});
Route::controller(ContactController::class)->group(function () {
    Route::post('contact', 'store')->middleware('throttle:contact');
    Route::get('contacts', 'index')->middleware(['auth:api', 'moderate']);
    Route::post('contacts/{contact}/reply', 'reply')->middleware(['auth:api', 'moderate', 'throttle:api']);
});

Route::controller(ReportController::class)->middleware(['auth:api', 'moderate'])->group(function () {
    Route::get('reports', 'index');
    Route::patch('reports/{report}/dismiss', 'dismiss');
});

Route::controller(UserController::class)->group(function () {
    Route::get('users/current-user', 'Current');
    // Must precede users/{user} below, or "me" gets swallowed as a {user} id.
    Route::get('users/me/export', 'exportMyData')->middleware('auth:api');
    Route::get('users', 'index')->middleware(['auth:api', 'admin']);
    // Must precede users/{user} below, or "bulk" gets swallowed as a {user} id.
    Route::delete('users/bulk', 'bulkDestroy')->middleware(['auth:api', 'admin']);
    Route::get('users/{user}', 'show')->middleware('auth:api');
    Route::patch('users/{user}/roles', 'updateRoles')->middleware(['auth:api', 'admin']);
    Route::post('users/change-password', 'updatePassword')->middleware('auth:api');
    Route::delete('users/{user}', 'destroy')->middleware('auth:api');
});

Route::controller(ExportController::class)->middleware(['auth:api', 'admin'])->group(function () {
    Route::get('export/options', 'options');
    Route::post('export/csv', 'csv');
    Route::get('export/sql', 'sql');
});

Route::controller(ImportController::class)->middleware(['auth:api', 'admin'])->group(function () {
    Route::get('import/options', 'options');
    Route::post('import/preview', 'preview')->middleware('throttle:api');
    Route::post('import/commit', 'commit')->middleware('throttle:api');
});
