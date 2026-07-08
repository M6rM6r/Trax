FROM php:8.2-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git curl pkg-config sqlite3 libsqlite3-dev libpng-dev libonig-dev libxml2-dev libzip-dev zip unzip \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY services/api/ ./

RUN composer install --no-interaction --optimize-autoloader --no-dev \
    && cp -n .env.example .env \
    && sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env \
    && sed -i 's|^DB_DATABASE=.*|DB_DATABASE=/var/www/html/database/database.sqlite|' .env \
    && grep -q '^CACHE_STORE=' .env && sed -i 's/^CACHE_STORE=.*/CACHE_STORE=file/' .env || echo 'CACHE_STORE=file' >> .env \
    && grep -q '^SESSION_DRIVER=' .env && sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=file/' .env || echo 'SESSION_DRIVER=file' >> .env \
    && grep -q '^QUEUE_CONNECTION=' .env && sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=sync/' .env || echo 'QUEUE_CONNECTION=sync' >> .env \
    && mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache database \
    && touch database/database.sqlite \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache database

EXPOSE 8080

CMD ["sh", "-c", "php artisan key:generate --force || true; php artisan jwt:secret --force || true; php artisan config:clear && php artisan route:clear && php artisan migrate --force && php artisan db:seed --force || true; php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]