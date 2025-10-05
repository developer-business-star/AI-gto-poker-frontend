import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {    

    const possibleIPs = [
      '172.20.1.182',
      '10.0.0.100',
    ];
    
    const currentIP = '172.20.1.182';
    
    return `http://${currentIP}:3001/api`;
  } else {
    // Production environment
    return 'https://your-production-api.com/api';
  }
};

export const DEV_CONFIG = {
  USE_MOCK_FORMAT_STATS: false,
  SHOW_MOCK_DATA_LOGS: true,
};

// API Configuration
export const API_CONFIG = {
  // Backend server URL
  // BASE_URL: getBaseUrl(),
  BASE_URL: `https://a0d5b792ea6f.ngrok-free.app/api`,
  // BASE_URL: `https://a6s23vup6g.eu-central-1.awsapprunner.com/api`,

  // Request timeouts
  TIMEOUT: 30000, // 30 seconds
  
  // Analysis polling configuration
  POLLING: {
    MAX_ATTEMPTS: 20,
    INTERVAL_MS: 1500,
  },

  // Image upload settings
  IMAGE: {
    MAX_SIZE_MB: 5,
    QUALITY: 0.8,
    ASPECT_RATIO: [16, 9] as [number, number],

    RESIZE: {
      MAX_WIDTH: 1920,
      MAX_HEIGHT: 1080,
      MIN_WIDTH: 640,
      MIN_HEIGHT: 360,
    },
    
    COMPRESSION: {
      LARGE_FILE_THRESHOLD: 2 * 1024 * 1024, 
      MEDIUM_FILE_THRESHOLD: 1 * 1024 * 1024,
      LARGE_FILE_QUALITY: 0.6,
      MEDIUM_FILE_QUALITY: 0.7,
      SMALL_FILE_QUALITY: 0.8,
    },
    
    // Format settings
    FORMAT: {
      OUTPUT_FORMAT: 'jpeg',
      REMOVE_EXIF: true,
    }
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
    RESOLVED_URL: `https://a0d5b792ea6f.ngrok-free.app/api`,
    // RESOLVED_URL: `https://a6s23vup6g.eu-central-1.awsapprunner.com/api`,
  }
};

console.log('🔗 API Configuration:', {
  Platform: Platform.OS,
  BaseURL: API_CONFIG.BASE_URL,
  IsDev: __DEV__
});

export default API_CONFIG;
