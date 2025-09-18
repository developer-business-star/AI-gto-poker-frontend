import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

interface UserSessionData {
  recentSessionCash: {
    date: string;
    gamePot: string;
    recommendedAction: string;
    confidence: number;
    analysisNotes: string;
  };
  recentSessionSpinAndGo: {
    date: string;
    gamePot: string;
    recommendedAction: string;
    confidence: number;
    analysisNotes: string;
  };
}

interface ComprehensiveStats {
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
}

export default function StatsScreen() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [userSessionData, setUserSessionData] = useState<UserSessionData | null>(null);
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // API Configuration
  const API_BASE_URL = API_CONFIG.BASE_URL;

  // Fetch comprehensive user statistics
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

  // Reset stats function
  const handleResetStats = async () => {
    if (!user?.id) return;

    // Show confirmation dialog
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset your statistics? This action will refresh your data from the server.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              setError(null);

              console.log('🔄 Resetting statistics...');
              
              // Call getComprehensiveStats to refresh the data
              await fetchComprehensiveStats();
              
              // Also refresh session data
              await fetchUserSessionData();
              
              console.log('✅ Statistics reset successfully');
              
              // Show success message
              Alert.alert(
                'Success',
                'Your statistics have been refreshed successfully!',
                [{ text: 'OK' }]
              );
              
            } catch (err) {
              console.error('❌ Error resetting statistics:', err);
              
              let errorMessage = 'Failed to reset statistics';
              
              if (err instanceof Error) {
                if (err.name === 'AbortError') {
                  errorMessage = 'Request timed out. Please check your connection.';
                } else if (err.message.includes('Network request failed')) {
                  errorMessage = 'Network error. Please check if the backend server is running.';
                } else {
                  errorMessage = err.message;
                }
              }
              
              Alert.alert(
                'Reset Failed',
                errorMessage,
                [{ text: 'OK' }]
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  // Fetch user session data from database
  const fetchUserSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!token || !user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Fetching user session data...', {
        userId: user.id,
        apiUrl: `${API_BASE_URL}/analysis/user-sessions/${user.id}`,
        hasToken: !!token
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/analysis/user-sessions/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Session data received:', data);
      
      if (data.success) {
        setUserSessionData(data.sessions);
      } else {
        throw new Error(data.error || 'Failed to fetch session data');
      }

    } catch (err) {
      console.error('❌ Error fetching user session data:', err);
      
      let errorMessage = 'Failed to load session data';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check if the backend server is running.';
        } else if (err.message.includes('User not authenticated')) {
          errorMessage = 'Please log in again to view your stats.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load comprehensive stats when user is authenticated
  useEffect(() => {
    if (!authLoading && user && token) {
      fetchComprehensiveStats();
      // Also fetch legacy session data for compatibility
      fetchUserSessionData();
    } else if (!authLoading && (!user || !token)) {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [authLoading, user, token]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Convert user session data to display format
  const recentSessions = userSessionData ? [
    userSessionData.recentSessionCash.date ? {
      date: formatDate(userSessionData.recentSessionCash.date),
      gameType: 'Cash',
      gamePot: userSessionData.recentSessionCash.gamePot,
      confidence: userSessionData.recentSessionCash.confidence,
      recommendedAction: userSessionData.recentSessionCash.recommendedAction,
    } : null,
    userSessionData.recentSessionSpinAndGo.date ? {
      date: formatDate(userSessionData.recentSessionSpinAndGo.date),
      gameType: 'Spin & Go',
      gamePot: userSessionData.recentSessionSpinAndGo.gamePot,
      confidence: userSessionData.recentSessionSpinAndGo.confidence,
      recommendedAction: userSessionData.recentSessionSpinAndGo.recommendedAction,
    } : null,
  ].filter(Boolean) : [];

  // Fallback data when API is not available
  const fallbackSessions = [
    { date: '2h ago', gameType: 'Cash', gamePot: '45BB', confidence: 91, recommendedAction: '+2.3bb' },
    { date: '1d ago', gameType: 'Spin & Go', gamePot: '23BB', confidence: 87, recommendedAction: '+0.8bb' },
    { date: '3d ago', gameType: 'Training', gamePot: '89BB', confidence: 94, recommendedAction: 'Study' },
  ];

  // Use fallback data if no real data and no error (API might be down)
  const displaySessions = recentSessions.length > 0 ? recentSessions : fallbackSessions;

  // Generate stats from real data or fallback
  const overallStats: StatCard[] = comprehensiveStats ? [
    {
      title: 'Overall Accuracy',
      value: `${comprehensiveStats.overallAccuracy}%`,
      subtitle: comprehensiveStats.accuracyChange > 0 
        ? `+${comprehensiveStats.accuracyChange}% this week`
        : comprehensiveStats.accuracyChange < 0 
        ? `${comprehensiveStats.accuracyChange}% this week`
        : 'No change this week',
      icon: 'target',
      color: '#22c55e'
    },
    {
      title: 'Hands Played',
      value: comprehensiveStats.handsPlayed.toLocaleString(),
      subtitle: `${comprehensiveStats.handsThisWeek} this week`,
      icon: 'gamecontroller.fill',
      color: '#3b82f6'
    },
    {
      title: 'Study Time',
      value: comprehensiveStats.studyTime,
      subtitle: `${comprehensiveStats.studyTimeThisWeek} this week`,
      icon: 'clock.fill',
      color: '#f59e0b'
    },
    {
      title: 'Win Rate',
      value: comprehensiveStats.winRate,
      subtitle: comprehensiveStats.winRateFormat,
      icon: 'chart.line.uptrend.xyaxis',
      color: '#8b5cf6'
    },
  ] : [
    // Fallback data when no comprehensive stats available
    {
      title: 'Overall Accuracy',
      value: '87%',
      subtitle: '+5% this week',
      icon: 'target',
      color: '#22c55e'
    },
    {
      title: 'Hands Played',
      value: '1,247',
      subtitle: '156 this week',
      icon: 'gamecontroller.fill',
      color: '#3b82f6'
    },
    {
      title: 'Study Time',
      value: '24h',
      subtitle: '3.2h this week',
      icon: 'clock.fill',
      color: '#f59e0b'
    },
    {
      title: 'Win Rate',
      value: '+12bb/100',
      subtitle: 'Cash games',
      icon: 'chart.line.uptrend.xyaxis',
      color: '#8b5cf6'
    },
  ];

  // Use real position stats or fallback
  const positionStats = comprehensiveStats?.positionStats || [
    { position: 'Button', accuracy: 92, hands: 198, color: '#22c55e' },
    { position: 'Cut-off', accuracy: 89, hands: 167, color: '#3b82f6' },
    { position: 'Big Blind', accuracy: 84, hands: 234, color: '#f59e0b' },
    { position: 'Small Blind', accuracy: 78, hands: 201, color: '#ef4444' },
    { position: 'UTG', accuracy: 86, hands: 145, color: '#8b5cf6' },
  ];

  const StatCardComponent = ({ stat }: { stat: StatCard }) => {
    // Map stat types to appropriate Ionicons
    const getIconName = (title: string) => {
      switch (title) {
        case 'Overall Accuracy':
          return 'checkmark-circle';
        case 'Hands Played':
          return 'play-circle';
        case 'Study Time':
          return 'time';
        case 'Win Rate':
          return 'trending-up';
        default:
          return 'help-circle';
      }
    };

    return (
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
            <Ionicons 
              name={getIconName(stat.title) as any} 
              size={20} 
              color={stat.color} 
            />
          </View>
          <Text style={styles.statTitle}>{stat.title}</Text>
        </View>
        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
        <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
      </View>
    );
  };

  const PositionBar = ({ position, accuracy, hands, color }: any) => (
    <View style={styles.positionRow}>
      <View style={styles.positionInfo}>
        <Text style={styles.positionName}>{position}</Text>
        <Text style={styles.positionHands}>{hands} hands</Text>
      </View>
      <View style={styles.positionBar}>
        <View 
          style={[
            styles.positionProgress, 
            { width: `${accuracy}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={[styles.positionAccuracy, { color }]}>{accuracy}%</Text>
    </View>
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Checking authentication...' : 'Loading your stats...'}
          </Text>
        </View>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Failed to Load Stats</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            fetchComprehensiveStats();
            fetchUserSessionData();
          }}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Performance Analytics</ThemedText>
          <ThemedText style={styles.subtitle}>Track your GTO progress</ThemedText>
        </View>

        {/* Overall Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {overallStats.map((stat, index) => (
              <StatCardComponent key={index} stat={stat} />
            ))}
          </View>
        </View>

        {/* Position Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position Analysis</Text>
          <View style={styles.positionChart}>
            {positionStats.map((position, index) => (
              <PositionBar
                key={index}
                position={position.position}
                accuracy={position.accuracy}
                hands={position.hands}
                color={position.color}
              />
            ))}
          </View>
        </View>

        {/* Accuracy Trend */}
        <View style={styles.section}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionTitle}>Accuracy Trend</Text>
            <View style={styles.trendPeriod}>
              <Text style={styles.trendPeriodText}>Last 7 days</Text>
            </View>
          </View>
          <View style={styles.trendChart}>
            <View style={styles.trendContent}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                <Text style={styles.yAxisLabel}>100%</Text>
                <Text style={styles.yAxisLabel}>75%</Text>
                <Text style={styles.yAxisLabel}>50%</Text>
                <Text style={styles.yAxisLabel}>25%</Text>
              </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                {/* Grid lines */}
                <View style={styles.gridLines}>
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                </View>
                
                {/* Data points with connecting line */}
                <View style={styles.trendLineContainer}>
                  {comprehensiveStats?.accuracyTrend ? 
                    comprehensiveStats.accuracyTrend.slice(-5).map((point, index) => {
                      if (point.accuracy === null) {
                        return (
                          <View key={index} style={styles.dataPointContainer}>
                            <View style={[styles.trendDataPoint, { 
                              bottom: '10%', 
                              backgroundColor: '#d1d5db',
                              opacity: 0.3 
                            }]} />
                            <Text style={styles.dataValue}>-</Text>
                          </View>
                        );
                      }
                      
                      const bottomPosition = `${Math.max(10, Math.min(90, point.accuracy))}%`;
                      const pointColor = point.accuracy >= 85 ? '#22c55e' : 
                                       point.accuracy >= 70 ? '#f59e0b' : '#ef4444';
                      
                      return (
                        <View key={index} style={styles.dataPointContainer}>
                          <View style={[styles.trendDataPoint, { 
                            bottom: bottomPosition as any, 
                            backgroundColor: pointColor 
                          }]} />
                          <Text style={styles.dataValue}>{point.accuracy}%</Text>
                        </View>
                      );
                    })
                    :
                    // Fallback trend data
                    [
                      { accuracy: 87, bottom: '75%', color: '#3b82f6' },
                      { accuracy: 73, bottom: '60%', color: '#f59e0b' },
                      { accuracy: 91, bottom: '80%', color: '#22c55e' },
                      { accuracy: 94, bottom: '85%', color: '#22c55e' },
                      { accuracy: 92, bottom: '82%', color: '#22c55e' },
                    ].map((point, index) => (
                      <View key={index} style={styles.dataPointContainer}>
                        <View style={[styles.trendDataPoint, { 
                          bottom: point.bottom as any, 
                          backgroundColor: point.color 
                        }]} />
                        <Text style={styles.dataValue}>{point.accuracy}%</Text>
                      </View>
                    ))
                  }
                </View>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.trendLabels}>
              <Text style={styles.trendLabel}>Mon</Text>
              <Text style={styles.trendLabel}>Tue</Text>
              <Text style={styles.trendLabel}>Wed</Text>
              <Text style={styles.trendLabel}>Thu</Text>
              <Text style={styles.trendLabel}>Fri</Text>
            </View>
            
            {/* Summary stats */}
            <View style={styles.trendSummary}>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-up" size={16} color="#22c55e" />
                <Text style={styles.summaryText}>+7% this week</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={16} color="#6b7280" />
                <Text style={styles.summaryText}>5 sessions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {recentSessions.length === 0 && !error && (
              <Text style={styles.fallbackNote}>Sample data (API unavailable)</Text>
            )}
          </View>
          <View style={styles.sessionsList}>
            {comprehensiveStats?.recentSessions && comprehensiveStats.recentSessions.length > 0 ? (
              comprehensiveStats.recentSessions.map((session, index) => (
                <View key={index} style={styles.sessionItem}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionGame}>{session.gameType}</Text>
                    <Text style={styles.sessionDetails}>
                      {session.recommendedAction} • {session.confidence}% confidence
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={[
                      styles.sessionResult,
                      { color: session.confidence >= 85 ? '#22c55e' : 
                               session.confidence >= 70 ? '#f59e0b' : '#ef4444' }
                    ]}>
                      {session.result}
                    </Text>
                    <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                  </View>
                </View>
              ))
            ) : displaySessions.length > 0 ? (
              displaySessions.map((session, index) => session ? (
                <View key={index} style={styles.sessionItem}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionGame}>{session.gameType}</Text>
                    <Text style={styles.sessionDetails}>
                      {session.gamePot} • {session.confidence}% accuracy
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={[
                      styles.sessionResult,
                      { color: session.recommendedAction.includes('+') ? '#22c55e' : 
                               session.recommendedAction.includes('-') ? '#ef4444' : '#666' }
                    ]}>
                      {session.recommendedAction}
                    </Text>
                    <Text style={styles.sessionDate}>{session.date}</Text>
                  </View>
                </View>
              ) : null)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="game-controller-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Recent Sessions</Text>
                <Text style={styles.emptyStateMessage}>
                  Start playing games to see your session history here
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section_quick}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, resetting && styles.actionButtonDisabled]} 
              onPress={handleResetStats}
              disabled={resetting}
            >
              {resetting ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="refresh" size={20} color="#007AFF" />
              )}
              <Text style={[styles.actionText, resetting && styles.actionTextDisabled]}>
                {resetting ? 'Resetting...' : 'Reset Stats'}
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  section_quick: {
    paddingHorizontal: 20,
    marginBottom: 80
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  positionChart: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionInfo: {
    width: 80,
  },
  positionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  positionHands: {
    fontSize: 12,
    color: '#666',
  },
  positionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  positionProgress: {
    height: '100%',
    borderRadius: 4,
  },
  positionAccuracy: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  trendChart: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  trendContent: {
    flexDirection: 'row',
    height: 100,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    width: 40,
    height: 100,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    marginLeft: 10,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  trendLineContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  dataPointContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  trendDataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dataValue: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
    marginTop: 4,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
  },
  sessionsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionLeft: {
    flex: 1,
  },
  sessionGame: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sessionDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionResult: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionTextDisabled: {
    color: '#999',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendPeriod: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  trendPeriodText: {
    fontSize: 14,
    color: '#666',
  },
  trendSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fallbackNote: {
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
}); 