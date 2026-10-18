import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export const queryKeys = {
  me: ['me'] as const,
  usernameAvailability: (username: string) => ['username-availability', username] as const,
};
