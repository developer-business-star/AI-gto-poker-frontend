import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
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
  const [colorPalette, setColorPalette] = React.useState(false);
  const [hapticFeedback, setHapticFeedback] = React.useState(true);
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isLoading, token, isLoading: authLoading } = useAuth();
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

  const menuItems = [
    {
      title: t('profile.gamePreferences'),
      items: [
        { label: t('profile.settings.defaultGameType'), value: 'Cash Game', icon: 'game-controller' },
        { label: t('profile.settings.stackSize'), value: '100bb', icon: 'layers' },
        { label: t('profile.settings.analysisSpeed'), value: 'Fast', icon: 'speedometer' },
      ]
    },
    {
      title: t('profile.trainingSettings'),
      items: [
        { label: t('profile.settings.difficultyLevel'), value: 'Advanced', icon: 'library' },
        { label: t('profile.settings.sessionLength'), value: '30 minutes', icon: 'time' },
        { label: t('profile.settings.focusAreas'), value: 'Preflop, Turn', icon: 'bulb' },
      ]
    },
    {
      title: t('profile.dataPrivacy'),
      items: [
        { label: t('profile.settings.exportHandHistory'), value: '', icon: 'share' },
        { label: t('profile.settings.clearCache'), value: '', icon: 'trash' },
        { label: t('profile.settings.privacyPolicy'), value: '', icon: 'shield-checkmark' },
      ]
    }
  ];

  return (
    <ThemedView style={styles.container}>
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
          <ThemedText style={styles.name}>{user.fullName}</ThemedText>
          <ThemedText style={styles.email}>{user.email}</ThemedText>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('profile.subscriptionInfo.title')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{comprehensiveStats?.overallAccuracy ? comprehensiveStats?.overallAccuracy : '···'}%</Text>
            <Text style={styles.quickStatLabel}>{t('dashboard.accuracy')}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{comprehensiveStats?.handsPlayed.toLocaleString() ? comprehensiveStats?.handsPlayed.toLocaleString() : '···'}</Text>
            <Text style={styles.quickStatLabel}>{t('dashboard.handsPlayed')}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{comprehensiveStats?.studyTime ? comprehensiveStats?.studyTime : '···h'}</Text>
            <Text style={styles.quickStatLabel}>{t('dashboard.studyTime')}</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBackground, { backgroundColor: '#007AFF15' }]}>
                  <Ionicons name="calendar" size={18} color="#007AFF" />
                </View>
                <Text style={styles.menuLabel}>Member Since</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBackground, { backgroundColor: '#22c55e15' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#22c55e" />
                </View>
                <Text style={styles.menuLabel}>Account Status</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: '#22c55e' }]}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBackground, { backgroundColor: '#f59e0b15' }]}>
                  <Ionicons name="trophy" size={18} color="#f59e0b" />
                </View>
                <Text style={styles.menuLabel}>Best Accuracy</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{comprehensiveStats?.bestAccuracy ? comprehensiveStats?.bestAccuracy : '···'}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.quickSettings')}</Text>
          <View style={styles.settingsGroup}>
            {/* Language Selector */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="language" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>{t('common.language')}</Text>
              </View>
              <LanguageSelector 
                buttonStyle={styles.languageSelectorButton}
                textStyle={styles.languageSelectorText}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>{t('profile.settings.notifications')}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                thumbColor="white"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="color-palette" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>{t('profile.settings.colorPalette')}</Text>
              </View>
              <Switch
                value={colorPalette}
                onValueChange={setColorPalette}
                trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                thumbColor="white"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>{t('profile.settings.hapticFeedback')}</Text>
              </View>
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuGroup}>
              {section.items.map((item, itemIndex) => {
                // Define icon colors based on the item
                const getIconColor = (label: string) => {
                  switch (label) {
                    case 'Default Game Type':
                    case 'Stack Size':
                      return '#22c55e'; // Green
                    case 'Analysis Speed':
                      return '#22c55e'; // Green
                    case 'Difficulty Level':
                      return '#22c55e'; // Green
                    case 'Session Length':
                      return '#22c55e'; // Green
                    case 'Focus Areas':
                      return '#22c55e'; // Green
                    case 'Export Hand History':
                    case 'Clear Cache':
                    case 'Privacy Policy':
                      return '#22c55e'; // Green
                    default:
                      return '#666';
                  }
                };

                const iconColor = getIconColor(item.label);

                return (
                  <TouchableOpacity key={itemIndex} style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                      <View style={[styles.iconBackground, { backgroundColor: `${iconColor}15` }]}>
                        <Ionicons name={item.icon as any} size={18} color={iconColor} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.menuRight}>
                      {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Subscription Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.subscription')}</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>{t('profile.subscriptionInfo.title')}</Text>
              <View style={styles.subscriptionBadge}>
                <Text style={styles.subscriptionBadgeText}>{t('profile.subscriptionInfo.status')}</Text>
              </View>
            </View>
            <Text style={styles.subscriptionDescription}>
              {t('profile.subscriptionInfo.description')}
            </Text>
            <Text style={styles.subscriptionRenewal}>
              {t('profile.subscriptionInfo.renewsOn')} March 15, 2024
            </Text>
            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageButtonText}>{t('profile.subscriptionInfo.manageSubscription')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.supportAbout')}</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle" size={20} color="#666" />
                <Text style={styles.menuLabel}>{t('profile.settings.helpFAQ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="mail" size={20} color="#666" />
                <Text style={styles.menuLabel}>{t('profile.settings.contactSupport')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle" size={20} color="#666" />
                <Text style={styles.menuLabel}>{t('profile.settings.about')}</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>v1.0.0</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section_sign_out}>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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