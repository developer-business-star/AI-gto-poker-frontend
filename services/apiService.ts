import { API_CONFIG, DEV_CONFIG } from '@/config/api';
import { Platform } from 'react-native';

export interface AnalysisResult {
  decision: string;
  confidence: number;
  reasoning: string;
  alternatives?: string[];
  gameState?: {
    position: number;
    potSize: number;
    stackSize: number;
    opponents: number;
  };
  metadata?: {
    imageQuality: string;
    cardsDetected: boolean;
    analysisTime: string;
  };
}

export interface UploadResponse {
  success: boolean;
  analysisId: string;
  analysisNotes: string;
  recommenedeAction: string;
  processingTime?: string;
}

export interface ResultResponse {
  success: boolean;
  result?: AnalysisResult & {
    gameFormat: string;
    analysisId: string;
    timestamp: string;
    status: string;
  };
  error?: string;
}

// Auth interfaces
export interface User {
  id: string;
  fullName: string;
  email: string;
  isActive?: boolean;
  avatar: {
    id: string;
    icon: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar?: {
    id: string;
    icon: string;
    color: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

class ApiService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Test network connectivity and provide diagnostic information
   */
  private async networkDiagnostics(): Promise<string> {
    const diagnostics = [
      `Platform: ${Platform.OS}`,
      `Base URL: ${this.baseUrl}`,
      `Development: ${__DEV__}`,
    ];

    // Try different URLs for debugging
    const testUrls = [
      this.baseUrl.replace('/api', ''),
      'http://localhost:3001',
      'http://10.0.2.2:3001',
      'http://127.0.0.1:3001'
    ];

    for (const url of testUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}/api/health`, { 
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          diagnostics.push(`✅ Working URL: ${url}`);
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        diagnostics.push(`❌ Failed URL: ${url} - ${errorMessage}`);
      }
    }

    return diagnostics.join('\n');
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 Registering user:', { email: userData.email, fullName: userData.fullName });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Registration failed: ${response.status}`);
      }

      console.log('✅ Registration successful:', result.data?.user.email);
      return result;

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Registration timeout - Please check your connection and try again');
        }
        
        if (error.message.includes('Network request failed')) {
          const diagnostics = await this.networkDiagnostics();
          throw new Error(`Network connection failed. Please check:\n\n${diagnostics}\n\nMake sure your backend server is running on port 3001.`);
        }
        
