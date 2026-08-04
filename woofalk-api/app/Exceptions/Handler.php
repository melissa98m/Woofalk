<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Psr\Log\LogLevel;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<Throwable>, LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * This is an API-only backend with no "login" web route to redirect to,
     * so unauthenticated requests always get a JSON 401 response.
     */
    protected function unauthenticated($request, AuthenticationException $exception): JsonResponse
    {
        return response()->json(['message' => $exception->getMessage()], 401);
    }

    /**
     * Every route in this app lives under api.php, but the default
     * shouldReturnJson() only renders JSON when the client sends an
     * `Accept: application/json` header (or XHR/`wantsJson()` heuristics).
     * A client that doesn't send it — curl, a partner integration, some
     * third-party webhook caller — hit a plain ValidationException and got
     * a 302 redirect-to-previous-page with an HTML body instead of a clean
     * error, since there's no session/previous-page concept in this
     * stateless API. Since there is no non-API route to protect, always
     * render JSON here.
     */
    protected function shouldReturnJson($request, Throwable $e): bool
    {
        return true;
    }
}
