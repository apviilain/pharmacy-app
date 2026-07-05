import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { navigationRef } from '../navigation/navigationRef';
import { useAuthStore } from '../state/authStore';
import { useSecurityStore } from '../state/securityStore';

const AUTH_ROUTES = new Set([
  'Splash',
  'SignIn',
  'SignUp',
  'OtpVerification',
  'CompleteProfile',
  'MpinSetup',
  'MpinUnlock',
]);

export const AppSecurityManager = () => {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextState => {
      const previousState = appState.current;
      appState.current = nextState;

      if (previousState === 'active' && /inactive|background/.test(nextState)) {
        await useSecurityStore.getState().noteBackgroundAt(Date.now());
        return;
      }

      if (/inactive|background/.test(previousState) && nextState === 'active') {
        const authState = useAuthStore.getState();
        const securityState = useSecurityStore.getState();

        if (!authState.accessToken || !securityState.hasMpin) {
          return;
        }

        const tokenValid = authState.validateSession();
        if (!tokenValid) {
          return;
        }

        if (!securityState.shouldRequireUnlock(Date.now())) {
          return;
        }

        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (currentRoute && AUTH_ROUTES.has(currentRoute)) {
          return;
        }

        await useSecurityStore.getState().lockApp();
        if (navigationRef.isReady()) {
          navigationRef.resetRoot({
            index: 0,
            routes: [{ name: 'MpinUnlock' }],
          });
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
};
