// The JWT itself lives in an httpOnly cookie set by the API (see
// AuthController::authCookie) — it is never sent in a JSON body and never
// readable from JS, which is the whole point (an XSS can no longer exfiltrate
// it the way it could when the token sat in localStorage). What login()/
// register() get back instead is the plain `user` object (id, username,
// email, roles — all non-sensitive, previously visible in the decoded JWT
// anyway) plus `expires_at`, which we cache here so the UI can synchronously
// decide what to render without a round-trip on every check. The cache is
// only ever a hint for rendering; the server enforces the real auth/role
// checks on every request via the cookie.
const STORAGE_KEY = 'auth_user';

let readSession = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

let setSession = (user, expiresAt) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, expiresAt }));
}

let clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
}

let getExpiryTime = () => {
    // Check si la session en cache est encore valide (non expirée)
    const session = readSession();
    if (session && session.expiresAt && session.expiresAt * 1000 > Date.now()) {
        return true
    } else {
        clearSession();
        return false
    }
}

// Kept for the call sites that only ever used it as a "is there a live
// session" boolean — there is no client-readable token to return anymore.
let getToken = () => {
    return getExpiryTime();
}

let getRoles = () => {
    if (getExpiryTime()) {
        // la valeur de base est un tableau dans un string, on le parse pour faire sauter le string et
        // on le tostring pour faire sauter le tableau, comme ça on a seulement la valeur
        return JSON.parse(readSession().user.roles).toString();
    } else {
        return false
    }
}

let getUserId = () => {
    if (getExpiryTime()) {
        return readSession().user.id;
    } else {
        return false
    }
}
let getEmail = () => {
    if (getExpiryTime()) {
        return readSession().user.email;
    } else {
        return false
    }
}
let getUsername = () => {
    if (getExpiryTime()) {
        return readSession().user.username;
    } else {
        return false
    }
}
let loggedAndAdmin = () => {
    // Check si il y a une session valide et check si le rôle est celui d'un admin, répond true quand c'est vrai
    return !!(getExpiryTime() && getRoles() === 'ROLE_ADMIN');
}
let loggedAndUser = () => {
    // Check si il y a une session valide et check si le rôle est celui d'un user, répond true quand c'est vrai
    return !!(getExpiryTime() && getRoles() === 'ROLE_USER');
}

export default {getToken, getRoles, getEmail, getUsername, getUserId, loggedAndAdmin, loggedAndUser, getExpiryTime, setSession, clearSession}
