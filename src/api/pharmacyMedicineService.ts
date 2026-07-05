import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CreateMedicineRequest,
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

  getById: async (id: string): Promise<PharmyxMedicine | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyMedicines.details(id),
    );
    return response || null;
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
