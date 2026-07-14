import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react-native';

import { pharmacyCartService } from '../../api/pharmacyCartService';
import { ApiError } from '../../api/errorHandler';
import type { PharmyxCartItem, UpdatePharmacyCartItemRequest } from '../../api/pharmyx';
import { colors } from '../../theme/colors';
import { moderateScale, scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { useAuthStore } from '../../state/authStore';
import { parseJwt } from '../../utils/jwt';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const getDisplayText = (value: unknown, fallback: string) => {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedValue =
      record.name ||
      record.brandName ||
      record.genericName ||
      record.manufacturer ||
      record.title;

    if (nestedValue !== undefined) {
      return getDisplayText(nestedValue, fallback);
    }
  }

  return fallback;
};

const getCartMedicineLabel = (item: PharmyxCartItem) =>
  getDisplayText(
    item.medicine?.name ||
      item.medicine?.brandName ||
      item.name ||
      item.genericName ||
      item.medicineId ||
      'Medicine',
    'Medicine'
  );

export function PharmacyCartScreen() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const jwtPayload = parseJwt(accessToken);
  const pharmacyId = String(
    authUser?.pharmacyId || jwtPayload?.pharmacyId || authUser?._id || ''
  );

  const pharmacyCartQuery = useQuery({
    queryKey: ['pharmacyCart'],
    queryFn: () => pharmacyCartService.getCart(),
  });

  const updateCartItemMutation = useMutation({
    mutationFn: (payload: UpdatePharmacyCartItemRequest) =>
      pharmacyCartService.updateItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyCart'] });
      Toast.show({
        type: 'success',
        text1: 'Cart updated',
        text2: 'Medicine quantity has been updated in the cart.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update cart',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: (medicineId: string) =>
      pharmacyCartService.removeItem(medicineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyCart'] });
      Toast.show({
        type: 'success',
        text1: 'Item removed',
        text2: 'Medicine has been removed from the cart.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to remove item',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => pharmacyCartService.clearCart(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyCart'] });
      Toast.show({
        type: 'success',
        text1: 'Cart cleared',
        text2: 'All cart items have been removed.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to clear cart',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const pharmacyCart = pharmacyCartQuery.data || null;
  const cartItems = pharmacyCart?.items || [];
  const cartTotalItems = Number(
    pharmacyCart?.totalItems ?? pharmacyCart?.totalQuantity ?? cartItems.length
  );
  const cartSubtotal = Number(
    pharmacyCart?.subtotal ??
      pharmacyCart?.totalAmount ??
      pharmacyCart?.grandTotal ??
      0
  );

  const handleUpdateQuantity = (medicineId: string, quantity: number) => {
    if (!pharmacyId || !medicineId) {
      Toast.show({
        type: 'error',
        text1: 'Unable to update cart',
        text2: 'Pharmacy or medicine details are missing.',
      });
      return;
    }

    updateCartItemMutation.mutate({
      pharmacyId,
      medicineId,
      quantity,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {pharmacyCartQuery.isLoading && !pharmacyCart ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading pharmacy cart...</Text>
        </View>
      ) : (
        <View style={styles.cartWorkspace}>
          <View style={styles.cartWorkspaceHeader}>
            <View style={styles.cartWorkspaceTitleWrap}>
              <View style={styles.cartWorkspaceIcon}>
                <ShoppingCart size={scale(20)} color={colors.primaryBlue} />
              </View>
              <View style={styles.cartWorkspaceCopy}>
                <Text style={styles.cartWorkspaceEyebrow}>Order summary</Text>
                <Text style={styles.cartWorkspaceTitle}>Your Cart</Text>
                <Text style={styles.cartWorkspaceSubtitle}>
                  {cartItems.length
                    ? `${cartItems.length} medicine${cartItems.length === 1 ? '' : 's'} ready to review`
                    : 'No medicines added yet'}
                </Text>
              </View>
            </View>

            <View style={styles.cartWorkspaceActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!cartItems.length || clearCartMutation.isPending}
                onPress={() => clearCartMutation.mutate()}
                style={[
                  styles.cartWorkspaceClearButton,
                  !cartItems.length && styles.cartWorkspaceClearButtonDisabled,
                ]}
              >
                <Trash2
                  size={scale(15)}
                  color={!cartItems.length ? colors.textLight : '#A16207'}
                />
                <Text
                  style={[
                    styles.cartWorkspaceClearButtonText,
                    !cartItems.length && styles.cartWorkspaceClearButtonTextDisabled,
                  ]}
                >
                  Clear Cart
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cartSummaryRow}>
            <View style={[styles.cartSummaryCard, styles.cartSummaryCardPrimary]}>
              <Text style={styles.cartSummaryLabel}>Total Items</Text>
              <Text style={styles.cartSummaryValue}>{cartTotalItems || 0}</Text>
            </View>
            <View style={styles.cartSummaryCard}>
              <Text style={styles.cartSummaryLabel}>Subtotal</Text>
              <Text style={styles.cartSummaryValue}>
                {cartSubtotal > 0 ? `₹${cartSubtotal.toFixed(2)}` : '₹0.00'}
              </Text>
            </View>
          </View>

          {pharmacyCartQuery.error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load cart</Text>
              <Text style={styles.errorText}>
                {getErrorMessage(
                  pharmacyCartQuery.error,
                  'Unable to load pharmacy cart right now.'
                )}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => pharmacyCartQuery.refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!cartItems.length ? (
            <View style={styles.cartEmptyState}>
              <View style={styles.cartEmptyIconWrap}>
                <ShoppingCart size={scale(22)} color={colors.primaryBlue} />
              </View>
              <Text style={styles.cartEmptyTitle}>Your cart is empty</Text>
              <Text style={styles.cartEmptyText}>
                Medicines add karne ke baad yahan se quantity manage kar paoge.
              </Text>
            </View>
          ) : (
            <View style={styles.cartItemsStack}>
              {cartItems.map((item) => {
                const itemMedicineId = String(
                  item.medicineId || item.medicine?._id || item.medicine?.id || ''
                );
                const itemQuantity = Number(item.quantity || 0) || 0;
                const itemPrice =
                  Number(item.totalPrice ?? item.subtotal ?? item.price ?? 0) || 0;

                return (
                  <View
                    key={itemMedicineId || getCartMedicineLabel(item)}
                    style={styles.cartItemCard}
                  >
                    <View style={styles.cartItemHeader}>
                      <View style={styles.cartItemCopy}>
                        <Text style={styles.cartItemTitle}>
                          {getCartMedicineLabel(item)}
                        </Text>
                        <Text style={styles.cartItemSubtitle}>
                          {getDisplayText(
                            item.medicine?.genericName ||
                              item.genericName ||
                              item.medicine?.manufacturer ||
                              item.manufacturer ||
                              'Pharmacy medicine',
                            'Pharmacy medicine'
                          )}
                        </Text>
                      </View>
                      <View style={styles.cartItemPricePill}>
                        <Text style={styles.cartItemPriceText}>
                          {itemPrice > 0 ? `₹${itemPrice.toFixed(2)}` : 'No price'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cartItemFooter}>
                      <View style={styles.cartItemStepper}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={updateCartItemMutation.isPending}
                          onPress={() => handleUpdateQuantity(itemMedicineId, -1)}
                          style={styles.cartItemStepButton}
                        >
                          <Minus size={scale(15)} color={colors.primaryBlue} />
                        </TouchableOpacity>
                        <Text style={styles.cartItemQuantityText}>{itemQuantity}</Text>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={updateCartItemMutation.isPending}
                          onPress={() => handleUpdateQuantity(itemMedicineId, 1)}
                          style={[
                            styles.cartItemStepButton,
                            styles.cartItemStepButtonAccent,
                          ]}
                        >
                          <Plus size={scale(15)} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={removeCartItemMutation.isPending}
                        onPress={() => removeCartItemMutation.mutate(itemMedicineId)}
                        style={styles.cartItemDeleteButton}
                      >
                        <Trash2 size={scale(15)} color="#B45309" />
                        <Text style={styles.cartItemDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9FE',
  },
  contentContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(28),
  },
  loadingCard: {
    borderRadius: moderateScale(28),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(22),
    paddingVertical: verticalScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CFE5FB',
    shadowColor: '#85BEEA',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  loadingText: {
    marginTop: verticalScale(10),
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  cartWorkspace: {
    borderRadius: moderateScale(32),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(20),
    borderWidth: 1,
    borderColor: '#CFE5FB',
    shadowColor: '#7DB5E2',
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cartWorkspaceHeader: {
    gap: verticalScale(14),
  },
  cartWorkspaceTitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
  },
  cartWorkspaceIcon: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(17),
    backgroundColor: '#DDF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartWorkspaceCopy: {
    flex: 1,
    paddingTop: verticalScale(2),
  },
  cartWorkspaceEyebrow: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cartWorkspaceTitle: {
    marginTop: verticalScale(4),
    color: colors.textHeader,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
  },
  cartWorkspaceSubtitle: {
    marginTop: verticalScale(6),
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: moderateScale(18),
  },
  cartWorkspaceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartWorkspaceClearButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(7),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E8D9B6',
    backgroundColor: '#FFF8EA',
  },
  cartWorkspaceClearButtonDisabled: {
    borderColor: '#D9E4F0',
    backgroundColor: '#F4F7FB',
  },
  cartWorkspaceClearButtonText: {
    color: '#A16207',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
  cartWorkspaceClearButtonTextDisabled: {
    color: colors.textLight,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(16),
  },
  cartSummaryCard: {
    flex: 1,
    minHeight: verticalScale(128),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: '#D9E7F5',
    backgroundColor: '#F7FBFF',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(16),
    justifyContent: 'space-between',
  },
  cartSummaryCardPrimary: {
    backgroundColor: '#E9F4FF',
    borderColor: '#B9DDFC',
  },
  cartSummaryLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cartSummaryValue: {
    color: colors.textHeader,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
  },
  errorCard: {
    marginTop: verticalScale(18),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#F6C9C9',
    backgroundColor: '#FFF6F6',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  errorTitle: {
    color: '#B42318',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
  },
  errorText: {
    marginTop: verticalScale(6),
    color: '#B42318',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: moderateScale(20),
  },
  retryButton: {
    marginTop: verticalScale(12),
    alignSelf: 'flex-start',
    borderRadius: scale(14),
    backgroundColor: '#FDECEC',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
  },
  retryButtonText: {
    color: '#B42318',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  cartEmptyState: {
    marginTop: verticalScale(18),
    borderRadius: moderateScale(26),
    borderWidth: 1,
    borderColor: '#D9E7F5',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(24),
    alignItems: 'flex-start',
  },
  cartEmptyIconWrap: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(16),
    backgroundColor: '#E7F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartEmptyTitle: {
    marginTop: verticalScale(16),
    color: colors.textHeader,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  cartEmptyText: {
    marginTop: verticalScale(8),
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: moderateScale(22),
  },
  cartItemsStack: {
    marginTop: verticalScale(18),
    gap: verticalScale(14),
  },
  cartItemCard: {
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: '#D9E7F5',
    backgroundColor: '#FCFEFF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  cartItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  cartItemCopy: {
    flex: 1,
  },
  cartItemTitle: {
    color: colors.textHeader,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
  },
  cartItemSubtitle: {
    marginTop: verticalScale(6),
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: moderateScale(17),
  },
  cartItemPricePill: {
    borderRadius: scale(12),
    backgroundColor: '#EEF6FF',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
  },
  cartItemPriceText: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
  cartItemFooter: {
    marginTop: verticalScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  cartItemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    borderRadius: scale(16),
    backgroundColor: '#F4F9FE',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(6),
  },
  cartItemStepButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(11),
    borderWidth: 1,
    borderColor: '#BCD7F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemStepButtonAccent: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  cartItemQuantityText: {
    minWidth: scale(20),
    textAlign: 'center',
    color: colors.textHeader,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
  },
  cartItemDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    borderRadius: scale(14),
    backgroundColor: '#FFF6E9',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(9),
  },
  cartItemDeleteText: {
    color: '#A16207',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
});
