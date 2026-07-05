export const profileStats = [
  { id: 's1', value: '4', label: 'Consults' },
  { id: 's2', value: '7', label: 'Orders' },
  { id: 's3', value: '₹800', label: 'Earned' },
];

export const profileMenu = [
  {
    id: 'm1',
    title: 'My Wallet',
    subtitle: 'Balance : ₹2,650',
    emoji: '💳',
    route: 'Wallet' as const,
  },
  {
    id: 'm2',
    title: 'My Appointments',
    subtitle: '1 upcoming',
    emoji: '📅',
    route: 'Appointments' as const,
  },
  {
    id: 'm3',
    title: 'My Orders',
    subtitle: '7 total orders',
    emoji: '📦',
    route: 'Orders' as const,
  },
  {
    id: 'm4',
    title: 'Health Vault',
    subtitle: '4 reports stored',
    emoji: '🗂️',
    route: 'HealthVault' as const,
  },
  {
    id: 'm4a',
    title: 'My Members',
    subtitle: 'Family & Dependents',
    emoji: '👨‍👩‍👧‍👦',
    route: 'MyMembers' as const,
  },
  {
    id: 'm5',
    title: 'Refer & Earn',
    subtitle: 'Earn ₹200 per referral',
    emoji: '🎁',
    route: 'ReferEarn' as const,
  },
  {
    id: 'm6',
    title: 'Settings',
    subtitle: 'Notifications, Privacy',
    emoji: '⚙️',
    route: 'Settings' as const,
  },
];

