
FROM php:8.3-apache

# Install PHP database drivers
RUN docker-php-ext-install pdo_mysql mysqli

# Enable Apache modules
RUN a2enmod rewrite headers

# Copy backend application files
COPY . /var/www/html/
# Load CORS and secure session configuration before every PHP script
RUN echo "auto_prepend_file=/var/www/html/api/cors.php" > /usr/local/etc/php/conf.d/zz-cors.ini

# Configure Apache to listen on Render's port
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:10000>/' /etc/apache2/sites-available/000-default.conf

EXPOSE 10000

CMD ["apache2-foreground"]
