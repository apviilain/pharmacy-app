import { localNotificationsStore } from './localUiData';

export interface Notification {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export const notificationApi = {
  getUserNotifications: async (_userId: string): Promise<Notification[]> =>
    localNotificationsStore.list(),

  getUnreadNotifications: async (_userId: string): Promise<Notification[]> =>
    (await localNotificationsStore.list()).filter(item => !item.isRead),

  getUnreadCount: async (_userId: string): Promise<number> =>
    (await localNotificationsStore.list()).filter(item => !item.isRead).length,

  markAsRead: async (notificationId: string): Promise<any> => {
    const notifications = await localNotificationsStore.list();
    const updated = notifications.map(item =>
      (item.id || item._id) === notificationId
        ? { ...item, isRead: true, updatedAt: new Date().toISOString() }
        : item,
    );
    await localNotificationsStore.save(updated);
    return { success: true };
  },

  markAllAsRead: async (_userId: string): Promise<any> => {
    const notifications = await localNotificationsStore.list();
    await localNotificationsStore.save(
      notifications.map(item => ({
        ...item,
        isRead: true,
        updatedAt: new Date().toISOString(),
      })),
    );
    return { success: true };
  },
};
