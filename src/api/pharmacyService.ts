import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import { ApiError } from './errorHandler';
import type {
  ListPharmaciesParams,
  PharmyxPharmacyProfile,
  UpdateMyPharmacyProfileRequest,
} from './pharmyx';

const extractProfile = (response: any): PharmyxPharmacyProfile | null => {
  if (!response || typeof response !== 'object') return null;

  const nested = response.pharmacy || response.profile || response.user;
  if (nested && typeof nested === 'object') {
    return nested as PharmyxPharmacyProfile;
  }

  return response as PharmyxPharmacyProfile;
};

export const pharmacyService = {
  getMyProfile: async (): Promise<PharmyxPharmacyProfile | null> => {
    try {
      const response: any = await apiClient.get(endpoints.pharmacies.meProfile);
      return extractProfile(response);
    } catch (error) {
      if (error instanceof ApiError && error.httpStatus === 404) return null;
      throw error;
    }
  },

  updateMyProfile: async (
    payload: UpdateMyPharmacyProfileRequest,
  ): Promise<PharmyxPharmacyProfile> => {
    const response: any = await apiClient.put(
      endpoints.pharmacies.meProfile,
      payload,
    );
    return extractProfile(response) || payload;
  },

  list: async (
    params: ListPharmaciesParams = {},
  ): Promise<PharmyxPharmacyProfile[]> => {
    const response: any = await apiClient.get(endpoints.pharmacies.list, {
      params,
    });
    return Array.isArray(response) ? response : response?.items || response?.data || [];
  },

  getById: async (id: string): Promise<PharmyxPharmacyProfile | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacies.details(id),
    );
    return response || null;
  },
};
