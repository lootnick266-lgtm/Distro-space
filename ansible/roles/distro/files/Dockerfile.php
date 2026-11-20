FROM docker.io/library/php:8.2.33-fpm
RUN apt-get update \
 && apt-get install -y --no-install-recommends libonig5 libonig-dev \
 && docker-php-ext-install -j2 mysqli pdo_mysql mbstring \
 && apt-get purge -y libonig-dev \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /var/www/localhost
COPY src/ ./src/
COPY config.php ./src/controlls/php/config.php
COPY php-runtime.ini /usr/local/etc/php/conf.d/distro-runtime.ini
RUN find /var/www/localhost -type d -exec chmod 0755 '{}' + \
 && find /var/www/localhost -type f -exec chmod 0644 '{}' +
