import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

export type LocationAccessState =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

type LocationOutcome = {
  coords?: DeviceCoordinates;
  message?: string;
  status: LocationAccessState;
};

const LAST_LOCATION_STORAGE_KEY = 'last_known_device_location';

const getBrowserGeolocation = () => {
  const nav = (globalThis as any).navigator as
    | (Navigator & {
        geolocation?: {
          getCurrentPosition: (
            success: (position: {
              coords: { latitude: number; longitude: number };
            }) => void,
            error?: (error: { code?: number; message?: string }) => void,
            options?: {
              enableHighAccuracy?: boolean;
              timeout?: number;
              maximumAge?: number;
            },
          ) => void;
        };
      })
    | undefined;

  return nav?.geolocation;
};

const getCurrentCoordinates = (): Promise<DeviceCoordinates> =>
  new Promise((resolve, reject) => {
    const geolocation = getBrowserGeolocation();
    if (!geolocation) {
      reject(new Error('Location services are unavailable on this device.'));
      return;
    }

    geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        reject(
          new Error(error?.message || 'Unable to fetch your current location.'),
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  });

const getCachedCoordinates = async (): Promise<DeviceCoordinates | null> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_LOCATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DeviceCoordinates>;
    const latitude = Number(parsed.latitude);
    const longitude = Number(parsed.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch {
    return null;
  }
};

const cacheCoordinates = async (coords: DeviceCoordinates) => {
  try {
    await AsyncStorage.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(coords));
  } catch {
    // Ignore cache write failures and continue with runtime location data.
  }
};

export const locationService = {
  openSettings: () => Linking.openSettings(),

  requestCurrentLocation: async (): Promise<LocationOutcome> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location permission required',
          message:
            'Medicine availability needs your current location to find nearby pharmacies.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return {
          status: 'blocked',
          message:
            'Location permission is blocked. Enable it from settings to continue.',
        };
      }

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return {
          status: 'denied',
          message:
            'Location permission is required to check medicine availability.',
        };
      }
    }

    try {
      const coords = await getCurrentCoordinates();
      void cacheCoordinates(coords);
      return { coords, status: 'granted' };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to access your current location.';

      const cachedCoords = await getCachedCoordinates();
      if (cachedCoords) {
        return {
          coords: cachedCoords,
          status: 'granted',
          message: 'Using your last known location.',
        };
      }

      if (/denied|permission/i.test(message)) {
        return {
          status: Platform.OS === 'ios' ? 'blocked' : 'denied',
          message:
            'Location permission is required to check medicine availability.',
        };
      }

      return { status: 'unavailable', message };
    }
  },
};
