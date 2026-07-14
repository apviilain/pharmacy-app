import React, { useEffect } from 'react';
import { useNetworkStore } from '../network/networkStore';
import { logger } from '../utils/logger';

let netInfoModule:
  | {
      addEventListener: (listener: (state: any) => void) => () => void;
      fetch: () => Promise<any>;
    }
  | null = null;

try {
  const resolved = require('@react-native-community/netinfo');
  netInfoModule = resolved?.default || resolved || null;
} catch (error) {
  logger.warn('NetInfo module is unavailable. Network provider will run in fallback mode.', {
    error: error instanceof Error ? error.message : String(error),
  });
}

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const setNetworkState = useNetworkStore(state => state.setNetworkState);

  useEffect(() => {
    if (!netInfoModule) {
      setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        isSlowConnection: false,
        isReconnecting: false,
        connectionType: 'unknown',
      });
      return () => undefined;
    }

    const unsubscribe = netInfoModule.addEventListener(state => {
      const isConnected = Boolean(state.isConnected);
      const isInternetReachable =
        state.isInternetReachable === null
          ? isConnected
          : Boolean(state.isInternetReachable);
      const connectionType = state.type || 'unknown';
      const cellularGeneration = (state.details as any)?.cellularGeneration;
      const isSlowConnection =
        connectionType === 'cellular' &&
        (cellularGeneration === '2g' || cellularGeneration === '3g');

      setNetworkState({
        isConnected,
        isInternetReachable,
        isSlowConnection,
        connectionType,
        isReconnecting: isConnected && !isInternetReachable,
      });

      logger.debug('Network state updated', {
        isConnected,
        isInternetReachable,
        isSlowConnection,
        connectionType,
      });
    });

    netInfoModule
      .fetch()
      .then(state => {
        setNetworkState({
          isConnected: Boolean(state.isConnected),
          isInternetReachable:
            state.isInternetReachable === null
              ? Boolean(state.isConnected)
              : Boolean(state.isInternetReachable),
          connectionType: state.type || 'unknown',
        });
      })
      .catch(error => {
        logger.warn('Failed to fetch initial network state', {
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => unsubscribe();
  }, [setNetworkState]);

  return <>{children}</>;
};
