const axios = require('axios');

const cleanPayload = (data) => {
  if (!data || typeof data !== 'object') return data;
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    const val = cleaned[key];
    if (
      val === '' ||
      val === null ||
      val === undefined ||
      (Array.isArray(val) && val.length === 0)
    ) {
      delete cleaned[key];
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = cleanPayload(val);
      if (Object.keys(cleaned[key]).length === 0) {
        delete cleaned[key];
      }
    }
  });
  return cleaned;
};

const payload = {
  name: 'Aarogya Medicos',
  nickname: 'Aarogya',
  ownerName: 'Akshay Panchal',
  phone: '7990878669',
  email: 'akshay@mail.com',
  address: '12 Main Market, Connaught Place',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
  latitude: 28.6315,
  longitude: 77.2167,
  gstNumber: '07ABCDE1234F1Z5',
  drugLicenseNumber: 'DL-DEL-2026-001234',
  gstCertificateUrl: 'https://cdn.example.com/pharmacy/gst-certificate.pdf',
  drugLicenseDocumentUrl: 'https://cdn.example.com/pharmacy/drug-license.pdf',
  ownerIdProofUrl: 'https://cdn.example.com/pharmacy/owner-id.pdf',
  shopFrontPhotoUrl: 'https://cdn.example.com/pharmacy/shop-front.jpg',
  profilePictureUrl: 'https://cdn.example.com/pharmacy/profile.jpg',
  pickupAvailable: true,
  deliveryAvailable: true,
  openingHours: {
    monday: { open: '09:00', close: '21:00', isClosed: false },
    tuesday: { open: '09:00', close: '21:00', isClosed: false },
    wednesday: { open: '09:00', close: '21:00', isClosed: false },
    thursday: { open: '09:00', close: '21:00', isClosed: false },
    friday: { open: '09:00', close: '21:00', isClosed: false },
    saturday: { open: '10:00', close: '20:00', isClosed: false },
    sunday: { isClosed: true }
  }
};

const cleaned = cleanPayload(payload);

axios.put('https://pharmyx.etryx.in/api/v1/pharmacies/me/profile', cleaned, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTRhNDdjYmYwYWJhYzUwN2ViMGZhNGEiLCJwaGFybWFjeUlkIjoiNmE0YTQ3Y2JmMGFiYWM1MDdlYjBmYTRhIiwicGhvbmUiOiI3OTkwODc4NjY5IiwidXNlclR5cGUiOiJwaGFybWFjeSIsImlhdCI6MTc4Mzg2MzE2NCwiZXhwIjoxNzg2NDU1MTY0fQ.7Wqw9BtI1lflpmxRrzriwopfn7BFK4q2y4VLuqoQV4g'
  }
}).then(res => {
  console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
}).catch(err => {
  console.error("ERROR:", err.response ? err.response.data : err.message);
});
