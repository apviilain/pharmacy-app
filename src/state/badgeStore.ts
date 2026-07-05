import { create } from 'zustand';

interface BadgeState {
  ordersBadgeCount: number;
  setOrdersBadgeCount: (count: number) => void;
  incrementOrdersBadgeCount: () => void;
  clearOrdersBadgeCount: () => void;
}

export const useBadgeStore = create<BadgeState>((set) => ({
  ordersBadgeCount: 0,
  setOrdersBadgeCount: (count) => set({ ordersBadgeCount: count }),
  incrementOrdersBadgeCount: () => set((state) => ({ ordersBadgeCount: state.ordersBadgeCount + 1 })),
  clearOrdersBadgeCount: () => set({ ordersBadgeCount: 0 }),
}));
