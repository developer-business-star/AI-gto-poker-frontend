import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HapticContextType {
  hapticEnabled: boolean;
  toggleHaptic: () => void;
  triggerHaptic: (type: HapticType) => void;
}

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const HapticContext = createContext<HapticContextType | undefined>(undefined);

export const HapticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Load haptic preference on mount
  useEffect(() => {
    loadHapticPreference();
  }, []);

  const loadHapticPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('hapticEnabled');
      if (saved !== null) {
        setHapticEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading haptic preference:', error);
    }
  };

  const toggleHaptic = async () => {
    const newValue = !hapticEnabled;
    setHapticEnabled(newValue);
    
    // Save preference
    try {
      await AsyncStorage.setItem('hapticEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving haptic preference:', error);
    }
  };

  const triggerHaptic = (type: HapticType) => {
    if (!hapticEnabled) return;

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  return (
    <HapticContext.Provider value={{ hapticEnabled, toggleHaptic, triggerHaptic }}>
      {children}
    </HapticContext.Provider>
  );
};

export const useHaptic = (): HapticContextType => {
  const context = useContext(HapticContext);
  if (context === undefined) {
    throw new Error('useHaptic must be used within a HapticProvider');
  }
  return context;
};
