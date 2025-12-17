-- MySQL Database Setup Script for AMS

-- Create Database
CREATE DATABASE IF NOT EXISTS ams_db;

-- Create User and Grant Privileges
-- First, drop the user if it exists
DROP USER IF EXISTS 'root2'@'localhost';

-- Create new user with password 'blaise' (matches the default in DatabaseContext.cs)
CREATE USER 'root2'@'localhost' IDENTIFIED BY 'blaise';

-- Grant all privileges on ams_db to root2
GRANT ALL PRIVILEGES ON ams_db.* TO 'root2'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the setup
SELECT 'Database and user setup completed successfully!' AS status;
