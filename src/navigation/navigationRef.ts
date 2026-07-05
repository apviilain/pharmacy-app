import { createNavigationContainerRef } from '@react-navigation/native';

// Root navigator ref so non-component code (e.g., Axios interceptors) can reset navigation.
export const navigationRef = createNavigationContainerRef<any>();

export const resetToAuth = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.resetRoot({
    index: 0,
    routes: [{ name: 'SignIn' }],
  });
};

export const resetToMpinUnlock = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.resetRoot({
    index: 0,
    routes: [{ name: 'MpinUnlock' }],
  });
};
