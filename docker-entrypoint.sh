#!/bin/sh
set -e

# Wende Migrationen an und seeede die Fragen, bevor die Next.js-App startet.
# Beides ist idempotent (migrate deploy / upsert).
echo "BS Lern-App: wende Datenbank-Migrationen an …"
npx prisma migrate deploy

echo "BS Lern-App: seeede Fragenkatalog …"
npx tsx prisma/seed.ts

echo "BS Lern-App: starte Webserver …"
exec "$@"