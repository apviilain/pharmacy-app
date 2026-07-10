import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  DiagnosticsBooking,
  DiagnosticsBookingRequest,
  DiagnosticsCancelRequest,
  DiagnosticsRescheduleRequest,
  DiagnosticsRetryPaymentRequest,
  PaymentVerificationRequest,
} from './pharmyx';

let sessionDiagnosticsBookings: DiagnosticsBooking[] = [];

const getBookingId = (
  booking: Partial<DiagnosticsBooking> | null | undefined,
): string => String(booking?.bookingId || booking?.id || booking?._id || '');

const upsertBooking = (booking: DiagnosticsBooking | null | undefined) => {
  const bookingId = getBookingId(booking);
  if (!booking || !bookingId) return;

  const existingIndex = sessionDiagnosticsBookings.findIndex(
    item => getBookingId(item) === bookingId,
  );

  if (existingIndex >= 0) {
    sessionDiagnosticsBookings[existingIndex] = {
      ...sessionDiagnosticsBookings[existingIndex],
      ...booking,
    };
    return;
  }

  sessionDiagnosticsBookings = [booking, ...sessionDiagnosticsBookings];
};

export const diagnosticsBookingService = {
  create: async (payload: DiagnosticsBookingRequest): Promise<DiagnosticsBooking> => {
    const response: any = await apiClient.post(
      endpoints.diagnosticsBookings.create,
      payload,
    );
    upsertBooking(response);
    return response;
  },

  retryPayment: async (
    id: string,
    payload: DiagnosticsRetryPaymentRequest,
  ): Promise<DiagnosticsBooking> => {
    const response: any = await apiClient.post(
      endpoints.diagnosticsBookings.retryPayment(id),
      payload,
    );
    upsertBooking(response);
    return response;
  },

  cancel: async (
    id: string,
    payload: DiagnosticsCancelRequest,
  ): Promise<DiagnosticsBooking> => {
    const response: any = await apiClient.post(
      endpoints.diagnosticsBookings.cancel(id),
      payload,
    );
    upsertBooking(response);
    return response;
  },

  reschedule: async (
    id: string,
    payload: DiagnosticsRescheduleRequest,
  ): Promise<DiagnosticsBooking> => {
    const response: any = await apiClient.post(
      endpoints.diagnosticsBookings.reschedule(id),
      payload,
    );
    upsertBooking(response);
    return response;
  },

  getPaymentDetails: async (id: string): Promise<DiagnosticsBooking | null> => {
    const response: any = await apiClient.get(
      endpoints.diagnosticsBookings.paymentDetails(id),
    );
    upsertBooking(response);
    return response || null;
  },

  listSessionBookings: async (): Promise<DiagnosticsBooking[]> =>
    sessionDiagnosticsBookings.map(item => ({ ...item })),

  getSessionBookingById: (id: string): DiagnosticsBooking | null =>
    sessionDiagnosticsBookings.find(item => getBookingId(item) === id) || null,

  verifyPayment: async (
    payload: PaymentVerificationRequest,
  ): Promise<Record<string, unknown> | null> => {
    const response: any = await apiClient.post(endpoints.payments.verify, payload);
    return response || null;
  },
};
