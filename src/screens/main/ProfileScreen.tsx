import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { ChevronRight, Edit2, User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { fileApi } from '../../api/fileApi';
import { env } from '../../config/env';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuthStore } from '../../state/authStore';
import { scale, verticalScale } from '../../theme/responsive';

import type { RootStackParamList } from '../../navigation/types';
import { profileMenu, profileStats } from '../profile/mockProfileData';
import { walletApi } from '../../api/walletApi';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '../../api/appointmentService';
import { CustomLogoutModal } from '../../components/profile/CustomLogoutModal';
import { DetailsSkeleton } from '../../components/DetailsSkeleton';
import LinearGradient from 'react-native-linear-gradient';
import { referralApi } from '../../api/referralApi';

const menuIconBgColors = [
  '#EAF4FF',
  '#FEE2E2',
  '#DCFCE7',
  '#EAF4FF',
  '#FEF3C7',
  '#FEF3C7',
];

export const ProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const { user, loading } = useProfile();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const handleEditProfile = React.useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchWallet = async () => {
        const userId = user?._id || user?.id;
        if (!userId) return;
        try {
          const response = await walletApi.getWalletDetails(userId);
          const amount = response?.data?.balance ?? response?.balance ?? 0;
          setWalletBalance(amount);
        } catch (err) {
          console.error('Wallet fetch failed in Profile:', err);
        }
      };

      if (user) {
        fetchWallet();
      }
    }, [user]),
  );

  const { data: appointments } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: () => appointmentService.getAppointments({ status: 'All' }),
    enabled: !!user,
  });

  const { data: referralEarnings } = useQuery({
    queryKey: ['referralEarnings'],
    queryFn: referralApi.getReferralEarnings,
    enabled: !!user,
  });

  const counts = React.useMemo(() => {
    if (!appointments) return { upcoming: 0, orders: 0, vault: 0 };

    const upcoming = appointments.filter(
      a => a.status === 'pending' || a.status === 'confirmed',
    ).length;
    const orders = appointments.length;

    let vault = 0;
    appointments.forEach((a: any) => {
      if (a.documents) vault += a.documents.length;
      if (a.report?.fileUrls) vault += a.report.fileUrls.length;
      if (a.prescription?.fileUrls) vault += a.prescription.fileUrls.length;
    });

    return { upcoming, orders, vault };
  }, [appointments]);

  const earnedAmount =
    Number(
      (referralEarnings as any)?.data?.totalEarned ??
        (referralEarnings as any)?.totalEarned ??
        (referralEarnings as any)?.data?.totalEarnings ??
        (referralEarnings as any)?.totalEarnings,
    ) || 0;

  const genderOptions = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Edit2 size={scale(20)} color={colors.primaryBlue} />
        </TouchableOpacity>
      ),
    });
  }, [handleEditProfile, navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailsSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(20) }}
      >
        <LinearGradient
          colors={[colors.primaryBlue, '#1F6FA9', '#165E94']}
          style={[styles.header, { paddingTop: verticalScale(30) }]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleEditProfile}
            style={styles.profileHero}
          >
            <View style={styles.avatarOuterRing}>
              <View style={styles.avatarContainer}>
                {user?.profileImage ||
                user?.profilePictureUrl ||
                user?.profilePicture ? (
                  <Image
                    source={{
                      uri: (() => {
                        const rawUrl =
                          user?.profileImage ||
                          user?.profilePictureUrl ||
                          user?.profilePicture ||
                          '';
                        if (!rawUrl) return '';

                        if (
                          rawUrl.startsWith('http') ||
                          rawUrl.startsWith('file://') ||
                          rawUrl.startsWith('content://')
                        ) {
                          return rawUrl;
                        }

                        const baseUrlTrimmed = env.BASE_URL.endsWith('/')
                          ? env.BASE_URL.slice(0, -1)
                          : env.BASE_URL;
                        const relativePath = rawUrl.startsWith('/')
                          ? rawUrl
                          : '/' + rawUrl;

                        return baseUrlTrimmed + relativePath;
                      })(),
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={scale(40)} color={colors.primaryBlue} />
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.nameText}>{user?.name || 'User'}</Text>
            <Text style={styles.metaText}>
              {user?.email || ''} • {user?.phone || user?.mobile || ''}
            </Text>
            <View style={styles.editProfileChip}>
              <Edit2 size={scale(14)} color={colors.primaryBlue} />
              <Text style={styles.editProfileChipText}>Edit Profile</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            {profileStats.map(s => {
              let displayValue = s.value;
              if (s.id === 's1')
                displayValue = String(
                  counts.upcoming +
                    (appointments?.filter(a => a.status === 'completed')
                      .length || 0),
                ); // Total Consults
              if (s.id === 's2') displayValue = String(counts.orders);
              if (s.id === 's3')
                displayValue = `₹${earnedAmount.toLocaleString('en-IN')}`;

              return (
                <View key={s.id} style={styles.statGlassCard}>
                  <Text style={styles.statValueText}>{displayValue}</Text>
                  <Text style={styles.statLabelText}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.menuContainer}>
          {profileMenu.map((m, idx) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(m.route)}
              style={styles.menuRow}
            >
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.menuIconBox,
                    {
                      backgroundColor:
                        menuIconBgColors[idx % menuIconBgColors.length],
                    },
                  ]}
                >
                  <Text style={styles.menuEmoji}>{m.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{m.title}</Text>
                  {m.id === 'm1' && walletBalance !== null ? (
                    <Text style={styles.menuSub}>
                      Balance : ₹{walletBalance.toLocaleString('en-IN')}
                    </Text>
                  ) : m.id === 'm2' ? (
                    <Text style={styles.menuSub}>
                      {counts.upcoming} upcoming
                    </Text>
                  ) : m.id === 'm3' ? (
                    <Text style={styles.menuSub}>
                      {counts.orders} total orders
                    </Text>
                  ) : m.id === 'm4' ? (
                    <Text style={styles.menuSub}>
                      {counts.vault} records stored
                    </Text>
                  ) : m.subtitle ? (
                    <Text style={styles.menuSub}>{m.subtitle}</Text>
                  ) : null}
                </View>
              </View>
              <ChevronRight size={scale(18)} color="#9CA3AF" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.menuRow, { borderBottomWidth: 0 }]} // Last item has no border
            onPress={() => setLogoutModalVisible(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, styles.logoutIconBox]}>
                <Text style={styles.menuEmoji}>🚪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoutText}>Logout</Text>
              </View>
            </View>
            <ChevronRight size={scale(18)} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomLogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          const logout = useAuthStore.getState().logout;
          await logout();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: verticalScale(90) },
  header: {
    backgroundColor: '#E8F2FB',
    paddingBottom: verticalScale(30),
    alignItems: 'center',
  },
  profileHero: {
    alignItems: 'center',
  },
  headerRightBtn: {
    padding: scale(8),
  },
  avatarOuterRing: {
    width: scale(102),
    height: scale(102),
    borderRadius: scale(51),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(10),
  },
  avatarContainer: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: scale(45),
  },
  nameText: {
    marginTop: verticalScale(16),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: '#FFFFFF',
  },
  metaText: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  editProfileChip: {
    marginTop: verticalScale(14),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: scale(999),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  editProfileChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(28),
    paddingHorizontal: scale(16),
    gap: scale(12),
  },
  statGlassCard: {
    flex: 1,
    height: verticalScale(70),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: '#FFFFFF',
  },
  statLabelText: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  editingTitle: {
    marginTop: verticalScale(20),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: '#fff',
  },
  menuContainer: {
    backgroundColor: '#fff',
    paddingTop: verticalScale(16),
  },
  menuRow: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F9FAFB',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: scale(10),
  },
  menuIconBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  logoutIconBox: { backgroundColor: '#FEE2E2' },
  menuEmoji: { fontSize: scale(20) },
  menuTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  menuSub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  logoutText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#EF4444',
  },
  editButton: {
    position: 'absolute',
    right: scale(16),
    top: verticalScale(60), // Account for header inset
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  cancelButton: {
    position: 'absolute',
    left: scale(16),
    top: verticalScale(60),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  formCard: {
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  formGroup: {
    marginBottom: verticalScale(14),
  },
  formLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(6),
  },
  formInput: {
    backgroundColor: '#F3F6FB',
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  disabledInput: {
    opacity: 0.6,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: scale(45),
    backgroundColor: 'rgba(21,114,183,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: colors.primaryBlue,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingBottom: verticalScale(40),
  },
  modalHeader: {
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  optionItem: {
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  optionText: {
    color: colors.textHeader,
    textAlign: 'center',
  },
  imagePickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: verticalScale(30),
    paddingHorizontal: scale(20),
  },
  imagePickerOption: {
    alignItems: 'center',
    width: scale(100),
  },
  imagePickerIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imagePickerText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
});
