import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { StyledAlertProvider } from '@/components/StyledAlert';
import { GameProvider } from '@/contexts/GameContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { HapticProvider } from '@/contexts/HapticContext';
import { useColorScheme } from '@/hooks/useColorScheme';
// Initialize i18n
import '@/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <HapticProvider>
        <StyledAlertProvider>
          <AuthProvider>
            <GameProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </GameProvider>
          </AuthProvider>
        </StyledAlertProvider>
      </HapticProvider>
    </CustomThemeProvider>
  );
}
