#!/bin/bash

# Migrate data from NeonDB to the self-hosted Docker PostgreSQL container
# Usage: bash scripts/migrate-from-neon.sh "postgres://user:password@neon-host/dbname?sslmode=require"

NEON_URL=$1
CONTAINER_NAME="nexthire-db"
BACKUP_FILE="/tmp/neon_backup.dump"
DB_NAME="nexthire"
DB_USER="postgres"

if [ -z "$NEON_URL" ]; then
  echo "❌ Error: Please provide your NeonDB connection URL."
  echo "Usage: bash scripts/migrate-from-neon.sh \"postgres://user:password@neon-host.neon.tech/dbname?sslmode=require\""
  exit 1
fi

if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "❌ Error: Docker container '$CONTAINER_NAME' is not running."
  echo "Please start the database first with 'docker compose up -d db'"
  exit 1
fi

echo "📦 1. Exporting data from NeonDB..."
# Run pg_dump inside the postgres container using the provided Neon URL
if docker exec "$CONTAINER_NAME" pg_dump "$NEON_URL" -F c -f "$BACKUP_FILE"; then
    echo "✅ Export successful."
else
    echo "❌ Export failed. Please check your NeonDB URL and ensure the container has internet access."
    exit 1
fi

echo "🧹 2. Dropping existing tables in local database (if any)..."
# Drop the public schema and recreate it to ensure a clean import
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"

echo "📥 3. Importing data into local Docker database..."
# Restore the data
if docker exec "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" -1 "$BACKUP_FILE"; then
    echo "✅ Import successful."
else
    echo "⚠️ Import finished with some warnings (this is common and usually safe)."
fi

echo "🗑️ 4. Cleaning up..."
docker exec "$CONTAINER_NAME" rm -f "$BACKUP_FILE"

echo "🎉 Migration complete! Your self-hosted database is now ready."
