import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeUsername, usernameSchema } from '@shared/contracts/profile';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useDebouncedValue } from '@/lib/use-debounced-value';

function isValidUsername(username: string) {
  return usernameSchema.safeParse(username).success;
}

/**
 * The username field of a new profile: D-004 rules, a live availability check, and D-008/5:
 * names too close to a verified partner's are refused with their own message.
 */
export function useUsernameField(initial = '') {
  const { t } = useTranslation();
  const [input, setInput] = useState(initial);
  const username = normalizeUsername(input);
  const debouncedUsername = useDebouncedValue(username, 400);
  const availability = useQuery({
    queryKey: queryKeys.usernameAvailability(debouncedUsername),
    queryFn: () => api.checkUsername(debouncedUsername),
    enabled: isValidUsername(debouncedUsername),
  });
  const isChecking =
    isValidUsername(username) && (debouncedUsername !== username || availability.isFetching);
  const isAvailable = !isChecking && availability.data === 'available';

  let error: string | null = null;
  let hint: string | null = t('onboarding.usernameRules');
  if (input.length > 0 && !isValidUsername(username)) {
    error = t('onboarding.usernameRules');
  } else if (isChecking) {
    hint = t('onboarding.usernameChecking');
  } else if (availability.data === 'taken') {
    error = t('onboarding.usernameTaken');
  } else if (availability.data === 'protected') {
    error = t('partners.nameProtected');
  } else if (isAvailable) {
    hint = t('onboarding.usernameAvailable');
  }

  return {
    input,
    setInput: (value: string) => setInput(value.toLowerCase()),
    username,
    isAvailable,
    error,
    hint,
    hintTone: isAvailable ? ('success' as const) : ('muted' as const),
    recheck: () => void availability.refetch(),
  };
}
