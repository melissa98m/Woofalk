# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GoWithDog is a website that lists dog-friendly places ("places") and walks ("ballades"). Non-authenticated/regular users can browse and add places/ballades; admins can also edit/delete places, ballades, categories, tags, addresses, and manage users. The repo has three independent sub-projects, each with its own dependency tree — there is no shared root `package.json`:

- `go-with-dog-api/` — Laravel 12 REST API (PHP 8.3), source of truth for data and auth.
- `go-with-dog-app/` — React 19 web front-end (MUI v9), built with Vite. The primary client.
- `GowithDogMobile/` — React Native 0.71 app, early stage, not part of the Docker setup below.

The API and web app run together via the root `docker-compose.yml` (see below); this is the primary way to run the project locally. Mobile has its own workflow (Metro/emulators) and isn't containerized.

## Rôle et exigences qualité (à appliquer sur toutes les sessions)

Sur ce projet, Claude Code doit se comporter comme un **lead développeur expert React / Laravel**, avec une expertise poussée en accessibilité, sécurité, optimisation et bonnes pratiques. Cette exigence s'applique à toute modification de code, quelle que soit sa taille.

Pour **chaque changement** (front `go-with-dog-app` ou back `go-with-dog-api`), vérifier systématiquement avant de considérer la tâche terminée :

