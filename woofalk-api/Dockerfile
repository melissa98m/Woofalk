# syntax=docker/dockerfile:1.7

########################################
# base: PHP runtime + extensions shared by every stage
########################################
FROM php:8.3-fpm-alpine@sha256:bf90236449d333cef008b1f01c72a3d4f11a6470a74629665e4c6b6158f03fc8 AS base

RUN apk add --no-cache \
        icu-libs \
        libzip \
        libpng \
        libjpeg-turbo \
        freetype \
        oniguruma \
        mysql-client \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        oniguruma-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
        opcache \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Re-key the www-data user to match the host UID/GID (defaults to the common
# first-user 1000:1000) so bind-mounted dev volumes and files written by
# php-fpm don't end up root-owned on the host. php-fpm's pool config keeps
# referring to it by name, so this is transparent to the rest of the image.
ARG WWWUSER=1000
ARG WWWGROUP=1000
RUN deluser www-data 2>/dev/null || true \
    && delgroup www-data 2>/dev/null || true \
    && addgroup -g "${WWWGROUP}" www-data \
    && adduser -D -u "${WWWUSER}" -G www-data -h /var/www/html www-data

WORKDIR /var/www/html

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY docker/php/security.ini /usr/local/etc/php/conf.d/zz-security.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

########################################
# dev: full composer deps (incl. dev), source mounted at runtime, xdebug available
########################################
FROM base AS dev

ENV APP_ENV=local \
    XDEBUG_MODE=off

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS linux-headers \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && apk del .build-deps

COPY docker/php/xdebug.ini /usr/local/etc/php/conf.d/zz-xdebug.ini

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --no-progress

# Real source is bind-mounted over this in docker-compose for hot reload;
# it is still copied here so the image is runnable standalone (e.g. in CI).
COPY . .
RUN chown -R www-data:www-data /var/www/html

USER www-data

########################################
# vendor: production dependencies only, used to build the prod image
########################################
FROM base AS vendor

COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-interaction \
        --no-scripts \
        --no-progress \
        --optimize-autoloader

COPY . .
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

########################################
# prod: immutable runtime image, no dev tooling, opcache tuned for prod
########################################
FROM base AS prod

ENV APP_ENV=production

COPY --from=vendor --chown=www-data:www-data /var/www/html /var/www/html

RUN mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data
