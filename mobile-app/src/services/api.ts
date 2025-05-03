import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the correct API URL based on platform
// Use the actual IP address of your computer for all devices
const getApiBaseUrl = () => {
  // Use local IP address instead of localhost
  return 'http://192.168.0.105:3000/api';  // Local network IP address
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
  trashType?: 'PLASTIC' | 'FOOD' | 'HAZARDOUS' | 'PAPER' | 'ELECTRONICS' | 'MIXED';
  severityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
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
  trashType?: string; // Added for trash type
  severityLevel?: string; // Added for severity level
}

// Define the User interface for authentication
export interface User {
  id: number;
  username: string;
  email?: string;
  isAdmin: boolean;
}

// Authentication functions
export const loginUser = async (username: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password
    });
    
    if (response.data && response.data.user && response.data.token) {
      // Store token and user data
      await storeAuthToken(response.data.token);
      await storeUserData(response.data.user);
      return response.data.user;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('API Error - loginUser:', error);
    throw error;
  }
};

export const registerUser = async (username: string, password: string, email: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      username,
      password,
      email
    });
    
    if (response.data && response.data.user && response.data.token) {
      // Store token and user data
      await storeAuthToken(response.data.token);
      await storeUserData(response.data.user);
      return response.data.user;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('API Error - registerUser:', error);
    throw error;
  }
};

// Submit a new trash report
export const submitTrashReport = async (data: {
  photoUrl: string;
  latitude: number;
  longitude: number;
  description?: string;
  trashType?: string;
  severityLevel?: string;
}) => {
  try {
    // Get authentication token
    const token = await AsyncStorage.getItem('authToken');
    const isGuest = !token;
    
    // If this is a guest submission, modify the description
    let apiData = { ...data };
    if (isGuest && apiData.description) {
      apiData.description = `${apiData.description} [Reported by Guest]`;
    } else if (isGuest) {
      apiData.description = '[Reported by Guest]';
    }
    
    console.log('Submitting with data:', apiData);
    
    // Always use the standard endpoint
    const response = await axios.post(`${API_BASE_URL}/reports`, apiData, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : undefined
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error submitting trash report:', error);
    console.log('Error response:', error.response?.data);
    throw new Error(error.response?.data?.error || 'Failed to submit trash report');
  }
};

// Helper function to get auth header with token
const getAuthHeader = async () => {
  // This would come from your storage/context in a real app
  const token = await AsyncStorage.getItem('authToken');
  
  return token ? { 
    'Authorization': `Bearer ${token}` 
  } : {};
};

// Store authentication token
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

// Remove authentication token (logout)
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Update a report's status or other fields
export const updateTrashReport = async (
  reportId: string | number, 
  updates: { status?: string, trashType?: string, severityLevel?: string, description?: string }
): Promise<any> => {
  try {
    const authHeader = await getAuthHeader();
    
    const response = await axios.patch(
      `${API_BASE_URL}/reports/${reportId}`, 
      updates,
      { headers: authHeader }
    );
    
    return response.data;
  } catch (error) {
    console.error(`API Error - updateTrashReport:`, error);
    throw error;
  }
};

// Get the current user's reports
export const getUserReports = async (): Promise<TrashReport[]> => {
  try {
    const authHeader = await getAuthHeader();
    
    const response = await axios.get(
      `${API_BASE_URL}/reports/user`,
      { headers: authHeader }
    );
    
    return response.data;
  } catch (error) {
    console.error('API Error - getUserReports:', error);
    return [];
  }
};

/**
 * Get all trash reports
 * This function retrieves all trash reports from the database,
 * regardless of which user created them, to ensure photos are visible to all users
 */
export const getTrashReports = async (): Promise<TrashReport[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports`);
    console.log('Raw API response:', JSON.stringify(response.data));
    
    // Ensure we return an array even if the API doesn't return the expected format
    if (!response.data) return [];
    
    const reports = Array.isArray(response.data) ? response.data : [];
    
    // Map snake_case to camelCase for consistency in the frontend
    return reports.map(report => {
      // Check for available trash type in various formats
      // First try snake_case fields directly from API
      const trashType = report.trash_type || report.trashType || null;
      const severityLevel = report.severity_level || report.severityLevel || null;
      
      // For backward compatibility, try to extract from description if not directly available
      let extractedType = null;
      let extractedSeverity = null;
      
      if (!trashType && report.description) {
        const typeMatch = report.description.match(/Type: ([A-Z]+)/);
        if (typeMatch) extractedType = typeMatch[1];
      }
      
      if (!severityLevel && report.description) {
        const severityMatch = report.description.match(/Severity: ([A-Z]+)/);
        if (severityMatch) extractedSeverity = severityMatch[1];
      }
      
      // Format dates properly
      let createdAtFormatted = null;
      try {
        if (report.created_at) {
          createdAtFormatted = new Date(report.created_at).toISOString();
        } else if (report.createdAt) {
          createdAtFormatted = new Date(report.createdAt).toISOString();
        }
      } catch (error) {
        console.warn('Error formatting date for report', report.id, error);
        // Use current date as fallback
        createdAtFormatted = new Date().toISOString();
      }
      
      console.log(`Processing report ${report.id}:`, {
        original_trash_type: report.trash_type,
        original_severity_level: report.severity_level,
        trashType: trashType || extractedType,
        severityLevel: severityLevel || extractedSeverity,
        createdAt: createdAtFormatted
      });
      
      return {
        ...report,
        // Add camelCase versions for frontend compatibility
        imageUrl: report.photo_url,
        // Ensure dates are properly formatted
        createdAt: createdAtFormatted,
        // Map snake_case fields to camelCase
        trash_type: trashType || extractedType, // Add snake_case version for direct access
        trashType: trashType || extractedType, // Add camelCase version for consistency
        severityLevel: severityLevel || extractedSeverity
      };
    });
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

// Get the current user information
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // First check if we're authenticated
    const isAuth = await isAuthenticated();
    if (!isAuth) return null;
    
    // Get the stored user data
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Store user data
export const storeUserData = async (userData: User): Promise<void> => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

// Logout function to clear both token and user data
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Update a report's status specifically
export const updateTrashReportStatus = async (reportId: string | number, status: string): Promise<any> => {
  return updateTrashReport(reportId, { status });
};

/**
 * Test the API connection
 */
export const testApiConnection = async (): Promise<{ success: boolean, message: string }> => {
  try {
    console.log('Testing API connection to:', `${API_BASE_URL}/reports/debug`);
    const response = await axios.get(`${API_BASE_URL}/reports/debug`);
    console.log('API test response:', response.data);
    return { 
      success: true, 
      message: `API connection successful: ${JSON.stringify(response.data)}` 
    };
  } catch (error: any) {
    console.error('API connection test failed:', error);
    return { 
      success: false, 
      message: `API connection failed: ${error.message}` 
    };
  }
}; 