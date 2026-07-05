import { localWallet } from './localUiData';

export type InitiateRechargePayload = {
  amount: number;
};
export type InitiateRechargeResponse = any;
export type VerifyPaymentPayload = any;
export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};

export const walletApi = {
  getWalletDetails: async (_userId: string) => ({
    balance: localWallet.balance,
    data: { balance: localWallet.balance },
  }),

  getWalletTransactions: async (
    _userId: string,
    _params: { transactionType?: string; page?: number; limit?: number } = {},
  ) => localWallet.transactions.map(item => ({ ...item })),

  initiateRecharge: async (
    payload: InitiateRechargePayload,
  ): Promise<ApiResponse<InitiateRechargeResponse>> => ({
    data: {
      razorpayOrderId: `order_${Date.now()}`,
      razorpayKeyId: 'rzp_test_placeholder',
      amount: payload.amount,
      currency: 'INR',
      paymentTransactionId: `txn_${Date.now()}`,
    },
  }),

  verifyPayment: async (
    payload: VerifyPaymentPayload,
  ): Promise<ApiResponse<any>> => ({
    data: payload,
    success: true,
    message: 'Payment verified',
  }),
};
