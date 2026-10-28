FROM php:8.2-fpm

RUN docker-php-ext-install mysqli pdo pdo_mysql

WORKDIR /var/www/localhost

COPY src/       /var/www/localhost/src/
COPY public/    /var/www/localhost/public/

RUN sed -i 's/^listen = .*/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf

EXPOSE 9000