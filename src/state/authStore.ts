import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { env } from '../config/env';
import { resetToAuth } from '../navigation/navigationRef';
import { parseJwt } from '../utils/jwt';
import { useSecurityStore } from './securityStore';
import { useSettingsStore } from './settingsStore';

type StoredAuth = {
  accessToken: string;
  refreshToken?: string;
  isProfileComplete?: boolean;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isBootstrapped: boolean;
  user: any | null;
  isProfileComplete: boolean;

  bootstrapAuth: () => Promise<void>;
  setTokens: (tokens: { accessToken: string; refreshToken?: string; isProfileComplete?: boolean }) => Promise<void>;
  setProfileComplete: (status: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: any) => void;
  validateSession: () => boolean;
};

const STORAGE_KEY = env.AUTH_TOKEN_KEY;

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isBootstrapped: false,
  user: null,
  isProfileComplete: false,

  bootstrapAuth: async () => {
    if (get().isBootstrapped) return;

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ accessToken: null, refreshToken: null, isProfileComplete: false, isBootstrapped: true });
        return;
      }

      const parsed = JSON.parse(raw) as StoredAuth;
      const decoded = parseJwt(parsed?.accessToken ?? null);
      const expiryMs = decoded?.exp ? Number(decoded.exp) * 1000 : null;

      if (expiryMs && Date.now() >= expiryMs) {
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        await useSecurityStore.getState().clearSecurityData();
        await useSettingsStore.getState().clearSecuritySettings();
        set({ accessToken: null, refreshToken: null, isProfileComplete: false, isBootstrapped: true });
        return;
      }

      set({
        accessToken: parsed?.accessToken ?? null,
        refreshToken: parsed?.refreshToken ?? null,
        isProfileComplete: parsed?.isProfileComplete ?? false,
        isBootstrapped: true,
      });
    } catch {
      // If parsing fails, clear storage to avoid stale/broken auth state.
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      set({ accessToken: null, refreshToken: null, isProfileComplete: false, isBootstrapped: true });
    }
  },

  setTokens: async ({ accessToken, refreshToken, isProfileComplete = false }) => {
    const stored: StoredAuth = { accessToken, refreshToken, isProfileComplete };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    set({ accessToken, refreshToken: refreshToken ?? null, isProfileComplete });
  },

  setProfileComplete: async (status: boolean) => {
    set({ isProfileComplete: status });
    const { accessToken, refreshToken } = get();
    if (accessToken) {
      const stored: StoredAuth = { accessToken, refreshToken: refreshToken || undefined, isProfileComplete: status };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  },

  logout: async () => {
    // Clear memory first to minimize the window where requests could still attach tokens.
    set({ accessToken: null, refreshToken: null, user: null, isProfileComplete: false });
    resetToAuth();
    await useSecurityStore.getState().clearSecurityData();
    await useSettingsStore.getState().clearSecuritySettings();
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  setUser: (user) => set({ user }),

  validateSession: () => {
    const token = get().accessToken;
    const decoded = parseJwt(token);
    const expiryMs = decoded?.exp ? Number(decoded.exp) * 1000 : null;

    if (expiryMs && Date.now() >= expiryMs) {
      get().logout().catch(() => {});
      return false;
    }

    return !!token;
  },
}));

export const getCurrentUserId = (): string | null => {
  const token = useAuthStore.getState().accessToken;
  const decoded = parseJwt(token);
  return decoded?._id || decoded?.id || null;
};
