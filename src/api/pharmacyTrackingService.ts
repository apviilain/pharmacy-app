import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type { PharmyxTrackingSummary } from './pharmyx';

export const pharmacyTrackingService = {
  getSummary: async (): Promise<PharmyxTrackingSummary | null> => {
    const response: any = await apiClient.get(endpoints.pharmacyTracking.summary);
    return response || null;
  },

  getByPharmacyId: async (id: string): Promise<PharmyxTrackingSummary | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyTracking.byPharmacy(id),
    );
    return response || null;
  },
};
