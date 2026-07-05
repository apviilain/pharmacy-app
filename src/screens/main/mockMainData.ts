export const ambulanceList = [
  { id: 'a1', name: 'City Ambulance Service', meta: '1.2 km · ~4 mins', phone: '9876543210' },
  { id: 'a2', name: 'Apollo Emergency', meta: '2.4 km · ~8 mins', phone: '8765432109' },
  { id: 'a3', name: '108 Government Service', meta: '3.1 km · ~10 mins', phone: '108' },
];

export const healthVaultFilters = ['All', 'Lab Reports', 'Prescriptions', 'Scans'] as const;

export const healthVaultItems = [
  {
    id: 'h1',
    title: 'CBC Blood Report',
    sub: 'Thyrocare · Dec 14, 2024',
    status: 'Normal',
    statusType: 'success' as const,
    icon: '🩸',
  },
  {
    id: 'h2',
    title: 'Prescription · Dr. Priya',
    sub: 'Apollo Clinic · Dec 10, 2024',
    status: 'Prescription',
    statusType: 'info' as const,
    icon: '💊',
  },
  {
    id: 'h3',
    title: 'Thyroid Profile',
    sub: 'SRL Diagnostics · Nov 28',
    status: 'Review needed',
    statusType: 'warning' as const,
    icon: '🔬',
  },
  {
    id: 'h4',
    title: 'ECG Report',
    sub: 'Fortis Hospital · Oct 15',
    status: 'Normal',
    statusType: 'success' as const,
    icon: '🫀',
  },
];

export const ordersFilters = ['All', 'Pharmacy', 'Diagnostics', 'Completed'] as const;

export const orders = [
  {
    id: 'o1',
    type: 'PHARMACY ORDER',
    title: '#ORD-4521',
    sub: 'Dolo 650, Vitamin C +1 more',
    date: 'Dec 17, 2024',
    amount: '₹522',
    status: 'In Transit',
    statusType: 'transit' as const,
    action: 'Track Order',
  },
  {
    id: 'o2',
    type: 'DIAGNOSTICS ORDER',
    title: '#DGN-1203',
    sub: 'CBC Blood Count Test',
    date: 'Dec 14, 2024',
    amount: '₹249',
    status: 'Completed',
    statusType: 'success' as const,
    action: 'View Report',
  },
  {
    id: 'o3',
    type: 'TELEHEALTH',
    title: '#APT-8801',
    sub: 'Dr. Priya Sharma · General',
    date: 'Dec 10, 2024',
    amount: '₹449',
    status: 'Completed',
    statusType: 'success' as const,
    action: 'View Details',
  },
];

export const appointmentsTabs = ['All', 'Upcoming', 'Pending', 'Past'] as const;

