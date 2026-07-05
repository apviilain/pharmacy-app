export type PharmyxDayHours = {
  open?: string;
  close?: string;
  isClosed: boolean;
};

export type PharmyxOpeningHours = {
  monday?: PharmyxDayHours;
  tuesday?: PharmyxDayHours;
  wednesday?: PharmyxDayHours;
  thursday?: PharmyxDayHours;
  friday?: PharmyxDayHours;
  saturday?: PharmyxDayHours;
  sunday?: PharmyxDayHours;
};

export type SendOtpRequest = {
  phone: string;
};

export type VerifyOtpRequest = {
  phone: string;
  otp: string;
};

export type VerifyOtpResponse = {
  accessToken?: string;
  token?: string;
  jwt?: string;
  refreshToken?: string;
  pharmacy?: PharmyxPharmacyProfile | null;
  user?: PharmyxPharmacyProfile | null;
  isProfileComplete?: boolean;
  [key: string]: unknown;
};

export type PharmyxPharmacyProfile = {
  id?: string;
  _id?: string;
  name?: string;
  nickname?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gstNumber?: string;
  drugLicenseNumber?: string;
  gstCertificateUrl?: string;
  drugLicenseDocumentUrl?: string;
  ownerIdProofUrl?: string;
  shopFrontPhotoUrl?: string;
  openingHours?: PharmyxOpeningHours;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  profilePictureUrl?: string;
  profileImage?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreatePharmacyProfileRequest = {
  name: string;
  nickname?: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gstNumber?: string;
  drugLicenseNumber?: string;
  gstCertificateUrl?: string;
  drugLicenseDocumentUrl?: string;
  ownerIdProofUrl?: string;
  shopFrontPhotoUrl?: string;
  openingHours?: PharmyxOpeningHours;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  profilePictureUrl?: string;
  isVerified?: boolean;
};

export type ListPharmaciesParams = {
  search?: string;
  city?: string;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PharmyxMedicine = {
  id?: string;
  _id?: string;
  name?: string;
  brandName?: string;
  genericName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateMedicineRequest = {
  name: string;
  genericName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
};

export type UpdateMedicineRequest = {
  brandName?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
};

export const defaultOpeningHours: PharmyxOpeningHours = {
  monday: { open: '09:00', close: '21:00', isClosed: false },
  tuesday: { open: '09:00', close: '21:00', isClosed: false },
  wednesday: { open: '09:00', close: '21:00', isClosed: false },
  thursday: { open: '09:00', close: '21:00', isClosed: false },
  friday: { open: '09:00', close: '21:00', isClosed: false },
  saturday: { open: '10:00', close: '20:00', isClosed: false },
  sunday: { isClosed: true },
};

const toBoolean = (value: unknown): boolean =>
  value === true || value === 'true' || value === 1;

export const hasCompletedPharmacyProfile = (
  profile: PharmyxPharmacyProfile | null | undefined,
): boolean => {
  if (!profile) return false;
  return Boolean(profile.name && profile.ownerName && profile.phone);
};

export const mapPharmacyProfileToUser = (
  profile: PharmyxPharmacyProfile | null | undefined,
) => {
  if (!profile) return null;

  return {
    ...profile,
    id: profile.id || profile._id,
    _id: profile._id || profile.id,
    name: profile.name || '',
    phone: profile.phone || '',
    mobile: profile.phone || '',
    email: profile.email || '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
    pincode: profile.pincode || '',
    profilePictureUrl:
      profile.profilePictureUrl || profile.profileImage || '',
    profileImage: profile.profileImage || profile.profilePictureUrl || '',
    ownerName: profile.ownerName || '',
    nickname: profile.nickname || '',
    isVerified: toBoolean(profile.isVerified),
  };
};
