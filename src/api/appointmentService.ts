import { apiClient } from './apiClient';
import { endpoints } from './endpoints';

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

const cloneAppointments = (): Appointment[] =>
  sessionAppointments.map(item => ({ ...item }));

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

const parseAmount = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeAppointmentStatus = (value: unknown): Appointment['status'] | undefined => {
  if (typeof value !== 'string') return undefined;

  const status = value.toLowerCase();
  if (['confirmed', 'booked', 'paid', 'success'].includes(status)) {
    return 'confirmed';
  }
  if (['pending', 'payment_pending', 'awaiting_payment'].includes(status)) {
    return 'pending';
  }
  if (['completed', 'done'].includes(status)) {
    return 'completed';
  }
  return value;
};

const extractPaymentPayload = (response: any) => {
  const payload = response?.data ?? response ?? {};
  const booking = payload?.booking ?? payload?.data?.booking ?? payload;
  const payment = payload?.payment ?? payload?.data?.payment ?? payload?.paymentDetails ?? {};

  return { booking, payment, payload };
};

const mergePaymentDetails = (
  appointment: Appointment,
  response: any,
): Appointment => {
  const { booking, payment, payload } = extractPaymentPayload(response);

  const fee =
    parseAmount(booking?.price) ??
    parseAmount(booking?.consultationFee) ??
    parseAmount(payload?.totalFee) ??
    parseAmount(payment?.totalAmount) ??
    parseAmount(payment?.fee) ??
    parseAmount(appointment.fee);

  const walletAmount =
    parseAmount(payment?.walletAmount) ??
    parseAmount(payment?.walletDeduction) ??
    parseAmount(payload?.walletAmount) ??
    appointment.walletAmount;

  const remainingAmount =
    parseAmount(payment?.remainingAmount) ??
    parseAmount(payment?.pendingAmount) ??
    parseAmount(payload?.remainingAmount) ??
    appointment.remainingAmount;

  const normalizedStatus =
    normalizeAppointmentStatus(booking?.bookingStatus) ??
    normalizeAppointmentStatus(booking?.status) ??
    normalizeAppointmentStatus(payment?.status) ??
    normalizeAppointmentStatus(payload?.status);

  return {
    ...appointment,
    id: appointment.id || booking?._id || booking?.bookingId || appointment._id || '',
    _id:
      appointment._id ||
      booking?._id ||
      booking?.bookingId ||
      appointment.id ||
      '',
    fee: fee ?? appointment.fee,
    walletAmount,
    remainingAmount,
    status: normalizedStatus || appointment.status,
    dateLabel:
      formatBookingDateLabel(booking?.bookingDate) ||
      appointment.dateLabel,
    timeLabel:
      booking?.selectedSlotTime ||
      booking?.bookingTime ||
      appointment.timeLabel,
    mode:
      booking?.consultationMode ||
      booking?.serviceMode ||
      appointment.mode,
    consultationMode:
      booking?.consultationMode ||
      booking?.serviceMode ||
      appointment.consultationMode,
    createdAt: booking?.createdAt || appointment.createdAt,
    doctorName:
      booking?.specialistName ||
      booking?.doctorName ||
      appointment.doctorName,
    specialization:
      booking?.specialization ||
      booking?.specialty ||
      appointment.specialization,
  };
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
  getAppointments: async (params?: GetAppointmentsParams): Promise<Appointment[]> => {
    const appointments = cloneAppointments().filter(item =>
      matchesStatus(item, params?.status),
    );

    const hydratedAppointments = await Promise.all(
      appointments.map(async item => {
        const appointmentId = item.id || item._id;
        const shouldRefresh =
          !!appointmentId &&
          (item.status === 'pending' || item.status === 'confirmed');

        if (!shouldRefresh || !appointmentId) return item;

        try {
          const response = await apiClient.get(
            endpoints.bookings.paymentDetails(appointmentId),
          );
          const merged = mergePaymentDetails(item, response);
          upsertSessionAppointment(merged);
          return merged;
        } catch {
          return item;
        }
      }),
    );

    return hydratedAppointments;
  },

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
    const existing =
      cloneAppointments().find(
        item => item.id === bookingId || item._id === bookingId,
      ) || null;

    if (existing) {
      upsertSessionAppointment(mergePaymentDetails(existing, response));
    }

    return response;
  },
};