- **Non-régression** : le comportement existant (routes, endpoints, permissions, UI) n'est pas cassé. Lancer les tests concernés (`vendor/bin/phpunit` côté API, `npm test` côté web) et le linting (`vendor/bin/pint`, ESLint) quand le changement les touche. Ne pas se contenter d'une relecture visuelle si une vérification automatisée existe.
- **Sécurité** : pas de faille introduite ou laissée en place — injection SQL, XSS, CSRF, IDOR/absence de contrôle d'autorisation (`auth:api`, vérification du rôle `ROLE_ADMIN`/`ROLE_USER`), secrets/API keys en dur, validation/échappement des entrées utilisateurs, dépendances non prévues côté client (ex. ne jamais faire confiance au rôle décodé côté front pour protéger une donnée sensible — le contrôle réel doit être côté API).
- **Accessibilité** : HTML sémantique, attributs ARIA pertinents, labels de formulaire, navigation clavier, contraste suffisant, gestion du focus, textes alternatifs sur les images/icônes — en particulier pour tout composant MUI custom ou toute nouvelle page.
- **Performance** : pas de requêtes N+1 côté Laravel (utiliser l'eager loading), pas de re-renders inutiles côté React (mémoïsation quand pertinent), pas d'augmentation injustifiée du bundle (imports ciblés, pas de librairie lourde pour un besoin trivial), attention aux images/assets non optimisés.
- **Responsive** : tout composant/page front doit rester utilisable sur mobile, tablette et desktop — breakpoints MUI cohérents avec l'existant, pas de débordement horizontal, tailles de police/zones tactiles adaptées au tactile (cibles tactiles suffisamment grandes), layout qui ne casse pas (grilles/flex qui wrap, images/tableaux/cartes qui ne dépassent pas), test visuel mental à au moins 3 largeurs (mobile ~375px, tablette ~768px, desktop ~1280px) avant de considérer un changement UI terminé.
- **Bonnes pratiques React (front)** : découper en composants réutilisables plutôt que dupliquer du JSX, un composant = une responsabilité claire, pas de CSS en dur dans le JS (pas de gros objets de style inline recréés à chaque render, pas de chaînes de style improvisées) — utiliser les fichiers SCSS existants (`src/assets/css/...`) et/ou les props `sx`/le thème MUI, comme fait le reste du repo. Éviter la prop-drilling excessive et les composants fourre-tout.
- **Bonnes pratiques** : cohérence avec les conventions déjà en place dans le repo (voir sections ci-dessous), pas d'abstraction ou de dépendance superflue, code lisible et maintenable.

Si une vérification ne peut pas être automatisée (ex. rendu visuel, accessibilité manuelle), le dire explicitement plutôt que de prétendre que c'est validé.

## SEO (à appliquer sur toutes les pages publiques de `go-with-dog-app`)

Le front est un SPA React (Vite) rendu côté client, sans SSR/prerendering : `index.html` ne contient qu'un titre/description/canonical **statiques et identiques sur toutes les routes** (pas de gestion par page). C'est la limite structurelle numéro un du SEO actuel — tout crawler ou réseau social qui n'exécute pas le JS ne voit que ce HTML générique. Tant qu'aucune solution de SSR/prerendering n'est mise en place, en tenir compte dans toute estimation d'impact SEO.

Pour toute page publique (`Home`, `Places`, `PlaceDetail`, `Ballades`, `BalladeDetail`, `Contact`, mentions légales, etc.), vérifier/mettre en place :

- **Meta tags par page** : utiliser `react-helmet-async` (à installer — aucune lib de gestion de `<head>` par route n'existe actuellement) pour injecter dynamiquement un `<title>` unique et descriptif, une `<meta name="description">` spécifique au contenu de la page (pas la description générique dupliquée d'`index.html`), un `<link rel="canonical">` pointant vers l'URL réelle de la page courante (pas une URL fixe), ainsi que les tags Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) et Twitter Card pour un partage correct sur les réseaux sociaux.
- **Données structurées (JSON-LD)** : ajouter un balisage schema.org pertinent par type de page — `LocalBusiness`/`TouristAttraction` (ou `Place`) pour les fiches lieu, un schéma adapté pour les balades, `BreadcrumbList` pour le fil d'Ariane, `Organization`/`WebSite` sur la home — injecté via le même mécanisme que les meta tags.
- **Sitemap dynamique** : `public/sitemap.xml` est aujourd'hui statique et ne liste que la home. Les lieux et balades étant créés dynamiquement par les utilisateurs, le sitemap doit être généré à partir des données réelles (endpoint Laravel dédié, ex. `GET /sitemap.xml` interrogeant `Place`/`Ballade`, ou script de build qui appelle l'API) avec un `lastmod` réel — ne jamais laisser un sitemap statique se désynchroniser du contenu.
- **robots.txt** : vérifier qu'il exclut les routes sans intérêt SEO ou protégées côté logique métier (`/login`, `/register`, `/mon-compte`, `/change-password`, `/reset-password/*`, `/dashboard`, et les routes admin `/place`, `/ballade`, `/category`, `/tag`, `/user`, `/address`) et qu'il référence le sitemap (`Sitemap: https://<domaine-prod>/sitemap.xml`).
- **URLs** : garder des URLs propres et stables (déjà le cas : `/places/:id`, `/ballades/:id`) ; toute redirection de contenu indexé (changement de slug/id) doit être une redirection HTTP côté serveur, pas un `useNavigate` client silencieux.
- **Core Web Vitals** : ils font partie du score SEO — s'appuient sur les exigences de performance déjà listées ci-dessus (pas de N+1, images avec `width`/`height` explicites pour éviter le CLS, `loading="lazy"` sous la ligne de flottaison, bundle maîtrisé).
- **Accessibilité liée au SEO** : un seul `h1` par page décrivant le contenu principal, hiérarchie `h2`/`h3` cohérente, `alt` descriptifs sur les images, liens internes avec texte explicite plutôt que "cliquez ici".
- **hreflang / i18n** : non applicable tant que le site reste mono-langue (FR) ; à prévoir seulement si une version dans une autre langue est introduite.

Si le SEO devient un enjeu prioritaire au-delà de ces mesures, envisager une solution de prerendering/SSR (ex. prerender.io, `vite-plugin-ssr`, ou migration des pages publiques vers un framework SSR) plutôt que du CSR pur — à discuter avec l'utilisateur avant toute migration de cette ampleur, vu l'impact structurel sur le projet.

## Docker (primary way to run api + web)

```bash
docker compose up --build          # api (nginx+php-fpm) :8000, web (vite) :3000, mysql :3306, mailhog UI :8025
docker compose down -v             # stop and wipe the db volume
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d   # prod-shaped: optimized images, no bind mounts
```

