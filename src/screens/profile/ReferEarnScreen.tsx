import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '../../api/referralApi';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TransactionSeparator = () => <View style={styles.txnDivider} />;

export const ReferEarnScreen = () => {
  const insets = useSafeAreaInsets();
  const bottomSpacing =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, verticalScale(96))
      : Math.max(insets.bottom, verticalScale(24));

  const { data: referralData, isLoading } = useQuery({
    queryKey: ['referralCode'],
    queryFn: referralApi.getReferralCode,
  });

  const { data: earningsData, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ['referralEarnings'],
    queryFn: referralApi.getReferralEarnings,
  });

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery(
    {
      queryKey: ['referralTransactions', 1, 10],
      queryFn: () =>
        referralApi.getReferralTransactions({ page: 1, limit: 10 }),
    },
  );

  const referralCode =
    (referralData as any)?.referralCode ||
    (referralData as any)?.data?.referralCode ||
    (referralData as any)?.code ||
    '------';

  const earningsPayload = (earningsData as any)?.data || earningsData || {};
  const transactionsPayload =
    (transactionsData as any)?.data || transactionsData || {};
  const transactionsSummary = transactionsPayload?.summary || {};
  const transactions: any[] =
    transactionsPayload?.data ||
    transactionsPayload?.transactions ||
    transactionsPayload?.items ||
    transactionsPayload?.records ||
    transactionsPayload?.docs ||
    (Array.isArray(transactionsPayload) ? transactionsPayload : []);

  const totalReferrals =
    Number(
      earningsPayload?.totalTransactions ??
        transactionsSummary?.totalTransactions ??
        earningsPayload?.totalReferrals ??
        earningsPayload?.referredUsersCount ??
        earningsPayload?.successfulReferrals ??
        earningsPayload?.referralsCount,
    ) || transactions.length;

  const totalEarned =
    Number(
      earningsPayload?.totalEarnings ??
        earningsPayload?.totalEarned ??
        transactionsSummary?.totalEarned ??
        earningsPayload?.totalReferralEarnings,
    ) || 0;

  const rewardPerReferral = Number(
    earningsPayload?.rewardPerReferral ??
      earningsPayload?.perReferralAmount ??
      earningsPayload?.referralReward,
  );

  const handleShare = async () => {
    try {
      if (referralCode === '------') return;

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

  const renderTransactionItem = ({ item }: { item: any }) => {
    const amount = Number(item?.amount) || 0;
    const title = item?.description || item?.title || 'Referral bonus';
    const createdAt = item?.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-IN')
      : 'Recent';

    return (
      <View style={styles.txnRow}>
        <View style={styles.txnMeta}>
          <Text style={styles.txnTitle}>{title}</Text>
          <Text style={styles.txnDate}>{createdAt}</Text>
        </View>
        <Text style={styles.txnAmount}>
          +₹{Math.abs(amount).toLocaleString('en-IN')}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomSpacing },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#41b34a', '#2ea33a']} style={styles.card}>
          <Text style={styles.cardTop}>Your unique referral code</Text>
          <View style={styles.codeBox}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.code}>{referralCode}</Text>
            )}
          </View>
          <Text style={styles.cardSub}>Share with friends & family</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.shareBtn}
            onPress={handleShare}
          >
            <Text style={styles.shareText}>Share Referral Code</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>How it works</Text>

        <View style={[styles.stepRow, styles.stepRowGreen]}>
          <Text style={styles.stepIcon}>📨</Text>
          <Text style={styles.stepText}>Share your code with a friend</Text>
        </View>
        <View style={[styles.stepRow, styles.stepRowBlue]}>
          <Text style={styles.stepIcon}>🧑‍⚕️</Text>
          <Text style={styles.stepText}>Friend signs up using your code</Text>
        </View>
        <View style={[styles.stepRow, styles.stepRowAmber]}>
          <Text style={styles.stepIcon}>💰</Text>
          <Text style={styles.stepText}>Both get ₹200 wallet credit!</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              {isLoadingEarnings ? (
                <ActivityIndicator color={colors.primaryGreen} />
              ) : (
                <Text style={styles.statValue}>{totalReferrals}</Text>
              )}
              <Text style={styles.statLabel}>Friends Referred</Text>
            </View>
            <View style={styles.vline} />
            <View style={styles.statCol}>
              {isLoadingEarnings ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <Text style={[styles.statValue, { color: colors.primaryBlue }]}>
                  ₹{totalEarned.toLocaleString('en-IN')}
                </Text>
              )}
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
          </View>
        </View>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>Reward Per Referral</Text>
          <Text style={styles.rewardValue}>
            ₹
            {Number.isNaN(rewardPerReferral)
              ? 0
              : rewardPerReferral.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Recent Referral Transactions</Text>
          {isLoadingTransactions ? (
            <ActivityIndicator
              color={colors.primaryBlue}
              style={styles.historyLoader}
            />
          ) : transactions.length > 0 ? (
            <FlatList
              data={transactions}
              keyExtractor={(item, index) =>
                String(item?._id || item?.id || `referral-txn-${index}`)
              }
              scrollEnabled={false}
              ItemSeparatorComponent={TransactionSeparator}
              renderItem={renderTransactionItem}
            />
          ) : (
            <Text style={styles.emptyText}>No referral transactions yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: scale(16), paddingTop: verticalScale(10) },
  card: { borderRadius: scale(18), padding: scale(16), overflow: 'hidden' },
  cardTop: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  codeBox: {
    marginTop: verticalScale(12),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: scale(12),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },
  code: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(28),
    letterSpacing: 4,
    color: '#fff',
  },
  cardSub: {
    marginTop: verticalScale(10),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  shareBtn: {
    marginTop: verticalScale(14),
    height: verticalScale(44),
    borderRadius: scale(12),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.primaryGreen,
  },
  sectionTitle: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(10),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(14),
    marginBottom: verticalScale(10),
  },
  stepRowGreen: { backgroundColor: 'rgba(65,179,74,0.10)' },
  stepRowBlue: { backgroundColor: 'rgba(21,114,183,0.08)' },
  stepRowAmber: { backgroundColor: 'rgba(245,158,11,0.10)' },
  stepIcon: { fontSize: scale(18), marginRight: scale(10) },
  stepText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  statsCard: {
    marginTop: verticalScale(10),
    backgroundColor: '#F6F8FB',
    borderRadius: scale(16),
    padding: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  statsTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(12),
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(28),
    color: colors.primaryGreen,
  },
  statLabel: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  vline: {
    width: 1,
    height: verticalScale(46),
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  rewardCard: {
    marginTop: verticalScale(12),
    backgroundColor: '#EEF7FF',
    borderRadius: scale(16),
    padding: scale(14),
  },
  rewardTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  rewardValue: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: colors.primaryBlue,
  },
  historyCard: {
    marginTop: verticalScale(12),
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: verticalScale(24),
  },
  historyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
  historyLoader: {
    marginVertical: verticalScale(8),
  },
  txnDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: verticalScale(10),
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txnMeta: {
    flex: 1,
    marginRight: scale(10),
  },
  txnTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  txnDate: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  txnAmount: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.primaryGreen,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: verticalScale(8),
  },
});
