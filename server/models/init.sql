-- =============================================
-- 📘 DATABASE: Automated Attendance Monitoring System (ams_db)
-- =============================================

CREATE DATABASE IF NOT EXISTS ams_db;
USE ams_db;

-- =============================================
-- 👤 USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  position ENUM('admin', 'official', 'staff') NOT NULL DEFAULT 'staff',
  gender ENUM('Male', 'Female') NULL,
  fingerprint_template TEXT NULL, -- Store fingerprint hash/template
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample Users


-- =============================================
-- 🕒 ATTENDANCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Link to users table
    position ENUM('admin','offical','staff') NOT NULL,
    am_time_in TIME DEFAULT NULL,
    am_time_out TIME DEFAULT NULL,
    pm_time_in TIME DEFAULT NULL,
    pm_time_out TIME DEFAULT NULL,
    date DATE NOT NULL,
    remarks ENUM('LATE', 'Ontime', 'Undertime', 'Overtime') DEFAULT 'Ontime',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);




-- =============================================
-- 🧾 REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_month VARCHAR(20) NOT NULL,
  generated_by INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);


-- =============================================
-- 🔍 FINGERPRINTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS fingerprints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fingerprint_template TEXT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

