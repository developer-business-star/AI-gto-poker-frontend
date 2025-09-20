import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface CacheInfo {
  totalSize: number;
  itemCount: number;
  lastCleared: string | null;
  breakdown: {
    userData: number;
    gameData: number;
    images: number;
    tempFiles: number;
    logs: number;
  };
}

class CacheService {
  private readonly CACHE_KEYS = {
    USER_DATA: 'user_data',
    GAME_PREFERENCES: 'game_preferences',
    THEME_SETTINGS: 'theme_settings',
    HAPTIC_SETTINGS: 'haptic_settings',
    SESSION_DATA: 'session_data',
    TRAINING_STATS: 'training_stats',
    HAND_HISTORY: 'hand_history',
    CACHED_IMAGES: 'cached_images',
    TEMP_FILES: 'temp_files',
    LOGS: 'logs'
  };

  /**
   * Get cache information and statistics
   */
  async getCacheInfo(): Promise<CacheInfo> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      let itemCount = 0;
      const breakdown = {
        userData: 0,
        gameData: 0,
        images: 0,
        tempFiles: 0,
        logs: 0
      };

      // Calculate AsyncStorage size
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          itemCount++;

          // Categorize by key type
          if (key.includes('user') || key.includes('profile')) {
            breakdown.userData += size;
          } else if (key.includes('game') || key.includes('training') || key.includes('session')) {
            breakdown.gameData += size;
          } else if (key.includes('image') || key.includes('photo')) {
            breakdown.images += size;
          } else if (key.includes('temp') || key.includes('cache')) {
            breakdown.tempFiles += size;
          } else if (key.includes('log') || key.includes('debug')) {
            breakdown.logs += size;
          }
        }
      }

      // Add file system cache size
      try {
        const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir) {
          const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
          if (cacheInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(cacheDir);
            for (const file of files) {
              const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
              if (fileInfo.exists && fileInfo.size) {
                totalSize += fileInfo.size;
                breakdown.tempFiles += fileInfo.size;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not read file system cache:', error);
      }

      const lastCleared = await AsyncStorage.getItem('last_cache_clear');

      return {
        totalSize,
        itemCount,
        lastCleared,
        breakdown
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        lastCleared: null,
        breakdown: {
          userData: 0,
          gameData: 0,
          images: 0,
          tempFiles: 0,
          logs: 0
        }
      };
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clear specific cache categories
   */
  async clearCacheByCategory(categories: string[]): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove: string[] = [];

      for (const key of keys) {
        for (const category of categories) {
          if (key.includes(category.toLowerCase())) {
            keysToRemove.push(key);
            break;
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      // Clear file system cache if temp files are selected
      if (categories.includes('temp') || categories.includes('all')) {
        await this.clearFileSystemCache();
      }

      // Update last cleared timestamp
      await AsyncStorage.setItem('last_cache_clear', new Date().toISOString());

    } catch (error) {
      console.error('Error clearing cache by category:', error);
      throw error;
    }
  }

  /**
   * Clear all cache data
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.clear();

      // Clear file system cache
      await this.clearFileSystemCache();

      // Update last cleared timestamp
      await AsyncStorage.setItem('last_cache_clear', new Date().toISOString());

    } catch (error) {
      console.error('Error clearing all cache:', error);
      throw error;
    }
  }

  /**
   * Clear file system cache
   */
  private async clearFileSystemCache(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
        if (cacheInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(cacheDir);
          for (const file of files) {
            try {
              await FileSystem.deleteAsync(`${cacheDir}${file}`);
            } catch (fileError) {
              console.warn(`Could not delete file ${file}:`, fileError);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error clearing file system cache:', error);
    }
  }

  /**
   * Clear specific cache types
   */
  async clearUserData(): Promise<void> {
    await this.clearCacheByCategory(['user', 'profile', 'auth']);
  }

  async clearGameData(): Promise<void> {
    await this.clearCacheByCategory(['game', 'training', 'session', 'stats']);
  }

  async clearImages(): Promise<void> {
    await this.clearCacheByCategory(['image', 'photo', 'avatar']);
  }

  async clearTempFiles(): Promise<void> {
    await this.clearCacheByCategory(['temp', 'cache']);
  }

  async clearLogs(): Promise<void> {
    await this.clearCacheByCategory(['log', 'debug', 'error']);
  }

  /**
   * Show cache clear confirmation dialog
   */
  showClearCacheDialog(
    onConfirm: () => void,
    onCancel: () => void,
    cacheType: 'all' | 'user' | 'game' | 'images' | 'temp' | 'logs' = 'all'
  ): void {
    const messages = {
      all: {
        title: 'Clear All Cache',
        message: 'This will remove all cached data including user preferences, game data, and temporary files. You may need to sign in again.',
        confirmText: 'Clear All'
      },
      user: {
        title: 'Clear User Data',
        message: 'This will remove cached user data and preferences. You may need to sign in again.',
        confirmText: 'Clear User Data'
      },
      game: {
        title: 'Clear Game Data',
        message: 'This will remove cached game data, training progress, and session information.',
        confirmText: 'Clear Game Data'
      },
      images: {
        title: 'Clear Images',
        message: 'This will remove all cached images and photos.',
        confirmText: 'Clear Images'
      },
      temp: {
        title: 'Clear Temp Files',
        message: 'This will remove temporary files and cache data.',
        confirmText: 'Clear Temp Files'
      },
      logs: {
        title: 'Clear Logs',
        message: 'This will remove all log files and debug information.',
        confirmText: 'Clear Logs'
      }
    };

    const config = messages[cacheType];

    Alert.alert(
      config.title,
      config.message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: config.confirmText,
          style: 'destructive',
          onPress: onConfirm
        }
      ]
    );
  }

  /**
   * Show cache clear success message
   */
  showClearSuccessMessage(cacheType: string, clearedSize: string): void {
    Alert.alert(
      'Cache Cleared Successfully',
      `${cacheType} cache has been cleared. Freed up ${clearedSize} of space.`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Show cache clear error message
   */
  showClearErrorMessage(error: string): void {
    Alert.alert(
      'Error Clearing Cache',
      `Failed to clear cache: ${error}`,
      [{ text: 'OK' }]
    );
  }
}

export const cacheService = new CacheService();
