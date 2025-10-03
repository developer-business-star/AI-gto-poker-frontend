import { Platform } from 'react-native';

// Get the correct base URL for different environments
const getBaseUrl = () => {
  if (__DEV__) {
    // Development environment
    // For Expo Go on real devices, we need to use the computer's IP address
    // Make sure your computer and phone are on the same WiFi network
    
    // Try multiple IP addresses for better compatibility
    const possibleIPs = [
      '192.168.145.28', // Your current IP
      '192.168.1.100',  // Common home network IP
      '10.0.0.100',     // Alternative network IP
    ];
    
    // Use the first IP for now, but you can change this based on your network
    const currentIP = '192.168.145.28';
    
    return `http://${currentIP}:3001/api`;
  } else {
    // Production environment
    return 'https://your-production-api.com/api';
  }
};

// Development Configuration
export const DEV_CONFIG = {
  USE_MOCK_FORMAT_STATS: false, // Set to false when backend endpoints are ready - NOW USING REAL DATA!
  SHOW_MOCK_DATA_LOGS: true,   // Set to false to hide mock data logs
};

// API Configuration
export const API_CONFIG = {
  // Backend server URL
  // BASE_URL: getBaseUrl(),
  // BASE_URL: `https://a2fa80910b9f.ngrok-free.app/api`,
  BASE_URL: `https://a6s23vup6g.eu-central-1.awsapprunner.com/api`,

  // Request timeouts
  TIMEOUT: 30000, // 30 seconds
  
  // Analysis polling configuration
  POLLING: {
    MAX_ATTEMPTS: 20,
    INTERVAL_MS: 1500,
  },

  // Image upload settings
  IMAGE: {
    MAX_SIZE_MB: 10,
    QUALITY: 0.8,
    ASPECT_RATIO: [16, 9] as [number, number],
  },

  // Format mappings
  GAME_FORMATS: {
    cash: 'cash',
    tournament: 'tournament',
  } as const,

  // Debug info
  DEBUG: {
    PLATFORM: Platform.OS,
    IS_DEV: __DEV__,
    // RESOLVED_URL: getBaseUrl(),
    // RESOLVED_URL: `https://a2fa80910b9f.ngrok-free.app/api`,
    RESOLVED_URL: `https://a6s23vup6g.eu-central-1.awsapprunner.com/api`,
  }
};

console.log('🔗 API Configuration:', {
  Platform: Platform.OS,
  BaseURL: API_CONFIG.BASE_URL,
  IsDev: __DEV__
});

export default API_CONFIG;
