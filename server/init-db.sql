-- init-db.sql
-- Safe/idempotent DB + user setup for local development.
-- Run as a privileged MySQL user (root) to create the database and grant access.

/*
Usage (from shell):
  mysql -u root -p < server/init-db.sql

This file is idempotent: it will not drop existing data.
*/

CREATE DATABASE IF NOT EXISTS `cart_compare` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user for localhost and 127.0.0.1 if missing, then set/ensure password
-- Replace the password below if you want a different one.
SET @pwd = '205Ridhimag@';

-- Create user entries if they do not exist
CREATE USER IF NOT EXISTS 'cartuser'@'localhost' IDENTIFIED BY @pwd;
CREATE USER IF NOT EXISTS 'cartuser'@'127.0.0.1' IDENTIFIED BY @pwd;

-- For MySQL 8+, ensure user uses mysql_native_password if plugin issues occur
-- This ALTER USER is safe to run repeatedly.
ALTER USER 'cartuser'@'localhost' IDENTIFIED WITH mysql_native_password BY @pwd;
ALTER USER 'cartuser'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY @pwd;

GRANT ALL PRIVILEGES ON `cart_compare`.* TO 'cartuser'@'localhost';
GRANT ALL PRIVILEGES ON `cart_compare`.* TO 'cartuser'@'127.0.0.1';
FLUSH PRIVILEGES;

-- Optional: show created DB and user (for manual verification when running interactively)
-- SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'cart_compare';
-- SELECT user, host FROM mysql.user WHERE user = 'cartuser';
