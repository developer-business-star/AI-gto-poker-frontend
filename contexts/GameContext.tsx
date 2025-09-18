import React, { createContext, useContext, useState } from 'react';

export type GameFormat = 'cash' | 'tournaments';

interface GameContextType {
  selectedFormat: GameFormat;
  setSelectedFormat: (format: GameFormat) => void;
  formatDisplayName: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('cash');

  const formatDisplayName = selectedFormat === 'cash' ? 'Cash Games' : 'Spin & Go';

  return (
    <GameContext.Provider value={{
      selectedFormat,
      setSelectedFormat,
      formatDisplayName
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