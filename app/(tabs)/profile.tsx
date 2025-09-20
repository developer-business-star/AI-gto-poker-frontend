import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/contexts/HapticContext';
import { useGame } from '@/contexts/GameContext';
import GameTypeModal from '@/components/GameTypeModal';
import StackSizeModal from '@/components/StackSizeModal';
import AnalysisSpeedModal from '@/components/AnalysisSpeedModal';
import DifficultyLevelModal from '@/components/DifficultyLevelModal';
import SessionLengthModal from '@/components/SessionLengthModal';
import FocusAreasModal from '@/components/FocusAreasModal';
import ClearCacheModal from '@/components/ClearCacheModal';
import { useUserStats } from '@/hooks/useUserStats';
import { API_CONFIG } from '@/config/api';
import React, { useState, useEffect } from 'react';

interface ComprehensiveStats {
  overallAccuracy: number;
  accuracyChange: number;
  handsPlayed: number;
  handsThisWeek: number;
  studyTime: string;
  studyTimeThisWeek: string;
  winRate: string;
  winRateFormat: string;
  bestAccuracy?: number;
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
}


export default function ProfileScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [gameTypeModalVisible, setGameTypeModalVisible] = React.useState(false);
  const [stackSizeModalVisible, setStackSizeModalVisible] = React.useState(false);
  const [analysisSpeedModalVisible, setAnalysisSpeedModalVisible] = React.useState(false);
  const [difficultyLevelModalVisible, setDifficultyLevelModalVisible] = React.useState(false);
  const [sessionLengthModalVisible, setSessionLengthModalVisible] = React.useState(false);
  const [focusAreasModalVisible, setFocusAreasModalVisible] = React.useState(false);
  const [clearCacheModalVisible, setClearCacheModalVisible] = React.useState(false);
  const router = useRouter();
  const { hapticEnabled, toggleHaptic, triggerHaptic } = useHaptic();
  const { selectedFormat, setSelectedFormat, formatDisplayName, selectedStackSize, setSelectedStackSize, stackSizeDisplayName, selectedAnalysisSpeed, setSelectedAnalysisSpeed, analysisSpeedDisplayName, selectedDifficultyLevel, setSelectedDifficultyLevel, difficultyLevelDisplayName, selectedSessionLength, setSelectedSessionLength, sessionLengthDisplayName, sessionDurationMinutes, selectedFocusAreas, setSelectedFocusAreas, focusAreasDisplayName } = useGame();
  const { t } = useTranslation();
  const { user, logout, isLoading, token, isLoading: authLoading } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { stats } = useUserStats();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);

  const fetchComprehensiveStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching comprehensive user statistics...');
      
      // Import the API service dynamically
      const { default: ApiService } = await import('@/services/apiService');
      const response = await ApiService.getComprehensiveStats(user.id);

      if (response.success && response.stats) {
        setComprehensiveStats(response.stats);
        console.log('✅ Comprehensive stats loaded:', response.stats);
      } else {
        throw new Error(response.error || 'Failed to fetch comprehensive stats');
      }

    } catch (err) {
      console.error('❌ Error fetching comprehensive stats:', err);
      
      let errorMessage = 'Failed to load comprehensive statistics';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check if the backend server is running.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && token) {
      fetchComprehensiveStats();
    } else if (!authLoading && (!user || !token)) {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [authLoading, user, token]);


  // Redirect to auth if no user
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/welcome');
    }
  }, [user, isLoading, router]);

  // Show loading or redirect if no user
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ThemedView>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const handleSignOut = async () => {
    try {
      await logout();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const handleGameTypeSelect = (gameType: 'cash' | 'tournaments') => {
    setSelectedFormat(gameType);
    triggerHaptic('success');
  };

  const handleGameTypePress = () => {
    triggerHaptic('light');
    setGameTypeModalVisible(true);
  };

  const handleStackSizeSelect = (stackSize: string) => {
    setSelectedStackSize(stackSize as any);
    triggerHaptic('success');
  };

  const handleStackSizePress = () => {
    triggerHaptic('light');
    setStackSizeModalVisible(true);
  };

  const handleAnalysisSpeedSelect = (analysisSpeed: string) => {
    setSelectedAnalysisSpeed(analysisSpeed as any);
    triggerHaptic('success');
  };

  const handleAnalysisSpeedPress = () => {
    triggerHaptic('light');
    setAnalysisSpeedModalVisible(true);
  };

  const handleDifficultyLevelSelect = (difficultyLevel: string) => {
    setSelectedDifficultyLevel(difficultyLevel as any);
    triggerHaptic('success');
  };

  const handleDifficultyLevelPress = () => {
    triggerHaptic('light');
    setDifficultyLevelModalVisible(true);
  };

  const handleSessionLengthSelect = (sessionLength: string) => {
    setSelectedSessionLength(sessionLength as any);
    triggerHaptic('success');
  };

  const handleSessionLengthPress = () => {
    triggerHaptic('light');
    setSessionLengthModalVisible(true);
  };

  const handleFocusAreasSelect = (focusAreas: string[]) => {
    setSelectedFocusAreas(focusAreas as any);
    triggerHaptic('success');
  };

  const handleFocusAreasPress = () => {
    triggerHaptic('light');
    setFocusAreasModalVisible(true);
  };

  const handleClearCachePress = () => {
    triggerHaptic('light');
    setClearCacheModalVisible(true);
  };

  const menuItems = [
    {
      title: t('profile.gamePreferences'),
      items: [
        { 
          label: t('profile.settings.defaultGameType'), 
          value: formatDisplayName, 
          icon: 'game-controller',
          onPress: handleGameTypePress
        },
        { 
          label: t('profile.settings.stackSize'), 
          value: stackSizeDisplayName, 
          icon: 'layers',
          onPress: handleStackSizePress
        },
        { 
          label: t('profile.settings.analysisSpeed'), 
          value: analysisSpeedDisplayName, 
          icon: 'speedometer',
          onPress: handleAnalysisSpeedPress
        },
      ]
    },
    {
      title: t('profile.trainingSettings'),
      items: [
        { 
          label: t('profile.settings.difficultyLevel'), 
          value: difficultyLevelDisplayName, 
          icon: 'library', 
          onPress: handleDifficultyLevelPress 
        },
        { 
          label: t('profile.settings.sessionLength'), 
          value: sessionLengthDisplayName, 
          icon: 'time', 
          onPress: handleSessionLengthPress 
        },
        { 
          label: t('profile.settings.focusAreas'), 
          value: focusAreasDisplayName, 
          icon: 'bulb', 
          onPress: handleFocusAreasPress 
        },
      ]
    },
    {
      title: t('profile.dataPrivacy'),
      items: [
        { label: t('profile.settings.exportHandHistory'), value: '', icon: 'share', onPress: undefined },
        { label: t('profile.settings.clearCache'), value: '', icon: 'trash', onPress: handleClearCachePress },
        { label: t('profile.settings.privacyPolicy'), value: '', icon: 'shield-checkmark', onPress: undefined },
      ]
    }
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: user.avatar.color }]}>
            <Ionicons 
              name={user.avatar.icon as any} 
              size={40} 
              color="white" 
            />
          </View>
          <ThemedText style={[styles.name, { color: colors.text }]}>{user.fullName}</ThemedText>
          <ThemedText style={[styles.email, { color: colors.textSecondary }]}>{user.email}</ThemedText>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{t('profile.subscriptionInfo.title')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.quickStats, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {comprehensiveStats?.overallAccuracy ? comprehensiveStats?.overallAccuracy : '···'}%
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {t('dashboard.accuracy')}
            </Text>
          </View>
          <View style={[styles.quickStatDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {comprehensiveStats?.handsPlayed.toLocaleString() ? comprehensiveStats?.handsPlayed.toLocaleString() : '···'}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {t('dashboard.handsPlayed')}
            </Text>
          </View>
          <View style={[styles.quickStatDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {comprehensiveStats?.studyTime ? comprehensiveStats?.studyTime : '···h'}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {t('dashboard.studyTime')}
            </Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBackground, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Member Since</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBackground, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Account Status</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: colors.success }]}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBackground, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="trophy" size={18} color={colors.warning} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Best Accuracy</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{comprehensiveStats?.bestAccuracy ? comprehensiveStats?.bestAccuracy : '···'}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.quickSettings')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Language Selector */}
            <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="language" size={20} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('common.language')}</Text>
              </View>
              <LanguageSelector 
                buttonStyle={styles.languageSelectorButton}
                textStyle={styles.languageSelectorText}
              />
            </View>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.settings.notifications')}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.toggleInactive, true: colors.toggleActive }}
                thumbColor={colors.toggleThumb}
              />
            </View>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="color-palette" size={20} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('profile.settings.colorPalette')}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.toggleInactive, true: colors.toggleActive }}
                thumbColor={colors.toggleThumb}
              />
            </View>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait" size={20} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.settings.hapticFeedback')}</Text>
              </View>
              <Switch
                value={hapticEnabled}
                onValueChange={() => {
                  toggleHaptic();
                  triggerHaptic('light');
                }}
                trackColor={{ false: colors.toggleInactive, true: colors.toggleActive }}
                thumbColor={colors.toggleThumb}
              />
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, itemIndex) => {
                // Define icon colors based on the item
                const getIconColor = (label: string) => {
                  switch (label) {
                    case 'Default Game Type':
                    case 'Stack Size':
                      return colors.success; // Green
                    case 'Analysis Speed':
                      return colors.success; // Green
                    case 'Difficulty Level':
                      return colors.success; // Green
                    case 'Session Length':
                      return colors.success; // Green
                    case 'Focus Areas':
                      return colors.success; // Green
                    case 'Export Hand History':
                    case 'Clear Cache':
                    case 'Privacy Policy':
                      return colors.success; // Green
                    default:
                      return colors.textSecondary;
                  }
                };

                const iconColor = getIconColor(item.label);

                return (
                  <TouchableOpacity 
                    key={itemIndex} 
                    style={[
                      styles.menuItem, 
                      { borderBottomColor: colors.divider },
                      itemIndex === section.items.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={item.onPress || (() => {})}
                    disabled={!item.onPress}
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.iconBackground, { backgroundColor: iconColor + '15' }]}>
                        <Ionicons name={item.icon as any} size={18} color={iconColor} />
                      </View>
                      <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                    </View>
                    <View style={styles.menuRight}>
                      {item.value && <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{item.value}</Text>}
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Subscription Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.subscription')}</Text>
          <View style={[styles.subscriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subscriptionHeader}>
              <Text style={[styles.subscriptionTitle, { color: colors.text }]}>{t('profile.subscriptionInfo.title')}</Text>
              <View style={[styles.subscriptionBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.subscriptionBadgeText}>{t('profile.subscriptionInfo.status')}</Text>
              </View>
            </View>
            <Text style={[styles.subscriptionDescription, { color: colors.textSecondary }]}>
              {t('profile.subscriptionInfo.description')}
            </Text>
            <Text style={[styles.subscriptionRenewal, { color: colors.textTertiary }]}>
              {t('profile.subscriptionInfo.renewsOn')} March 15, 2024
            </Text>
            <TouchableOpacity style={[styles.manageButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.manageButtonText, { color: 'white' }]}>{t('profile.subscriptionInfo.manageSubscription')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.supportAbout')}</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.settings.helpFAQ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
              <View style={styles.menuLeft}>
                <Ionicons name="mail" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.settings.contactSupport')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.settings.about')}</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: colors.textSecondary }]}>v1.0.0</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section_sign_out}>
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: colors.error }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.signOutText, { color: 'white' }]}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Game Type Selection Modal */}
      <GameTypeModal
        visible={gameTypeModalVisible}
        onClose={() => setGameTypeModalVisible(false)}
        currentGameType={selectedFormat}
        onGameTypeSelect={handleGameTypeSelect}
      />

      {/* Stack Size Selection Modal */}
      <StackSizeModal
        visible={stackSizeModalVisible}
        onClose={() => setStackSizeModalVisible(false)}
        currentStackSize={selectedStackSize}
        onStackSizeSelect={handleStackSizeSelect}
      />

      {/* Analysis Speed Selection Modal */}
      <AnalysisSpeedModal
        visible={analysisSpeedModalVisible}
        onClose={() => setAnalysisSpeedModalVisible(false)}
        currentAnalysisSpeed={selectedAnalysisSpeed}
        onAnalysisSpeedSelect={handleAnalysisSpeedSelect}
      />

      {/* Difficulty Level Selection Modal */}
      <DifficultyLevelModal
        visible={difficultyLevelModalVisible}
        onClose={() => setDifficultyLevelModalVisible(false)}
        currentDifficultyLevel={selectedDifficultyLevel}
        onDifficultyLevelSelect={handleDifficultyLevelSelect}
      />

      {/* Session Length Selection Modal */}
      <SessionLengthModal
        visible={sessionLengthModalVisible}
        onClose={() => setSessionLengthModalVisible(false)}
        currentSessionLength={selectedSessionLength}
        onSessionLengthSelect={handleSessionLengthSelect}
      />

      {/* Focus Areas Selection Modal */}
      <FocusAreasModal
        visible={focusAreasModalVisible}
        onClose={() => setFocusAreasModalVisible(false)}
        currentFocusAreas={selectedFocusAreas}
        onFocusAreasSelect={handleFocusAreasSelect}
      />

      {/* Clear Cache Modal */}
      <ClearCacheModal
        visible={clearCacheModalVisible}
        onClose={() => setClearCacheModalVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  section_sign_out: {
    paddingHorizontal: 20,
    marginBottom: 80
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingsGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  languageSelectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  languageSelectorText: {
    fontSize: 14,
    color: '#007AFF',
  },
  menuGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subscriptionBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subscriptionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  subscriptionRenewal: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
}); 