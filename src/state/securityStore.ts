import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  APP_LOCK_INACTIVITY_MS,
  MPIN_LOCKOUT_MS,
  MPIN_MAX_RETRIES,
} from '../constants/security';
import { getMpinScope, hashMpin } from '../utils/mpin';

const SECURITY_KEY = 'app_security_state';

type StoredSecurityState = {
  hasMpin?: boolean;
  mpinHash?: string | null;
  mpinLength?: number;
  failedAttempts?: number;
  blockedUntil?: number | null;
  lastBackgroundAt?: number | null;
  lastUnlockAt?: number | null;
};

type VerifyResult = {
  success: boolean;
  attemptsLeft: number;
  blockedUntil: number | null;
};

type SecurityState = {
  isBootstrapped: boolean;
  hasMpin: boolean;
  mpinHash: string | null;
  mpinLength: number;
  failedAttempts: number;
  blockedUntil: number | null;
  isLocked: boolean;
  lastBackgroundAt: number | null;
  lastUnlockAt: number | null;

  bootstrapSecurity: () => Promise<void>;
  setMpin: (params: {
    mpin: string;
    mpinLength: number;
    userId?: string | null;
  }) => Promise<void>;
  verifyMpin: (params: {
    mpin: string;
    userId?: string | null;
  }) => Promise<VerifyResult>;
  lockApp: () => Promise<void>;
  unlockApp: () => Promise<void>;
  noteBackgroundAt: (timestamp?: number) => Promise<void>;
  shouldRequireUnlock: (now?: number) => boolean;
  clearSecurityData: () => Promise<void>;
};

const persistState = async (state: Partial<StoredSecurityState>) => {
  const currentRaw = await AsyncStorage.getItem(SECURITY_KEY);
  const current = currentRaw ? (JSON.parse(currentRaw) as StoredSecurityState) : {};
  await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify({ ...current, ...state }));
};

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isBootstrapped: false,
  hasMpin: false,
  mpinHash: null,
  mpinLength: 4,
  failedAttempts: 0,
  blockedUntil: null,
  isLocked: false,
  lastBackgroundAt: null,
  lastUnlockAt: null,

  bootstrapSecurity: async () => {
    if (get().isBootstrapped) return;

    try {
      const raw = await AsyncStorage.getItem(SECURITY_KEY);
      const parsed = raw ? (JSON.parse(raw) as StoredSecurityState) : {};
      set({
        isBootstrapped: true,
        hasMpin: !!parsed?.hasMpin,
        mpinHash: parsed?.mpinHash ?? null,
        mpinLength: parsed?.mpinLength ?? 4,
        failedAttempts: parsed?.failedAttempts ?? 0,
        blockedUntil: parsed?.blockedUntil ?? null,
        isLocked: !!parsed?.hasMpin,
        lastBackgroundAt: parsed?.lastBackgroundAt ?? null,
        lastUnlockAt: parsed?.lastUnlockAt ?? null,
      });
    } catch {
      await AsyncStorage.removeItem(SECURITY_KEY).catch(() => {});
      set({
        isBootstrapped: true,
        hasMpin: false,
        mpinHash: null,
        mpinLength: 4,
        failedAttempts: 0,
        blockedUntil: null,
        isLocked: false,
        lastBackgroundAt: null,
        lastUnlockAt: null,
      });
    }
  },

  setMpin: async ({ mpin, mpinLength, userId }) => {
    const mpinHash = hashMpin(mpin, getMpinScope(userId));
    const payload = {
      hasMpin: true,
      mpinHash,
      mpinLength,
      failedAttempts: 0,
      blockedUntil: null,
      lastUnlockAt: Date.now(),
      lastBackgroundAt: null,
    };
    set({ ...payload, isLocked: false, isBootstrapped: true });
    await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(payload));
  },

  verifyMpin: async ({ mpin, userId }) => {
    const state = get();
    const now = Date.now();

    if (state.blockedUntil && state.blockedUntil > now) {
      return {
        success: false,
        attemptsLeft: 0,
        blockedUntil: state.blockedUntil,
      };
    }

    const expectedHash = state.mpinHash;
    const receivedHash = hashMpin(mpin, getMpinScope(userId));

    if (expectedHash && expectedHash === receivedHash) {
      const payload = {
        failedAttempts: 0,
        blockedUntil: null,
        lastUnlockAt: now,
      };
      set({ ...payload, isLocked: false });
      await persistState(payload);
      return {
        success: true,
        attemptsLeft: MPIN_MAX_RETRIES,
        blockedUntil: null,
      };
    }

    const failedAttempts = state.failedAttempts + 1;
    const blockedUntil =
      failedAttempts >= MPIN_MAX_RETRIES ? now + MPIN_LOCKOUT_MS : null;
    const attemptsLeft = Math.max(0, MPIN_MAX_RETRIES - failedAttempts);

    set({ failedAttempts, blockedUntil, isLocked: true });
    await persistState({ failedAttempts, blockedUntil });

    return {
      success: false,
      attemptsLeft,
      blockedUntil,
    };
  },

  lockApp: async () => {
    if (!get().hasMpin) return;
    set({ isLocked: true });
  },

  unlockApp: async () => {
    const lastUnlockAt = Date.now();
    set({ isLocked: false, lastUnlockAt, failedAttempts: 0, blockedUntil: null });
    await persistState({ lastUnlockAt, failedAttempts: 0, blockedUntil: null });
  },

  noteBackgroundAt: async (timestamp = Date.now()) => {
    set({ lastBackgroundAt: timestamp });
    await persistState({ lastBackgroundAt: timestamp });
  },

  shouldRequireUnlock: (now = Date.now()) => {
    const state = get();
    if (!state.hasMpin) return false;
    if (state.isLocked) return true;
    if (!state.lastBackgroundAt) return false;
    return now - state.lastBackgroundAt >= APP_LOCK_INACTIVITY_MS;
  },

  clearSecurityData: async () => {
    set({
      isBootstrapped: true,
      hasMpin: false,
      mpinHash: null,
      mpinLength: 4,
      failedAttempts: 0,
      blockedUntil: null,
      isLocked: false,
      lastBackgroundAt: null,
      lastUnlockAt: null,
    });
    await AsyncStorage.removeItem(SECURITY_KEY).catch(() => {});
  },
}));
