#!/bin/sh
set -e

cd /var/www/html

# Ensure SQLite DB exists and is writable
touch database/database.sqlite
chmod 664 database/database.sqlite

# Clear and cache config for production
php artisan config:clear
php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction 2>/dev/null || true

# Start PHP built-in server on Cloud Run port
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
