import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CommitInventoryImportRequest,
  InventoryImportPreviewInput,
  PharmyxInventoryImport,
} from './pharmyx';

const normalizeArrayResponse = <T,>(response: any): T[] =>
  Array.isArray(response) ? response : response?.items || response?.data || [];

export const pharmacyInventoryImportService = {
  preview: async (
    payload: InventoryImportPreviewInput,
  ): Promise<PharmyxInventoryImport> => {
    const formData = new FormData();
    formData.append('file', {
      uri: payload.uri,
      name: payload.name,
      type: payload.type || 'application/octet-stream',
    } as any);
    formData.append('importMode', payload.importMode || 'upsert');

    const response: any = await apiClient.post(
      endpoints.pharmacyInventoryImports.preview,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response;
  },

  commit: async (
    payload: CommitInventoryImportRequest,
  ): Promise<PharmyxInventoryImport> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyInventoryImports.commit,
      payload,
    );
    return response;
  },

  list: async (params: { page?: number; limit?: number } = {}) => {
    const response: any = await apiClient.get(
      endpoints.pharmacyInventoryImports.list,
      {
        params,
      },
    );
    return normalizeArrayResponse<PharmyxInventoryImport>(response);
  },

  getById: async (id: string): Promise<PharmyxInventoryImport | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyInventoryImports.details(id),
    );
    return response || null;
  },
};
