import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/services/apiService';
import apiService from '@/services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
  isActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Get stored token and user data
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUserData = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUserData) {
        // Verify token with backend
        const verificationResult = await apiService.verifyToken(storedToken);
        
        if (verificationResult.success && verificationResult.user) {
          setToken(storedToken);
          setUser(verificationResult.user);
          console.log('✅ User authenticated from storage:', verificationResult.user.email);
        } else {
          // Token is invalid, clear storage
          console.log('❌ Invalid token, clearing storage');
          await logout();
        }
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, userToken: string) => {
    try {
      // Store in AsyncStorage
      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Update state
      setToken(userToken);
      setUser(userData);
      
      console.log('✅ User logged in:', userData.email);
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // Also update AsyncStorage
    AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const verificationResult = await apiService.verifyToken(token);
      if (verificationResult.success && verificationResult.user) {
        setUser(verificationResult.user);
        await AsyncStorage.setItem('userData', JSON.stringify(verificationResult.user));
        console.log('✅ User data refreshed');
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isActive: user?.isActive || false,
      isLoading,
      login,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 