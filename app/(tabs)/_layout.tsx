import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/contexts/ThemeContext';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  
  // Add fallback for theme context
  let colors, isDark;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDark = theme.isDark;
  } catch (error) {
    // Fallback to default colors if theme context is not available
    colors = {
      primary: '#007AFF',
      textSecondary: '#8E8E93',
      surface: '#FFFFFF',
      border: '#C6C6C8'
    };
    isDark = false;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: t('navigation.training'),
          tabBarIcon: ({ color }) => <FontAwesome5 name="graduation-cap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('navigation.solver'),
          tabBarIcon: ({ color }) => <MaterialIcons name="center-focus-strong" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('navigation.stats'),
          tabBarIcon: ({ color }) => <Ionicons name="analytics" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
