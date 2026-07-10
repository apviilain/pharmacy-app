import type { RootStackParamList } from '../../navigation/types';

export const profileStats = [
  { id: 's1', value: '4', label: 'Consults' },
  { id: 's2', value: '7', label: 'Orders' },
  { id: 's3', value: '₹800', label: 'Earned' },
];

type ProfileMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  section: 'care' | 'pharmacy' | 'account';
  route: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

export const profileMenu: ProfileMenuItem[] = [
  {
    id: 'm1',
    title: 'My Wallet',
    subtitle: 'Balance, top-ups, and transactions',
    emoji: '💳',
    section: 'care',
    route: 'Wallet',
    params: { mode: 'pharmacy', title: 'Pharmacy Wallet' },
  },
  {
    id: 'm2',
    title: 'Doctor Consultation',
    subtitle: 'Find and book doctors',
    emoji: '🩺',
    section: 'care',
    route: 'FindDoctor',
  },
  {
    id: 'm3',
    title: 'My Appointments',
    subtitle: '1 upcoming',
    emoji: '📅',
    section: 'care',
    route: 'Appointments',
  },
  {
    id: 'm4',
    title: 'My Orders',
    subtitle: '7 total orders',
    emoji: '📦',
    section: 'care',
    route: 'Orders',
  },
  {
    id: 'm5',
    title: 'Health Vault',
    subtitle: '4 reports stored',
    emoji: '🗂️',
    section: 'care',
    route: 'HealthVault',
  },
  {
    id: 'm6',
    title: 'My Members',
    subtitle: 'Family & Dependents',
    emoji: '👨‍👩‍👧‍👦',
    section: 'care',
    route: 'MyMembers',
  },
  {
    id: 'm7',
    title: 'Pharmacy Medicines',
    subtitle: 'Browse and manage medicines',
    emoji: '💊',
    section: 'pharmacy',
    route: 'PharmacyMedicines',
  },
  {
    id: 'm8',
    title: 'Pharmacy Customers',
    subtitle: 'Customer records and profiles',
    emoji: '🧑',
    section: 'pharmacy',
    route: 'PharmacyCustomers',
  },
  {
    id: 'm9',
    title: 'Pharmacy Inventory',
    subtitle: 'Stock, low stock, and imports',
    emoji: '📋',
    section: 'pharmacy',
    route: 'PharmacyInventory',
  },
  {
    id: 'm10',
    title: 'Pharmacy Orders',
    subtitle: 'Orders, payments, and health checks',
    emoji: '🛒',
    section: 'pharmacy',
    route: 'PharmacyOrders',
  },
  {
    id: 'm11',
    title: 'Pharmacy Subscriptions',
    subtitle: 'Recurring medicine plans',
    emoji: '🔁',
    section: 'pharmacy',
    route: 'PharmacySubscriptions',
  },
  {
    id: 'm13',
    title: 'Patient Tracking',
    subtitle: 'Follow-ups and chronic care notes',
    emoji: '🧾',
    section: 'pharmacy',
    route: 'PatientTracking',
  },
  {
    id: 'm14',
    title: 'Diagnostics',
    subtitle: 'Bookings and payment retries',
    emoji: '🧪',
    section: 'pharmacy',
    route: 'Diagnostics',
  },
  {
    id: 'm15',
    title: 'Refer & Earn',
    subtitle: 'Earn ₹200 per referral',
    emoji: '🎁',
    section: 'account',
    route: 'ReferEarn',
  },
  {
    id: 'm16',
    title: 'Settings',
    subtitle: 'Notifications, Privacy',
    emoji: '⚙️',
    section: 'account',
    route: 'Settings',
  },
];
