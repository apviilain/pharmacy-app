import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CreatePharmacySubscriptionRequest,
  ListPharmacySubscriptionsParams,
  PausePharmacySubscriptionRequest,
  PharmyxSubscription,
  UpdatePharmacySubscriptionRequest,
} from './pharmyx';

const normalizeArrayResponse = <T,>(response: any): T[] =>
  Array.isArray(response) ? response : response?.items || response?.data || [];

export const pharmacySubscriptionService = {
  create: async (
    payload: CreatePharmacySubscriptionRequest,
  ): Promise<PharmyxSubscription> => {
    const response: any = await apiClient.post(
      endpoints.pharmacySubscriptions.create,
      payload,
    );
    return response;
  },

  list: async (
    params: ListPharmacySubscriptionsParams = {},
  ): Promise<PharmyxSubscription[]> => {
    const response: any = await apiClient.get(endpoints.pharmacySubscriptions.list, {
      params,
    });
    return normalizeArrayResponse<PharmyxSubscription>(response);
  },

  update: async (
    id: string,
    payload: UpdatePharmacySubscriptionRequest,
  ): Promise<PharmyxSubscription> => {
    const response: any = await apiClient.put(
      endpoints.pharmacySubscriptions.update(id),
      payload,
    );
    return response;
  },

  pause: async (
    id: string,
    payload: PausePharmacySubscriptionRequest,
  ): Promise<PharmyxSubscription> => {
    const response: any = await apiClient.post(
      endpoints.pharmacySubscriptions.pause(id),
      payload,
    );
    return response;
  },

  remove: async (id: string): Promise<PharmyxSubscription> => {
    const response: any = await apiClient.delete(
      endpoints.pharmacySubscriptions.delete(id),
    );
    return response;
  },
};
