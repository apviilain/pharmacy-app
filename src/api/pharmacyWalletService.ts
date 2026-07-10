import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  ListWalletTransactionsParams,
  PharmyxWallet,
  PharmyxWalletTransaction,
  WalletTopupRequest,
} from './pharmyx';

const normalizeArrayResponse = <T,>(response: any): T[] =>
  Array.isArray(response) ? response : response?.items || response?.data || [];

export const pharmacyWalletService = {
  getSummary: async (): Promise<PharmyxWallet | null> => {
    const response: any = await apiClient.get(endpoints.pharmacyWallet.summary);
    return response || null;
  },

  getTransactions: async (
    params: ListWalletTransactionsParams = {},
  ): Promise<PharmyxWalletTransaction[]> => {
    const response: any = await apiClient.get(endpoints.pharmacyWallet.transactions, {
      params,
    });
    return normalizeArrayResponse<PharmyxWalletTransaction>(response);
  },

  topup: async (payload: WalletTopupRequest): Promise<PharmyxWallet | null> => {
    const response: any = await apiClient.post(endpoints.pharmacyWallet.topup, payload);
    return response || null;
  },
};
