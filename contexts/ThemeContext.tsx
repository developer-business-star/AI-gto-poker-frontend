import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Shadow colors
  shadow: string;
  
  // Toggle and switch colors
  toggleActive: string;
  toggleInactive: string;
  toggleThumb: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#007AFF',
  primaryLight: '#007AFF15',
  primaryDark: '#0056CC',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  border: '#e5e7eb',
  divider: '#f0f0f0',
  shadow: '#000000',
  toggleActive: '#007AFF',
  toggleInactive: '#f0f0f0',
  toggleThumb: '#ffffff',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2c2c2e',
  text: '#f2f2f7',
  textSecondary: '#8e8e93',
  textTertiary: '#636366',
  primary: '#5ac8fa',
  primaryLight: '#5ac8fa15',
  primaryDark: '#007aff',
  success: '#32d74b',
  warning: '#ffcc00',
  error: '#ff3b30',
  info: '#64d2ff',
  border: '#38383a',
  divider: '#2c2c2e',
  shadow: '#000000',
  toggleActive: '#5ac8fa',
  toggleInactive: '#48484a',
  toggleThumb: '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load saved theme mode from storage
  useEffect(() => {
    loadThemeMode();
  }, []);

  // Update theme based on system preference when mode is 'system'
  useEffect(() => {
    if (themeMode === 'system') {
      // For now, we'll default to light mode
      // In a real app, you'd use Appearance API to detect system theme
      setTheme('light');
    } else {
      setTheme(themeMode);
    }
  }, [themeMode]);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };

  const saveThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemeMode(mode);
  };

  const toggleTheme = () => {
    const newMode = theme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{
      theme,
      themeMode,
      colors,
      toggleTheme,
      setThemeMode,
      isDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
