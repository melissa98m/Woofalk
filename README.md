# Woofalk

Woofalk est une application web qui répertorie les lieux acceptant les chiens ("lieux"), des ballades et des hébergements pet-friendly. Les visiteurs peuvent consulter et proposer des lieux/ballades/hébergements ; les administrateurs peuvent en plus les modifier/supprimer, gérer les catégories, tags, adresses et utilisateurs, et exporter les données (CSV ou dump SQL complet).

Le dépôt contient trois sous-projets indépendants, chacun avec son propre arbre de dépendances (pas de `package.json` racine) :

- [`woofalk-api/`](woofalk-api) — API REST Laravel 12 (PHP 8.3), source de vérité pour les données et l'authentification (JWT).
- [`woofalk-app/`](woofalk-app) — Front-end web React 19 (MUI v9), construit avec Vite. Client principal.
- [`GowithDogMobile/`](GowithDogMobile) — Application React Native 0.71, en tout début de développement, non intégrée au Docker Compose ci-dessous. **Pas encore renommée** : un renommage propre implique de changer le projet Xcode, les identifiants de bundle iOS et le package Android, pas juste le dossier — prévu dans une passe dédiée.

## Stack technique

| | API (`woofalk-api`) | Web (`woofalk-app`) |
|---|---|---|
| Framework | Laravel 12 (PHP 8.3) | React 19 + Vite |
| Auth | JWT (`php-open-source-saver/jwt-auth`), middleware `auth:api` | Rôles décodés côté client depuis le JWT (`roles`: `ROLE_ADMIN` / `ROLE_USER`) |
| UI | — | MUI v9 |
| Base de données | MySQL | — |
| Emails | Resend en prod, Mailhog en local | — |
| Cartes | — | `react-leaflet` / `leaflet` |
| Graphiques (dashboard admin) | — | `chart.js`, `@devexpress/dx-react-chart-material-ui` |
| Tests | PHPUnit (`tests/Feature`, `tests/Unit`) | Vitest + Testing Library |

## Installation avec Docker (recommandé)

Prérequis : Docker + Docker Compose.

    docker compose up --build

Ça démarre l'API Laravel (avec sa base MySQL et migrations automatiques), le front React (Vite) et Mailhog pour intercepter les emails en local :

- Front : http://localhost:3000
- API : http://localhost:8000
- Mailhog (emails interceptés) : http://localhost:8025

Pour arrêter les conteneurs sans perdre les données (usage quotidien) :

    docker compose down

Un `Makefile` fournit des raccourcis plus sûrs :

    make up          # docker compose up --build
    make down        # docker compose down (garde le volume de la base)
    make backup      # dump la base de dev dans ./backups/ (gitignored)
    make reset-db    # backup + docker compose down -v, avec confirmation manuelle ("reset")

**`docker compose down -v` supprime définitivement la base de données locale (utilisateurs, lieux, ballades, hébergements, likes...), sans confirmation.** C'est déjà arrivé une fois pendant le développement. Ne jamais lancer `down -v` directement — utiliser `make reset-db`, qui sauvegarde avant de demander confirmation.

Pour un lancement façon production (images optimisées, sans montage du code source) :

    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

Voir `CLAUDE.md` pour le détail de l'architecture Docker (dev/prod, volumes, entrypoint).

## Installation manuelle (sans Docker)

### Prérequis

    PHP 8.3+
    Composer
    Node.js
    NPM
    MySQL

### API (`woofalk-api`)

Dans le dossier `woofalk-api` :

    composer install

Renommez `.env.example` en `.env` et configurez les variables d'environnement (base de données, mail, etc. — voir la section Configuration ci-dessous), puis générez la clé d'application et le secret JWT :

    php artisan key:generate
    php artisan jwt:secret

Exécutez les migrations pour créer les tables de base de données :

    php artisan migrate

Vous pouvez aussi peupler la base avec des données de démo :

    php artisan migrate:fresh --seed

Démarrez l'API :

    php artisan serve

L'API est alors disponible sur http://localhost:8000.

### Front-end (`woofalk-app`)

Dans le dossier `woofalk-app` :

    npm install

