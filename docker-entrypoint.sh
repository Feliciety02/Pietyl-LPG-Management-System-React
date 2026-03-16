#!/bin/bash
set -e

echo "Waiting for database connection..."

for i in $(seq 1 30); do
  if php artisan db:show --json > /dev/null 2>&1; then
    echo "Database is ready."
    break
  fi
  echo "Attempt $i/30 — DB not ready yet, retrying in 1s..."
  sleep 1
done

echo "Running migrations..."
php artisan migrate --force

echo "Starting Apache..."
exec apache2-foreground
