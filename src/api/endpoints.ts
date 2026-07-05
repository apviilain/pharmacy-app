export const endpoints = {
  auth: {
    sendOtp: '/api/v1/auth/pharmacy/send',
    verifyOtp: '/api/v1/auth/pharmacy/verify',
  },
  pharmacies: {
    me: '/api/v1/pharmacies/me/profile',
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
