import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { AntDesign, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import ApiService, { AnalysisResult } from '@/services/apiService';
import { API_CONFIG } from '@/config/api';
import DailyQuizModal from '@/components/DailyQuizModal';

const { width } = Dimensions.get('window');

interface GameMode {
  id: 'cash' | 'tournaments';
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  accuracy: number;
  description: string;
}

interface Session {
  id: number;
  gameType: string;
  gamePot: string;
  accuracy: number;
  date: string;
}

interface UserSessionData {
  date: string | null;
  gamePot: string | null;
  gameSeat: string | null;
  recommendedAction: string | null;
  confidence: number | null;
  analysisNotes: string | null;
}

interface DailyProgress {
  id: string;
  date: string;
  handsPlayed: number;
  accuracy: number;
  studyTime: number;
  pointsEarned: number;
  gameType: string;
  achievements: string[];
  analyses: Array<{
    id: string;
    gameFormat: string;
    recommendedAction: string;
    confidence: number;
    analysisNotes: string;
    time: string;
  }>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { selectedFormat, setSelectedFormat } = useGame();
  const { user, token } = useAuth();
  const [isSelecting, setIsSelecting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [analysisStats, setAnalysisStats] = useState<{
    avgProcessingTime: string;
    avgConfidence: number;
    maxDecisions: number;
    totalAnalyses: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Format-specific stats state
  const [formatSpecificStats, setFormatSpecificStats] = useState<{
    cash: {
      handsAnalyzed: number;
      accuracyRate: number;
      studyTime: string;
    } | null;
    tournaments: {
      handsAnalyzed: number;
      accuracyRate: number;
      studyTime: string;
    } | null;
  }>({
    cash: null,
    tournaments: null
  });
  const [isLoadingFormatStats, setIsLoadingFormatStats] = useState(false);
  const [userSessions, setUserSessions] = useState<{
    recentSessionCash: UserSessionData;
    recentSessionSpinAndGo: UserSessionData;
  } | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [dailyProgressModalVisible, setDailyProgressModalVisible] = useState(false);
  const [dailyProgressData, setDailyProgressData] = useState<DailyProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [raffleModalVisible, setRaffleModalVisible] = useState(false);
  const [raffleReward, setRaffleReward] = useState<{
    type: 'quota' | 'points' | 'bonus';
    amount: number;
    message: string;
    icon: string;
  } | null>(null);
  const [isRaffleSpinning, setIsRaffleSpinning] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [streaksGoalsModalVisible, setStreaksGoalsModalVisible] = useState(false);
  const [streaksGoalsData, setStreaksGoalsData] = useState<{
    currentStreak: number;
    lastCheckIn: string | null;
    hasCheckedInToday: boolean;
    weeklyProgress: {
      daysActive: number;
      goalDays: number;
      pointsEarned: number;
      isCompleted: boolean;
    };
    monthlyProgress: {
      daysActive: number;
      goalDays: number;
      pointsEarned: number;
      isCompleted: boolean;
    };
    totalPoints: number;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      earned: boolean;
      points: number;
    }>;
    availableUsage: number;
    userUsage: number;
  } | null>(null);
  const [loadingStreaksGoals, setLoadingStreaksGoals] = useState(false);

  // Fetch analysis stats on component mount
  useEffect(() => {
      fetchAnalysisStats();
      checkDailyCheckIn();
  }, []);

  // Fetch user sessions when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserSessions();
      fetchFormatSpecificStats();
    }
  }, [user?.id]);

  // Fetch format stats when selected format changes
  useEffect(() => {
    if (user?.id) {
      fetchFormatSpecificStats();
    }
  }, [selectedFormat, user?.id]);

  const fetchAnalysisStats = async () => {
    try {
      setIsLoadingStats(true);
      console.log('📊 Fetching analysis statistics...');
      const statsResponse = await ApiService.getAnalysisStats();
      
      if (statsResponse.success && statsResponse.stats) {
        setAnalysisStats(statsResponse.stats);
        console.log('✅ Analysis stats updated:', statsResponse.stats);
      }
    } catch (error) {
      console.error('❌ Failed to fetch analysis stats:', error);
      // Don't show error to user, just use default values
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchUserSessions = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingSessions(true);
      console.log('👤 Fetching user sessions...');
      const sessionsResponse = await ApiService.getUserSessions(user.id);
      
      if (sessionsResponse.success && sessionsResponse.sessions) {
        setUserSessions(sessionsResponse.sessions);
        console.log('✅ User sessions updated:', sessionsResponse.sessions);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user sessions:', error);
      // Don't show error to user, just use default values
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchFormatSpecificStats = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingFormatStats(true);
      console.log(`📊 Fetching format-specific stats for ${selectedFormat}...`);
      
      // Fetch both cash and tournaments stats
      const [cashStatsResponse, tournamentStatsResponse] = await Promise.allSettled([
        ApiService.getFormatSpecificStats(user.id, 'cash'),
        ApiService.getFormatSpecificStats(user.id, 'tournaments')
      ]);
      
      const newFormatStats = { ...formatSpecificStats };
      
      // Process cash stats
      if (cashStatsResponse.status === 'fulfilled' && cashStatsResponse.value.success && cashStatsResponse.value.stats) {
        const cashStats = cashStatsResponse.value.stats;
        const isMockData = cashStatsResponse.value.fallback;
        newFormatStats.cash = {
          handsAnalyzed: cashStats.handsAnalyzed || cashStats.maxDecisions || 0,
          accuracyRate: cashStats.accuracyRate || cashStats.avgConfidence || 0,
          studyTime: cashStats.studyTime || '0h'
        };
        console.log(`✅ Cash stats updated ${isMockData ? '(mock data)' : '(from backend)'}:`, newFormatStats.cash);
      } else {
        // Handle both rejected promises and 404 fallbacks
        const isEndpointMissing = cashStatsResponse.status === 'fulfilled' && 
                                 cashStatsResponse.value.fallback;
        
        if (isEndpointMissing) {
          console.log('📊 Using fallback data for cash stats (endpoint not implemented)');
        } else {
          console.warn('⚠️ Cash stats failed:', 
            cashStatsResponse.status === 'rejected' ? cashStatsResponse.reason : 'API error');
        }
        
        // Use smart fallback data
        const baseHands = analysisStats?.maxDecisions || 37;
        const baseAccuracy = analysisStats?.avgConfidence || 87;
        const sessionAccuracy = userSessions?.recentSessionCash?.confidence;
        
        newFormatStats.cash = {
          handsAnalyzed: sessionAccuracy ? Math.round(baseHands * 1.2) : baseHands,
          accuracyRate: sessionAccuracy || Math.round(baseAccuracy * 1.05),
          studyTime: '32h'
        };
        console.log('📊 Cash fallback stats:', newFormatStats.cash);
      }
      
      // Process tournament stats
      if (tournamentStatsResponse.status === 'fulfilled' && tournamentStatsResponse.value.success && tournamentStatsResponse.value.stats) {
        const tournamentStats = tournamentStatsResponse.value.stats;
        const isMockData = tournamentStatsResponse.value.fallback;
        newFormatStats.tournaments = {
          handsAnalyzed: tournamentStats.handsAnalyzed || tournamentStats.maxDecisions || 0,
          accuracyRate: tournamentStats.accuracyRate || tournamentStats.avgConfidence || 0,
          studyTime: tournamentStats.studyTime || '0h'
        };
        console.log(`✅ Tournament stats updated ${isMockData ? '(mock data)' : '(from backend)'}:`, newFormatStats.tournaments);
      } else {
        // Handle both rejected promises and 404 fallbacks
        const isEndpointMissing = tournamentStatsResponse.status === 'fulfilled' && 
                                 tournamentStatsResponse.value.fallback;
        
        if (isEndpointMissing) {
          console.log('📊 Using fallback data for tournament stats (endpoint not implemented)');
        } else {
          console.warn('⚠️ Tournament stats failed:', 
            tournamentStatsResponse.status === 'rejected' ? tournamentStatsResponse.reason : 'API error');
        }
        
        // Use smart fallback data
        const baseHands = analysisStats?.maxDecisions || 37;
        const baseAccuracy = analysisStats?.avgConfidence || 87;
        const sessionAccuracy = userSessions?.recentSessionSpinAndGo?.confidence;
        
        newFormatStats.tournaments = {
          handsAnalyzed: sessionAccuracy ? Math.round(baseHands * 0.75) : Math.round(baseHands * 0.8),
          accuracyRate: sessionAccuracy || Math.round(baseAccuracy * 0.95),
          studyTime: '18h'
        };
        console.log('📊 Tournament fallback stats:', newFormatStats.tournaments);
      }
      
      setFormatSpecificStats(newFormatStats);
    } catch (error) {
      console.error('❌ Failed to fetch format-specific stats:', error);
      // Use fallback data based on selected format and user sessions
      const fallbackStats = { ...formatSpecificStats };
      if (selectedFormat === 'cash') {
        fallbackStats.cash = {
          handsAnalyzed: userSessions?.recentSessionCash?.confidence ? 45 : (analysisStats?.maxDecisions || 37),
          accuracyRate: userSessions?.recentSessionCash?.confidence || (analysisStats?.avgConfidence || 87),
          studyTime: '32h'
        };
      } else {
        fallbackStats.tournaments = {
          handsAnalyzed: userSessions?.recentSessionSpinAndGo?.confidence ? 28 : Math.round((analysisStats?.maxDecisions || 37) * 0.75),
          accuracyRate: userSessions?.recentSessionSpinAndGo?.confidence || Math.round((analysisStats?.avgConfidence || 87) * 0.95),
          studyTime: '18h'
        };
      }
      setFormatSpecificStats(fallbackStats);
    } finally {
      setIsLoadingFormatStats(false);
    }
  };

  const fetchDailyProgress = async () => {
    if (!user?.id || !token) return;
    
    try {
      setLoadingProgress(true);
      console.log('📊 Fetching daily progress...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/analysis/daily-progress/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDailyProgressData(data.data);
          console.log('✅ Daily progress updated:', data.data);
        } else {
          Alert.alert('Error', data.error || 'Failed to fetch daily progress');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch daily progress');
      }
    } catch (error) {
      console.error('❌ Error fetching daily progress:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleHandHistoryPress = () => {
    setDailyProgressModalVisible(true);
    fetchDailyProgress();
  };

  const checkDailyCheckIn = async () => {
    if (!user?.id || !token) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/analysis/check-daily-checkin/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasCheckedInToday(data.data.hasCheckedInToday);
        return data.data.hasCheckedInToday;
      }
    } catch (error) {
      console.error('❌ Error checking daily check-in:', error);
    }
    return false;
  };

  const performDailyCheckIn = async () => {
    if (!user?.id || !token) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/analysis/daily-checkin/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.error('❌ Error performing daily check-in:', error);
    }
    return null;
  };

  const generateRaffleReward = () => {
    const rewards = [
      // Quota rewards (most common)
      { type: 'quota' as const, amount: 5, message: 'Bonus Analysis Quota!', icon: 'gift', probability: 0.4 },
      { type: 'quota' as const, amount: 10, message: 'Extra Analysis Quota!', icon: 'gift', probability: 0.2 },
      { type: 'quota' as const, amount: 15, message: 'Premium Analysis Quota!', icon: 'diamond', probability: 0.1 },
      { type: 'quota' as const, amount: 25, message: 'Mega Analysis Quota!', icon: 'diamond', probability: 0.05 },
      
      // Points rewards
      { type: 'points' as const, amount: 20, message: 'Bonus Points!', icon: 'star', probability: 0.15 },
      { type: 'points' as const, amount: 50, message: 'Extra Points!', icon: 'star', probability: 0.05 },
      { type: 'points' as const, amount: 100, message: 'Mega Points!', icon: 'trophy', probability: 0.02 },
      
      // Special bonus
      { type: 'bonus' as const, amount: 1, message: 'Lucky Bonus!', icon: 'flash', probability: 0.03 },
    ];

    // Calculate weighted random selection
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }
    
    // Fallback to first reward
    return rewards[0];
  };

  const handleDailyCheckInPress = async () => {
    if (hasCheckedInToday) {
      Alert.alert('Already Checked In', 'You have already checked in today. Come back tomorrow!');
      return;
    }

    setRaffleModalVisible(true);
    setIsRaffleSpinning(true);
    setRaffleReward(null);

    // Simulate spinning animation
    setTimeout(async () => {
      try {
        // Perform the actual check-in
        const checkInResult = await performDailyCheckIn();
        
        if (checkInResult) {
          // Create reward object from backend response
          const reward = {
            type: 'quota' as const,
            amount: checkInResult.quotaReward,
            message: 'Bonus Analysis Quota!',
            icon: 'gift'
          };
          setRaffleReward(reward);
          setIsRaffleSpinning(false);
          setHasCheckedInToday(true);
          
          // Show success message
          Alert.alert(
            'Check-in Successful!', 
            `You received: ${reward.amount} analysis quota!`
          );
        } else {
          setIsRaffleSpinning(false);
          Alert.alert('Error', 'Failed to check in. Please try again.');
        }
      } catch (error) {
        setIsRaffleSpinning(false);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }, 2000); // 2 second spinning animation
  };

  const fetchStreaksGoals = async () => {
    if (!user?.id || !token) return;
    
    try {
      setLoadingStreaksGoals(true);
      console.log('📊 Fetching streaks and goals data...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/analysis/streaks-goals/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStreaksGoalsData(data.data);
          console.log('✅ Streaks and goals data updated:', data.data);
        } else {
          Alert.alert('Error', data.error || 'Failed to fetch streaks and goals data');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch streaks and goals data');
      }
    } catch (error) {
      console.error('❌ Error fetching streaks and goals data:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoadingStreaksGoals(false);
    }
  };

  const handleStreaksGoalsPress = () => {
    setStreaksGoalsModalVisible(true);
    fetchStreaksGoals();
  };

  const claimReward = async (rewardType: 'weekly' | 'monthly') => {
    if (!user?.id || !token) return;
    
    try {
      console.log(`🎁 Claiming ${rewardType} reward...`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/analysis/claim-reward/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardType }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          Alert.alert(
            'Reward Claimed!', 
            `You received ${data.data.pointsEarned} points for completing your ${rewardType} goal!`
          );
          // Refresh streaks and goals data
          fetchStreaksGoals();
        } else {
          Alert.alert('Error', data.error || 'Failed to claim reward');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error(`❌ Error claiming ${rewardType} reward:`, error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const gameModesData: GameMode[] = [
    {
      id: 'cash',
      title: 'Cash Games',
      subtitle: 'Deep stack strategy • 100bb+',
      icon: 'cash',
      gradient: ['#1a73e8', '#4285f4'],
      accuracy: 87,
      description: 'Master deep stack play with optimal ranges and sizing'
    },
    {
      id: 'tournaments',
      title: 'Spin & Go',
      subtitle: 'Short stack • Fast-paced',
      icon: 'trophy',
      gradient: ['#ea4335', '#fbbc05'],
      accuracy: 73,
      description: 'Perfect push/fold decisions and hyper-turbo strategy'
    },
  ];

  // Convert user session data to display format
  const convertUserSessionsToDisplay = (): Session[] => {
    const sessions: Session[] = [];
    
    if (userSessions?.recentSessionCash && userSessions.recentSessionCash.date) {
      const cashSession = userSessions.recentSessionCash;
      const timeAgo = getTimeAgo(cashSession.date);
      sessions.push({
        id: 1,
        gameType: 'Cash',
        gamePot: cashSession.gamePot || 'Unknown',
        accuracy: cashSession.confidence || 0,
        date: timeAgo
      });
    }
    
    if (userSessions?.recentSessionSpinAndGo && userSessions.recentSessionSpinAndGo.date) {
      const spinAndGoSession = userSessions.recentSessionSpinAndGo;
      const timeAgo = getTimeAgo(spinAndGoSession.date);
      sessions.push({
        id: 2,
        gameType: 'Spin & Go',
        gamePot: spinAndGoSession.gamePot || 'Unknown',
        accuracy: spinAndGoSession.confidence || 0,
        date: timeAgo
      });
    }
    
    // If no real data, show default sessions
    if (sessions.length === 0) {
      return [
        { id: 1, gameType: 'Cash', gamePot: 'Null', accuracy: 0, date: 'Unknown' },
        { id: 2, gameType: 'Spin & Go', gamePot: 'Null', accuracy: 0, date: 'Unknown' },
      ];
    }
    
    return sessions;
  };


  // Helper function to get time ago string
  const getTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just Today';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks}w ago`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Unknown';
    }
  };

  const recentSessions: Session[] = convertUserSessionsToDisplay();

  const handleGameModeSelect = (mode: GameMode) => {
    setIsSelecting(true);
    setSelectedFormat(mode.id);
    
    // Navigate to Solver page after selection
    setTimeout(() => {
      setIsSelecting(false);
      setIsNavigating(true);
      
      setTimeout(() => {
        router.push('/(tabs)/camera'); // Navigate to Solver screen
        setIsNavigating(false);
      }, 200);
    }, 300);
  };

  const handleStartTraining = () => {
    const format = selectedFormat === 'cash' ? 'Cash Games' : 'Spin & Go';
    router.push({
      pathname: '/(tabs)/training',
      params: { gameType: selectedFormat, format: format }
    });
  };

  const handleQuizModalOpen = () => {
    setQuizModalVisible(true);
  };

  const handleQuizModalClose = () => {
    setQuizModalVisible(false);
  };

  const handleQuizRewardEarned = (points: number) => {
    Alert.alert(
      'Congratulations! 🎉',
      `You earned ${points} availableUsage points for scoring 80% or higher on today's quiz!`,
      [{ text: 'Awesome!', style: 'default' }]
    );
    // Here you could also refresh user data or update points in the backend
  };

  // Helper function to get current format stats
  const getCurrentFormatStats = () => {
    const currentStats = selectedFormat === 'cash' 
      ? formatSpecificStats.cash 
      : formatSpecificStats.tournaments;
    
    // Fallback to general stats if format-specific stats are not available
    if (!currentStats) {
      const baseHands = analysisStats?.maxDecisions || 0;
      const baseAccuracy = analysisStats?.avgConfidence || 0;
      
      return {
        handsAnalyzed: selectedFormat === 'cash' ? Math.round(baseHands * 1.2) : Math.round(baseHands * 0.8),
        accuracyRate: selectedFormat === 'cash' ? Math.min(100, Math.round(baseAccuracy * 1.05)) : Math.round(baseAccuracy * 0.95),
        studyTime: selectedFormat === 'cash' ? '32h' : '18h'
      };
    }
    
    return currentStats;
  };

  const GameModeCard = ({ mode }: { mode: GameMode }) => {
    const isSelected = selectedFormat === mode.id;
    const formatColor = mode.gradient[0]; // Use the format's primary color
    
    // Get format-specific accuracy for this mode
    const getFormatAccuracy = (formatId: 'cash' | 'tournaments') => {
      const formatStats = formatId === 'cash' 
        ? formatSpecificStats.cash 
        : formatSpecificStats.tournaments;
      
      if (formatStats && formatStats.accuracyRate > 0) {
        return Math.round(formatStats.accuracyRate);
      }
      
      // Fallback to user session data if available
      if (userSessions) {
        const session = formatId === 'cash' 
          ? userSessions.recentSessionCash 
          : userSessions.recentSessionSpinAndGo;
        
        if (session.confidence && session.confidence > 0) {
          return Math.round(session.confidence);
        }
      }
      
      // Final fallback to default mode accuracy
      return mode.accuracy;
    };
    
    const displayAccuracy = getFormatAccuracy(mode.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.gameModeCard,
          isSelected && styles.gameModeCardSelected
        ]}
        onPress={() => handleGameModeSelect(mode)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.gameModeGradient, 
          { backgroundColor: mode.gradient[0] },
          isSelected && styles.gameModeGradientSelected
        ]}>
          <View style={styles.gameModeHeader}>
            {mode.id === 'cash' ? (
              <Ionicons name="cash" size={28} color="white" />
            ) : (
              <Ionicons name="trophy" size={28} color="white" />
            )}
             <View style={[styles.accuracyBadge, { backgroundColor: formatColor }]}>
               <Text style={styles.accuracyText}>{displayAccuracy}%</Text>
             </View>
          </View>
          
          <View style={styles.gameModeContent}>
            <Text style={styles.gameModeTitle}>{mode.title}</Text>
            <Text style={styles.gameModeSubtitle}>{mode.subtitle}</Text>
            <Text style={styles.gameModeDescription}>{mode.description}</Text>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={[styles.selectionIndicator, { backgroundColor: formatColor }]}>
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={[styles.selectionText, { color: 'white' }]}>Active</Text>
            </View>
          )}

          {/* Navigate to Solver Indicator */}
          <View style={styles.navigateIndicator}>
            <Ionicons name="school" size={16} color="white" />
            <Text style={styles.navigateText}>To Solver</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CurrentSelectionBanner = () => {
    const currentMode = gameModesData.find(mode => mode.id === selectedFormat);
    if (!currentMode) return null;

    const bannerColor = selectedFormat === 'cash' ? '#1a73e8' : '#ea4335';

    return (
      <View style={[styles.selectionBanner, { backgroundColor: bannerColor }]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerIcon}>
            {selectedFormat === 'cash' ? (
              <Ionicons name="cash" size={20} color="white" />
            ) : (
              <Ionicons name="trophy" size={20} color="white" />
            )}
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Current Format</Text>
            <Text style={styles.bannerSubtitle}>{currentMode.title}</Text>
          </View>
          <View style={styles.bannerButtons}>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => router.push('/(tabs)/camera')}
            >
              <Ionicons name="camera" size={16} color={bannerColor} />
              <Text style={[styles.bannerButtonText, { color: bannerColor }]}>Solver</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bannerButton, styles.bannerButtonSecondary, { 
                borderColor: 'white',
                backgroundColor: 'white'
              }]}
              onPress={handleStartTraining}
            >
              <Ionicons name="school" size={16} color={bannerColor} />
              <Text style={[styles.bannerButtonText, { color: bannerColor }]}>Train</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const RecentSessionItem = ({ session }: { session: Session }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionLeft}>
        <View style={styles.sessionIcon}>
          <MaterialIcons name="casino" size={16} color="#6b7280" />
        </View>
        <View>
          <Text style={styles.sessionGameType}>{session.gameType}</Text>
          <Text style={styles.sessionGamePot}>{session.gamePot} • {session.date}</Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={[
          styles.sessionAccuracy,
          { color: session.accuracy >= 85 ? '#10b981' : session.accuracy >= 70 ? '#f59e0b' : '#ef4444' }
        ]}>
          {session.accuracy}%
        </Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText style={styles.title}>Welcome To Here 🤖</ThemedText>
              <ThemedText style={styles.subtitle}>Ready to improve your game?</ThemedText>
            </View>
            <TouchableOpacity style={styles.solverButton} onPress={() => router.push('/(tabs)/camera')}>
              <MaterialIcons name="center-focus-strong" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Selection Banner */}
        <CurrentSelectionBanner />

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="documents" size={20} color="#6b7280" />
            <Text style={styles.statValue}>
              {isLoadingFormatStats ? '···' : getCurrentFormatStats().handsAnalyzed}
            </Text>
            <Text style={styles.statLabel}>Hands Analyzed</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="gps-fixed" size={20} color="#6b7280" />
            <Text style={styles.statValue}>
              {isLoadingFormatStats ? '···' : `${Math.round(getCurrentFormatStats().accuracyRate)}%`}
            </Text>
            <Text style={styles.statLabel}>Accuracy Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#6b7280" />
            <Text style={styles.statValue}>
              {isLoadingFormatStats ? '···' : getCurrentFormatStats().studyTime}
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>
        </View>

        {/* Game Modes Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Choose Game Format</ThemedText>
            <Text style={styles.sectionSubtitle}>Select a format to start GTO analysis</Text>
          </View>
          <View style={styles.gameModeContainer}>
            {gameModesData.map((mode) => (
              <GameModeCard key={mode.id} mode={mode} />
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Sessions</ThemedText>
          <View style={styles.sessionsList}>
            {recentSessions.map((session) => (
              <RecentSessionItem key={session.id} session={session} />
            ))}
          </View>
        </View>

        {/* Quick Tools */}
        <View style={styles.section_quick}>
          <ThemedText style={styles.sectionTitle}>Quick Tools</ThemedText>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard} onPress={handleDailyCheckInPress}>
              <View style={styles.toolIconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="calendar" size={28} color="#2563eb" />
                </View>
              </View>
              <Text style={styles.toolTitle}>Daily Check-in</Text>
              <Text style={styles.toolSubtitle}>
                {hasCheckedInToday ? 'Already checked in!' : 'Claim today\'s reward'}
              </Text>
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardText}>
                  {hasCheckedInToday ? 'See you tomorrow!' : '+5 - 25 quota'}
                </Text>
                <View style={styles.progressDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard} onPress={handleHandHistoryPress}>
              <View style={styles.toolIconContainer}>
                <View style={styles.iconBackground}>
                  <Ionicons name="pulse" size={28} color="#f59e0b" />
                </View>
              </View>
              <Text style={styles.toolTitle}>Hand History</Text>
              <Text style={styles.toolSubtitle}>Review queue: 1 hands</Text>
              <TouchableOpacity style={styles.toolActionButton}>
                <Text style={styles.toolActionText}>Start review +20 pts</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            
              <TouchableOpacity style={styles.toolCard} onPress={handleStreaksGoalsPress}>
                <View style={styles.toolIconContainer}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressText}>
                      {streaksGoalsData ? `${streaksGoalsData.currentStreak}/30` : '0/30'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.toolTitle}>Streaks & Goals</Text>
                <Text style={styles.toolSubtitle}>Keep your run going</Text>
                <TouchableOpacity style={styles.toolActionButton}>
                  <Text style={styles.toolActionText}>View progress</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard} onPress={handleQuizModalOpen}>
              <View style={styles.toolIconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="help-circle" size={28} color="#16a34a" />
                </View>
              </View>
              <Text style={styles.toolTitle}>Solve Problems</Text>
              <Text style={styles.toolSubtitle}>Daily quiz challenge</Text>
              <Text style={styles.rewardText}>+15 pts for 80%+ score</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <NavigationOverlay isVisible={isNavigating} />
        
        {/* Daily Progress Modal */}
        <Modal
          visible={dailyProgressModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setDailyProgressModalVisible(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Progress History</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDailyProgressModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {loadingProgress ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading your progress...</Text>
              </View>
            ) : dailyProgressData.length > 0 ? (
              <FlatList
                data={dailyProgressData}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.progressList}
                renderItem={({ item }) => (
                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.progressPoints}>+{item.pointsEarned} pts</Text>
                    </View>
                    
                    <View style={styles.progressStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="game-controller" size={16} color="#007AFF" />
                        <Text style={styles.statText}>{item.handsPlayed} hands</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#34a853" />
                        <Text style={styles.statText}>{item.accuracy}% accuracy</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color="#f59e0b" />
                        <Text style={styles.statText}>{item.studyTime}min study</Text>
                      </View>
                    </View>
                    
                    <View style={styles.gameTypeContainer}>
                      <View style={[styles.gameTypeBadge, { 
                        backgroundColor: item.gameType.includes('cash') ? '#e3f2fd' : '#f3e5f5'
                      }]}>
                        <Text style={[styles.gameTypeText, {
                          color: item.gameType.includes('cash') ? '#1976d2' : '#7b1fa2'
                        }]}>
                          {item.gameType== "cash" ? "Cash" : "Tournament"}
                        </Text>
                      </View>
                    </View>
                    
                    {item.achievements.length > 0 && (
                      <View style={styles.achievementsContainer}>
                        <Text style={styles.achievementsTitle}>Achievements:</Text>
                        <View style={styles.achievementsList}>
                          {item.achievements.map((achievement, index) => (
                            <View key={index} style={styles.achievementBadge}>
                              <Ionicons name="trophy" size={12} color="#f59e0b" />
                              <Text style={styles.achievementText}>{achievement}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    <View style={styles.analysesContainer}>
                      <Text style={styles.analysesTitle}>Recent Analyses:</Text>
                      {item.analyses.slice(0, 3).map((analysis, index) => (
                        <View key={index} style={styles.analysisItem}>
                          <View style={styles.analysisHeader}>
                            <Text style={styles.analysisAction}>{analysis.recommendedAction}</Text>
                            <Text style={styles.analysisConfidence}>{analysis.confidence}%</Text>
                          </View>
                          <Text style={styles.analysisNotes}>{analysis.analysisNotes}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Progress Data</Text>
                <Text style={styles.emptyStateMessage}>
                  Start analyzing hands to see your daily progress here
                </Text>
              </View>
            )}
          </ThemedView>
        </Modal>
        
        {/* Raffle Modal */}
        <Modal
          visible={raffleModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setRaffleModalVisible(false)}
        >
          <View style={styles.raffleModalOverlay}>
            <View style={styles.raffleModalContainer}>
              <View style={styles.raffleHeader}>
                <Text style={styles.raffleTitle}>Daily Check-in</Text>
                <TouchableOpacity 
                  style={styles.raffleCloseButton}
                  onPress={() => setRaffleModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.raffleContent}>
                {isRaffleSpinning ? (
                  <View style={styles.spinningContainer}>
                    <View style={styles.spinningWheel}>
                      <Ionicons name="refresh" size={48} color="#0ea5e9" />
                    </View>
                    <Text style={styles.spinningText}>Spinning for your reward...</Text>
                    <View style={styles.spinningDots}>
                      <View style={[styles.spinningDot, styles.spinningDot1]} />
                      <View style={[styles.spinningDot, styles.spinningDot2]} />
                      <View style={[styles.spinningDot, styles.spinningDot3]} />
                    </View>
                  </View>
                ) : raffleReward ? (
                  <View style={styles.raffleRewardContainer}>
                    <View style={styles.celebrationContainer}>
                      <Ionicons name="sparkles" size={24} color="#fbbf24" style={styles.celebrationIcon1} />
                      <View style={[styles.rewardIcon, { 
                        backgroundColor: raffleReward.type === 'quota' ? '#e3f2fd' : 
                                       raffleReward.type === 'points' ? '#fff3e0' : '#f3e5f5'
                      }]}>
                        <Ionicons 
                          name={raffleReward.icon as any} 
                          size={48} 
                          color={raffleReward.type === 'quota' ? '#1976d2' : 
                                 raffleReward.type === 'points' ? '#f57c00' : '#7b1fa2'} 
                        />
                      </View>
                      <Ionicons name="sparkles" size={24} color="#fbbf24" style={styles.celebrationIcon2} />
                    </View>
                    <Text style={styles.rewardMessage}>{raffleReward.message}</Text>
                    <Text style={styles.rewardAmount}>
                      +{raffleReward.amount} {raffleReward.type === 'quota' ? 'Analysis Quota' : 
                                           raffleReward.type === 'points' ? 'Points' : 'Bonus Reward'}
                    </Text>
                    <Text style={styles.rewardDescription}>
                      {raffleReward.type === 'quota' ? 
                        'You can now perform more poker analyses!' :
                        raffleReward.type === 'points' ? 
                        'Points can be used for special features!' :
                        'You received a special bonus reward!'}
                    </Text>
                    <View style={styles.rewardBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.rewardBadgeText}>Reward Claimed</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.raffleFooter}>
                <TouchableOpacity 
                  style={styles.raffleActionButton}
                  onPress={() => setRaffleModalVisible(false)}
                >
                  <Text style={styles.raffleActionText}>
                    {raffleReward ? 'Awesome!' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Streaks & Goals Modal */}
        <Modal
          visible={streaksGoalsModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setStreaksGoalsModalVisible(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Streaks & Goals</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setStreaksGoalsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {loadingStreaksGoals ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading your progress...</Text>
              </View>
            ) : streaksGoalsData ? (
              <ScrollView style={styles.streaksGoalsContent} showsVerticalScrollIndicator={false}>
                {/* Current Streak Section */}
                <View style={styles.streakSection}>
                  <View style={styles.streakHeader}>
                    <Ionicons name="flame" size={24} color="#f59e0b" />
                    <Text style={styles.streakTitle}>Current Streak</Text>
                  </View>
                  <View style={styles.streakCard}>
                    <Text style={styles.streakNumber}>{streaksGoalsData.currentStreak}</Text>
                    <Text style={styles.streakLabel}>Days in a row</Text>
                    <View style={styles.streakProgress}>
                      <View style={[styles.streakProgressBar, { width: `${Math.min(100, (streaksGoalsData.currentStreak / 30) * 100)}%` }]} />
                    </View>
                    <Text style={styles.streakGoal}>Goal: 30 days</Text>
                  </View>
                </View>

                {/* Weekly Goal Section */}
                <View style={styles.goalSection}>
                  <View style={styles.goalHeader}>
                    <Ionicons name="calendar" size={24} color="#3b82f6" />
                    <Text style={styles.goalTitle}>Weekly Goal</Text>
                  </View>
                  <View style={styles.goalCard}>
                    <View style={styles.goalProgress}>
                      <Text style={styles.goalProgressText}>
                        {streaksGoalsData.weeklyProgress.daysActive}/{streaksGoalsData.weeklyProgress.goalDays} days
                      </Text>
                      <View style={styles.goalProgressBar}>
                        <View style={[styles.goalProgressFill, { 
                          width: `${(streaksGoalsData.weeklyProgress.daysActive / streaksGoalsData.weeklyProgress.goalDays) * 100}%` 
                        }]} />
                      </View>
                    </View>
                    <View style={styles.goalReward}>
                      <Text style={styles.goalRewardText}>Reward: 20 points</Text>
                      {streaksGoalsData.weeklyProgress.isCompleted ? (
                        <TouchableOpacity 
                          style={[styles.claimButton, { backgroundColor: '#10b981' }]}
                          onPress={() => claimReward('weekly')}
                        >
                          <Ionicons name="gift" size={16} color="white" />
                          <Text style={styles.claimButtonText}>Claim Reward</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.claimButton, { backgroundColor: '#94a3b8' }]}>
                          <Ionicons name="lock-closed" size={16} color="white" />
                          <Text style={styles.claimButtonText}>Locked</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Monthly Goal Section */}
                <View style={styles.goalSection}>
                  <View style={styles.goalHeader}>
                    <Ionicons name="trophy" size={24} color="#8b5cf6" />
                    <Text style={styles.goalTitle}>Monthly Goal</Text>
                  </View>
                  <View style={styles.goalCard}>
                    <View style={styles.goalProgress}>
                      <Text style={styles.goalProgressText}>
                        {streaksGoalsData.monthlyProgress.daysActive}/{streaksGoalsData.monthlyProgress.goalDays} days
                      </Text>
                      <View style={styles.goalProgressBar}>
                        <View style={[styles.goalProgressFill, { 
                          width: `${(streaksGoalsData.monthlyProgress.daysActive / streaksGoalsData.monthlyProgress.goalDays) * 100}%` 
                        }]} />
                      </View>
                    </View>
                    <View style={styles.goalReward}>
                      <Text style={styles.goalRewardText}>Reward: 70 points</Text>
                      {streaksGoalsData.monthlyProgress.isCompleted ? (
                        <TouchableOpacity 
                          style={[styles.claimButton, { backgroundColor: '#10b981' }]}
                          onPress={() => claimReward('monthly')}
                        >
                          <Ionicons name="gift" size={16} color="white" />
                          <Text style={styles.claimButtonText}>Claim Reward</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.claimButton, { backgroundColor: '#94a3b8' }]}>
                          <Ionicons name="lock-closed" size={16} color="white" />
                          <Text style={styles.claimButtonText}>Locked</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Total Points */}
                <View style={styles.pointsSection}>
                  <View style={styles.pointsCard}>
                    <Ionicons name="star" size={32} color="#f59e0b" />
                    <Text style={styles.pointsTitle}>Total Points</Text>
                    <Text style={styles.pointsValue}>{streaksGoalsData.totalPoints}</Text>
                  </View>
                </View>

                {/* Achievements */}
                <View style={styles.achievementsSection}>
                  <Text style={styles.goalsSectionTitle}>Achievements</Text>
                  <View style={styles.achievementsGrid}>
                    {streaksGoalsData.achievements.map((achievement, index) => (
                      <View key={index} style={[styles.achievementCard, { 
                        backgroundColor: achievement.earned ? '#f0fdf4' : '#f8fafc',
                        borderColor: achievement.earned ? '#10b981' : '#e2e8f0'
                      }]}>
                        <Ionicons 
                          name={achievement.icon as any} 
                          size={24} 
                          color={achievement.earned ? '#10b981' : '#94a3b8'} 
                        />
                        <Text style={[styles.achievementName, { 
                          color: achievement.earned ? '#059669' : '#64748b' 
                        }]}>
                          {achievement.name}
                        </Text>
                        <Text style={[styles.achievementDescription, { 
                          color: achievement.earned ? '#047857' : '#94a3b8' 
                        }]}>
                          {achievement.description}
                        </Text>
                        <Text style={[styles.achievementPoints, { 
                          color: achievement.earned ? '#059669' : '#94a3b8' 
                        }]}>
                          +{achievement.points} pts
                        </Text>
                        {achievement.earned && (
                          <View style={styles.goalAchievementBadge}>
                            <Ionicons name="checkmark" size={16} color="#10b981" />
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Usage Stats */}
                <View style={styles.usageSection}>
                  <Text style={styles.goalsSectionTitle}>Usage Statistics</Text>
                  <View style={styles.usageCard}>
                    <View style={styles.usageItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.usageLabel}>Analyses Used</Text>
                      <Text style={styles.usageValue}>{streaksGoalsData.userUsage}</Text>
                    </View>
                    <View style={styles.usageItem}>
                      <Ionicons name="gift" size={20} color="#3b82f6" />
                      <Text style={styles.usageLabel}>Available Quota</Text>
                      <Text style={styles.usageValue}>{streaksGoalsData.availableUsage}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Data Available</Text>
                <Text style={styles.emptyStateMessage}>
                  Start analyzing hands to see your streaks and goals here
                </Text>
              </View>
            )}
          </ThemedView>
        </Modal>

        {/* Daily Quiz Modal */}
        <DailyQuizModal
          visible={quizModalVisible}
          onClose={handleQuizModalClose}
          onRewardEarned={handleQuizRewardEarned}
        />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  solverButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 35,
  },
  section_quick: {
    paddingHorizontal: 20,
    marginBottom: 80
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  gameModeContainer: {
    gap: 16,
  },
  gameModeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1 }],
  },
  gameModeCardSelected: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  gameModeGradient: {
    padding: 20,
    position: 'relative',
  },
  gameModeGradientSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  gameModeHeader: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    marginBottom: 12,
  },
  accuracyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  accuracyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gameModeContent: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gameModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 3,
  },
  gameModeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  gameModeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 20
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  selectionText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  navigateIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  navigateText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  selectionBanner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  bannerButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)', // This will be overridden inline
    borderWidth: 1,
  },
  bannerButtonSecondaryText: {
    // Color will be set inline dynamically
  },
  startTrainingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startTrainingText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  sessionsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionGameType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionGamePot: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionAccuracy: {
    fontSize: 16,
    fontWeight: '600',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  toolCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  toolSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  toolIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0ea5e9',
  },
  toolActionButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toolActionText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '700',
  },
  rewardContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  rewardText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  dotActive: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  progressList: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  progressPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  gameTypeContainer: {
    marginBottom: 12,
  },
  gameTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gameTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievementsContainer: {
    marginBottom: 12,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  achievementText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  analysesContainer: {
    marginTop: 8,
  },
  analysesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  analysisItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  analysisAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  analysisConfidence: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  analysisNotes: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Raffle Modal styles
  raffleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  raffleModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  raffleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  raffleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  raffleCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  raffleContent: {
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: 'center',
    minHeight: 240,
    justifyContent: 'center',
  },
  spinningContainer: {
    alignItems: 'center',
  },
  spinningWheel: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  spinningText: {
    fontSize: 17,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  spinningDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  spinningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
  },
  spinningDot1: {
    opacity: 0.4,
  },
  spinningDot2: {
    opacity: 0.7,
  },
  spinningDot3: {
    opacity: 1,
  },
  raffleRewardContainer: {
    alignItems: 'center',
  },
  celebrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  celebrationIcon1: {
    position: 'absolute',
    left: -20,
    top: -10,
  },
  celebrationIcon2: {
    position: 'absolute',
    right: -20,
    bottom: -10,
  },
  rewardIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  rewardMessage: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  rewardAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0ea5e9',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(14, 165, 233, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rewardDescription: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 16,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 6,
  },
  rewardBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  raffleFooter: {
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  raffleActionButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  raffleActionText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  navigationContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
  },
  // Streaks & Goals Modal styles
  streaksGoalsContent: {
    flex: 1,
    padding: 20,
  },
  streakSection: {
    marginBottom: 24,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f59e0b',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '600',
  },
  streakProgress: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  streakProgressBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  streakGoal: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  goalSection: {
    marginBottom: 24,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  goalProgress: {
    marginBottom: 16,
  },
  goalProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  goalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  goalReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalRewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pointsSection: {
    marginBottom: 24,
  },
  pointsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f59e0b',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  goalsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    position: 'relative',
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  achievementPoints: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalAchievementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usageSection: {
    marginBottom: 24,
  },
  usageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  usageLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
});

// Navigation Overlay Component
const NavigationOverlay = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;
  
  return (
    <View style={styles.navigationOverlay}>
      <View style={styles.navigationContainer}>
        <MaterialIcons name="center-focus-strong" size={40} color="#1a73e8" />
        <Text style={styles.navigationText}>Opening GTO Solver...</Text>
      </View>
    </View>
  );
};