        throw new Error(error.message);
      }
      
      throw new Error('Failed to register. Please try again.');
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔐 Logging in user:', { email: loginData.email });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Login failed: ${response.status}`);
      }      

      console.log('✅ Login successful:', result.data?.user.email);
      return result;

    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('🔗 Trying to connect to:', `${this.baseUrl}/auth/login`);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Login timeout - Please check your connection and try again');
        }
        
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          throw new Error(`Network connection failed. Please check your internet connection and try again.\n\nTrying to connect to: ${this.baseUrl}`);
        }
        
        throw new Error(error.message);
      }
      
      throw new Error('Failed to login. Please try again.');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔍 Verifying token...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Token verification failed');
      }

      console.log('✅ Token verified successfully');
      return {
        success: true,
        user: result.data.user
      };

    } catch (error) {
      console.error('❌ Token verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      };
    }
  }

  /**
   * Upload image to backend for GTO analysis
   */
  async uploadImageForAnalysis(
    imageUri: string, 
    gameFormat: 'cash' | 'tournament',
    userInfo?: User
  ): Promise<UploadResponse> {
    try {
      console.log(`📤 Uploading image for ${gameFormat} analysis...`);
      console.log(`📡 Using URL: ${this.baseUrl}/analysis/upload`);

      // Create FormData for image upload
      const formData = new FormData();
      
      // Add the image file
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'poker-table.jpg',
      } as any);
      
      // Add game format
      formData.append('gameFormat', gameFormat);

      // Add user information if provided
      if (userInfo) {
        formData.append('userId', userInfo.id);
        formData.append('userEmail', userInfo.email);
        formData.append('userFullName', userInfo.fullName);
        console.log(`👤 Including user info: ${userInfo.email}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/analysis/upload`, {
        method: 'POST',
        // Don't set Content-Type header for FormData - let the browser set it with boundary
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const result: UploadResponse = await response.json();
      
      console.log(`✅ Upload successful - Analysis ID: ${result.analysisId}`);
      
      return result;
    } catch (error) {
      console.error('❌ Image upload error:', error);
      console.error('🔗 Upload URL:', `${this.baseUrl}/analysis/upload`);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - Please check your connection and try again');
        }
        
        if (error.message.includes('multipart') || error.message.includes('boundary')) {
          throw new Error('Image upload failed - Please try using LAN mode instead of tunnel mode');
        }
        
        if (error.message.includes('Network request failed')) {
          const diagnostics = await this.networkDiagnostics();
          throw new Error(`Network connection failed. Please check:\n\n${diagnostics}\n\nMake sure your backend server is running on port 3001.`);
        }
        
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      throw new Error('Failed to upload image for analysis');
    }
  }

  /**
   * Test backend connectivity with improved diagnostics
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Testing connection to: ${this.baseUrl}/health`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for health check

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        return data.success === true;
      } else {
        console.log('❌ Backend responded with error:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      
      if (error instanceof Error && error.message.includes('Network request failed')) {
        const diagnostics = await this.networkDiagnostics();
        console.error('Network diagnostics:', diagnostics);
      }
      
      return false;
    }
  }

  /**
   * Get analysis statistics from database
   */
  async getAnalysisStats(): Promise<{
    success: boolean;
    stats?: {
      avgProcessingTime: string;
      avgConfidence: number;
      maxDecisions: number;
      totalAnalyses: number;
    };
    error?: string;
  }> {
    try {
      console.log('📊 Fetching analysis statistics...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/analysis/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch stats: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.stats) {
        console.log('✅ Analysis stats received:', result.stats);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching analysis stats:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Please check your connection');
        }
        
        if (error.message.includes('Network request failed')) {
          throw new Error('Network connection failed - Please check if backend server is running');
        }
        
        throw error;
      }
      
      throw new Error('Failed to retrieve analysis statistics');
    }
  }

  /**
   * Generate mock format-specific stats for development
   */
  private generateMockFormatStats(format: 'cash' | 'tournaments') {
    const baseStats = {
      avgProcessingTime: '2.3s',
      totalAnalyses: format === 'cash' ? 156 : 89,
    };

    if (format === 'cash') {
      return {
        ...baseStats,
        avgConfidence: 89,
        maxDecisions: 67,
        handsAnalyzed: 67,
        accuracyRate: 89,
        studyTime: '45h'
      };
    } else {
      return {
        ...baseStats,
        avgConfidence: 82,
        maxDecisions: 43,
        handsAnalyzed: 43,
        accuracyRate: 82,
        studyTime: '28h'
      };
    }
  }

  /**
   * Get format-specific analysis statistics from database
   */
  async getFormatSpecificStats(userId: string, format: 'cash' | 'tournaments'): Promise<{
    success: boolean;
    stats?: {
      avgProcessingTime: string;
      avgConfidence: number;
      maxDecisions: number;
      totalAnalyses: number;
      handsAnalyzed: number;
      accuracyRate: number;
      studyTime: string;
    };
    error?: string;
    fallback?: boolean;
  }> {
    try {
      // Use mock data in development if configured
      if (DEV_CONFIG.USE_MOCK_FORMAT_STATS) {
        if (DEV_CONFIG.SHOW_MOCK_DATA_LOGS) {
          console.log(`📊 Using mock ${format} stats (DEV_CONFIG.USE_MOCK_FORMAT_STATS = true)`);
        }
        const mockStats = this.generateMockFormatStats(format);
        return {
          success: true,
          stats: mockStats,
          fallback: true
        };
      }

      console.log(`📊 Fetching ${format} analysis statistics for user ${userId}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/analysis/stats/${userId}/${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 404 specifically - endpoint might not be implemented yet
        if (response.status === 404) {
          console.warn(`⚠️ ${format} stats endpoint not found - using mock data for development`);
          const mockStats = this.generateMockFormatStats(format);
          return {
            success: true,
            stats: mockStats,
            fallback: true
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch ${format} stats: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.stats) {
        console.log(`✅ ${format} analysis stats received:`, result.stats);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${format} analysis stats:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Please check your connection');
        }
        
        if (error.message.includes('Network request failed')) {
          throw new Error('Network connection failed - Please check if backend server is running');
        }
        
        throw error;
      }
      
      throw new Error(`Failed to retrieve ${format} analysis statistics`);
    }
  }

  /**
   * Get comprehensive user statistics for the stats page
   */
  async getComprehensiveStats(userId: string): Promise<{
    success: boolean;
    stats?: {
      overallAccuracy: number;
      accuracyChange: number;
      handsPlayed: number;
      handsThisWeek: number;
      studyTime: string;
      studyTimeThisWeek: string;
      winRate: string;
      winRateFormat: string;
      positionStats: Array<{
        position: string;
        accuracy: number;
        hands: number;
        color: string;
      }>;
      accuracyTrend: Array<{
        date: string;
        accuracy: number | null;
        hands: number;
      }>;
      recentSessions: Array<{
        date: string;
        gameType: string;
        confidence: number;
        recommendedAction: string;
        result: string;
      }>;
    };
    error?: string;
  }> {
    try {
      console.log(`📊 Fetching comprehensive stats for user ${userId}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/analysis/comprehensive-stats/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch comprehensive stats: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.stats) {
        console.log(`✅ Comprehensive stats received for user ${userId}:`, {
          accuracy: result.stats.overallAccuracy,
          hands: result.stats.handsPlayed,
          studyTime: result.stats.studyTime
        });
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error fetching comprehensive stats:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Please check your connection');
        }
        
        if (error.message.includes('Network request failed')) {
          throw new Error('Network connection failed - Please check if backend server is running');
        }
        
        throw error;
      }
      
      throw new Error('Failed to retrieve comprehensive statistics');
    }
  }

  /**
   * Get available game formats
   */
  async getGameFormats() {
    try {
      const response = await fetch(`${this.baseUrl}/analysis/formats`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching game formats:', error);
      throw error;
    }
  }

  /**
   * Get user's recent session data
   */
  async getUserSessions(userId: string): Promise<{
    success: boolean;
    sessions?: {
      recentSessionCash: {
        date: string | null;
        gamePot: string | null;
        gameSeat: string | null;
        recommendedAction: string | null;
        confidence: number | null;
        analysisNotes: string | null;
      };
      recentSessionSpinAndGo: {
        date: string | null;
        gamePot: string | null;
        gameSeat: string | null;
        recommendedAction: string | null;
        confidence: number | null;
        analysisNotes: string | null;
      };
    };
    error?: string;
  }> {
    try {
      console.log('👤 Fetching user sessions for user:', userId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/analysis/user-sessions/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch user sessions: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.sessions) {
        console.log('✅ User sessions received:', result.sessions);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching user sessions:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Please check your connection');
        }
        
        if (error.message.includes('Network request failed')) {
          throw new Error('Network connection failed - Please check if backend server is running');
        }
        
        throw error;
      }
      
      throw new Error('Failed to retrieve user sessions');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export default new ApiService();