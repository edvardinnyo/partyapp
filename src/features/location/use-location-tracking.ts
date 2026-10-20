import * as Location from 'expo-location';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useLocationStore } from './location-store';
import { roundPosition } from './position';

/** A recent position is good enough to start with; a fresh one follows. */
const LAST_KNOWN_MAX_AGE_MS = 10 * 60_000;

/**
 * F1, F5: finds the user's position while the app is open, in the foreground only. The permission
 * is asked once, when it is first needed: the Home's recommendations depend on it. A denial is
 * respected; the user can change it in the phone's settings, which we notice on return.
 */
export function useLocationTracking() {
  useEffect(() => {
    let active = true;
    const { setStatus, setPosition } = useLocationStore.getState();

    async function update() {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (
          permission.status === Location.PermissionStatus.UNDETERMINED &&
          permission.canAskAgain
        ) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!active) {
          return;
        }
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          setStatus('unavailable');
          return;
        }
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
        });
        if (active && lastKnown) {
          setPosition(
            roundPosition({ lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude }),
          );
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) {
          setPosition(
            roundPosition({ lat: current.coords.latitude, lng: current.coords.longitude }),
          );
        }
      } catch {
        // Location services are off or there is no fix: keep the last position, if any.
        if (active && !useLocationStore.getState().position) {
          setStatus('unavailable');
        }
      }
    }

    void update();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void update();
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
}
