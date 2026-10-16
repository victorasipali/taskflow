import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { queryClient } from '@/services/queryClient';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Route protection lives here. Stack.Protected removes the guarded screens
 * from the navigator entirely, so an unauthenticated user cannot reach them
 * by deep link or by manipulating navigation state — they are redirected.
 */
function RootNavigator() {
  const { session, isRestoring } = useAuth();
  const isSignedIn = session !== null;

  useEffect(() => {
    if (!isRestoring) void SplashScreen.hideAsync();
  }, [isRestoring]);

  // Keep the splash screen up until we know whether a saved session exists.
  if (isRestoring) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
        <Stack.Screen name="project/form" options={{ title: 'Project', presentation: 'modal' }} />
        <Stack.Screen name="task/[id]" options={{ title: 'Task' }} />
        <Stack.Screen name="task/form" options={{ title: 'Task', presentation: 'modal' }} />
        <Stack.Screen name="weather" options={{ title: 'Weather' }} />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
