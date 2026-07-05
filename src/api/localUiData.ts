import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Appointment } from './appointmentService';
import type { Dependent } from './dependentService';
import type { Notification } from './notificationApi';
import type { ReferralTransaction } from './referralApi';
import type { Specialist } from './telehealthService';

const DEPENDENTS_STORAGE_KEY = 'local_dependents_store';
const NOTIFICATIONS_STORAGE_KEY = 'local_notifications_store';

export const localSpecialists: Specialist[] = [
  {
    _id: 'spec-1',
    id: 'spec-1',
    name: 'Aditi Sharma',
    specialization: 'General Physician',
    specialty: 'General Physician',
    rating: 4.8,
    consultationFee: 499,
    experienceYears: 9,
    languages: ['English', 'Hindi'],
    city: 'Delhi',
    state: 'Delhi',
    isVerified: true,
  },
  {
    _id: 'spec-2',
    id: 'spec-2',
    name: 'Rahul Verma',
    specialization: 'Dermatologist',
    specialty: 'Dermatologist',
    rating: 4.7,
    consultationFee: 599,
    experienceYears: 7,
    languages: ['English', 'Hindi'],
    city: 'Gurugram',
    state: 'Haryana',
    isVerified: true,
  },
  {
    _id: 'spec-3',
    id: 'spec-3',
    name: 'Neha Bansal',
    specialization: 'Pediatrician',
    specialty: 'Pediatrician',
    rating: 4.9,
    consultationFee: 699,
    experienceYears: 11,
    languages: ['English', 'Hindi'],
    city: 'Noida',
    state: 'Uttar Pradesh',
    isVerified: true,
  },
  {
    _id: 'spec-4',
    id: 'spec-4',
    name: 'Karan Mehta',
    specialization: 'Cardiologist',
    specialty: 'Cardiologist',
    rating: 4.6,
    consultationFee: 899,
    experienceYears: 14,
    languages: ['English', 'Hindi'],
    city: 'Delhi',
    state: 'Delhi',
    isVerified: true,
  },
];

export const localAppointments: Appointment[] = [
  {
    id: 'apt-1001',
    _id: 'apt-1001',
    doctorName: 'Dr. Aditi Sharma',
    specialization: 'General Physician',
    dateLabel: '2026-07-08',
    timeLabel: '11:30 AM',
    fee: '₹499',
    walletAmount: 0,
    remainingAmount: 0,
    status: 'confirmed',
    mode: 'Video',
    specialistId: 'spec-1',
    consultationMode: 'Video',
    createdAt: '2026-07-05T09:30:00.000Z',
    documents: [],
    report: null,
    prescription: null,
  },
  {
    id: 'apt-1002',
    _id: 'apt-1002',
    doctorName: 'Dr. Rahul Verma',
    specialization: 'Dermatologist',
    dateLabel: '2026-07-02',
    timeLabel: '04:15 PM',
    fee: '₹599',
    walletAmount: 150,
    remainingAmount: 449,
    status: 'pending',
    mode: 'Video',
    specialistId: 'spec-2',
    consultationMode: 'Video',
    createdAt: '2026-07-02T10:00:00.000Z',
    documents: [],
    report: null,
    prescription: null,
  },
  {
    id: 'apt-1003',
    _id: 'apt-1003',
    doctorName: 'Dr. Neha Bansal',
    specialization: 'Pediatrician',
    dateLabel: '2026-06-28',
    timeLabel: '06:45 PM',
    fee: '₹699',
    walletAmount: 0,
    remainingAmount: 0,
    status: 'completed',
    mode: 'Video',
    specialistId: 'spec-3',
    consultationMode: 'Video',
    createdAt: '2026-06-28T09:00:00.000Z',
    documents: [
      {
        type: 'report',
        url: 'https://example.com/reports/consultation-report.pdf',
        filename: 'consultation-report.pdf',
      },
    ],
    report: {
      message: 'Report Available',
      fileUrls: ['https://example.com/reports/followup-report.pdf'],
    },
    prescription: {
      message: 'Prescription Available',
      fileUrls: ['https://example.com/reports/prescription.pdf'],
    },
  },
];

