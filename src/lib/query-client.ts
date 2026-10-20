import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// A phone app has no window focus: data counts as focused while the app is in the foreground.
// Stale data refreshes when the app comes back, and refetch intervals pause in the background.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) =>
    handleFocus(state === 'active'),
  );
  return () => subscription.remove();
});

export const queryKeys = {
  me: ['me'] as const,
  taste: ['taste'] as const,
  settings: ['settings'] as const,
  usernameAvailability: (username: string) => ['username-availability', username] as const,
  /** Everything about events; invalidated when the database reports a change (D-007/2). */
  events: ['events'] as const,
  nearbyEvents: (lat: number, lng: number) => ['events', 'nearby', lat, lng] as const,
  event: (id: string) => ['events', 'detail', id] as const,
};
