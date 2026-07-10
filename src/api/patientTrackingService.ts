import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  PharmyxPatientTracking,
  UpdatePatientTrackingRequest,
} from './pharmyx';

export const patientTrackingService = {
  getById: async (id: string): Promise<PharmyxPatientTracking | null> => {
    const response: any = await apiClient.get(endpoints.patientTracking.details(id));
    return response || null;
  },

  update: async (
    id: string,
    payload: UpdatePatientTrackingRequest,
  ): Promise<PharmyxPatientTracking | null> => {
    const response: any = await apiClient.put(
      endpoints.patientTracking.update(id),
      payload,
    );
    return response || null;
  },
};