export const localLabTests = [
  {
    id: 'lab-1',
    name: 'CBC Blood Report',
    status: 'ready',
    labName: 'City Diagnostics',
    orderedAt: '2026-07-03T08:00:00.000Z',
  },
];

export const localMedicineOrders = [
  {
    id: 'ord-1',
    itemCount: 2,
    totalAmount: 522,
    status: 'delivered',
    orderedAt: '2026-07-01T08:00:00.000Z',
  },
];

export const localHealthTips = [
  {
    _id: 'tip-1',
    title: 'Stay Hydrated Today',
    description:
      'Drink water regularly through the day to support energy, focus, and kidney health.',
  },
];

export const localCoupons = [
  {
    _id: 'coupon-1',
    code: 'WELCOME10',
    discountType: 'percentage' as const,
    discountValue: 10,
    minPurchaseAmount: 299,
    maxDiscountAmount: 150,
    isActive: true,
    description: 'Flat 10% off on your next booking.',
  },
];

export const localWallet = {
  balance: 2650,
  transactions: [
    {
      id: 'txn-1',
      title: 'Wallet Recharge',
      amount: 1000,
      type: 'credit',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: 'txn-2',
      title: 'Consultation Payment',
      amount: -499,
      type: 'debit',
      createdAt: '2026-06-28T12:00:00.000Z',
    },
  ],
};

export const localReferralSummary = {
  code: 'PHARMYX200',
  totalEarned: 800,
  totalTransactions: 4,
  rewardPerReferral: 200,
};

export const localReferralTransactions: ReferralTransaction[] = [
  {
    id: 'ref-1',
    amount: 200,
    description: 'Referral bonus credited',
    createdAt: '2026-06-30T09:00:00.000Z',
  },
  {
    id: 'ref-2',
    amount: 200,
    description: 'Referral bonus credited',
    createdAt: '2026-06-18T09:00:00.000Z',
  },
];

const defaultDependents: Dependent[] = [
  {
    id: 'dep-1',
    _id: 'dep-1',
    userId: 'self',
    name: 'Self',
    relationship: 'Self',
    age: 30,
    gender: 'Other',
    phone: '',
    email: '',
    dateOfBirth: '',
    bloodGroup: '',
    address: '',
    isActive: true,
    isMe: true,
  } as Dependent & { isMe?: boolean },
];

const defaultNotifications: Notification[] = [
  {
    _id: 'notif-1',
    id: 'notif-1',
    userId: 'local-user',
    title: 'Welcome to Pharmyx',
    message: 'Your pharmacy workspace is ready.',
    type: 'info',
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { emoji: '💊' },
  },
  {
    _id: 'notif-2',
    id: 'notif-2',
    userId: 'local-user',
    title: 'Profile reminder',
    message: 'Complete your pharmacy profile to unlock the full flow.',
    type: 'reminder',
    isRead: true,
    createdAt: '2026-07-04T10:00:00.000Z',
    updatedAt: '2026-07-04T10:00:00.000Z',
    metadata: { emoji: '📋' },
  },
];

const readJson = async <T,>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const localDependentsStore = {
  list: async (): Promise<Dependent[]> =>
    readJson<Dependent[]>(DEPENDENTS_STORAGE_KEY, defaultDependents),
  save: async (dependents: Dependent[]) => writeJson(DEPENDENTS_STORAGE_KEY, dependents),
};

export const localNotificationsStore = {
  list: async (): Promise<Notification[]> =>
    readJson<Notification[]>(NOTIFICATIONS_STORAGE_KEY, defaultNotifications),
  save: async (notifications: Notification[]) =>
    writeJson(NOTIFICATIONS_STORAGE_KEY, notifications),
};
