import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/contexts/HapticContext';
import { cacheService, CacheInfo } from '@/services/cacheService';

const { width } = Dimensions.get('window');

interface ClearCacheModalProps {
  visible: boolean;
  onClose: () => void;
}

const ClearCacheModal: React.FC<ClearCacheModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCacheInfo();
    }
  }, [visible]);

  const loadCacheInfo = async () => {
    setLoading(true);
    try {
      const info = await cacheService.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('Error loading cache info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async (type: 'all' | 'user' | 'game' | 'images' | 'temp' | 'logs') => {
    triggerHaptic('light');
    setClearing(type);

    try {
      const oldSize = cacheInfo?.totalSize || 0;
      
      switch (type) {
        case 'all':
          await cacheService.clearAllCache();
          break;
        case 'user':
          await cacheService.clearUserData();
          break;
        case 'game':
          await cacheService.clearGameData();
          break;
        case 'images':
          await cacheService.clearImages();
          break;
        case 'temp':
          await cacheService.clearTempFiles();
          break;
        case 'logs':
          await cacheService.clearLogs();
          break;
      }

      // Reload cache info
      await loadCacheInfo();
      
      const newSize = cacheInfo?.totalSize || 0;
      const freedSize = cacheService.formatBytes(oldSize - newSize);
      
      triggerHaptic('success');
      cacheService.showClearSuccessMessage(
        type === 'all' ? 'All cache' : `${type} cache`,
        freedSize
      );

    } catch (error) {
      console.error('Error clearing cache:', error);
      triggerHaptic('error');
      cacheService.showClearErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setClearing(null);
    }
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const cacheOptions = [
    {
      id: 'all' as const,
      title: 'Clear All Cache',
      subtitle: 'Remove all cached data',
      description: 'User data, game data, images, temp files, and logs',
      icon: 'trash',
      color: '#ef4444',
      size: cacheInfo?.totalSize || 0
    },
    {
      id: 'user' as const,
      title: 'User Data',
      subtitle: 'User preferences and auth',
      description: 'Profile data, settings, and authentication',
      icon: 'person',
      color: '#3b82f6',
      size: cacheInfo?.breakdown.userData || 0
    },
    {
      id: 'game' as const,
      title: 'Game Data',
      subtitle: 'Training and session data',
      description: 'Training progress, session stats, and game preferences',
      icon: 'game-controller',
      color: '#10b981',
      size: cacheInfo?.breakdown.gameData || 0
    },
    {
      id: 'images' as const,
      title: 'Images',
      subtitle: 'Cached images and photos',
      description: 'Profile pictures, hand images, and other media',
      icon: 'image',
      color: '#f59e0b',
      size: cacheInfo?.breakdown.images || 0
    },
    {
      id: 'temp' as const,
      title: 'Temp Files',
      subtitle: 'Temporary cache files',
      description: 'Temporary files and system cache',
      icon: 'folder',
      color: '#8b5cf6',
      size: cacheInfo?.breakdown.tempFiles || 0
    },
    {
      id: 'logs' as const,
      title: 'Logs',
      subtitle: 'Debug and error logs',
      description: 'Application logs and debug information',
      icon: 'document-text',
      color: '#6b7280',
      size: cacheInfo?.breakdown.logs || 0
    }
  ];

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Clear Cache</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cache Info */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading cache information...
              </Text>
            </View>
          ) : (
            <View style={styles.cacheInfoContainer}>
              <View style={[styles.cacheInfoCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                <View style={styles.cacheInfoRow}>
                  <Ionicons name="storage" size={20} color={colors.primary} />
                  <Text style={[styles.cacheInfoLabel, { color: colors.text }]}>Total Cache Size</Text>
                  <Text style={[styles.cacheInfoValue, { color: colors.text }]}>
                    {cacheService.formatBytes(cacheInfo?.totalSize || 0)}
                  </Text>
                </View>
                <View style={styles.cacheInfoRow}>
                  <Ionicons name="list" size={20} color={colors.primary} />
                  <Text style={[styles.cacheInfoLabel, { color: colors.text }]}>Items</Text>
                  <Text style={[styles.cacheInfoValue, { color: colors.text }]}>
                    {cacheInfo?.itemCount || 0}
                  </Text>
                </View>
                {cacheInfo?.lastCleared && (
                  <View style={styles.cacheInfoRow}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <Text style={[styles.cacheInfoLabel, { color: colors.text }]}>Last Cleared</Text>
                    <Text style={[styles.cacheInfoValue, { color: colors.textSecondary }]}>
                      {new Date(cacheInfo.lastCleared).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Cache Options */}
          <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsContainer}>
              {cacheOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.cacheOption,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.divider,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => handleClearCache(option.id)}
                  disabled={clearing !== null}
                  activeOpacity={0.7}
                >
                  <View style={styles.cacheOptionLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: option.color + '15' }]}>
                      <Ionicons name={option.icon as any} size={24} color={option.color} />
                    </View>
                    <View style={styles.cacheOptionInfo}>
                      <Text style={[styles.cacheOptionTitle, { color: colors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.cacheOptionSubtitle, { color: colors.textSecondary }]}>
                        {option.subtitle}
                      </Text>
                      <Text style={[styles.cacheOptionDescription, { color: colors.textTertiary }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cacheOptionRight}>
                    {clearing === option.id ? (
                      <ActivityIndicator size="small" color={option.color} />
                    ) : (
                      <>
                        <Text style={[styles.cacheSize, { color: colors.textSecondary }]}>
                          {cacheService.formatBytes(option.size)}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Cancel Button */}
          <View style={styles.cancelContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  cacheInfoContainer: {
    padding: 20,
  },
  cacheInfoCard: {
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  cacheInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cacheInfoLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  cacheInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsScrollView: {
    maxHeight: Dimensions.get('window').height * 0.4,
  },
  optionsContainer: {
    padding: 20,
    gap: 15,
  },
  cacheOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  cacheOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cacheOptionInfo: {
    flex: 1,
  },
  cacheOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cacheOptionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cacheOptionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  cacheOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cacheSize: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClearCacheModal;
