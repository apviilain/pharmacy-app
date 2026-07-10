import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import { localAppointments, localSpecialists } from './localUiData';

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

export const telehealthService = {
  getSpecialists: async (): Promise<Specialist[]> =>
    localSpecialists.map(item => ({ ...item })),

  bookSpecialist: async (payload: BookingPayload): Promise<any> => {
    const response: any = await apiClient.post(
      endpoints.bookings.specialist,
      payload,
    );
    return response;
  },

  getSlots: async (_doctorId: string, date: string): Promise<any> => buildSlots(date),

  getUserBookings: async (_userId: string): Promise<any> =>
    localAppointments.map(item => ({ ...item })),

  getUpcomingBookings: async (): Promise<any> =>
    localAppointments.filter(item => item.status === 'confirmed' || item.status === 'pending'),
};
