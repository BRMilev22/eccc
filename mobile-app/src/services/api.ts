import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Get the correct API URL based on platform
// Use the actual IP address of your computer for all devices
const getApiBaseUrl = () => {
  // Use actual IP address for all devices
  return 'http://172.20.10.3:3000/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log("Using API URL:", API_BASE_URL);

// Configure axios with interceptors to log requests and responses
axios.interceptors.request.use(request => {
  console.log('API Request:', request.method, request.url, request.data);
  return request;
}, error => {
  console.error('API Request Error:', error);
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  console.log('API Response:', response.status, response.data);
  return response;
}, error => {
  if (error.response) {
    console.error('API Response Error:', error.response.status, error.response.data);
  } else if (error.request) {
    console.error('API No Response:', error.request);
  } else {
    console.error('API Error:', error.message);
  }
  return Promise.reject(error);
});

// Define the report data interface
export interface TrashReportData {
  photoUrl: string;  // This should be renamed to imageUrl in the future for consistency
  latitude: number;
  longitude: number;
  description: string;
  status: string;
  createdAt: string;
}

// Define the TrashReport interface for received reports
export interface TrashReport {
  id: string | number;
  imageUrl?: string;  // For backwards compatibility
  photoUrl?: string;  // From new upload API
  photo_url: string;  // From API response
  latitude: number | string;
  longitude: number | string;
  description: string | null;
  status?: string;
  created_at: string; // From API response
  createdAt?: string; // For backwards compatibility
}

/**
 * Submit a new trash report to the server
 */
export const submitTrashReport = async (reportData: TrashReportData): Promise<any> => {
  try {
    // Ensure file URI is properly formatted or provide fallback
    const photoUrl = reportData.photoUrl || 'https://example.com/placeholder.jpg';
    
    // Convert field names to match what the server API expects (camelCase)
    const apiData = {
      photoUrl: photoUrl,
      latitude: reportData.latitude.toString(),
      longitude: reportData.longitude.toString(),
      description: reportData.description || '',
      // Don't send status or createdAt, they'll be handled by the server
    };
    
    console.log('Sending to API:', apiData);
    const response = await axios.post(`${API_BASE_URL}/reports`, apiData);
    return response.data;
  } catch (error) {
    console.error('API Error - submitTrashReport:', error);
    throw error;
  }
};

/**
 * Get all trash reports
 */
export const getTrashReports = async (): Promise<TrashReport[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports`);
    // Ensure we return an array even if the API doesn't return the expected format
    if (!response.data) return [];
    
    const reports = Array.isArray(response.data) ? response.data : [];
    
    // Map snake_case to camelCase for consistency in the frontend
    return reports.map(report => ({
      ...report,
      // Add camelCase versions for frontend compatibility
      imageUrl: report.photo_url,
      createdAt: report.created_at,
    }));
  } catch (error) {
    console.error('API Error - getTrashReports:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

/**
 * Get a specific trash report by ID
 */
export const getTrashReportById = async (reportId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('API Error - getTrashReportById:', error);
    throw error;
  }
};

/**
 * Update a trash report status
 */
export const updateTrashReportStatus = async (reportId: string, status: string): Promise<any> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/reports/${reportId}`, { status });
    return response.data;
  } catch (error) {
    console.error('API Error - updateTrashReportStatus:', error);
    throw error;
  }
};

/**
 * Upload an image to the server
 * @param imageUri - The local URI of the image to upload
 * @returns The URL of the uploaded image on the server
 */
export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    console.log('Uploading image:', imageUri);
    
    // Create a FormData object
    const formData = new FormData();
    
    // Get filename from the uri
    const uriParts = imageUri.split('/');
    const filename = uriParts[uriParts.length - 1];
    
    // Determine mime type
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    
    // Append the image to the FormData object
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: mimeType
    } as any);
    
    // Upload the image
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.status === 200 && response.data.imageUrl) {
      console.log('Image uploaded successfully:', response.data.imageUrl);
      return response.data.imageUrl;
    } else {
      throw new Error('Failed to upload image: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 