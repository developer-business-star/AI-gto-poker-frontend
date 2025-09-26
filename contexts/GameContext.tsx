import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import ApiService, { UserPreferences } from '@/services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GameFormat = 'cash' | 'tournaments';
export type StackSize = '50bb' | '100bb' | '200bb' | '300bb+';
export type AnalysisSpeed = 'slow' | 'fast' | 'instant' | 'adaptive';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SessionLength = '15min' | '30min' | '45min' | '60min' | 'custom';
export type FocusArea = 'preflop' | 'flop' | 'turn' | 'river' | 'bluffing' | 'value_betting' | 'position' | 'stack_sizes';

interface GameContextType {
  selectedFormat: GameFormat;
  setSelectedFormat: (format: GameFormat) => void;
  formatDisplayName: string;
  selectedStackSize: StackSize;
  setSelectedStackSize: (stackSize: StackSize) => void;
  stackSizeDisplayName: string;
  selectedAnalysisSpeed: AnalysisSpeed;
  setSelectedAnalysisSpeed: (analysisSpeed: AnalysisSpeed) => void;
  analysisSpeedDisplayName: string;
  selectedDifficultyLevel: DifficultyLevel;
  setSelectedDifficultyLevel: (difficultyLevel: DifficultyLevel) => void;
  difficultyLevelDisplayName: string;
  selectedSessionLength: SessionLength;
  setSelectedSessionLength: (sessionLength: SessionLength) => void;
  sessionLengthDisplayName: string;
  sessionDurationMinutes: number;
  selectedFocusAreas: FocusArea[];
  setSelectedFocusAreas: (focusAreas: FocusArea[]) => void;
  focusAreasDisplayName: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('cash');
  const [selectedStackSize, setSelectedStackSize] = useState<StackSize>('100bb');
  const [selectedAnalysisSpeed, setSelectedAnalysisSpeed] = useState<AnalysisSpeed>('fast');
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState<DifficultyLevel>('advanced');
  const [selectedSessionLength, setSelectedSessionLength] = useState<SessionLength>('30min');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<FocusArea[]>(['preflop', 'turn']);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  const formatDisplayName = selectedFormat === 'cash' ? 'Cash Games' : 'Spin & Go';
  const stackSizeDisplayName = selectedStackSize;
  const analysisSpeedDisplayName = selectedAnalysisSpeed.charAt(0).toUpperCase() + selectedAnalysisSpeed.slice(1);
  const difficultyLevelDisplayName = selectedDifficultyLevel.charAt(0).toUpperCase() + selectedDifficultyLevel.slice(1);
  const sessionLengthDisplayName = selectedSessionLength === 'custom' ? 'Custom' : selectedSessionLength;
  
  // Convert session length to minutes for actual timing
  const getSessionDurationMinutes = (sessionLength: SessionLength): number => {
    switch (sessionLength) {
      case '15min': return 15;
      case '30min': return 30;
      case '45min': return 45;
      case '60min': return 60;
      case 'custom': return 30; // Default for custom
      default: return 30;
    }
  };
  
  const sessionDurationMinutes = getSessionDurationMinutes(selectedSessionLength);
  
  // Format focus areas display name
  const focusAreasDisplayName = selectedFocusAreas.length === 0 
    ? 'None' 
    : selectedFocusAreas.length === 1 
      ? selectedFocusAreas[0].charAt(0).toUpperCase() + selectedFocusAreas[0].slice(1).replace('_', ' ')
      : selectedFocusAreas.length <= 2
        ? selectedFocusAreas.map(area => area.charAt(0).toUpperCase() + area.slice(1).replace('_', ' ')).join(', ')
        : `${selectedFocusAreas.length} areas`;

  // Load preferences from backend when user is available
  useEffect(() => {
    if (user?.id && token) {
      loadUserPreferences();
    }
  }, [user?.id, token]);

  // Load user preferences from backend
  const loadUserPreferences = async () => {
    if (!user?.id || !token) return;
    
    try {
      setIsLoadingPreferences(true);
      console.log('🔄 Loading user preferences from backend...');
      
      // For now, we'll load from the user object if it has preferences
      // In the future, we can add a dedicated endpoint to fetch preferences
      if (user.preferences) {
        const prefs = user.preferences as any;
        if (prefs.gameFormat) setSelectedFormat(prefs.gameFormat);
        if (prefs.stackSize) setSelectedStackSize(prefs.stackSize);
        if (prefs.analysisSpeed) setSelectedAnalysisSpeed(prefs.analysisSpeed);
        if (prefs.difficultyLevel) setSelectedDifficultyLevel(prefs.difficultyLevel);
        if (prefs.sessionLength) setSelectedSessionLength(prefs.sessionLength);
        if (prefs.focusAreas) setSelectedFocusAreas(prefs.focusAreas);
        console.log('✅ User preferences loaded from backend');
      }
    } catch (error) {
      console.error('❌ Error loading user preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Save preferences to backend
  const savePreferencesToBackend = async (preferences: Partial<UserPreferences>) => {
    if (!user?.id || !token) return;
    
    try {
      console.log('💾 Saving preferences to backend:', preferences);
      await ApiService.updateUserPreferences(user.id, preferences, token);
      console.log('✅ Preferences saved to backend');
    } catch (error) {
      console.error('❌ Error saving preferences to backend:', error);
      // Don't throw error to avoid breaking the UI
    }
  };

  // Enhanced setters that save to backend
  const setSelectedFormatWithSave = (format: GameFormat) => {
    setSelectedFormat(format);
    savePreferencesToBackend({ gameFormat: format });
  };

  const setSelectedStackSizeWithSave = (stackSize: StackSize) => {
    setSelectedStackSize(stackSize);
    savePreferencesToBackend({ stackSize });
  };

  const setSelectedAnalysisSpeedWithSave = (analysisSpeed: AnalysisSpeed) => {
    setSelectedAnalysisSpeed(analysisSpeed);
    savePreferencesToBackend({ analysisSpeed });
  };

  const setSelectedDifficultyLevelWithSave = (difficultyLevel: DifficultyLevel) => {
    setSelectedDifficultyLevel(difficultyLevel);
    savePreferencesToBackend({ difficultyLevel });
  };

  const setSelectedSessionLengthWithSave = (sessionLength: SessionLength) => {
    setSelectedSessionLength(sessionLength);
    savePreferencesToBackend({ sessionLength });
  };

  const setSelectedFocusAreasWithSave = (focusAreas: FocusArea[]) => {
    setSelectedFocusAreas(focusAreas);
    savePreferencesToBackend({ focusAreas });
  };

  return (
    <GameContext.Provider value={{
      selectedFormat,
      setSelectedFormat: setSelectedFormatWithSave,
      formatDisplayName,
      selectedStackSize,
      setSelectedStackSize: setSelectedStackSizeWithSave,
      stackSizeDisplayName,
      selectedAnalysisSpeed,
      setSelectedAnalysisSpeed: setSelectedAnalysisSpeedWithSave,
      analysisSpeedDisplayName,
      selectedDifficultyLevel,
      setSelectedDifficultyLevel: setSelectedDifficultyLevelWithSave,
      difficultyLevelDisplayName,
      selectedSessionLength,
      setSelectedSessionLength: setSelectedSessionLengthWithSave,
      sessionLengthDisplayName,
      sessionDurationMinutes,
      selectedFocusAreas,
      setSelectedFocusAreas: setSelectedFocusAreasWithSave,
      focusAreasDisplayName
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 