- `api` (dev target) bind-mounts `./go-with-dog-api` and runs `composer install` at build time; `api-nginx` (plain `nginx:alpine`) reverse-proxies PHP to it over fastcgi using `go-with-dog-api/docker/nginx/api.conf`. The API's entrypoint (`go-with-dog-api/docker/entrypoint.sh`) bootstraps `.env` from `.env.example`, generates `APP_KEY`/`JWT_SECRET` if missing, waits for the db, runs migrations, and runs `storage:link` — all idempotent, safe on every `up`.
- `web` (dev target) bind-mounts `./go-with-dog-app` and runs the Vite dev server; `node_modules` is kept in a named volume (`web_node_modules`) so the host's absence of `node_modules` doesn't shadow the container's.
- The `api`/`www-data` user inside the API image is re-keyed to UID/GID 1000 (override via `WWWUSER`/`WWWGROUP` build args) so files written into the bind-mounted `storage/`/`bootstrap/cache` don't end up root-owned on the host.
- `docker-compose.prod.yml` is a merge overlay (uses Compose's `!override`/`!reset` YAML tags) — it switches both images to their `prod` build target (immutable, no bind mounts, optimized autoloader/opcache for the API, nginx-served static build for the web app) and shares the API's `public/`/`storage` tree with `api-nginx` via a named volume (`api_html`) instead of a bind mount, since the prod image has no host mount. If you rebuild the api image with new static assets, `docker volume rm gowithdog_api_html` to force nginx to pick them up.
- `go-with-dog-api/Dockerfile` and `go-with-dog-app/Dockerfile` are both multi-stage (`base`/`dev`/`vendor`/`prod` and `deps`/`dev`/`build`/`prod` respectively) and can be built/run standalone outside compose too.

## go-with-dog-api (Laravel)

### Setup (without Docker)
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
```

### Common commands
```bash
php artisan serve                 # run dev server (http://localhost:8000)
php artisan migrate               # run migrations
php artisan migrate:fresh --seed  # reset DB and seed
vendor/bin/phpunit                # run full test suite (Unit + Feature)
vendor/bin/phpunit --filter testCreateBallade   # run a single test method
vendor/bin/phpunit tests/Feature/BalladeTest.php  # run a single test file
vendor/bin/pint                   # code style fixer (Laravel Pint)
```
Via Docker instead: `docker compose exec api <command>` (e.g. `docker compose exec api vendor/bin/phpunit`).

### Architecture
- Auth uses JWT (`php-open-source-saver/jwt-auth`, see `config/jwt.php`), not Sanctum sessions, despite `laravel/sanctum` being installed. Protected routes use the `auth:api` middleware. `app/Http/Middleware/Authenticate.php` and `app/Exceptions/Handler.php` are both overridden to always return JSON 401s for unauthenticated requests — this is an API-only app with no `login` web route, so the framework's default redirect-to-login fallback would otherwise 500.
- Uses the "legacy" pre-11 skeleton (`app/Http/Kernel.php`, `app/Console/Kernel.php`, `app/Exceptions/Handler.php`, `app/Providers/RouteServiceProvider.php`, etc.) rather than the newer `bootstrap/app.php`-centric skeleton — Laravel 12 still fully supports this structure, and migrating it wasn't required to upgrade.
- All API routes are declared in `routes/api.php` using `Route::controller(...)->group(...)` per resource: `AuthController`, `AddressController`, `BalladeController`, `CategoryController`, `PlaceController`, `TagController`, `ContactController`, `UserController`. Controllers live in `app/Http/Controllers/API/`.
- Models: `Address`, `Ballade`, `Category`, `Contact`, `PasswordReset`, `Place`, `Tag`, `User` in `app/Models/`.
- Roles are embedded in the issued JWT as a `roles` claim (e.g. `ROLE_ADMIN`, `ROLE_USER`) — this is how the front-end determines admin access, not a server-side gate on every request.
- Most `store`/`update`/`destroy` endpoints require `auth:api`; `index`/`show` endpoints are public. `*-user` endpoints (`places-user`, `ballades-user`) return only the authenticated user's own records.
- Mail is configured for both Mailgun and Brevo transports (`symfony/mailgun-mailer`, `symfony/brevo-mailer` — Brevo is Sendinblue's current name; the package was renamed upstream). Local/dev mail goes to Mailhog (`MAIL_HOST=mailhog`, UI at `:8025`).
- Tests: `tests/Feature/*Test.php` hit routes via HTTP and assert response status/shape; `tests/Unit/*Test.php` test model/logic in isolation. **Known pre-existing gaps, not introduced by any recent change**: `AddressFactory`/`CategoryFactory`/`BalladeFactory` don't exist even though tests call `Model::factory()`; the stock `UserFactory` generates a `name` column the custom `users` migration doesn't have (it uses `username`); `CategoryFTest` posts to a non-existent web route (`/categories` instead of `/api/categories`); a couple of tests use the wrong HTTP verb or don't authenticate before hitting an `auth:api` route. Expect `vendor/bin/phpunit` to report ~13 pre-existing failures/errors unrelated to your changes unless you're specifically asked to fix the test suite.

## go-with-dog-app (React web front-end, Vite)

### Setup / common commands
```bash
npm install
npm start       # or `npm run dev` — Vite dev server on http://localhost:3000
npm run build   # outputs to dist/
npm run preview # serve the production build locally
npm test        # vitest run
```
Was Create React App until this was migrated to Vite (CRA/`react-scripts` has been unmaintained since 2025). Consequences worth knowing:
- Entry point is `index.html` at the project root (not `public/index.html`), pointing at `/src/index.jsx`.
- Every source file under `src/` was renamed `.js` → `.jsx` because esbuild/Rollup only parses JSX in files with that extension (unlike CRA's Babel pipeline, which didn't care about extension). Extensionless imports (`from "./component/x"`) still resolve fine since `.jsx` is in Vite's default `resolve.extensions`.
- Env vars must be prefixed `VITE_` (not `REACT_APP_`) and are read via `import.meta.env.VITE_*` (not `process.env.*`) — see `src/config.jsx` (`VITE_API_URL`).
- Build output directory is `dist/` (Vite default), not `build/`.

### Architecture
- Routing is defined centrally in `src/index.jsx` (not `App.jsx`) — all top-level routes and their admin/auth gating live there via `react-router-dom`'s `<Routes>`. `App.jsx` just renders the shared `<Outlet/>` layout inside `index.jsx`'s tree. Only depend on `react-router-dom` (not the bare `react-router` package) — a few files used to import hooks from `react-router` directly, which is redundant and, post-upgrade, versioned independently from `react-router-dom`; they were switched to import from `react-router-dom` instead.
- The API origin is centralized in `src/config.jsx` (`export const API_URL = import.meta.env.VITE_API_URL || "https://api.gowithdog.fr"`) and imported wherever a request is made. It used to be hardcoded to the production domain (`https://api.gowithdog.fr`) in ~50 places across every component/service file, which meant local/Docker dev always hit prod — if you add a new API call, import `API_URL` from `./config` (or the right relative path) rather than hardcoding a host.
- Auth/authorization is entirely client-side and localStorage-based: the JWT from the API is stored under `access_token`, and `src/services/auth/token.jsx` decodes it (via `jwt-decode`'s named `jwtDecode` export — v4 dropped the default export) to expose `getToken`, `getRoles`, `loggedAndAdmin`, `loggedAndUser`, `getExpiryTime`, etc. Route elements call `auth.loggedAndAdmin()` / `auth.loggedAndUser()` directly to decide what to render — there is no route-guard component wrapping children.
- `src/store.jsx` and `src/services/auth/guard.jsx` reference `@reduxjs/toolkit`/`react-redux` (not installed) and a `component/features/loginButton/loginButtonSlice` module that doesn't exist, and neither file is imported from `index.jsx`. This is dead/broken leftover code, not the actual state mechanism — the real "am I logged in" state is derived live from `auth.getToken()`/`auth.loggedAndAdmin()` in `token.jsx`.
- Components are organized by domain under `src/component/` (`place/`, `ballade/`, `category/`, `tag/`, `address/`, `user/`, `account/`, `contact/`, `dashboard/`, `legal/`, `search/`), each typically with `new*`/`edit*`/`delete*`/list-and-detail files following the same CRUD pattern per resource, mirroring the API's resources. Shared chrome lives in `src/component/_partials/` (`_navbar/`, `_footer/`, `_theme/` — light/dark theme via `ColorContext`).
- Styling is SCSS (`src/assets/css/...`), imported per-component/per-file, alongside MUI's `sx`/theme props.
- Maps/geolocation use `react-leaflet`/`leaflet` (CSS imported from the npm package in `places.jsx`, not a CDN); charts use `chart.js`/`react-chartjs-2` and `@devexpress/dx-react-chart-material-ui` (admin dashboard).
- Contact form uses `react-google-recaptcha`.
- Tests use Vitest + Testing Library (`@testing-library/jest-dom/vitest` import in `src/setupTests.jsx`), not Jest — CRA's `react-scripts test` is gone.
