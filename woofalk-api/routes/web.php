<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Deliberately outside routes/api.php: this must be reachable at the bare
// API origin (not under /api) so a Vercel rewrite can proxy the front-end's
// own /sitemap.xml to it — see vercel.json.
Route::get('sitemap.xml', [SitemapController::class, 'index']);
