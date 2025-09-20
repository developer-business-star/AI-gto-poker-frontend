import React, { createContext, useContext, useState } from 'react';

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
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('cash');
  const [selectedStackSize, setSelectedStackSize] = useState<StackSize>('100bb');
  const [selectedAnalysisSpeed, setSelectedAnalysisSpeed] = useState<AnalysisSpeed>('fast');
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState<DifficultyLevel>('advanced');
  const [selectedSessionLength, setSelectedSessionLength] = useState<SessionLength>('30min');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<FocusArea[]>(['preflop', 'turn']);

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

  return (
    <GameContext.Provider value={{
      selectedFormat,
      setSelectedFormat,
      formatDisplayName,
      selectedStackSize,
      setSelectedStackSize,
      stackSizeDisplayName,
      selectedAnalysisSpeed,
      setSelectedAnalysisSpeed,
      analysisSpeedDisplayName,
      selectedDifficultyLevel,
      setSelectedDifficultyLevel,
      difficultyLevelDisplayName,
      selectedSessionLength,
      setSelectedSessionLength,
      sessionLengthDisplayName,
      sessionDurationMinutes,
      selectedFocusAreas,
      setSelectedFocusAreas,
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