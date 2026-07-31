.PHONY: up down backup reset-db

# Daily driver: never touches the db volume.
up:
	docker compose up --build

down:
	docker compose down

# Dumps the current dev database to ./backups/ (gitignored).
backup:
	./scripts/backup-db.sh

# The only place `docker compose down -v` is allowed to run: takes a backup
# first, then requires typing "reset" to confirm the wipe.
reset-db: backup
	@echo "This will WIPE the database volume — all local data will be lost (a backup was just taken in ./backups/)."
	@read -p "Type 'reset' to confirm: " confirm; \
	if [ "$$confirm" = "reset" ]; then \
		docker compose down -v && docker compose up --build -d; \
	else \
		echo "Aborted, nothing was touched."; \
	fi
