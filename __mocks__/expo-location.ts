// Jest stand-in for expo-location: permission granted, the phone is in central Budapest.
// Tests can change the answers with mockResolvedValue.
export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;

export const Accuracy = { Balanced: 3 } as const;

const centralBudapest = { coords: { latitude: 47.49791, longitude: 19.04023 } };

export const getForegroundPermissionsAsync = jest.fn(async () => ({
  status: PermissionStatus.GRANTED as string,
  canAskAgain: true,
}));
export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: PermissionStatus.GRANTED as string,
  canAskAgain: true,
}));
export const getLastKnownPositionAsync = jest.fn(async () => centralBudapest);
export const getCurrentPositionAsync = jest.fn(async () => centralBudapest);
