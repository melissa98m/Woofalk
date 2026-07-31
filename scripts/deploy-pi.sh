#!/bin/bash
# Redeploys woofalk-api on the Raspberry Pi. Invoked over SSH by the
# "Deploy to Raspberry Pi" job in .github/workflows/api-ci-cd.yml, after
# PHPUnit has passed in CI. Only ever touches the api/api-nginx services —
# db/web/mailhog are left running untouched.
#
# Wrapped in a function and called at the very end on purpose: this script
# lives in the same repo it `git reset --hard`s below, and bash would
# otherwise re-read this file line-by-line from disk mid-execution, right
# as its own content is being rewritten. Wrapping the body in a function
# forces bash to read the whole thing into memory first.
main() {
    set -e
    cd "$(dirname "$0")/.."

    # Fixed and explicit rather than derived from the checkout directory
    # name, so the api_html volume name below is deterministic.
    export COMPOSE_PROJECT_NAME=gowithdog

    git fetch origin master
    git checkout master
    git reset --hard origin/master

    docker compose -f docker-compose.yml -f docker-compose.prod.yml build api

    # api_html only ever holds code (see docker-compose.prod.yml) — uploads
    # (api_uploads) and secrets (.env.production, read via env_file) live
    # outside it and are untouched by this. Scoped to api/api-nginx: down
    # refuses to remove the shared network while db/web still use it,
    # which is expected and harmless.
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down api api-nginx
    # "|| true": absent on the very first deploy, before any container has
    # ever created it — not an error in that case.
    docker volume rm gowithdog_api_html || true

    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps api api-nginx

    docker compose exec -T api php artisan migrate --force

    docker image prune -f

    echo "Deploy complete: $(git rev-parse --short HEAD)"
}

main "$@"
