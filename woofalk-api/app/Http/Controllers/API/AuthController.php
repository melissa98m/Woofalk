<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\Register as MailRegister;
use App\Mail\ResetPasswordEmail;
use App\Mail\Welcome;
use App\Models\User;
use App\Services\Auth\GoogleTokenVerifierContract;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function __construct() {}

    /**
     * Build the httpOnly cookie the JWT is shipped in for browser clients.
     * The token never appears in a JSON body, so front-end JS has no way to
     * read it (and no way to leak it via XSS) — the browser attaches it
     * automatically on requests to this API's origin. `secure` is relaxed
     * outside `local` so it still works over plain http in Docker dev.
     */
    private function authCookie(?string $token, ?int $minutes = null)
    {
        return cookie(
            config('jwt.cookie_key_name', 'access_token'),
            $token,
            $minutes ?? config('jwt.ttl'),
            '/',
            null,
            ! app()->isLocal(),
            true,
            false,
            'lax'
        );
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',

        ],
            [
                'email.email' => 'Ce champ attend un donnée de type email',
                'email.required' => 'Ce champ est requis',
                'password.required' => 'Ce champ est requis',
                'password.string' => 'Ce champ attend un donnée de type text',
            ]
        );
        $credentials = $request->only('email', 'password');

        $token = Auth::attempt($credentials);
        if (! $token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        $user = Auth::user();

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'expires_at' => now()->addMinutes(config('jwt.ttl'))->getTimestamp(),
        ])->cookie($this->authCookie($token));

    }

    public function loginWithGoogle(Request $request, GoogleTokenVerifierContract $verifier)
    {
        $request->validate([
            'credential' => 'required|string',
            'accept_terms' => 'accepted',
        ], [
            'credential.required' => 'Ce champ est requis',
            'accept_terms.accepted' => 'Vous devez accepter la politique de confidentialité',
        ]);

        try {
            $payload = $verifier->verify($request->input('credential'));
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Jeton Google invalide',
            ], 401);
        }

        if (! $payload['email_verified']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cet email Google n\'est pas vérifié',
            ], 401);
        }

        $user = User::where('google_id', $payload['sub'])->first();

        if (! $user) {
            $user = User::where('email', $payload['email'])->first();

            if ($user) {
                // Google already verified ownership of this email, so linking
                // it to an existing password-based account carries no extra
                // account-takeover risk.
                $user->google_id = $payload['sub'];
                $user->save();
            }
        }

        if (! $user) {
            $user = User::create([
                'username' => $this->uniqueUsernameFromGoogle($payload),
                'email' => $payload['email'],
                'password' => null,
                'google_id' => $payload['sub'],
                'roles' => json_encode(['ROLE_USER']),
                'terms_accepted_at' => now(),
                'email_verified_at' => now(),
            ]);
        }

        $token = Auth::login($user);

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'expires_at' => now()->addMinutes(config('jwt.ttl'))->getTimestamp(),
        ])->cookie($this->authCookie($token));
    }

    private function uniqueUsernameFromGoogle(array $payload): string
    {
        $base = Str::slug($payload['name'] ?? Str::before($payload['email'], '@'), '');
        $base = $base !== '' ? $base : 'user';

        $username = $base;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.$suffix;
            $suffix++;
        }

        return $username;
    }

    public function register(Request $request)
    {

        $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'accept_terms' => 'accepted',
        ],
            [
                'username.required' => 'Ce champ est requis',
                'username.string' => 'Ce champ attend un donnée de type text',
                'email.email' => 'Ce champ attend un donnée de type email',
                'email.required' => 'Ce champ est requis',
                'email.unique' => 'Ce mail est déja utilisé',
                'password.required' => 'Ce champ est requis',
                'password.string' => 'Ce champ attend un donnée de type text',
                'accept_terms.accepted' => 'Vous devez accepter la politique de confidentialité',
            ]
        );

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // self-registration always grants the base role; roles.* fields
            // sent by the client are ignored — only an admin (UserController)
            // can grant ROLE_ADMIN.
            'roles' => json_encode(['ROLE_USER']),
            'terms_accepted_at' => now(),
        ]);
        Mail::to('melissa.mangione@gmail.com') // permet définir de qui est envoyé le mail
            ->send(new MailRegister($user));
        Mail::to($user->email, $user->username)->send(new Welcome($user));

        // Registration does not log the user in — the front-end sends them
        // to the login page afterwards, so no cookie/token is issued here.
        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'user' => $user,
        ]);
    }

    public function logout()
    {
        Auth::logout();

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully logged out',
        ])->withCookie(Cookie::forget(config('jwt.cookie_key_name', 'access_token')));
    }

    public function refresh()
    {
        $token = Auth::refresh();
        $user = Auth::user();

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'expires_at' => now()->addMinutes(config('jwt.ttl'))->getTimestamp(),
        ])->cookie($this->authCookie($token));
    }

    public function currentUser()
    {
        return response()->json(Auth::user());
    }

    public function forgotPassword(Request $request)
    {
        try {
            // Valider la requête
            $validatedData = $request->validate([
                'email' => 'required|email|exists:users,email',
            ]);

            // Générer un jeton de réinitialisation de mot de passe
            $token = Str::random(60);

            // Enregistrer le jeton dans la table password_resets
            DB::table('password_resets')->insert([
                'email' => $validatedData['email'],
                'token' => $token,
                'created_at' => Carbon::now(),
            ]);

            // Envoyer un e-mail de réinitialisation de mot de passe à l'utilisateur
            Mail::to($validatedData['email'])->send(new ResetPasswordEmail($token));

            return response()->json(
                ['message' => 'Un e-mail de réinitialisation de mot de passe a été envoyé.'], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
            'token' => 'required|string',
        ]);
        try {
            // find a matching, unexpired token for this email
            $passwordReset = DB::table('password_resets')
                ->where('email', $request->email)
                ->where('token', $request->token)
                ->first();

            if (! $passwordReset || Carbon::parse($passwordReset->created_at)->addMinutes(60)->isPast()) {
                DB::table('password_resets')->where('email', $request->email)->delete();

                return response(['message' => 'Token invalide ou expiré'], 422);
            }

            // update user password
            $userUpdateResult = DB::table('users')->where('email', $request->email)->update([
                'password' => Hash::make($request->password),
            ]);

            if (! $userUpdateResult) {
                return response(['message' => 'Erreur lors de la reinitialisation du mot de passe'], 422);
            }
            // delete the token (and any other outstanding tokens for this email) so it can't be reused
            DB::table('password_resets')->where('email', $request->email)->delete();

            return response(['message' => 'Mot de passe bien reinitialisé'], 200);
        } catch (Exception $e) {
            return response(['message' => $e->getMessage()], 400);
        }
    }
}
