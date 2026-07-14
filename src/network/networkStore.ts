import { create } from 'zustand';

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
  isSlowConnection: boolean;
  isReconnecting: boolean;
  connectionType: string;
  setNetworkState: (patch: Partial<Omit<NetworkState, 'setNetworkState'>>) => void;
};

export const useNetworkStore = create<NetworkState>(set => ({
  isConnected: true,
  isInternetReachable: true,
  isSlowConnection: false,
  isReconnecting: false,
  connectionType: 'unknown',
  setNetworkState: patch => set(state => ({ ...state, ...patch })),
}));
