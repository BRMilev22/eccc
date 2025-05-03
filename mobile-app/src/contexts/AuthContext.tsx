import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, getCurrentUser, logout as apiLogout } from '../services/api';

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user data when the app loads
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        // Try to get the current user from the API which checks AsyncStorage
        const userData = await getCurrentUser();
        
        if (userData) {
          console.log('Found stored user data:', userData.username);
          setUser(userData);
        } else {
          console.log('No stored user data found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function - store user data
  const login = async (userData: User) => {
    try {
      setUser(userData);
      // The actual storage is handled by the api.ts service
      console.log('User logged in:', userData.username);
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  // Logout function - clear stored user data
  const logout = async () => {
    try {
      await apiLogout(); // This clears AsyncStorage
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  // Function to refresh user data from AsyncStorage
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for using the auth context
export const useAuth = () => useContext(AuthContext); 