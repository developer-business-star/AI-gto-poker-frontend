import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, Modal, ActivityIndicator, Alert, Platform, Clipboard, TextInput, Linking } from 'react-native';
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import supportService from '@/services/supportService';
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
  const [privacyPolicyModalVisible, setPrivacyPolicyModalVisible] = React.useState(false);
  const [exportingData, setExportingData] = React.useState(false);
  const [helpFAQModalVisible, setHelpFAQModalVisible] = React.useState(false);
  const [contactSupportModalVisible, setContactSupportModalVisible] = React.useState(false);
  const [aboutModalVisible, setAboutModalVisible] = React.useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = React.useState('');
  const [supportTicketModalVisible, setSupportTicketModalVisible] = React.useState(false);
  const [supportTicketData, setSupportTicketData] = React.useState({
    type: 'general' as 'general' | 'feature_request',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    subject: '',
    description: ''
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = React.useState(false);
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

  const handleExportHandHistory = async () => {
    triggerHaptic('light');
    setExportingData(true);
    
    try {
      console.log('📤 Starting hand history export...');
      
      // Fetch analysis history from backend
      let analysisHistory = [];
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/analysis/history?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          analysisHistory = data.analyses || [];
        }
      } catch (error) {
        console.log('Could not fetch analysis history:', error);
      }

      // Create comprehensive export data
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          exportDate: new Date().toISOString(),
        },
        handHistory: analysisHistory,
        sessionData: {
          recentSessionCash: (user as any)?.recentSessionCash,
          recentSessionSpinAndGo: (user as any)?.recentSessionSpinAndGo,
        },
        gamePreferences: {
          defaultGameType: selectedFormat,
          stackSize: selectedStackSize,
          analysisSpeed: selectedAnalysisSpeed,
          difficultyLevel: selectedDifficultyLevel,
          sessionLength: selectedSessionLength,
          focusAreas: selectedFocusAreas,
        },
        performanceStats: comprehensiveStats,
        metadata: {
          appVersion: '1.0.0',
          platform: Platform.OS,
          exportTimestamp: Date.now(),
        }
      };

      // Format data for export
      const formatDataForExport = () => {
        let content = '';
        content += '='.repeat(60) + '\n';
        content += 'GTO POKER ASSISTANT - HAND HISTORY & DATA EXPORT\n';
        content += '='.repeat(60) + '\n\n';
        
        content += `Export Date: ${new Date().toLocaleString()}\n`;
        content += `User: ${user?.email || 'Unknown'}\n`;
        content += `Platform: ${Platform.OS}\n\n`;
        
        // Game Preferences
        content += '📋 GAME PREFERENCES\n';
        content += '-'.repeat(30) + '\n';
        content += `Default Game Type: ${formatDisplayName}\n`;
        content += `Stack Size: ${stackSizeDisplayName}\n`;
        content += `Analysis Speed: ${analysisSpeedDisplayName}\n`;
        content += `Difficulty Level: ${difficultyLevelDisplayName}\n`;
        content += `Session Length: ${sessionLengthDisplayName}\n`;
        content += `Focus Areas: ${focusAreasDisplayName}\n\n`;
        
        // Performance Stats
        if (comprehensiveStats) {
          content += '📊 PERFORMANCE STATISTICS\n';
          content += '-'.repeat(30) + '\n';
          content += `Overall Accuracy: ${comprehensiveStats.overallAccuracy?.toFixed(1)}%\n`;
          content += `Accuracy Change: ${comprehensiveStats.accuracyChange > 0 ? '+' : ''}${comprehensiveStats.accuracyChange?.toFixed(1)}%\n`;
          content += `Hands Played: ${comprehensiveStats.handsPlayed || 0}\n`;
          content += `Sessions Played: ${(comprehensiveStats as any).sessionsPlayed || 0}\n\n`;
          
          // Recent Sessions
          if (comprehensiveStats.recentSessions && comprehensiveStats.recentSessions.length > 0) {
            content += '📈 RECENT SESSIONS\n';
            content += '-'.repeat(30) + '\n';
            comprehensiveStats.recentSessions.forEach((session, index) => {
              content += `Session ${index + 1}:\n`;
              content += `  Date: ${new Date(session.date).toLocaleDateString()}\n`;
              content += `  Pot: ${(session as any).gamePot || 'N/A'}\n`;
              content += `  Action: ${session.recommendedAction || 'N/A'}\n`;
              content += `  Result: ${session.result || 'N/A'}\n\n`;
            });
          }
        }
        
        // Hand History
        if (analysisHistory.length > 0) {
          content += '🃏 ANALYSIS HISTORY\n';
          content += '-'.repeat(30) + '\n';
          content += `Total Analyses: ${analysisHistory.length}\n\n`;
          
          analysisHistory.forEach((analysis: any, index: number) => {
            content += `Analysis ${index + 1}:\n`;
            content += `  Date: ${new Date(analysis.createdAt).toLocaleString()}\n`;
            content += `  Game Format: ${analysis.gameFormat || 'Unknown'}\n`;
            content += `  Pot: ${analysis.pot || 'N/A'}\n`;
            content += `  Recommended Action: ${analysis.recommendedAction || 'N/A'}\n`;
            content += `  Confidence: ${analysis.confidence || 'N/A'}\n`;
            if (analysis.analysisNotes) {
              content += `  Notes: ${analysis.analysisNotes}\n`;
            }
            content += '\n';
          });
        } else {
          content += '🃏 ANALYSIS HISTORY\n';
          content += '-'.repeat(30) + '\n';
          content += 'No analysis history found.\n\n';
        }
        
        content += '='.repeat(60) + '\n';
        content += 'End of Export\n';
        content += '='.repeat(60) + '\n';
        
        return content;
      };

      const documentContent = formatDataForExport();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `GTO_Hand_History_${timestamp}.txt`;
      
      // Try to share using file system
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          try {
            const tempDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
            if (tempDir) {
              const fileUri = tempDir + filename;
              
              await FileSystem.writeAsStringAsync(fileUri, documentContent);
              
              await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: 'Export Hand History',
              });
              
              Alert.alert(
                'Export Successful',
                'Your hand history and game data has been exported and is ready to share!',
                [{ text: 'OK' }]
              );
            } else {
              throw new Error('No file system directory available');
            }
          } catch (fileError) {
            // Fallback to data URI
            const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(documentContent)}`;
            await Sharing.shareAsync(dataUri, {
              mimeType: 'text/plain',
              dialogTitle: 'Export Hand History',
            });
            
            Alert.alert(
              'Export Successful',
              'Your hand history data has been shared!',
              [{ text: 'OK' }]
            );
          }
        } else {
          throw new Error('Sharing not available');
        }
      } catch (error) {
        console.log('Sharing not available, using clipboard fallback');
        
        // Fallback to clipboard
        await (Clipboard as any).setStringAsync(documentContent);
        Alert.alert(
          'Export Complete',
          'Your hand history data has been copied to the clipboard. You can paste it into any text app to save or share.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'There was an error exporting your data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setExportingData(false);
    }
  };

  const handlePrivacyPolicyPress = () => {
    triggerHaptic('light');
    setPrivacyPolicyModalVisible(true);
  };

  const handleHelpFAQPress = () => {
    triggerHaptic('light');
    setHelpFAQModalVisible(true);
  };

  const handleContactSupportPress = () => {
    triggerHaptic('light');
    setContactSupportModalVisible(true);
  };

  const handleAboutPress = () => {
    triggerHaptic('light');
    setAboutModalVisible(true);
  };

  const handleCreateSupportTicket = () => {
    triggerHaptic('light');
    setSupportTicketModalVisible(true);
  };

  const handleSubmitSupportTicket = async () => {
    if (!supportTicketData.subject.trim() || !supportTicketData.description.trim()) {
      Alert.alert('Error', 'Please fill in both subject and description.');
      return;
    }

    setIsSubmittingTicket(true);
    
    try {
      const result = await supportService.createTicket({
        type: supportTicketData.type,
        priority: supportTicketData.priority,
        subject: supportTicketData.subject.trim(),
        description: supportTicketData.description.trim(),
        userEmail: user?.email || '',
        userFullName: user?.fullName || '',
        userId: user?.id ?? undefined
      }, token || undefined);

      if (result.success && result.ticket) {
        Alert.alert(
          '✅ Ticket Created',
          `Your support ticket has been created successfully!\n\nWe'll respond to your request as soon as possible.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSupportTicketModalVisible(false);
                setSupportTicketData({
                  type: 'general',
                  priority: 'medium',
                  subject: '',
                  description: ''
                });
              }
            }
          ]
        );
      } else {
        console.error('Support ticket creation failed:', result);
        Alert.alert(
          'Error Creating Ticket', 
          result.error || 'Failed to create support ticket. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Support ticket submission error:', error);
      Alert.alert('Error', 'Failed to create support ticket. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // FAQ Data
  const faqData = [
    {
      category: "Getting Started",
      icon: "rocket",
      questions: [
        {
          question: "How do I analyze my first poker hand?",
          answer: "Tap the 'Solver' tab at the bottom, then use the camera to capture your poker table or upload an image from your gallery. Our AI will analyze the hand and provide GTO recommendations."
        },
        {
          question: "What game formats are supported?",
          answer: "We support Cash Games and Tournament formats including Spin & Go. You can select your preferred format in the game preferences section."
        },
        {
          question: "How accurate are the recommendations?",
          answer: "Our GTO solver uses advanced algorithms trained on millions of poker scenarios. Accuracy typically ranges from 85-95% depending on image quality and game complexity."
        }
      ]
    },
    {
      category: "Using the Solver",
      icon: "analytics",
      questions: [
        {
          question: "Why is my image analysis taking too long?",
          answer: "Analysis speed depends on your selected setting and image complexity. You can adjust analysis speed in Settings > Analysis Speed. 'Fast' mode takes 2-3 seconds, while 'Detailed' mode takes 5-8 seconds for higher accuracy."
        },
        {
          question: "What if the solver can't read my cards?",
          answer: "Ensure good lighting and clear card visibility. The cards should be fully visible without glare or shadows. You can retake the photo or adjust the image before analysis."
        },
        {
          question: "Can I analyze hands from different poker sites?",
          answer: "Yes! Our solver works with screenshots from any poker site or live poker photos. The AI adapts to different table layouts and card designs."
        }
      ]
    },
    {
      category: "Training & Stats",
      icon: "school",
      questions: [
        {
          question: "How does the training mode work?",
          answer: "Training mode presents you with poker scenarios and asks for your decision. Compare your choice with GTO recommendations to improve your skills. You can set difficulty levels and focus areas in settings."
        },
        {
          question: "What do the accuracy statistics mean?",
          answer: "Your accuracy shows how often your decisions align with GTO recommendations. Track your progress over time and identify areas for improvement in the Stats tab."
        },
        {
          question: "How can I improve my accuracy?",
          answer: "Focus on specific areas using the Focus Areas setting, practice regularly with training mode, and review your analysis history to learn from mistakes."
        }
      ]
    },
    {
      category: "Account & Settings",
      icon: "settings",
      questions: [
        {
          question: "How do I change my game preferences?",
          answer: "Go to Profile > Game Preferences. You can adjust default game type, stack size, analysis speed, and other settings to match your playing style."
        },
        {
          question: "Can I export my data?",
          answer: "Yes! Use Profile > Data & Privacy > Export Hand History to download all your analysis data, session results, and statistics."
        },
        {
          question: "How do I delete my account?",
          answer: "Contact our support team through the Contact Support option. We'll help you delete your account and all associated data per our privacy policy."
        }
      ]
    },
    {
      category: "Troubleshooting",
      icon: "construct",
      questions: [
        {
          question: "The app is running slowly, what can I do?",
          answer: "Try clearing the app cache in Profile > Data & Privacy > Clear Cache. Also ensure you have a stable internet connection for analysis requests."
        },
        {
          question: "I'm getting analysis errors, how to fix?",
          answer: "Check your internet connection, ensure the image is clear and well-lit, and try again. If problems persist, contact support with the error details."
        },
        {
          question: "How do I report a bug?",
          answer: "Use the Contact Support feature to report bugs. Include details about what happened, when it occurred, and your device information."
        }
      ]
    }
  ];

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(faqSearchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

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
        { label: t('profile.settings.exportHandHistory'), value: exportingData ? 'Exporting...' : '', icon: 'share', onPress: handleExportHandHistory },
        { label: t('profile.settings.clearCache'), value: '', icon: 'trash', onPress: handleClearCachePress },
        { label: t('profile.settings.privacyPolicy'), value: '', icon: 'shield-checkmark', onPress: handlePrivacyPolicyPress },
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
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={handleHelpFAQPress}>
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.settings.helpFAQ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={handleContactSupportPress}>
              <View style={styles.menuLeft}>
                <Ionicons name="mail" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.settings.contactSupport')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
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

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyPolicyModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPrivacyPolicyModalVisible(false)}
      >
        <View style={[styles.privacyModalFullScreen, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
          {/* Header */}
          <View style={[styles.privacyModalHeader, { 
            backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa',
            borderBottomColor: isDark ? '#38383a' : '#e1e5e9' 
          }]}>
            <Text style={[styles.privacyModalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Privacy Policy
            </Text>
            <TouchableOpacity
              style={[styles.privacyModalCloseButton, { backgroundColor: isDark ? '#2c2c2e' : '#e9ecef' }]}
              onPress={() => setPrivacyPolicyModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.privacyModalScrollContainer}
            contentContainerStyle={styles.privacyModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Data Collection Section */}
            <View style={styles.privacySection}>
              <Text style={[styles.privacySectionTitle, { color: '#007AFF' }]}>
                📊 Data Collection
              </Text>
              <Text style={[styles.privacyText, { color: isDark ? '#ffffff' : '#000000' }]}>
                We collect and process the following types of data to provide you with the best GTO poker analysis experience:
              </Text>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  <Text style={styles.privacyBold}>Poker Hand Analysis Data:</Text> Images you upload for analysis, game states, pot sizes, and recommended actions
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  <Text style={styles.privacyBold}>Performance Statistics:</Text> Your accuracy rates, session results, and training progress
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  <Text style={styles.privacyBold}>Game Preferences:</Text> Your selected game types, stack sizes, and training settings
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  <Text style={styles.privacyBold}>Account Information:</Text> Email address and authentication data
                </Text>
              </View>
            </View>

            {/* Data Usage Section */}
            <View style={styles.privacySection}>
              <Text style={[styles.privacySectionTitle, { color: '#007AFF' }]}>
                🎯 Data Usage
              </Text>
              <Text style={[styles.privacyText, { color: isDark ? '#ffffff' : '#000000' }]}>
                Your data is used exclusively to:
              </Text>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Provide accurate GTO poker analysis and recommendations
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Track your performance and improvement over time
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Personalize your training experience
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Improve our analysis algorithms and app functionality
                </Text>
              </View>
            </View>

            {/* Security Section */}
            <View style={styles.privacySection}>
              <Text style={[styles.privacySectionTitle, { color: '#007AFF' }]}>
                🔒 Data Storage & Security
              </Text>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  All data is encrypted and stored securely on our servers
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Hand analysis images are processed and then deleted within 24 hours
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Performance data is retained to track your progress
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  We use industry-standard security measures to protect your information
                </Text>
              </View>
            </View>

            {/* Your Rights Section */}
            <View style={styles.privacySection}>
              <Text style={[styles.privacySectionTitle, { color: '#007AFF' }]}>
                ⚖️ Your Rights
              </Text>
              <Text style={[styles.privacyText, { color: isDark ? '#ffffff' : '#000000' }]}>
                You have the right to:
              </Text>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Export all your data using the "Export Hand History" feature
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Request deletion of your account and all associated data
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Access and review all data we have about you
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Opt out of data collection (though this may limit app functionality)
                </Text>
              </View>
            </View>

            {/* Third Party Section */}
            <View style={styles.privacySection}>
              <Text style={[styles.privacySectionTitle, { color: '#007AFF' }]}>
                🔗 Third-Party Services
              </Text>
              <Text style={[styles.privacyText, { color: isDark ? '#ffffff' : '#000000' }]}>
                We use the following third-party services:
              </Text>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Authentication services for secure login
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Cloud storage for data backup and synchronization
                </Text>
              </View>
              
              <View style={styles.privacyBulletContainer}>
                <Text style={[styles.privacyBullet, { color: isDark ? '#ffffff' : '#000000' }]}>•</Text>
                <Text style={[styles.privacyBulletText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Analytics services to improve app performance (anonymized data only)
                </Text>
              </View>
            </View>

            {/* Contact Section */}
            <View style={styles.privacySection}>
              <Text style={[styles.privacySectionTitle, { color: '#007AFF' }]}>
                📧 Contact Us
              </Text>
              <Text style={[styles.privacyText, { color: isDark ? '#ffffff' : '#000000' }]}>
                For any privacy-related questions or requests, please contact us through the app's support feature or email us directly.
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.privacyFooter}>
              <Text style={[styles.privacyFooterText, { color: isDark ? '#8e8e93' : '#666666' }]}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>
              <Text style={[styles.privacyFooterText, { color: isDark ? '#8e8e93' : '#666666' }]}>
                GTO Poker Assistant v1.0.0
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Help & FAQ Modal */}
      <Modal
        visible={helpFAQModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setHelpFAQModalVisible(false)}
      >
        <View style={[styles.helpFAQModalFullScreen, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
          {/* Header */}
          <View style={[styles.helpFAQModalHeader, { 
            backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa',
            borderBottomColor: isDark ? '#38383a' : '#e1e5e9' 
          }]}>
            <Text style={[styles.helpFAQModalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Help & FAQ
            </Text>
            <TouchableOpacity
              style={[styles.helpFAQModalCloseButton, { backgroundColor: isDark ? '#2c2c2e' : '#e9ecef' }]}
              onPress={() => setHelpFAQModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa' }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff', borderColor: isDark ? '#38383a' : '#e1e5e9' }]}>
              <Ionicons name="search" size={20} color={isDark ? '#8e8e93' : '#666666'} />
              <TextInput
                style={[styles.searchInput, { color: isDark ? '#ffffff' : '#000000' }]}
                placeholder="Search FAQ..."
                placeholderTextColor={isDark ? '#8e8e93' : '#666666'}
                value={faqSearchQuery}
                onChangeText={setFaqSearchQuery}
              />
              {faqSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setFaqSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={isDark ? '#8e8e93' : '#666666'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.helpFAQModalScrollContainer}
            contentContainerStyle={styles.helpFAQModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {filteredFAQ.length > 0 ? filteredFAQ.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.faqCategory}>
                <View style={styles.faqCategoryHeader}>
                  <Ionicons name={category.icon as any} size={24} color="#007AFF" />
                  <Text style={[styles.faqCategoryTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {category.category}
                  </Text>
                </View>
                
                {category.questions.map((faq, faqIndex) => (
                  <View key={faqIndex} style={[styles.faqItem, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa', borderColor: isDark ? '#38383a' : '#e1e5e9' }]}>
                    <Text style={[styles.faqQuestion, { color: isDark ? '#ffffff' : '#000000' }]}>
                      {faq.question}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                      {faq.answer}
                    </Text>
                  </View>
                ))}
              </View>
            )) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color={isDark ? '#8e8e93' : '#666666'} />
                <Text style={[styles.noResultsText, { color: isDark ? '#8e8e93' : '#666666' }]}>
                  No FAQ found matching "{faqSearchQuery}"
                </Text>
                <Text style={[styles.noResultsSubtext, { color: isDark ? '#8e8e93' : '#666666' }]}>
                  Try different keywords or contact support
                </Text>
              </View>
            )}
            
            {/* Contact Support Suggestion */}
            <View style={[styles.supportSuggestion, { backgroundColor: isDark ? '#1c1c1e' : '#f0f8ff', borderColor: '#007AFF' }]}>
              <Ionicons name="help-circle" size={24} color="#007AFF" />
              <View style={styles.supportSuggestionText}>
                <Text style={[styles.supportSuggestionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Still need help?
                </Text>
                <Text style={[styles.supportSuggestionSubtitle, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                  Contact our support team for personalized assistance
                </Text>
              </View>
              <TouchableOpacity
                style={styles.supportSuggestionButton}
                onPress={() => {
                  setHelpFAQModalVisible(false);
                  setTimeout(() => setContactSupportModalVisible(true), 300);
                }}
              >
                <Text style={styles.supportSuggestionButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contact Support Modal */}
      <Modal
        visible={contactSupportModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setContactSupportModalVisible(false)}
      >
        <View style={[styles.contactSupportModalFullScreen, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
          {/* Header */}
          <View style={[styles.contactSupportModalHeader, { 
            backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa',
            borderBottomColor: isDark ? '#38383a' : '#e1e5e9' 
          }]}>
            <Text style={[styles.contactSupportModalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Contact Support
            </Text>
            <TouchableOpacity
              style={[styles.contactSupportModalCloseButton, { backgroundColor: isDark ? '#2c2c2e' : '#e9ecef' }]}
              onPress={() => setContactSupportModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.contactSupportModalScrollContainer}
            contentContainerStyle={styles.contactSupportModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Create Support Ticket */}
            <TouchableOpacity 
              style={[styles.supportOption, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa', borderColor: '#007AFF' }]}
              onPress={() => {
                setContactSupportModalVisible(false);
                setTimeout(() => setSupportTicketModalVisible(true), 300);
              }}
            >
              <View style={styles.supportOptionIcon}>
                <Ionicons name="create" size={32} color="#007AFF" />
              </View>
              <View style={styles.supportOptionContent}>
                <Text style={[styles.supportOptionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Create Support Ticket
                </Text>
                <Text style={[styles.supportOptionDescription, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                  Submit a support request through our ticketing system. Get tracked responses and updates.
                </Text>
                <Text style={[styles.supportOptionDetail, { color: '#007AFF' }]}>
                  Recommended • Fast Response
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#8e8e93' : '#666666'} />
            </TouchableOpacity>


            {/* Response Time Info */}
            <View style={[styles.responseTimeInfo, { backgroundColor: isDark ? '#1c1c1e' : '#f0f8ff', borderColor: isDark ? '#38383a' : '#007AFF' }]}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <View style={styles.responseTimeContent}>
                <Text style={[styles.responseTimeTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Response Times
                </Text>
                <Text style={[styles.responseTimeText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                  • General Support: 24-48 hours{'\n'}
                  • Bug Reports: 12-24 hours{'\n'}
                  • Feature Requests: 3-5 business days
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Support Ticket Creation Modal */}
      <Modal
        visible={supportTicketModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSupportTicketModalVisible(false)}
      >
        <View style={[styles.supportTicketModalFullScreen, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
          {/* Header */}
          <View style={[styles.supportTicketModalHeader, { 
            backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa',
            borderBottomColor: isDark ? '#38383a' : '#e1e5e9' 
          }]}>
            <Text style={[styles.supportTicketModalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Create Support Ticket
            </Text>
            <TouchableOpacity
              style={[styles.supportTicketModalCloseButton, { backgroundColor: isDark ? '#2c2c2e' : '#e9ecef' }]}
              onPress={() => setSupportTicketModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.supportTicketModalScrollContainer}
            contentContainerStyle={styles.supportTicketModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Type Selection */}
            <View style={styles.supportTicketSection}>
              <Text style={[styles.supportTicketLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Request Type
              </Text>
              <View style={styles.supportTicketTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.supportTicketTypeButton,
                    { 
                      backgroundColor: supportTicketData.type === 'general' ? '#007AFF' : (isDark ? '#2c2c2e' : '#f8f9fa'),
                      borderColor: supportTicketData.type === 'general' ? '#007AFF' : (isDark ? '#38383a' : '#e1e5e9')
                    }
                  ]}
                  onPress={() => setSupportTicketData(prev => ({ ...prev, type: 'general' }))}
                >
                  <Ionicons 
                    name="help-circle" 
                    size={20} 
                    color={supportTicketData.type === 'general' ? '#ffffff' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.supportTicketTypeText,
                    { color: supportTicketData.type === 'general' ? '#ffffff' : (isDark ? '#ffffff' : '#000000') }
                  ]}>
                    General Support
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.supportTicketTypeButton,
                    { 
                      backgroundColor: supportTicketData.type === 'feature_request' ? '#007AFF' : (isDark ? '#2c2c2e' : '#f8f9fa'),
                      borderColor: supportTicketData.type === 'feature_request' ? '#007AFF' : (isDark ? '#38383a' : '#e1e5e9')
                    }
                  ]}
                  onPress={() => setSupportTicketData(prev => ({ ...prev, type: 'feature_request' }))}
                >
                  <Ionicons 
                    name="bulb" 
                    size={20} 
                    color={supportTicketData.type === 'feature_request' ? '#ffffff' : '#ffd93d'} 
                  />
                  <Text style={[
                    styles.supportTicketTypeText,
                    { color: supportTicketData.type === 'feature_request' ? '#ffffff' : (isDark ? '#ffffff' : '#000000') }
                  ]}>
                    Feature Request
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Priority Selection */}
            <View style={styles.supportTicketSection}>
              <Text style={[styles.supportTicketLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Priority
              </Text>
              <View style={styles.supportTicketPriorityContainer}>
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.supportTicketPriorityButton,
                      { 
                        backgroundColor: supportTicketData.priority === priority ? '#007AFF' : (isDark ? '#2c2c2e' : '#f8f9fa'),
                        borderColor: supportTicketData.priority === priority ? '#007AFF' : (isDark ? '#38383a' : '#e1e5e9')
                      }
                    ]}
                    onPress={() => setSupportTicketData(prev => ({ ...prev, priority: priority as any }))}
                  >
                    <Text style={[
                      styles.supportTicketPriorityText,
                      { color: supportTicketData.priority === priority ? '#ffffff' : (isDark ? '#ffffff' : '#000000') }
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject Input */}
            <View style={styles.supportTicketSection}>
              <Text style={[styles.supportTicketLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Subject *
              </Text>
              <TextInput
                style={[
                  styles.supportTicketInput,
                  { 
                    backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
                    borderColor: isDark ? '#38383a' : '#e1e5e9',
                    color: isDark ? '#ffffff' : '#000000'
                  }
                ]}
                placeholder="Brief description of your issue or request"
                placeholderTextColor={isDark ? '#8e8e93' : '#666666'}
                value={supportTicketData.subject}
                onChangeText={(text) => setSupportTicketData(prev => ({ ...prev, subject: text }))}
                maxLength={200}
              />
              <Text style={[styles.supportTicketCharCount, { color: isDark ? '#8e8e93' : '#666666' }]}>
                {supportTicketData.subject.length}/200
              </Text>
            </View>

            {/* Description Input */}
            <View style={styles.supportTicketSection}>
              <Text style={[styles.supportTicketLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Description *
              </Text>
              <TextInput
                style={[
                  styles.supportTicketTextArea,
                  { 
                    backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
                    borderColor: isDark ? '#38383a' : '#e1e5e9',
                    color: isDark ? '#ffffff' : '#000000'
                  }
                ]}
                placeholder="Please provide detailed information about your issue or feature request..."
                placeholderTextColor={isDark ? '#8e8e93' : '#666666'}
                value={supportTicketData.description}
                onChangeText={(text) => setSupportTicketData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={5000}
              />
              <Text style={[styles.supportTicketCharCount, { color: isDark ? '#8e8e93' : '#666666' }]}>
                {supportTicketData.description.length}/5000
              </Text>
            </View>

            {/* User Info Display */}
            <View style={[styles.supportTicketInfoCard, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa', borderColor: isDark ? '#38383a' : '#e1e5e9' }]}>
              <Text style={[styles.supportTicketInfoTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Contact Information
              </Text>
              <Text style={[styles.supportTicketInfoText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                Email: {user?.email || 'Not available'}
              </Text>
              <Text style={[styles.supportTicketInfoText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                Name: {user?.fullName || 'Not available'}
              </Text>
              <Text style={[styles.supportTicketInfoText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                Platform: {Platform.OS}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.supportTicketSubmitButton,
                { 
                  backgroundColor: (!supportTicketData.subject.trim() || !supportTicketData.description.trim() || isSubmittingTicket) 
                    ? (isDark ? '#2c2c2e' : '#e9ecef') 
                    : '#007AFF',
                  opacity: (!supportTicketData.subject.trim() || !supportTicketData.description.trim() || isSubmittingTicket) ? 0.6 : 1
                }
              ]}
              onPress={handleSubmitSupportTicket}
              disabled={!supportTicketData.subject.trim() || !supportTicketData.description.trim() || isSubmittingTicket}
            >
              {isSubmittingTicket ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.supportTicketSubmitButtonText}>Creating Ticket...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#ffffff" />
                  <Text style={styles.supportTicketSubmitButtonText}>Create Support Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={[styles.aboutModalFullScreen, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
          {/* Header */}
          <View style={[styles.aboutModalHeader, { 
            backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa',
            borderBottomColor: isDark ? '#38383a' : '#e1e5e9' 
          }]}>
            <Text style={[styles.aboutModalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              About
            </Text>
            <TouchableOpacity
              style={[styles.aboutModalCloseButton, { backgroundColor: isDark ? '#2c2c2e' : '#e9ecef' }]}
              onPress={() => setAboutModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.aboutModalScrollContainer}
            contentContainerStyle={styles.aboutModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* App Logo and Info */}
            <View style={styles.aboutAppInfo}>
              <View style={[styles.aboutAppIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="analytics" size={48} color="#ffffff" />
              </View>
              <Text style={[styles.aboutAppName, { color: isDark ? '#ffffff' : '#000000' }]}>
                GTO Poker Assistant
              </Text>
              <Text style={[styles.aboutAppVersion, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                Version 1.0.0 (Build 1)
              </Text>
              <Text style={[styles.aboutAppDescription, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                Advanced Game Theory Optimal poker analysis powered by AI. Improve your poker skills with real-time hand analysis and personalized training.
              </Text>
            </View>

            {/* Developer Info */}
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: '#007AFF' }]}>
                👨‍💻 Developer
              </Text>
              <Text style={[styles.aboutText, { color: isDark ? '#ffffff' : '#000000' }]}>
                Developed with ❤️ by the GTO Poker Team
              </Text>
              <Text style={[styles.aboutText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                Combining years of poker expertise with cutting-edge AI technology to help players improve their game.
              </Text>
            </View>

            {/* Features */}
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: '#007AFF' }]}>
                ✨ Key Features
              </Text>
              <View style={styles.aboutFeatureList}>
                <Text style={[styles.aboutFeature, { color: isDark ? '#ffffff' : '#000000' }]}>
                  • Real-time poker hand analysis
                </Text>
                <Text style={[styles.aboutFeature, { color: isDark ? '#ffffff' : '#000000' }]}>
                  • GTO strategy recommendations
                </Text>
                <Text style={[styles.aboutFeature, { color: isDark ? '#ffffff' : '#000000' }]}>
                  • Performance tracking and statistics
                </Text>
                <Text style={[styles.aboutFeature, { color: isDark ? '#ffffff' : '#000000' }]}>
                  • Personalized training modes
                </Text>
                <Text style={[styles.aboutFeature, { color: isDark ? '#ffffff' : '#000000' }]}>
                  • Multi-format support (Cash, Tournament)
                </Text>
                <Text style={[styles.aboutFeature, { color: isDark ? '#ffffff' : '#000000' }]}>
                  • Dark/Light theme support
                </Text>
              </View>
            </View>

            {/* Legal */}
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: '#007AFF' }]}>
                📜 Legal
              </Text>
              <Text style={[styles.aboutText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                © 2024 GTO Poker Assistant. All rights reserved.
              </Text>
              <Text style={[styles.aboutText, { color: isDark ? '#d1d1d6' : '#666666' }]}>
                This app is for educational purposes only. Please gamble responsibly.
              </Text>
            </View>

            {/* Contact */}
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: '#007AFF' }]}>
                📧 Contact
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:hello@gtopokerassistant.com')}>
                <Text style={[styles.aboutContactLink, { color: '#007AFF' }]}>
                  hello@gtopokerassistant.com
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://gtopokerassistant.com')}>
                <Text style={[styles.aboutContactLink, { color: '#007AFF' }]}>
                  www.gtopokerassistant.com
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.aboutFooter}>
              <Text style={[styles.aboutFooterText, { color: isDark ? '#8e8e93' : '#666666' }]}>
                Made with 🃏 for poker enthusiasts worldwide
              </Text>
              <Text style={[styles.aboutFooterText, { color: isDark ? '#8e8e93' : '#666666' }]}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyModalFullScreen: {
    flex: 1,
  },
  privacyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  privacyModalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  privacyModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyModalScrollContainer: {
    flex: 1,
  },
  privacyModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  privacySection: {
    marginBottom: 30,
  },
  privacySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  privacyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  privacyBulletContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 5,
  },
  privacyBullet: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
    minWidth: 20,
  },
  privacyBulletText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  privacyBold: {
    fontWeight: '700',
  },
  privacyFooter: {
    marginTop: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  privacyFooterText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  
  // Help & FAQ Modal Styles
  helpFAQModalFullScreen: {
    flex: 1,
  },
  helpFAQModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  helpFAQModalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  helpFAQModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  helpFAQModalScrollContainer: {
    flex: 1,
  },
  helpFAQModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  faqCategory: {
    marginBottom: 30,
  },
  faqCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  faqCategoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  faqItem: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  supportSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  supportSuggestionText: {
    flex: 1,
    marginLeft: 15,
  },
  supportSuggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportSuggestionSubtitle: {
    fontSize: 14,
  },
  supportSuggestionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  supportSuggestionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Contact Support Modal Styles
  contactSupportModalFullScreen: {
    flex: 1,
  },
  contactSupportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  contactSupportModalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  contactSupportModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactSupportModalScrollContainer: {
    flex: 1,
  },
  contactSupportModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  supportOptionIcon: {
    marginRight: 15,
  },
  supportOptionContent: {
    flex: 1,
  },
  supportOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportOptionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  supportOptionDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseTimeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  responseTimeContent: {
    flex: 1,
    marginLeft: 15,
  },
  responseTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  responseTimeText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // About Modal Styles
  aboutModalFullScreen: {
    flex: 1,
  },
  aboutModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  aboutModalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  aboutModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutModalScrollContainer: {
    flex: 1,
  },
  aboutModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  aboutAppInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  aboutAppIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutAppName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  aboutAppVersion: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  aboutAppDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  aboutSection: {
    marginBottom: 30,
  },
  aboutSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  aboutFeatureList: {
    marginTop: 5,
  },
  aboutFeature: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  aboutTechInfo: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  aboutContactLink: {
    fontSize: 16,
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  aboutFooter: {
    alignItems: 'center',
    paddingTop: 30,
    marginTop: 20,
  },
  aboutFooterText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },

  // Support Ticket Modal Styles
  supportTicketModalFullScreen: {
    flex: 1,
  },
  supportTicketModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  supportTicketModalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  supportTicketModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTicketModalScrollContainer: {
    flex: 1,
  },
  supportTicketModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  supportTicketSection: {
    marginBottom: 25,
  },
  supportTicketLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  supportTicketTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  supportTicketTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  supportTicketTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportTicketPriorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  supportTicketPriorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  supportTicketPriorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  supportTicketInput: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  supportTicketTextArea: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 120,
  },
  supportTicketCharCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  supportTicketInfoCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  supportTicketInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  supportTicketInfoText: {
    fontSize: 13,
    marginBottom: 4,
  },
  supportTicketSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  supportTicketSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 