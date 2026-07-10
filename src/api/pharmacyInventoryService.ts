import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CreateInventoryRequest,
  InventoryActionRequest,
  ListInventoryParams,
  PharmyxInventoryAdjustment,
  PharmyxInventoryItem,
} from './pharmyx';

const normalizeArrayResponse = <T,>(response: any): T[] =>
  Array.isArray(response) ? response : response?.items || response?.data || [];

export const pharmacyInventoryService = {
  create: async (
    payload: CreateInventoryRequest,
  ): Promise<PharmyxInventoryItem[]> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyInventory.create,
      payload,
    );
    return normalizeArrayResponse<PharmyxInventoryItem>(response);
  },

  list: async (
    params: ListInventoryParams = {},
  ): Promise<PharmyxInventoryItem[]> => {
    const response: any = await apiClient.get(endpoints.pharmacyInventory.list, {
      params,
    });
    return normalizeArrayResponse<PharmyxInventoryItem>(response);
  },

  lowStock: async (
    params: ListInventoryParams = {},
  ): Promise<PharmyxInventoryItem[]> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyInventory.lowStock,
      {
        params,
      },
    );
    return normalizeArrayResponse<PharmyxInventoryItem>(response);
  },

  adjustments: async (
    params: ListInventoryParams = {},
  ): Promise<PharmyxInventoryAdjustment[]> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyInventory.adjustments,
      {
        params,
      },
    );
    return normalizeArrayResponse<PharmyxInventoryAdjustment>(response);
  },

  reserve: async (
    payload: InventoryActionRequest,
  ): Promise<PharmyxInventoryItem[]> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyInventory.reserve,
      payload,
    );
    return normalizeArrayResponse<PharmyxInventoryItem>(response);
  },

  release: async (
    payload: InventoryActionRequest,
  ): Promise<PharmyxInventoryItem[]> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyInventory.release,
      payload,
    );
    return normalizeArrayResponse<PharmyxInventoryItem>(response);
  },

  getById: async (id: string): Promise<PharmyxInventoryItem | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyInventory.details(id),
    );
    return response || null;
  },
};
