import { useNetworkStore } from '../network/networkStore';

export const useNetworkStatus = () => {
  const isConnected = useNetworkStore(state => state.isConnected);
  const isInternetReachable = useNetworkStore(
    state => state.isInternetReachable,
  );
  const isSlowConnection = useNetworkStore(state => state.isSlowConnection);
  const isReconnecting = useNetworkStore(state => state.isReconnecting);
  const connectionType = useNetworkStore(state => state.connectionType);

  return {
    isConnected,
    isInternetReachable,
    isSlowConnection,
    isReconnecting,
    connectionType,
    isOffline: !isConnected || !isInternetReachable,
  };
};
