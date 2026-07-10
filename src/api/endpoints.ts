export const endpoints = {
  auth: {
    sendOtp: '/api/v1/auth/pharmacy/send',
    verifyOtp: '/api/v1/auth/pharmacy/verify',
  },
  pharmacies: {
    create: '/api/v1/pharmacies',
    meProfile: '/api/v1/pharmacies/me/profile',
    list: '/api/v1/pharmacies',
    details: (id: string) => `/api/v1/pharmacies/${id}`,
  },
  pharmacyMedicines: {
    create: '/api/v1/pharmacy-medicines',
    list: '/api/v1/pharmacy-medicines',
    details: (id: string) => `/api/v1/pharmacy-medicines/${id}`,
    update: (id: string) => `/api/v1/pharmacy-medicines/${id}`,
  },
  pharmacyCustomers: {
    create: '/api/v1/pharmacy-customers',
    list: '/api/v1/pharmacy-customers',
  },
  pharmacyInventory: {
    create: '/api/v1/pharmacy-inventory',
    list: '/api/v1/pharmacy-inventory',
    lowStock: '/api/v1/pharmacy-inventory/low-stock',
    adjustments: '/api/v1/pharmacy-inventory/adjustments',
    reserve: '/api/v1/pharmacy-inventory/reserve',
    release: '/api/v1/pharmacy-inventory/release',
    details: (id: string) => `/api/v1/pharmacy-inventory/${id}`,
  },
  pharmacyInventoryImports: {
    preview: '/api/v1/pharmacy-inventory-imports/preview',
    commit: '/api/v1/pharmacy-inventory-imports/commit',
    list: '/api/v1/pharmacy-inventory-imports',
    details: (id: string) => `/api/v1/pharmacy-inventory-imports/${id}`,
  },
  pharmacyOrders: {
    create: '/api/v1/pharmacy-orders',
    list: '/api/v1/pharmacy-orders',
    details: (id: string) => `/api/v1/pharmacy-orders/${id}`,
    update: (id: string) => `/api/v1/pharmacy-orders/${id}`,
    status: (id: string) => `/api/v1/pharmacy-orders/${id}/status`,
    cancel: (id: string) => `/api/v1/pharmacy-orders/${id}/cancel`,
    markPaid: (id: string) => `/api/v1/pharmacy-orders/${id}/mark-paid`,
    healthCheck: (id: string) => `/api/v1/pharmacy-orders/${id}/health-check`,
  },
  pharmacySubscriptions: {
    create: '/api/v1/pharmacy-subscriptions',
    list: '/api/v1/pharmacy-subscriptions',
    update: (id: string) => `/api/v1/pharmacy-subscriptions/${id}`,
    pause: (id: string) => `/api/v1/pharmacy-subscriptions/${id}/pause`,
    delete: (id: string) => `/api/v1/pharmacy-subscriptions/${id}`,
  },
  pharmacyWallet: {
    summary: '/api/v1/pharmacy-wallet',
    transactions: '/api/v1/pharmacy-wallet/transactions',
    topup: '/api/v1/pharmacy-wallet/topup',
  },
  patientTracking: {
    details: (id: string) => `/api/v1/patient-tracking/${id}`,
    update: (id: string) => `/api/v1/patient-tracking/${id}`,
  },
  pharmacyTracking: {
    summary: '/api/v1/pharmacy-tracking/summary',
    byPharmacy: (id: string) => `/api/v1/pharmacy-tracking/summary/${id}`,
  },
  diagnosticsBookings: {
    create: '/api/v1/external-bookings/diagnostics/bookings',
    retryPayment: (id: string) =>
      `/api/v1/external-bookings/diagnostics/bookings/${id}/retry-payment`,
    cancel: (id: string) =>
      `/api/v1/external-bookings/diagnostics/bookings/${id}/cancel`,
    reschedule: (id: string) =>
      `/api/v1/external-bookings/diagnostics/bookings/${id}/reschedule`,
    paymentDetails: (id: string) =>
      `/api/v1/external-bookings/bookings/${id}/payment-details`,
  },
  payments: {
    verify: '/api/v1/payments/verify',
  },
  bookings: {
    specialist: '/api/v1/bookings/specialist',
    retryPayment: (id: string) => `/api/v1/bookings/${id}/retry-payment`,
    paymentDetails: (id: string) => `/api/v1/bookings/${id}/payment-details`,
    cancel: (id: string) => `/api/v1/bookings/${id}/cancel`,
    reschedule: (id: string) => `/api/v1/bookings/${id}/reschedule`,
  },
};
