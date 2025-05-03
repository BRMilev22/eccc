-- Create database
CREATE DATABASE IF NOT EXISTS ecccChemistryDb;
USE ecccChemistryDb;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

-- Create trash reports table with enhanced fields
CREATE TABLE IF NOT EXISTS trash_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  photo_url VARCHAR(512) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  trash_type ENUM('PLASTIC', 'FOOD', 'HAZARDOUS', 'PAPER', 'ELECTRONICS', 'MIXED') NULL,
  severity_level ENUM('LOW', 'MEDIUM', 'HIGH') NULL,
  status ENUM('REPORTED', 'IN_PROGRESS', 'CLEANED', 'VERIFIED') DEFAULT 'REPORTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for faster geolocation searches
CREATE INDEX idx_lat_long ON trash_reports(latitude, longitude);

-- Add index for status searches
CREATE INDEX idx_status ON trash_reports(status);

-- Add index for trash type 
CREATE INDEX idx_trash_type ON trash_reports(trash_type);

-- Add index for severity level
CREATE INDEX idx_severity ON trash_reports(severity_level);

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');

-- Insert sample user (password: user123)
INSERT INTO users (username, email, password, role) VALUES
('user', 'user@example.com', 'e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446', 'user');

-- Insert some sample data for trash reports
INSERT INTO trash_reports (user_id, photo_url, latitude, longitude, description, trash_type, severity_level, status) VALUES
(2, 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?q=80&w=1000', 37.7749, -122.4194, 'Large pile of plastic bottles near the park', 'PLASTIC', 'HIGH', 'REPORTED'),
(2, 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=1000', 40.7128, -74.0060, 'Food waste along the sidewalk', 'FOOD', 'MEDIUM', 'IN_PROGRESS'),
(NULL, 'https://images.unsplash.com/photo-1606224547099-b15c94ca4efa?q=80&w=1000', 34.0522, -118.2437, 'Hazardous materials near a school', 'HAZARDOUS', 'HIGH', 'REPORTED'),
(NULL, 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?q=80&w=1000', 41.8781, -87.6298, 'Plastic bags in the river', 'PLASTIC', 'MEDIUM', 'REPORTED'),
(NULL, 'https://images.unsplash.com/photo-1603171121414-90e78cc5b9af?q=80&w=1000', 51.5074, -0.1278, 'Electronic waste dumped illegally', 'ELECTRONICS', 'HIGH', 'REPORTED'); 