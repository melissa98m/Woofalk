#!/usr/bin/env sh
# Dumps the dev MySQL database (running via `docker compose up`) to ./backups/.
# Reads credentials from the `db` container's own environment so nothing is
# hardcoded here; run before any operation that can wipe the db volume
# (`docker compose down -v`, `migrate:fresh`, etc.).
set -eu

cd "$(dirname "$0")/.."
mkdir -p backups

timestamp=$(date +%Y%m%d-%H%M%S)
out="backups/db-${timestamp}.sql"

docker compose exec -T db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > "$out"

echo "Backup written to $out"
