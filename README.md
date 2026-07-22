# GoWithDog
Go with dog

Ce projet est une application web qui répertorie tous les lieux autorisés pour les chiens , les ballades à faire avec eux. Le projet utilise Laravel 9 pour l'API et ReactJS avec la librairie de style MUI avec Material UI pour le front-end.

## Installation avec Docker (recommandé)

Prérequis : Docker + Docker Compose.

    docker compose up --build

Ça démarre l'API Laravel (avec sa base MySQL et migrations automatiques), le front React (Vite) et Mailhog pour intercepter les emails en local :

- Front : http://localhost:3000
- API : http://localhost:8000
- Mailhog (emails interceptés) : http://localhost:8025

Pour un lancement façon production (images optimisées, sans montage du code source) :

    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

Voir `CLAUDE.md` pour le détail de l'architecture Docker.

## Installation manuelle (sans Docker)

Prérequis

Avant de pouvoir exécuter l'application, vous devez avoir les éléments suivants installés sur votre système:

    PHP 8.3+
    Composer
    Node.js
    NPM
    MySQL

Installation

 Clonez le repository Git.
 Dans le dossier `go-with-dog-api`, exécutez la commande suivante pour installer les dépendances Laravel:

    composer install

  Renommez le fichier .env.example en .env et modifiez les variables d'environnement selon vos besoins (par exemple, la configuration de la base de données).
  Générez une clé d'application et un secret JWT en exécutant les commandes suivantes:

    php artisan key:generate
    php artisan jwt:secret

  Exécutez les migrations pour créer les tables de base de données:

    php artisan migrate

 Installez les dépendances React en exécutant la commande suivante dans le dossier go-with-dog-app:

    npm install

Configuration

Dans le fichier .env, vous pouvez configurer les variables d'environnement suivantes:

    APP_NAME: Le nom de l'application.
    APP_ENV: L'environnement de l'application (production, développement, etc.).
    APP_DEBUG: Si cette variable est définie sur true, les erreurs seront affichées sur le front-end.
    DB_CONNECTION: Le pilote de base de données à utiliser (par exemple, mysql).
    DB_HOST: L'hôte de la base de données.
    DB_PORT: Le port de la base de données.
    DB_DATABASE: Le nom de la base de données.
    DB_USERNAME: Le nom d'utilisateur de la base de données.
    DB_PASSWORD: Le mot de passe de la base de données.

Dans le fichier `go-with-dog-app/.env` (copié depuis `.env.example`), configurez `VITE_API_URL` pour pointer vers l'URL de l'API.

Exécution

Pour exécuter l'application, exécutez les deux commandes suivantes dans deux terminaux différents:

Dans le dossier `go-with-dog-api`, exécutez la commande suivante pour démarrer l'API:

    php artisan serve

Dans le dossier `go-with-dog-app`, exécutez la commande suivante pour démarrer le serveur de développement de React:

    npm start

Ensuite, accédez à l'URL suivante dans votre navigateur:

http://localhost:3000

Fonctionnalités

Le site web permet à l'utilisateur (sans le role admin) de:

    Consulter la liste des lieux autorisés aux chiens.
    Consulter la liste des ballades.
    Ajouter un nouveau lieu autorisé aux chiens.
    Ajouter une nouvelle ballade.
    
 Le site web permet à l'utilisateur admin de:
 
    Faire tout comme un utilisateur
    Modifier un lieu ou une ballade
    Supprimer un lieu ou une ballade
  
