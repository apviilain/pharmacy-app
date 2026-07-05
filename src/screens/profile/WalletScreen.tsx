import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import {
  ChevronLeft,
  MoreHorizontal,
  Tag,
  ArrowRight,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../../api/walletApi';
import { referralApi } from '../../api/referralApi';
import { useAuthStore } from '../../state/authStore';
import { Skeleton } from '../../components/Skeleton';
import { ListSkeleton } from '../../components/ListSkeleton';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import { env } from '../../config/env';

export const WalletScreen = () => {
  const user = useAuthStore(state => state.user);
  const userId = user?.id || user?._id;
  const queryClient = useQueryClient();

  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['walletDetails', userId],
    queryFn: () => walletApi.getWalletDetails(userId),
    enabled: !!userId,
  });

  const { data: transactionsData, isLoading: isLoadingTxns } = useQuery({
    queryKey: ['walletTransactions', userId],
    queryFn: () => walletApi.getWalletTransactions(userId),
    enabled: !!userId,
  });

  const balance = walletData?.data?.balance ?? walletData?.balance ?? 0;
  const transactions: any[] = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as any)?.data || [];

  const { data: referralData } = useQuery({
    queryKey: ['referralCode'],
    queryFn: referralApi.getReferralCode,
  });

  const referralCode =
    (referralData as any)?.referralCode ||
    (referralData as any)?.data?.referralCode ||
    (referralData as any)?.code ||
    '------';

  const handleShareReferral = async () => {
    try {
      if (referralCode === '------') {
        Toast.show({
          type: 'info',
          text1: 'Referral Code',
          text2: 'Fetching referral code, please try again.',
        });
        return;
      }

      const message = `Hey there! 👋

Join Pharmacy App using my referral code *${referralCode}* and get ₹200 added to your wallet instantly.

Experience hassle-free healthcare services at your doorstep.

Download now and enjoy the benefits 🚀`;
      await Share.share({
        message,
        title: 'Share Referral Code',
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const { useFocusEffect } = require('@react-navigation/native');

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['walletDetails', userId] });
      queryClient.invalidateQueries({
        queryKey: ['walletTransactions', userId],
      });
    }, [queryClient, userId]),
  );

  const handleAddMoney = async () => {
    const amountNum = parseInt(rechargeAmt, 10);
    if (!amountNum || amountNum < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter an amount of at least ₹10',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Get Order ID from backend
      const initRes = await walletApi.initiateRecharge({ amount: amountNum });
      console.log('Wallet Recharge Response:', initRes);

      // Defensively parse orderId and key across possible API structure variants
      const orderId =
        (initRes as any)?.razorpayOrderId ||
        (initRes as any)?.orderId ||
        (initRes as any)?.id ||
        (initRes as any)?.data?.razorpayOrderId ||
        (initRes as any)?.data?.orderId ||
        (initRes as any)?.data?.id;

      const razorpayKey =
        (initRes as any)?.razorpayKeyId ||
        (initRes as any)?.data?.razorpayKeyId ||
        env.RAZORPAY_KEY ||
        'rzp_test_placeholder';

      const paymentTransactionId =
        (initRes as any)?.paymentTransactionId ||
        (initRes as any)?.data?.paymentTransactionId;

      if (!orderId || typeof orderId !== 'string') {
        throw new Error(
          'Could not retrieve a valid payment order ID from server. Response: ' +
            JSON.stringify(initRes),
        );
      }

      // 2. Open Razorpay Checkout
      const options = {
        description: 'Wallet Recharge',
        currency: (initRes as any)?.currency || 'INR',
        key: razorpayKey,
        amount: (initRes as any)?.amount
          ? (initRes as any).amount * 100
          : amountNum * 100, // Amount in paise
        name: 'Pharmacy App',
        order_id: orderId,
        theme: { color: colors.primaryBlue },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // 3. Verify Payment
          try {
            await walletApi.verifyPayment({
              paymentTransactionId: paymentTransactionId,
              razorpayOrderId: data.razorpay_order_id,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySignature: data.razorpay_signature,
            });
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: `₹${amountNum} added to wallet successfully!`,
            });
            setShowRecharge(false);
            setRechargeAmt('');
            // Refresh wallet data
            queryClient.invalidateQueries({
              queryKey: ['walletDetails', userId],
            });
            queryClient.invalidateQueries({
              queryKey: ['walletTransactions', userId],
            });
          } catch (verifyErr: any) {
            Toast.show({
              type: 'error',
              text1: 'Payment Verification Failed',
              text2: verifyErr.message,
            });
          }
        })
        .catch((error: any) => {
          Toast.show({
            type: 'error',
            text1: 'Payment Failed/Cancelled',
            text2: error.description || '',
          });
        });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to initiate recharge',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#2B7BB9', '#1F6FA9', '#165E94']}
          locations={[0, 0.5, 1]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {isLoadingWallet ? (
            <Skeleton
              width={scale(150)}
              height={scale(48)}
              borderRadius={scale(8)}
              style={{ marginTop: verticalScale(10), backgroundColor: 'rgba(255,255,255,0.2)' }}
            />
          ) : (
            <Text style={styles.balanceValue}>
              ₹{balance.toLocaleString('en-IN')}
            </Text>
          )}
          <View style={styles.balanceBtns}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.lightBtn}
              onPress={() => setShowRecharge(true)}
            >
              <Text style={styles.lightBtnText}>+ Add Money</Text>
            </TouchableOpacity>
             <TouchableOpacity
              activeOpacity={0.85}
              style={styles.darkBtn}
              onPress={handleShareReferral}
            >
              <Text style={styles.darkBtnText}>Refer & Earn</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Transactions</Text>

        {isLoadingTxns ? (
          <ListSkeleton />
        ) : transactions.length > 0 ? (
          transactions.map((t: any, idx: number) => {
            // Determine credit vs debit properly
            const amountVal = Number(t.amount || 0);
            const titleText = (
              t.description ||
              t.title ||
              'Transaction'
            ).toLowerCase();
            const typeValue = (t.transactionType || t.type || '').toLowerCase();

            // If explicit type exists
            let isDebit =
              typeValue === 'debit' ||
              typeValue === 'payment' ||
              typeValue === 'booking';
            let isCredit =
              typeValue === 'credit' ||
              typeValue === 'recharge' ||
              typeValue === 'refund';

            // Fallback to searching title text if type is ambiguous or missing
            if (!isDebit && !isCredit) {
              if (
                titleText.includes('payment') ||
                titleText.includes('booking') ||
                titleText.includes('used for')
              ) {
                isDebit = true;
              } else if (
                titleText.includes('recharge') ||
                titleText.includes('added') ||
                titleText.includes('refilled')
              ) {
                isCredit = true;
              } else {
                // Last resort: sign of amount
                isCredit = amountVal > 0;
                isDebit = amountVal < 0;
              }
            }

            const amountText = `${isCredit ? '+' : '-'}₹${Math.abs(amountVal)}`;
            const displayTitle = t.description || t.title || 'Transaction';
            const dateText = t.createdAt
              ? new Date(t.createdAt).toLocaleDateString()
              : 'Recent';

            return (
              <View key={t._id || t.id || idx} style={styles.txnRow}>
                <View style={styles.iconBox}>
                  <Text style={styles.emoji}>{isCredit ? '💳' : '💸'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: scale(12) }}>
                  <Text style={styles.txnTitle}>{displayTitle}</Text>
                  <Text style={styles.txnSub}>{dateText}</Text>
                </View>
                <Text
                  style={[styles.amount, isCredit ? styles.plus : styles.minus]}
                >
                  {amountText}
                </Text>
              </View>
            );
          })
        ) : (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 20,
              color: colors.textLight,
            }}
          >
            No transactions yet.
          </Text>
        )}
      </ScrollView>

      {/* Custom Designed Add Money Modal */}
      <Modal
        visible={showRecharge}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecharge(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.whiteModalContent}>
            {/* Header */}
            <View style={styles.dmHeader}>
              <TouchableOpacity
                onPress={() => setShowRecharge(false)}
                hitSlop={10}
              >
                <ChevronLeft color="#333" size={24} />
              </TouchableOpacity>
              <Text style={styles.dmHeaderTitle}>Add Money</Text>
              <TouchableOpacity onPress={() => {}} hitSlop={10}>
                <MoreHorizontal color="#333" size={24} />
              </TouchableOpacity>
            </View>

            {/* Current Balance */}
            <View style={styles.dmBalanceWrap}>
              <Text style={styles.dmBalanceLabel}>Current Balance</Text>
              <Text style={styles.dmBalanceValue}>
                ₹{balance.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Large Amount Input */}
            <View style={styles.dmAmountWrapper}>
              <Text style={styles.dmCurrencySymbol}>₹</Text>
              <TextInput
                style={[
                  styles.dmAmountInput,
                  rechargeAmt ? { color: '#333' } : {},
                ]}
                placeholder="0.00"
                placeholderTextColor="#A2B2BF"
                keyboardType="numeric"
                value={rechargeAmt}
                onChangeText={setRechargeAmt}
                maxLength={6}
                autoFocus
              />
            </View>

            {/* Quick Add Chips */}
            <View style={styles.dmChipsRow}>
              {[500, 1000, 2000].map(val => (
                <TouchableOpacity
                  key={val}
                  style={styles.dmChip}
                  onPress={() => setRechargeAmt(val.toString())}
                >
                  <Text style={styles.dmChipText}>+₹{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Promo Code Box */}
            <View style={styles.dmPromoBox}>
              <View style={styles.dmPromoHeader}>
                <Tag
                  color={colors.primaryBlue}
                  size={16}
                  fill={colors.primaryBlue}
                />
                <Text style={styles.dmPromoHeadText}>Have a promo code?</Text>
              </View>
              <View style={styles.dmPromoInputRow}>
                <TextInput
                  style={styles.dmPromoInput}
                  placeholder="Enter Code"
                  placeholderTextColor="#A2B2BF"
                />
                <TouchableOpacity style={styles.dmPromoBtn}>
                  <Text style={styles.dmPromoBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Bottom Section */}
            <View style={styles.dmBottomWrapper}>
              <View style={styles.dmFeeRow}>
                <Text style={styles.dmFeeLabel}>Transaction Fee</Text>
                <Text style={styles.dmFeeValue}>₹0.00</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.dmProceedBtn}
                onPress={handleAddMoney}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.dmProceedBtnText}>Proceed to Pay</Text>
                    <ArrowRight color="#fff" size={20} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(18),
  },
  balanceCard: {
    borderRadius: scale(18),
    padding: scale(16),
    overflow: 'hidden',
  },
  balanceLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  balanceValue: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(42),
    color: '#fff',
    letterSpacing: -1,
  },
  balanceBtns: { flexDirection: 'row', marginTop: verticalScale(14) },
  lightBtn: {
    flex: 1,
    height: verticalScale(42),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  lightBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.primaryBlue,
  },
  darkBtn: {
    flex: 1,
    height: verticalScale(42),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  sectionTitle: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(10),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  iconBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(14),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: scale(16) },
  txnTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  txnSub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  amount: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
  },
  plus: { color: colors.primaryGreen },
  minus: { color: '#EF4444' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  whiteModalContent: {
    flex: 1,
    marginTop: 100,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  dmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dmHeaderTitle: {
    color: '#333',
    fontSize: 18,
    fontFamily: typography.fontFamily.semiBold,
  },
  dmBalanceWrap: { alignItems: 'center', marginTop: 30 },
  dmBalanceLabel: {
    color: '#666',
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  dmBalanceValue: {
    color: '#333',
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    marginTop: 4,
  },
  dmAmountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 20,
  },
  dmCurrencySymbol: {
    color: colors.primaryBlue,
    fontSize: 42,
    fontFamily: typography.fontFamily.bold,
    marginRight: 10,
  },
  dmAmountInput: {
    color: '#A2B2BF',
    fontSize: 64,
    fontFamily: typography.fontFamily.bold,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  dmChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 12,
  },
  dmChip: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  dmChipText: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
  },
  dmPromoBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginTop: 40,
  },
  dmPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dmPromoHeadText: {
    color: '#333',
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    marginLeft: 8,
  },
  dmPromoInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dmPromoInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#333',
  },
  dmPromoBtn: { backgroundColor: 'transparent' },
  dmPromoBtnText: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
  },
  dmBottomWrapper: {
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 20,
  },
  dmFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dmFeeLabel: {
    color: '#666',
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
  },
  dmFeeValue: {
    color: '#333',
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
  },
  dmProceedBtn: {
    backgroundColor: colors.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
  },
  dmProceedBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: typography.fontFamily.semiBold,
    marginRight: 8,
  },
});
