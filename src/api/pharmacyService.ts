import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CreatePharmacyProfileRequest,
  ListPharmaciesParams,
  PharmyxPharmacyProfile,
} from './pharmyx';

export const pharmacyService = {
  getMyProfile: async (): Promise<PharmyxPharmacyProfile | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacies.me,
    );
    return response || null;
  },

  createProfile: async (
    payload: CreatePharmacyProfileRequest,
  ): Promise<PharmyxPharmacyProfile> => {
    const response: any = await apiClient.post(
      endpoints.pharmacies.create,
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
