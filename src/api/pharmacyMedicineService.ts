import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CreateMedicineRequest,
  MedicineAvailabilityItem,
  MedicineAvailabilityParams,
  NearbyMedicinesParams,
  PharmyxMedicine,
  UpdateMedicineRequest,
} from './pharmyx';

export const pharmacyMedicineService = {
  create: async (payload: CreateMedicineRequest): Promise<PharmyxMedicine> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyMedicines.create,
      payload,
    );
    return response;
  },

  list: async (params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PharmyxMedicine[]> => {
    const response: any = await apiClient.get(endpoints.pharmacyMedicines.list, {
      params,
    });
    return Array.isArray(response) ? response : response?.items || response?.data || [];
  },

  getNearbyMedicines: async (
    params: NearbyMedicinesParams,
  ): Promise<PharmyxMedicine[]> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyMedicines.nearby,
      { params },
    );

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    return [];
  },

  getById: async (id: string): Promise<PharmyxMedicine | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyMedicines.details(id),
    );
    return response || null;
  },

  getAvailability: async (
    params: MedicineAvailabilityParams,
  ): Promise<MedicineAvailabilityItem[]> => {
    const response: any = await apiClient.get(
      endpoints.pharmacies.medicineAvailability,
      { params },
    );

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    return [];
  },

  update: async (
    id: string,
    payload: UpdateMedicineRequest,
  ): Promise<PharmyxMedicine> => {
    const response: any = await apiClient.put(
      endpoints.pharmacyMedicines.update(id),
      payload,
    );
    return response;
  },
};
