import { useQuery } from '@tanstack/react-query';

import { localeFor } from '@/features/events/format';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

/** D-008/23: the applications waiting for the team; asked again whenever a screen opens. */
export function usePartnerApplications() {
  return useQuery({
    queryKey: queryKeys.partnerApplications,
    queryFn: api.getPartnerApplications,
    refetchOnMount: 'always',
  });
}

/** "2026. október 23. 20:30" in the phone's time zone. */
export function formatSubmittedAt(submittedAt: string, language: string): string {
  return new Date(submittedAt).toLocaleString(localeFor(language), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
