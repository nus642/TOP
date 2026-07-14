# 使用官方 PHP 7.4 + Apache 镜像
FROM php:7.4-apache

# 安装 zip 扩展（以及其他常用扩展）
RUN apt-get update && apt-get install -y \
        libzip-dev \
        zip \
        unzip \
    && docker-php-ext-install zip \
    && docker-php-ext-install pdo_mysql \
    && a2enmod rewrite

# 将当前目录下的所有文件复制到 Apache 的默认网页目录
COPY . /var/www/html/

# 设置目录权限
RUN chown -R www-data:www-data /var/www/html