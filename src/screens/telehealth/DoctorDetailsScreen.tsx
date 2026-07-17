import React, { useState, useEffect } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Star, Stethoscope, Video, MessageCircle, MapPin } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { env } from '../../config/env';
import { typography } from '../../theme/typography';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import { Specialist, telehealthService } from '../../api/telehealthService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorDetails'>;

const StatPill = ({ value, label, icon: Icon }: { value: string; label: string; icon?: any }) => (
  <View style={styles.statPill}>
    {Icon && <Icon size={scale(16)} color={colors.primaryBlue} style={{ marginBottom: verticalScale(4) }} />}
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const DoctorDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const [doctor, setDoctor] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await telehealthService.getSpecialists();
        const found = data.find(d => (d._id || d.id) === route.params.doctorId);
        setDoctor(found || null);
      } catch (error) {
        console.error('Failed to fetch doctor details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [route.params.doctorId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primaryBlue} size="large" />
        <Text style={{ marginTop: verticalScale(12), color: '#94A3B8', fontFamily: typography.fontFamily.medium }}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stethoscope size={scale(48)} color="#E2E8F0" />
        <Text style={{ marginTop: verticalScale(12), color: '#64748B', fontFamily: typography.fontFamily.medium }}>Doctor not found.</Text>
      </SafeAreaView>
    );
  }

  const avatarUri = doctor.profilePictureUrl
    ? `${env.BASE_URL}${doctor.profilePictureUrl}`
    : doctor.avatarUri;
  const rating = doctor.rating || 4.5;
  const expYears = doctor.experienceYears !== undefined ? doctor.experienceYears : doctor.experience || 5;
  const patientsCount = doctor.patients || '1k+';
  const fee = doctor.consultationFee !== undefined ? doctor.consultationFee : 500;
  const languages = doctor.languages || ['English', 'Hindi'];
  const about =
    doctor.about ||
    `${
      doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`
    } is a highly experienced specialist with expertise in providing comprehensive care.`;
  const specialty = doctor.specialization || doctor.specialty || 'General';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#E8F2FB', '#F8FAFC']}
          style={styles.headerGradient}
        >
          <View style={styles.topProfile}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarBig} />
            ) : (
              <View style={styles.avatarFallbackBig}>
                <Stethoscope size={scale(40)} color={colors.primaryBlue} />
              </View>
            )}
            
            <Text style={styles.docNameBig}>
              {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
            </Text>
            <Text style={styles.docSubBig}>
              {specialty} {doctor.degree ? `· ${doctor.degree}` : ''}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <StatPill icon={Star} value={rating.toFixed(1)} label="Rating" />
            <StatPill value={`${expYears} yrs`} label="Experience" />
            <StatPill value={String(patientsCount)} label="Patients" />
          </View>
        </LinearGradient>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>{about}</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.langRow}>
            {languages.map((l: string) => {
              const active = selectedLang === l;
              return (
                <TouchableOpacity
                  key={l}
                  activeOpacity={0.8}
                  onPress={() => setSelectedLang(active ? null : l)}
                  style={[styles.langChip, active && styles.langChipActive]}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Clinic Details</Text>
          <View style={styles.clinicCard}>
            <MapPin size={scale(20)} color={colors.primaryBlue} style={{ marginRight: scale(12) }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.clinicName}>Apollo Care Clinic</Text>
              <Text style={styles.clinicAddress}>123 Healthcare Ave, Medical District, City - 400001</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, verticalScale(16)) }]}>
        <View>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>₹{fee}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('TelehealthBooking', { doctorId: route.params.doctorId })}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  headerGradient: {
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(24),
    paddingHorizontal: scale(20),
    alignItems: 'center',
  },
  topProfile: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  avatarBig: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(32),
    marginBottom: verticalScale(16),
  },
  avatarFallbackBig: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(32),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  docNameBig: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(22),
    color: '#0F172A',
    textAlign: 'center',
  },
  docSubBig: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#64748B',
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: scale(10),
  },
  statPill: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(12),
    alignItems: 'center',
    flex: 1,
    marginHorizontal: scale(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  contentSection: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(24),
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginBottom: verticalScale(12),
  },
  aboutText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: '#475569',
    lineHeight: verticalScale(22),
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  langChip: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  langChipActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(21, 114, 183, 0.05)',
  },
  langText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#64748B',
  },
  langTextActive: {
    color: colors.primaryBlue,
  },
  clinicCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  clinicName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(15),
    color: '#0F172A',
  },
  clinicAddress: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(13),
    color: '#64748B',
    marginTop: verticalScale(4),
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 10,
  },
  feeLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#64748B',
  },
  feeAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(22),
    color: '#0F172A',
    marginTop: verticalScale(2),
  },
  bookButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(14),
    borderRadius: scale(16),
  },
  bookButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(15),
    color: '#fff',
  },
});
