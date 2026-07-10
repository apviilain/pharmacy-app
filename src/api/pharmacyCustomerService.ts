import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CreateCustomerRequest,
  ListCustomersParams,
  PharmyxCustomer,
} from './pharmyx';

export const pharmacyCustomerService = {
  create: async (payload: CreateCustomerRequest): Promise<PharmyxCustomer> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyCustomers.create,
      payload,
    );
    return response;
  },

  list: async (
    params: ListCustomersParams = {},
  ): Promise<PharmyxCustomer[]> => {
    const response: any = await apiClient.get(endpoints.pharmacyCustomers.list, {
      params,
    });
    return Array.isArray(response) ? response : response?.items || response?.data || [];
  },
};
