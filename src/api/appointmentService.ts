import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import { localAppointments } from './localUiData';

export type Appointment = {
  id: string;
  _id?: string;
  doctorName: string;
  doctorImage?: string;
  specialization: string;
  dateLabel: string;
  timeLabel: string;
  fee: string | number;
  walletAmount?: number;
  remainingAmount?: number;
  status: 'upcoming' | 'completed' | 'confirmed' | 'pending' | string;
  mode: string;
  specialistId?: string;
  consultationMode?: string;
  documents?: any[];
  report?: any;
  prescription?: any;
  createdAt?: string;
  [key: string]: unknown;
};

type GetAppointmentsParams = {
  status?: 'upcoming' | 'completed' | 'Past' | 'pending' | 'Pending' | 'All';
};

let sessionAppointments: Appointment[] = [];

const cloneAppointments = (): Appointment[] => {
  const local = localAppointments.map(item => ({ ...item }));
  const seen = new Set<string>();

  return [...sessionAppointments, ...local].filter(item => {
    const id = item.id || item._id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const matchesStatus = (item: Appointment, status?: GetAppointmentsParams['status']) => {
  if (!status || status === 'All') return true;
  if (status === 'upcoming') {
    return item.status === 'confirmed' || item.status === 'pending';
  }
  if (status === 'Pending' || status === 'pending') {
    return item.status === 'pending';
  }
  if (status === 'Past') {
    return item.status === 'completed';
  }
  return item.status === status;
};

const formatBookingDateLabel = (bookingDate?: string) => {
  if (!bookingDate || bookingDate.length !== 8) return bookingDate || '';
  const year = bookingDate.slice(0, 4);
  const month = bookingDate.slice(4, 6);
  const day = bookingDate.slice(6, 8);
  return `${year}-${month}-${day}`;
};

const upsertSessionAppointment = (appointment: Appointment) => {
  const id = appointment.id || appointment._id;
  if (!id) return;

  const existingIndex = sessionAppointments.findIndex(
    item => (item.id || item._id) === id,
  );

  if (existingIndex >= 0) {
    sessionAppointments[existingIndex] = {
      ...sessionAppointments[existingIndex],
      ...appointment,
      id,
      _id: appointment._id || sessionAppointments[existingIndex]._id || id,
    };
    return;
  }

  sessionAppointments = [
    {
      ...appointment,
      id,
      _id: appointment._id || id,
    },
    ...sessionAppointments,
  ];
};

export const appointmentService = {
  getAppointments: async (params?: GetAppointmentsParams): Promise<Appointment[]> =>
    cloneAppointments().filter(item => matchesStatus(item, params?.status)),

  getAppointmentById: async (appointmentId: string): Promise<Appointment | null> =>
    cloneAppointments().find(item => item.id === appointmentId || item._id === appointmentId) || null,

  bookAppointment: async (payload: {
    doctorId: string;
    patientId?: string;
    slotId: string;
    memberId?: string;
  }): Promise<{ appointmentId: string; [key: string]: unknown }> => ({
    appointmentId: `apt-${payload.slotId}`,
    bookingId: `apt-${payload.slotId}`,
    doctorId: payload.doctorId,
    patientId: payload.patientId,
    memberId: payload.memberId,
  }),

  cacheAppointment: (appointment: Appointment) => {
    upsertSessionAppointment(appointment);
  },

  updateCachedAppointment: (
    appointmentId: string,
    patch: Partial<Appointment>,
  ) => {
    const existing =
      cloneAppointments().find(
        item => item.id === appointmentId || item._id === appointmentId,
      ) || null;

    if (!existing) return;

    upsertSessionAppointment({
      ...existing,
      ...patch,
      id: existing.id || existing._id || appointmentId,
      _id: existing._id || existing.id || appointmentId,
    });
  },

  cancelAppointment: async (
    appointmentId: string,
    reason?: string,
  ): Promise<void> => {
    await apiClient.post(endpoints.bookings.cancel(appointmentId), {
      cancellationReason: reason || 'Cancelled by pharmacy',
    });

    appointmentService.updateCachedAppointment(appointmentId, {
      status: 'cancelled',
    });
  },

  rescheduleAppointment: async (
    appointmentId: string,
    payload: {
      slotId: string;
      bookingDate: string;
      bookingTime: string;
      serviceMode?: string;
      consultationMode?: string;
      notes?: string;
    },
  ): Promise<void> => {
    await apiClient.post(endpoints.bookings.reschedule(appointmentId), {
      bookingDate: payload.bookingDate,
      selectedSlotTime: payload.bookingTime,
    });

    appointmentService.updateCachedAppointment(appointmentId, {
      dateLabel: formatBookingDateLabel(payload.bookingDate),
      timeLabel: payload.bookingTime,
      mode: payload.consultationMode || payload.serviceMode || 'Video',
      consultationMode:
        payload.consultationMode || payload.serviceMode || 'video',
      status: 'confirmed',
    });
  },

  retryPayment: async (
    bookingId: string,
    payload: { useWalletBalance: boolean; couponCode?: string },
  ) => {
    const response: any = await apiClient.post(
      endpoints.bookings.retryPayment(bookingId),
      payload,
    );
    return response;
  },

  getPaymentDetails: async (bookingId: string) => {
    const response: any = await apiClient.get(
      endpoints.bookings.paymentDetails(bookingId),
    );
    return response;
  },
};
