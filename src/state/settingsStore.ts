import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsState = {
  pushEnabled: boolean;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  mpinSetupSkipped: boolean;
  
  setBiometricEnabled: (value: boolean) => Promise<void>;
  setMpinSetupSkipped: (value: boolean) => Promise<void>;
  togglePush: (value: boolean) => Promise<void>;
  toggleBiometric: (value: boolean) => Promise<void>;
  toggleTwoFactor: (value: boolean) => Promise<void>;
  clearSecuritySettings: () => Promise<void>;
  
  bootstrapSettings: () => Promise<void>;
};

const SETTINGS_KEY = 'app_user_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  pushEnabled: true,
  biometricEnabled: false,
  twoFactorEnabled: false,
  mpinSetupSkipped: false,

  bootstrapSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          pushEnabled: parsed?.pushEnabled ?? true,
          biometricEnabled: parsed?.biometricEnabled ?? false,
          twoFactorEnabled: parsed?.twoFactorEnabled ?? false,
          mpinSetupSkipped: parsed?.mpinSetupSkipped ?? false,
        });
      }
    } catch {
      console.error('Failed to parse active settings');
    }
  },

  togglePush: async (val: boolean) => {
    set({ pushEnabled: val });
    const current = get();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  },

  setBiometricEnabled: async (val: boolean) => {
    set({ biometricEnabled: val });
    const current = get();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  },

  setMpinSetupSkipped: async (val: boolean) => {
    set({ mpinSetupSkipped: val });
    const current = get();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  },

  toggleBiometric: async (val: boolean) => {
    set({ biometricEnabled: val });
    const current = get();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  },

  toggleTwoFactor: async (val: boolean) => {
    set({ twoFactorEnabled: val });
    const current = get();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  },

  clearSecuritySettings: async () => {
    set({ biometricEnabled: false, twoFactorEnabled: false, mpinSetupSkipped: false });
    const current = get();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  },
}));
