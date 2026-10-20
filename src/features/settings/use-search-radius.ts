import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_RADIUS_KM, type UserSettings } from '@shared/contracts/settings';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

/** Q6: the search radius from the map's slider, saved on the server for every device. */
export function useSearchRadius() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings });

  const save = useMutation({
    // One at a time, so a quick second slide cannot be overtaken by the first one.
    scope: { id: 'settings' },
    mutationFn: (searchRadiusKm: number) => api.saveSettings({ searchRadiusKm }),
    onMutate: async (searchRadiusKm) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings });
      const previous = queryClient.getQueryData<UserSettings>(queryKeys.settings);
      queryClient.setQueryData<UserSettings>(queryKeys.settings, { searchRadiusKm });
      return { previous };
    },
    onError: (_error, _radius, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.settings, context.previous);
      }
    },
    onSuccess: (saved) => queryClient.setQueryData(queryKeys.settings, saved),
  });

  return {
    radiusKm: settings.data?.searchRadiusKm ?? DEFAULT_RADIUS_KM,
    /** Until then the default would be a guess; on an error the default is used. */
    isLoaded: !settings.isPending,
    setRadiusKm: (radiusKm: number, onSettled?: () => void) => save.mutate(radiusKm, { onSettled }),
    saveFailed: save.isError,
  };
}
