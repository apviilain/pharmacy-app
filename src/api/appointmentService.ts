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

const cloneAppointments = (): Appointment[] =>
  localAppointments.map(item => ({ ...item }));

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

  cancelAppointment: async (_appointmentId: string, _reason?: string): Promise<void> => {},

  rescheduleAppointment: async (
    _appointmentId: string,
    _payload: {
      slotId: string;
      bookingDate: string;
      bookingTime: string;
      serviceMode?: string;
      consultationMode?: string;
      notes?: string;
    },
  ): Promise<void> => {},

  retryPayment: async (
    bookingId: string,
    _payload: { useWalletBalance: boolean; couponCode?: string },
  ) => ({
    payment: {
      razorpayOrderId: `order_${bookingId}`,
      razorpayKeyId: 'rzp_test_placeholder',
      amount: 49900,
      currency: 'INR',
      paymentTransactionId: `txn_${bookingId}`,
    },
    booking: { id: bookingId },
  }),
};
