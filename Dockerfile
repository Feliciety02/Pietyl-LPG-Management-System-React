FROM php:8.2-apache
RUN apt-get update && apt-get install -y \
    libgd-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip unzip git curl libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql mbstring bcmath opcache zip
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
EXPOSE 8080
CMD php artisan serve --host=0.0.0.0 --port=$PORT