import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage for the Supabase session (CLAUDE.md 3.2: tokens in expo-secure-store).
 * A session can exceed what SecureStore holds per key, so each value is encrypted with a fresh
 * AES key: the key lives in SecureStore (Keychain / Keystore), the ciphertext in AsyncStorage.
 */
async function encrypt(key: string, value: string): Promise<string> {
  const encryptionKey = getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
  return aesjs.utils.hex.fromBytes(encrypted);
}

async function decrypt(key: string, value: string): Promise<string | null> {
  const encryptionKey = await SecureStore.getItemAsync(key);
  if (!encryptionKey) {
    return null;
  }
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(encryptionKey),
    new aesjs.Counter(1),
  );
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
}

export const encryptedStorage = {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    return encrypted ? decrypt(key, encrypted) : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, await encrypt(key, value));
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
