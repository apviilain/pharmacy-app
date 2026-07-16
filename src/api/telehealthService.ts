import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import { appointmentService } from './appointmentService';
import { localSpecialists } from './localUiData';
import type { ApiError } from './errorHandler';

export type Specialist = {
  _id: string;
  id?: string;
  name: string;
  profilePictureUrl?: string;
  avatarUri?: string;
  rating: number;
  specialization: string;
  specialty?: string;
  degree?: string;
  experienceYears?: number;
  experience?: number;
  languages: string[];
  consultationFee: number;
  isConsultationFree?: boolean;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  isVerified?: boolean;
  [key: string]: any;
};

export type BookingPayload = {
  userId: string;
  specialistId: string;
  primaryConcern: string;
  consultationMode: string;
  bookingDate: string;
  bookingTime: string;
  slotId: string;
  contactNo: string;
  alternateContactNo?: string;
  serviceAddress?: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  notes?: string;
  documents?: {
    type: string;
    url: string;
    filename: string;
  }[];
  couponCode?: string;
  useWalletBalance?: boolean;
  followUp?: {
    isFollowUp?: boolean;
    parentConsultationId?: string;
  };
};

const buildSlots = (date: string) => ({
  morning: [
    { id: `${date}-09:00`, time: '09:00 AM', available: true },
    { id: `${date}-10:30`, time: '10:30 AM', available: true },
  ],
  afternoon: [
    { id: `${date}-01:00`, time: '01:00 PM', available: true },
    { id: `${date}-03:30`, time: '03:30 PM', available: false },
  ],
  evening: [
    { id: `${date}-05:00`, time: '05:00 PM', available: true },
    { id: `${date}-07:00`, time: '07:00 PM', available: true },
  ],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getArrayFromPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.specialists,
    payload.doctors,
    payload.slots,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      const nested = getArrayFromPayload(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
};

const normalizeSpecialist = (item: unknown): Specialist | null => {
  if (!isRecord(item)) return null;

  const id = String(item._id || item.id || '');
  const name = String(item.name || item.fullName || '').trim();

  if (!id && !name) return null;

  return {
    ...item,
    _id: id || String(item.id || item._id || ''),
    id: String(item.id || item._id || '') || undefined,
    name: name || 'Doctor',
    profilePictureUrl: String(
      item.profilePictureUrl || item.avatar || item.image || '',
    ) || undefined,
    specialization: String(
      item.specialization || item.specialty || item.department || 'General',
    ),
    specialty: String(
      item.specialty || item.specialization || item.department || 'General',
    ),
    rating: Number(item.rating ?? item.averageRating ?? 4.5),
    consultationFee: Number(item.consultationFee ?? item.fee ?? 0),
    experienceYears: Number(item.experienceYears ?? item.experience ?? 0),
    languages: Array.isArray(item.languages)
      ? item.languages.map(value => String(value))
      : [],
  };
};

const normalizeSlot = (item: unknown) => {
  if (!isRecord(item)) return null;

  const id = String(item._id || item.id || item.slotId || '');
  const startTime = String(
    item.startTime || item.time || item.label || item.bookingTime || '',
  ).trim();

  if (!id && !startTime) return null;

  return {
    ...item,
    _id: String(item._id || item.id || item.slotId || '') || undefined,
    id: String(item.id || item._id || item.slotId || '') || undefined,
    slotId: String(item.slotId || item.id || item._id || '') || undefined,
    startTime,
    isAvailable:
      item.isAvailable === undefined ? true : Boolean(item.isAvailable),
    isActive: item.isActive === undefined ? true : Boolean(item.isActive),
  };
};

const shouldFallbackToLocal = (error: unknown) => {
  const apiError = error as ApiError | undefined;
  return [400, 404, 405].includes(apiError?.httpStatus || 0);
};

export const telehealthService = {
  getSpecialists: async (): Promise<Specialist[]> => {
    try {
      const response = await apiClient.get(endpoints.bookings.specialists);
      const normalized = getArrayFromPayload(response)
        .map(normalizeSpecialist)
        .filter(Boolean) as Specialist[];

      if (normalized.length > 0) {
        return normalized;
      }
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }

    return localSpecialists.map(item => ({ ...item }));
  },

  bookSpecialist: async (payload: BookingPayload): Promise<any> => {
    const response: any = await apiClient.post(
      endpoints.bookings.specialist,
      payload,
    );
    return response;
  },

  getSlots: async (doctorId: string, date: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        endpoints.bookings.specialistSlots(doctorId),
        {
          params: { bookingDate: date, date },
        },
      );

      const normalized = getArrayFromPayload(response)
        .map(normalizeSlot)
        .filter(Boolean);

      if (normalized.length > 0) {
        return normalized;
      }
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }

    const fallback = buildSlots(date);
    return [
      ...fallback.morning.map(slot => ({
        id: slot.id,
        _id: slot.id,
        startTime: slot.time,
        isAvailable: slot.available,
        isActive: slot.available,
      })),
      ...fallback.afternoon.map(slot => ({
        id: slot.id,
        _id: slot.id,
        startTime: slot.time,
        isAvailable: slot.available,
        isActive: slot.available,
      })),
      ...fallback.evening.map(slot => ({
        id: slot.id,
        _id: slot.id,
        startTime: slot.time,
        isAvailable: slot.available,
        isActive: slot.available,
      })),
    ];
  },

  getUserBookings: async (_userId: string): Promise<any> =>
    appointmentService.getAppointments({ status: 'All' }),

  getUpcomingBookings: async (): Promise<any> =>
    appointmentService.getAppointments({ status: 'upcoming' }),
};
