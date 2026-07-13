import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type {
  PharmyxCart,
  PharmyxCartItem,
  UpdatePharmacyCartItemRequest,
} from './pharmyx';

const normalizeCartItem = (item: any): PharmyxCartItem => ({
  ...item,
  id: item?.id || item?._id || item?.medicineId,
  _id: item?._id || item?.id || item?.medicineId,
  medicineId: item?.medicineId || item?.medicine?._id || item?.medicine?.id,
  quantity: Number(item?.quantity ?? 0) || 0,
  price: Number(item?.price ?? item?.medicine?.price ?? 0) || 0,
  totalPrice:
    Number(item?.totalPrice ?? item?.subtotal ?? item?.price ?? 0) || 0,
});

const normalizeCart = (response: any): PharmyxCart => {
  const source = response?.cart || response?.data || response || {};
  const rawItems = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.cartItems)
    ? source.cartItems
    : [];

  const items = rawItems.map(normalizeCartItem);
  const totalQuantity =
    Number(source?.totalQuantity ?? source?.quantity ?? 0) ||
    items.reduce(
      (sum: number, item: PharmyxCartItem) => sum + Number(item.quantity || 0),
      0,
    );
  const subtotal =
    Number(source?.subtotal ?? source?.totalAmount ?? source?.grandTotal ?? 0) ||
    items.reduce(
      (sum: number, item: PharmyxCartItem) =>
        sum +
        Number(
          item.totalPrice ||
            (Number(item.price || 0) * Number(item.quantity || 0)),
        ),
      0,
    );

  return {
    ...source,
    id: source?.id || source?._id || source?.pharmacyId || 'pharmacy-cart',
    _id: source?._id || source?.id || source?.pharmacyId || 'pharmacy-cart',
    items,
    totalItems: Number(source?.totalItems ?? items.length) || items.length,
    totalQuantity,
    subtotal,
    totalAmount:
      Number(source?.totalAmount ?? source?.grandTotal ?? subtotal) || subtotal,
  };
};

export const pharmacyCartService = {
  getCart: async (): Promise<PharmyxCart> => {
    const response: any = await apiClient.get(endpoints.pharmacyCart.summary);
    return normalizeCart(response);
  },

  updateItem: async (
    payload: UpdatePharmacyCartItemRequest,
  ): Promise<PharmyxCart> => {
    const response: any = await apiClient.post(endpoints.pharmacyCart.items, payload);
    return normalizeCart(response);
  },

  removeItem: async (medicineId: string): Promise<PharmyxCart> => {
    const response: any = await apiClient.delete(
      endpoints.pharmacyCart.removeItem(medicineId),
    );
    return normalizeCart(response);
  },

  clearCart: async (): Promise<PharmyxCart> => {
    const response: any = await apiClient.delete(endpoints.pharmacyCart.summary);
    return normalizeCart(response);
  },
};
