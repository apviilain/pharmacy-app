import { localCoupons } from './localUiData';

export type Coupon = {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  isActive: boolean;
  description?: string;
};

export type ValidateCouponPayload = {
  code: string;
  userId: string;
  bookingType: string;
  bookingId?: string;
  purchaseAmount: number;
};

export const couponService = {
  getCoupons: async (): Promise<Coupon[]> => localCoupons.map(item => ({ ...item })),

  validateCoupon: async (payload: ValidateCouponPayload): Promise<any> => {
    const coupon = localCoupons.find(
      item => item.code.toLowerCase() === payload.code.toLowerCase(),
    );

    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    const discount =
      coupon.discountType === 'percentage'
        ? Math.min(
            (payload.purchaseAmount * coupon.discountValue) / 100,
            coupon.maxDiscountAmount || Number.MAX_SAFE_INTEGER,
          )
        : coupon.discountValue;

    return {
      valid: true,
      discountAmount: discount,
      coupon,
    };
  },
};
