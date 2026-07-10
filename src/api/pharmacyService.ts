import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  ListPharmaciesParams,
  PharmyxPharmacyProfile,
  UpdateMyPharmacyProfileRequest,
} from './pharmyx';

export const pharmacyService = {
  getMyProfile: async (): Promise<PharmyxPharmacyProfile | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacies.meProfile,
    );
    return response || null;
  },

  updateMyProfile: async (
    payload: UpdateMyPharmacyProfileRequest,
  ): Promise<PharmyxPharmacyProfile> => {
    const response: any = await apiClient.put(
      endpoints.pharmacies.meProfile,
      payload,
    );
    return response;
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
