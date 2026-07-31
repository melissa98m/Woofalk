#!/bin/sh
set -e

if [ ! -f vendor/autoload.php ]; then
    echo "vendor/ missing, run 'composer install' (dev image mounts it from the host)." >&2
fi

if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

if [ -z "$APP_KEY" ] && [ -f .env ] && ! grep -q '^APP_KEY=base64' .env; then
    php artisan key:generate --force
fi

if [ ! -f .env ] || ! grep -q '^JWT_SECRET=.\+' .env 2>/dev/null; then
    if [ -z "$JWT_SECRET" ]; then
        php artisan jwt:secret --force
    fi
fi

if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

if [ "$WAIT_FOR_DB" = "true" ]; then
    echo "Waiting for database at ${DB_HOST:-db}:${DB_PORT:-3306}..."
    until php artisan db:show > /dev/null 2>&1; do
        sleep 1
    done
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force
fi

if [ ! -L public/storage ]; then
    php artisan storage:link
fi

exec "$@"
