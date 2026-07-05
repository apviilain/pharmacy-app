export const endpoints = {
  auth: {
    sendOtp: '/api/v1/auth/pharmacy/send',
    verifyOtp: '/api/v1/auth/pharmacy/verify',
    profile: '/api/v1/auth/profile',
  },
  pharmacies: {
    create: '/api/v1/pharmacies',
    list: '/api/v1/pharmacies',
    details: (id: string) => `/api/v1/pharmacies/${id}`,
  },
  pharmacyMedicines: {
    create: '/api/v1/pharmacy-medicines',
    list: '/api/v1/pharmacy-medicines',
    details: (id: string) => `/api/v1/pharmacy-medicines/${id}`,
    update: (id: string) => `/api/v1/pharmacy-medicines/${id}`,
  },
};
