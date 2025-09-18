import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
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
