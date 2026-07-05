import { create } from 'zustand';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  appointmentId: string;
  patientName?: string;
  concern?: string;
  timeStr?: string;
  meetingLink?: string;
  doctorId?: string;
  dateLabel?: string;
  type?: 'reminder' | 'booking_success';
}

interface NotificationState {
  currentNotification: NotificationData | null;
  isVisible: boolean;
  showNotification: (data: NotificationData) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  currentNotification: null,
  isVisible: false,
  showNotification: (data) => set({ currentNotification: data, isVisible: true }),
  hideNotification: () => set({ isVisible: false, currentNotification: null }),
}));
