-- Create database
CREATE DATABASE IF NOT EXISTS ecccChemistryDb;
USE ecccChemistryDb;

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

-- Insert some sample data
INSERT INTO trash_reports (photo_url, latitude, longitude, description) VALUES
  ('https://example.com/photos/trash1.jpg', 37.7749, -122.4194, 'Large pile of trash near the park'),
  ('https://example.com/photos/trash2.jpg', 40.7128, -74.0060, 'Trash along the sidewalk'),
  ('https://example.com/photos/trash3.jpg', 34.0522, -118.2437, 'Plastic bottles and paper'); 