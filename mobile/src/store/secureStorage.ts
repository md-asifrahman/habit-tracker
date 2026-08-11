import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Storage for anything that would let someone act as the user — currently the auth tokens.
 *
 * On a phone this is the iOS Keychain / Android Keystore, which is encrypted at rest and not
 * included in device backups. Plain AsyncStorage is not: it is an unencrypted file in the app's
 * sandbox, readable on a rooted or jailbroken device and extractable from a backup.
 *
 * Expo web has no Keychain, so there it falls back to AsyncStorage (localStorage). The packaged
 * app we ship is native, and the website has its own separate storage.
 */
export const secureStorage: StateStorage = {
  getItem: async (name) => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(name);
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    if (Platform.OS === 'web') return AsyncStorage.setItem(name, value);
    await SecureStore.setItemAsync(name, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  removeItem: async (name) => {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(name);
    await SecureStore.deleteItemAsync(name);
  },
};
