import {
  localReferralSummary,
  localReferralTransactions,
} from './localUiData';

export type ReferralEarningsResponse = {
  userId?: string;
  totalEarnings?: number;
  totalEarned?: number;
  totalReferralEarnings?: number;
  totalTransactions?: number;
  totalReferrals?: number;
  referredUsersCount?: number;
  successfulReferrals?: number;
  referralsCount?: number;
  rewardPerReferral?: number;
  perReferralAmount?: number;
  referralReward?: number;
  data?: Record<string, any>;
};

export type ReferralTransactionsParams = {
  page?: number;
  limit?: number;
};

export type ReferralTransactionsResponse = {
  data?: ReferralTransaction[];
  summary?: {
    totalEarned?: number;
    totalTransactions?: number;
  };
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ReferralTransaction = {
  _id?: string;
  id?: string;
  amount?: number;
  description?: string;
  title?: string;
  createdAt?: string;
  status?: string;
  type?: string;
  transactionType?: string;
  [key: string]: any;
};

export const referralApi = {
  getReferralCode: async () => ({
    referralCode: localReferralSummary.code,
    code: localReferralSummary.code,
  }),

  applyReferralCode: async (referralCode: string) => ({
    success: true,
    referralCode,
  }),

  getReferralEarnings: async (): Promise<ReferralEarningsResponse> => ({
    totalEarned: localReferralSummary.totalEarned,
    totalTransactions: localReferralSummary.totalTransactions,
    totalReferrals: localReferralSummary.totalTransactions,
    rewardPerReferral: localReferralSummary.rewardPerReferral,
  }),

  getReferralTransactions: async (
    params: ReferralTransactionsParams = { page: 1, limit: 10 },
  ): Promise<ReferralTransactionsResponse> => ({
    data: localReferralTransactions.slice(0, params.limit || 10),
    summary: {
      totalEarned: localReferralSummary.totalEarned,
      totalTransactions: localReferralSummary.totalTransactions,
    },
    pagination: {
      page: params.page || 1,
      limit: params.limit || 10,
      total: localReferralTransactions.length,
      totalPages: 1,
    },
  }),
};
