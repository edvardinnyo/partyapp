import { create } from 'zustand';

import { LAUNCH_CITY_CENTER, type Position } from './position';

/** `checking` until we know; `unavailable` when the permission is denied or there is no fix. */
export type LocationStatus = 'checking' | 'granted' | 'unavailable';

type LocationState = {
  status: LocationStatus;
  position: Position | null;
  setStatus: (status: LocationStatus) => void;
  setPosition: (position: Position) => void;
};

/** In memory only: the position is never saved on the phone or sent anywhere unrounded. */
export const useLocationStore = create<LocationState>()((set) => ({
  status: 'checking',
  position: null,
  setStatus: (status) => set({ status }),
  setPosition: (position) => set({ position, status: 'granted' }),
}));

/**
 * Where distances are measured from (F1: the user's current position). Without it, the launch
 * city's centre stands in and `isApproximate` asks the UI to say so (F5).
 */
export function useEventsOrigin(): { origin: Position | null; isApproximate: boolean } {
  const status = useLocationStore((state) => state.status);
  const position = useLocationStore((state) => state.position);
  if (position) {
    return { origin: position, isApproximate: false };
  }
  if (status === 'unavailable') {
    return { origin: LAUNCH_CITY_CENTER, isApproximate: true };
  }
  return { origin: null, isApproximate: false };
}
