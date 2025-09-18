import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  accuracy: number;
  handsPlayed: number;
  studyTime: string;
  totalSessions: number;
  bestAccuracy: number;
  lastSession: string;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    accuracy: 87,
    handsPlayed: 1247,
    studyTime: '24h',
    totalSessions: 15,
    bestAccuracy: 95,
    lastSession: '2 hours ago'
  });
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, you would fetch these stats from your backend
  // For now, we'll use mock data that can be easily replaced
  useEffect(() => {
    if (user) {
      // fetchUserStats();
      // For now, using mock data
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiService.getUserStats(user.id);
      // setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    fetchUserStats();
  };

  return {
    stats,
    isLoading,
    refreshStats
  };
}; 