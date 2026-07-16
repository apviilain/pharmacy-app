import { create } from 'zustand';

import type {
  DeviceCoordinates,
  LocationAccessState,
} from '../services/locationService';

type LocationSelectionState = {
  coords: DeviceCoordinates | null;
  status: LocationAccessState;
  message: string;
  title: string;
  subtitle: string;
  source: 'device' | 'profile';
  setDeviceLocation: (
    coords: DeviceCoordinates,
    options?: { message?: string; title?: string; subtitle?: string },
  ) => void;
  setProfileLocation: (title: string, subtitle?: string) => void;
  setLocationStatus: (status: LocationAccessState, message?: string) => void;
};

export const useLocationSelectionStore = create<LocationSelectionState>(set => ({
  coords: null,
  status: 'idle',
  message: '',
  title: 'Select location',
  subtitle: 'Tap to choose',
  source: 'profile',

  setDeviceLocation: (coords, options) =>
    set({
      coords,
      status: 'granted',
      message: options?.message || '',
      title: options?.title?.trim() || 'Current location',
      subtitle:
        options?.subtitle?.trim() ||
        `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
      source: 'device',
    }),

  setProfileLocation: (title, subtitle) =>
    set({
      coords: null,
      title: title.trim() || 'Saved location',
      subtitle: subtitle?.trim() || 'Profile address',
      source: 'profile',
    }),

  setLocationStatus: (status, message = '') =>
    set({
      status,
      message,
    }),
}));
