<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\Register as MailRegister;
use App\Mail\ResetPasswordEmail;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct() {}

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
            'token' => $token,
        ]);

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

        if (empty($request->roles)) {
            $request->roles = json_encode(['ROLE_USER']);
        } else {
            json_encode($request->roles);
        }

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'roles' => $request->roles,
            'terms_accepted_at' => now(),
        ]);
        Mail::to('melissa.mangione@gmail.com') // permet définir de qui est envoyé le mail
            ->send(new MailRegister($user));

        $token = Auth::login($user);

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'user' => $user,
            'authorisation' => [
                'token' => $token,
                'type' => 'bearer',
            ],
        ]);
    }

    public function logout()
    {
        Auth::logout();

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully logged out',
        ]);
    }

    public function refresh()
    {
        return response()->json([
            'status' => 'success',
            'user' => Auth::user(),
            'authorisation' => [
                'token' => Auth::refresh(),
                'type' => 'bearer',
            ],
        ]);
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
            // find the token
            $passwordReset = DB::table('password_resets')->where('token', $request->token);
            if (! $passwordReset) {
                return response(['message' => 'token expiré ou inexistant'], 422);
            }
            // find user's email
            $user = DB::table('users')->where('email', $request->email);
            if (! $user) {
                return response(['message' => 'Utilisateur non trouvé'], 422);
            }
            // update user password
            $userUpdateResult = DB::table('users')->where('email', $request->email)->update([
                'password' => Hash::make($request->password),
            ]);

            if (! $userUpdateResult) {
                return response(['message' => 'Erreur lors de la reinitialisation du mot de passe'], 422);
            }
            // delete current token
            $deleteTokenResult = DB::table('password_resets')->where('token', $request->token)->delete();
            if (! $deleteTokenResult) {
                return response(['message' => 'Erreur lors de la suppression du token'], 422);
            }

            return response(['message' => 'Mot de passe bien reinitialisé'], 200);
        } catch (Exception $e) {
            return response(['message' => $e->getMessage()], 400);
        }
    }
}
