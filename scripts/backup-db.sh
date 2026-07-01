#!/bin/sh
# Erzeugt ein binäres PostgreSQL-Backup der Lern-App-Datenbank.
# Aufruf vom Projektverzeichnis aus (docker compose muss laufen):
#   sh scripts/backup-db.sh
set -e

TS=$(date +%Y%m%d-%H%M%S)
OUT_DIR="backups"
OUT="${OUT_DIR}/lernapp-${TS}.dump"

mkdir -p "${OUT_DIR}"

echo "Erzeuge Backup -> ${OUT}"
docker compose exec -T db pg_dump -U lernapp -d lernapp -Fc > "${OUT}"

SIZE=$(wc -c < "${OUT}" | tr -d ' ')
echo "Fertig. ${OUT} (${SIZE} Bytes)"
echo ""
echo "Wiederherstellung:"
echo "  docker compose exec -T db pg_restore -U lernapp -d lernapp -c < \"${OUT}\""