Copiez `.env.example` en `.env` et configurez `VITE_API_URL` pour pointer vers l'URL de l'API (par exemple `http://localhost:8000`).

Démarrez le serveur de développement :

    npm start

Puis ouvrez http://localhost:3000 dans votre navigateur.

### Mobile (`GowithDogMobile`)

Application React Native early-stage, non intégrée au Docker Compose ni au CI/CD ci-dessous — son workflow est indépendant (Metro + émulateurs/simulateurs).

Dans le dossier `GowithDogMobile` :

    npm install
    npm start          # démarre Metro
    npm run android     # build + lance sur émulateur/device Android
    npm run ios         # build + lance sur simulateur/device iOS (nécessite Xcode + CocoaPods)

## Configuration

Principales variables d'environnement de l'API (`woofalk-api/.env`) :

    APP_NAME       Le nom de l'application.
    APP_ENV        L'environnement de l'application (local, production, etc.).
    APP_DEBUG      Si true, les erreurs sont affichées (à désactiver en production).
    DB_CONNECTION  Le pilote de base de données (mysql).
    DB_HOST        L'hôte de la base de données.
    DB_PORT        Le port de la base de données.
    DB_DATABASE    Le nom de la base de données.
    DB_USERNAME    Le nom d'utilisateur de la base de données.
    DB_PASSWORD    Le mot de passe de la base de données.
    MAIL_MAILER    Le transport d'email (smtp/mailhog en local, resend en prod).

Côté front (`woofalk-app/.env`) :

    VITE_API_URL   URL de base de l'API (sans slash final), inlinée au build par Vite.

## Tests et qualité de code

API (dans `woofalk-api`) :

    vendor/bin/phpunit                              # suite complète (Unit + Feature)
    vendor/bin/phpunit --filter testCreateBallade   # un seul test
    vendor/bin/pint                                 # correction du style de code (Laravel Pint)

Front (dans `woofalk-app`) :

    npm test   # Vitest

Via Docker, préfixez les commandes API par `docker compose exec api` (ex. `docker compose exec api vendor/bin/phpunit`).

## CI/CD et déploiement

- `.github/workflows/api-ci-cd.yml` : sur chaque push/PR touchant `woofalk-api` ou les fichiers Docker Compose, lance PHPUnit (contre une vraie base MySQL) et Pint (informatif, non bloquant). Sur un push sur `master` avec les tests au vert, un job de déploiement se connecte en SSH au Raspberry Pi de production et exécute `scripts/deploy-pi.sh`.
- `scripts/deploy-pi.sh` : rebuild l'image `api` en mode prod, redémarre uniquement les services `api`/`api-nginx` (la base, le front et Mailhog ne sont pas touchés) et lance les migrations.
- Le front (`woofalk-app`) est déployé séparément sur Vercel (build/CDN/déploiements propres à Vercel, indépendants de ce workflow et du Raspberry Pi).
- La mobile (`GowithDogMobile`) n'a pas encore de CI/CD ni de déploiement automatisé.

## Fonctionnalités

Le site web permet à l'utilisateur (sans le rôle admin) de :

- Consulter la liste des lieux autorisés aux chiens, des ballades et des hébergements pet-friendly, avec recherche et filtres (catégorie, tags).
- Ajouter un nouveau lieu, une nouvelle ballade ou un nouvel hébergement.
- Liker des lieux/ballades/hébergements.
- Créer un compte, se connecter et gérer son profil.
- Exporter ses propres données personnelles (RGPD) depuis son compte.
- Contacter l'équipe via un formulaire de contact protégé contre le spam.

Le site web permet en plus à l'utilisateur admin de :

- Faire tout comme un utilisateur.
- Modifier, supprimer ou changer le statut (individuellement ou en masse) d'un lieu, d'une ballade ou d'un hébergement.
- Gérer les catégories, tags, adresses et utilisateurs depuis un tableau de bord dédié.
- Exporter tout ou partie des données de l'application (lieux, ballades, hébergements, catégories, tags, adresses, utilisateurs, messages de contact) au format CSV (par table, ou en `.zip` si plusieurs tables sont sélectionnées), ou récupérer un dump SQL complet de la base — voir `ExportController` (`woofalk-api/app/Http/Controllers/API/ExportController.php`).
