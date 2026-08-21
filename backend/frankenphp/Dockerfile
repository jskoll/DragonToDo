# syntax=docker/dockerfile:1

# Modeled on dunglas/symfony-docker: FrankenPHP (Caddy + PHP worker mode) serving
# a Symfony app, with dev/prod stages sharing a common base.
#
# PHP 8.5 is the target: if `dunglas/frankenphp:1-php8.5` is not yet published for
# your platform, fall back to `dunglas/frankenphp:1-php8.4` (the version this backend
# was developed and tested against locally) until the 8.5 image is available.
ARG FRANKENPHP_IMAGE=dunglas/frankenphp:1-php8.5

FROM ${FRANKENPHP_IMAGE} AS base

WORKDIR /app

# Extensions needed for all three supported database engines, plus common Symfony/API
# Platform needs (intl for locale-aware validation/formatting, opcache, zip for Composer).
RUN install-php-extensions \
    pdo_sqlite \
    pdo_mysql \
    pdo_pgsql \
    intl \
    opcache \
    zip

COPY frankenphp/conf.d/10-app.ini $PHP_INI_DIR/conf.d/
COPY frankenphp/Caddyfile /etc/frankenphp/Caddyfile
COPY --chmod=755 frankenphp/docker-entrypoint.sh /usr/local/bin/docker-entrypoint

COPY --from=composer/composer:2-bin /composer /usr/bin/composer

ENV SERVER_NAME=:80
ENV APP_ENV=prod

# ---------------------------------------------------------------------------
FROM base AS dev

ENV APP_ENV=dev
COPY frankenphp/conf.d/20-app.dev.ini $PHP_INI_DIR/conf.d/
COPY frankenphp/Caddyfile.dev /etc/frankenphp/Caddyfile

# Source is bind-mounted in dev (see compose.override.yaml); dependencies are
# installed here as a baseline so `docker compose up` works before any mount too.
COPY composer.json composer.lock symfony.lock ./
RUN composer install --prefer-dist --no-autoloader --no-scripts --no-progress

COPY . .
RUN composer dump-autoload --classmap-authoritative

ENTRYPOINT ["docker-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]

# ---------------------------------------------------------------------------
FROM base AS prod

ENV APP_ENV=prod
COPY frankenphp/conf.d/20-app.prod.ini $PHP_INI_DIR/conf.d/

COPY . .

RUN composer install --prefer-dist --no-dev --no-autoloader --no-scripts --no-progress \
    && composer dump-autoload --classmap-authoritative --no-dev \
    && composer run-script --no-dev post-install-cmd \
    && chmod +x bin/console \
    && sync

RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var

ENTRYPOINT ["docker-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
