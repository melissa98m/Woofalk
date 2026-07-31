# woofalk-app

Front-end web de Woofalk : React 19 + MUI v9, construit avec Vite. Client principal du projet (voir le [README racine](../README.md) pour la vue d'ensemble des trois sous-projets et [`CLAUDE.md`](../CLAUDE.md) pour les conventions détaillées).

## Prérequis

- Node.js + npm
- L'API (`woofalk-api`) doit tourner quelque part accessible (localement via `php artisan serve`/Docker, ou en pointant vers une instance distante).

## Installation

    npm install
    cp .env.example .env

Configurez `.env` :

    VITE_API_URL   URL de base de l'API, sans slash final (ex. http://localhost:8000)

Puis démarrez le serveur de dev :

    npm start        # ou npm run dev — Vite sur http://localhost:3000

## Scripts disponibles

    npm start        # serveur de dev Vite (port 3000)
    npm run dev       # alias de start
    npm run build     # build de prod dans dist/
    npm run preview   # sert le build de prod localement (port 3000)
    npm test          # exécute la suite Vitest

## Structure

    src/
      index.jsx            # point d'entrée : toutes les routes (react-router-dom) et le gating admin/auth y sont déclarés
      App.jsx               # layout partagé (<Outlet/>), pas de routing ici
      config.jsx             # API_URL, à importer partout où un appel réseau est fait
      component/
        place/, ballade/, hebergement/, category/, tag/, address/, user/
                              # un dossier par ressource métier, pattern CRUD (new*/edit*/delete*/liste/détail) miroir de l'API
        account/, dashboard/, contact/, export/, search/, faq/, legal/
        _partials/            # chrome partagé : _navbar, _footer, _theme (clair/sombre via ColorContext), _ui, _admin
      services/
        auth/                 # gestion de la session (voir Authentification ci-dessous)
        geo/, geocode.jsx      # géolocalisation/adresses
        search/                # recherche
        like.jsx               # likes lieux/ballades/hébergements
      assets/css/             # SCSS, importé par composant/fichier

## Authentification

Le JWT est émis par l'API dans un cookie `httpOnly` (voir `AuthController::authCookie` côté `woofalk-api`) — il n'est jamais lisible ni manipulable depuis le JS, ce qui protège contre l'exfiltration par XSS. `login()`/`register()` reçoivent en retour l'objet `user` (id, username, email, roles) et `expires_at`, mis en cache dans `localStorage` (`services/auth/token.jsx`) uniquement pour permettre à l'UI de décider synchronement quoi afficher (`getToken`, `getRoles`, `loggedAndAdmin`, `loggedAndUser`, `getExpiryTime`, etc.) — ce cache n'est qu'un indice de rendu, jamais une preuve d'autorisation : le contrôle réel est fait côté API à chaque requête via le cookie. Les éléments de route appellent directement `auth.loggedAndAdmin()` / `auth.loggedAndUser()` pour décider quoi rendre ; il n'y a pas de composant route-guard dédié.

## Découpage et chargement des routes

Toutes les routes sont déclarées dans `src/index.jsx`. La page d'accueil (`Home`) est importée directement (page la plus visitée, et fallback utilisé inline par plusieurs routes nécessitant l'auth) ; le reste des pages est chargé via `React.lazy` pour éviter qu'un visiteur arrivant sur `/` télécharge aussi le code de l'admin, des cartes Leaflet ou des formulaires.

## Tests

    npm test   # Vitest + Testing Library, voir src/setupTests.jsx (@testing-library/jest-dom/vitest)

## Autres notes techniques

- Cartes/géolocalisation : `react-leaflet`/`leaflet` (CSS importé depuis le package npm, pas de CDN).
- Graphiques (dashboard admin) : `chart.js`/`react-chartjs-2` et `@devexpress/dx-react-chart-material-ui`.
- Formulaire de contact protégé par `react-google-recaptcha`.
- Styling : SCSS (`src/assets/css/...`) + props `sx`/thème MUI, pas de gros objets de style inline.
- `src/store.jsx` et `src/services/auth/guard.jsx` référencent `@reduxjs/toolkit`/`react-redux` (non installés) et un module inexistant — code mort, non importé depuis `index.jsx`, à ne pas utiliser comme référence.

Voir [`CLAUDE.md`](../CLAUDE.md) à la racine du dépôt pour le détail des exigences de qualité (accessibilité, sécurité, performance, responsive) à respecter sur toute modification front.
