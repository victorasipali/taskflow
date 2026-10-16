import NetInfo from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

// Tell React Query when the device goes on/offline so it pauses and resumes requests correctly.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

// Refetch stale data when the user returns to the app.
AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
      // "offlineFirst" lets our query functions run and fall back to the local cache when offline.
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  tasks: (scope: string) => ['tasks', scope] as const,
  task: (id: string) => ['task', id] as const,
  weather: (lat: number, lon: number) => ['weather', lat.toFixed(2), lon.toFixed(2)] as const,
};
