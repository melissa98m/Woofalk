<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Auth now travels in an httpOnly cookie (see AuthController::authCookie),
    // which requires supports_credentials below — browsers reject the
    // combination of a credentialed request with a wildcard origin, so this
    // must be an explicit list of real front-end origins, not '*'.
    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // Without this, cross-origin JS (the Vite dev server on :3000 calling the
    // API on :8000, or any other host serving the front-end) can't read the
    // real filename off a download response and falls back to a generic one
    // — visible on /export, where a multi-table CSV zip could get saved
    // with a .csv extension since the front-end couldn't see it was a zip.
    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => true,

];
