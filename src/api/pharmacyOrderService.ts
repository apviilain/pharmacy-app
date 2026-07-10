import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  CancelPharmacyOrderRequest,
  CreateOrderHealthCheckRequest,
  CreatePharmacyOrderRequest,
  ListPharmacyOrdersParams,
  MarkPharmacyOrderPaidRequest,
  PharmyxOrderHealthCheck,
  PharmyxOrder,
  UpdatePharmacyOrderRequest,
  UpdateOrderHealthCheckRequest,
  UpdatePharmacyOrderStatusRequest,
} from './pharmyx';

const normalizeArrayResponse = <T,>(response: any): T[] =>
  Array.isArray(response) ? response : response?.items || response?.data || [];

export const pharmacyOrderService = {
  create: async (payload: CreatePharmacyOrderRequest): Promise<PharmyxOrder> => {
    const response: any = await apiClient.post(endpoints.pharmacyOrders.create, payload);
    return response;
  },

  list: async (
    params: ListPharmacyOrdersParams = {},
  ): Promise<PharmyxOrder[]> => {
    const response: any = await apiClient.get(endpoints.pharmacyOrders.list, {
      params,
    });
    return normalizeArrayResponse<PharmyxOrder>(response);
  },

  getById: async (id: string): Promise<PharmyxOrder | null> => {
    const response: any = await apiClient.get(endpoints.pharmacyOrders.details(id));
    return response || null;
  },

  update: async (
    id: string,
    payload: UpdatePharmacyOrderRequest,
  ): Promise<PharmyxOrder> => {
    const response: any = await apiClient.put(
      endpoints.pharmacyOrders.update(id),
      payload,
    );
    return response;
  },

  updateStatus: async (
    id: string,
    payload: UpdatePharmacyOrderStatusRequest,
  ): Promise<PharmyxOrder> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyOrders.status(id),
      payload,
    );
    return response;
  },

  cancel: async (
    id: string,
    payload: CancelPharmacyOrderRequest,
  ): Promise<PharmyxOrder> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyOrders.cancel(id),
      payload,
    );
    return response;
  },

  markPaid: async (
    id: string,
    payload: MarkPharmacyOrderPaidRequest,
  ): Promise<PharmyxOrder> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyOrders.markPaid(id),
      payload,
    );
    return response;
  },

  createHealthCheck: async (
    id: string,
    payload: CreateOrderHealthCheckRequest,
  ): Promise<PharmyxOrderHealthCheck> => {
    const response: any = await apiClient.post(
      endpoints.pharmacyOrders.healthCheck(id),
      payload,
    );
    return response;
  },

  updateHealthCheck: async (
    id: string,
    payload: UpdateOrderHealthCheckRequest,
  ): Promise<PharmyxOrderHealthCheck> => {
    const response: any = await apiClient.put(
      endpoints.pharmacyOrders.healthCheck(id),
      payload,
    );
    return response;
  },

  getHealthCheck: async (id: string): Promise<PharmyxOrderHealthCheck | null> => {
    const response: any = await apiClient.get(
      endpoints.pharmacyOrders.healthCheck(id),
    );
    return response || null;
  },
};
