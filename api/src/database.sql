-- Create database
CREATE DATABASE IF NOT EXISTS eccc_db;
USE eccc_db;

-- Create trash reports table
CREATE TABLE IF NOT EXISTS trash_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  photo_url VARCHAR(512) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster geolocation searches
CREATE INDEX idx_lat_long ON trash_reports(latitude, longitude); 