import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

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

const getCurrentCoordinates = (): Promise<DeviceCoordinates> =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
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
        enableHighAccuracy: Platform.OS === 'ios',
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

  reverseGeocodeLocation: async (latitude: number, longitude: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&email=admin@freenace.com`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en-IN",
          "User-Agent": "PharmacyApp/1.0 (admin@freenace.com)",
        },
      },
    );
    if (!response.ok) {
      throw new Error("Geocoding failed");
    }
    const payload = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const addressParts = payload.display_name?.split(",") || [];
    return {
      title:
        payload.address?.city ||
        payload.address?.town ||
        payload.address?.suburb ||
        addressParts[0] ||
        "Selected location",
      subtitle: payload.display_name || "Location details not available",
    };
  },

  requestCurrentLocation: async (): Promise<LocationOutcome> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple(
        [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]
      );

      const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      
      const fineNeverAskAgain = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
      const coarseNeverAskAgain = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

      if (fineNeverAskAgain && coarseNeverAskAgain) {
        return {
          status: 'blocked',
          message:
            'Location permission is blocked. Enable it from settings to continue.',
        };
      }

      if (!fineGranted && !coarseGranted) {
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
