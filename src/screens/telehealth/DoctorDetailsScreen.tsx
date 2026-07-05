import React, { useState, useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Star, Stethoscope, ArrowRight, ArrowLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { env } from '../../config/env';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DetailsSkeleton } from '../../components/DetailsSkeleton';
import { Specialist, telehealthService } from '../../api/telehealthService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorDetails'>;

const StatPill = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statPill}>
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
      <SafeAreaView style={styles.container}>
        <DetailsSkeleton />
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.muted}>Doctor not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUri = doctor.profilePictureUrl
    ? `${env.BASE_URL}${doctor.profilePictureUrl}`
    : doctor.avatarUri;
  const rating = doctor.rating || 4.5;
  const expYears =
    doctor.experienceYears !== undefined
      ? doctor.experienceYears
      : doctor.experience || 5;
  const patientsCount = doctor.patients || '1k+';
  const fee =
    doctor.consultationFee !== undefined ? doctor.consultationFee : 500;
  const languages = doctor.languages || ['English', 'Hindi'];
  const about =
    doctor.about ||
    `${
      doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`
    } is a highly experienced specialist with expertise in providing comprehensive care.`;
  const specialty = doctor.specialization || doctor.specialty || 'General';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F2FB', '#F5F7FA']}
        locations={[0, 1]}
        style={[
          styles.topGradient,
          {
            paddingTop: verticalScale(16),
            paddingBottom: verticalScale(16),
          },
        ]}
      >

        <View style={styles.topRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#EAF2FB',
                  },
                ]}
              >
                <Stethoscope size={scale(36)} color={colors.primaryBlue} />
              </View>
            )}
            <View style={styles.topMeta}>
              <Text style={styles.docName}>
                {doctor.name.startsWith('Dr.')
                  ? doctor.name
                  : `Dr. ${doctor.name}`}
              </Text>
              <Text style={styles.docSub}>
                {specialty} {doctor.degree ? `· ${doctor.degree}` : ''}
              </Text>

              <View style={styles.pillsRow}>
                <StatPill value={rating.toFixed(1)} label="Rating" />
                <StatPill value={`${expYears}y`} label="Exp" />
                <StatPill value={String(patientsCount)} label="Patients" />
            </View>
          </View>
        </View>
      </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{about}</Text>
        </View>

        <View style={styles.section}>
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
                  <Text
                    style={[styles.langText, active && styles.langTextActive]}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Keeping Review Card items static as requested */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Reviews</Text>

          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewName}>Meera K.</Text>
              <Text style={styles.reviewTime}>2 days ago</Text>
            </View>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={scale(14)} color="#F4C150" fill="#F4C150" />
              ))}
            </View>
            <Text style={styles.reviewText}>
              Very attentive and thorough. Took time to explain everything
              clearly!
            </Text>
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewName}>Rahul P.</Text>
              <Text style={styles.reviewTime}>1 week ago</Text>
            </View>
            <View style={styles.starsRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Star
                  key={`f-${i}`}
                  size={scale(14)}
                  color="#F4C150"
                  fill="#F4C150"
                />
              ))}
              <Star size={scale(14)} color="#E6E6E6" fill="#E6E6E6" />
            </View>
            <Text style={styles.reviewText}>
              Great experience. Professional and prompt. Would consult again.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom:
              insets.bottom > 0
                ? insets.bottom + verticalScale(10)
                : verticalScale(24),
          },
        ]}
      >
        <View style={{ flex: 1, marginRight: scale(10) }}>
          <Text style={styles.feeLabel}>Consult Fee</Text>
          <Text style={styles.feeValue}>₹{fee}</Text>
        </View>
        <PrimaryButton
          title="Book Consultation →"
          onPress={() =>
            navigation.navigate('SelectMember', {
              doctorId: doctor._id || doctor.id || '',
            })
          }
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: {
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  scrollContent: { paddingBottom: verticalScale(100) },
  topGradient: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(10),
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(20),
    backgroundColor: '#eee',
  },
  topMeta: { flex: 1, marginLeft: scale(12) },
  docName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
  },
  docSub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  pillsRow: { flexDirection: 'row', marginTop: verticalScale(10) },
  statPill: { alignItems: 'center', marginRight: scale(16) },
  statValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  statLabel: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  section: { paddingHorizontal: scale(16), paddingTop: verticalScale(16) },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
  aboutText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: verticalScale(20),
  },
  langRow: { flexDirection: 'row', flexWrap: 'wrap' },
  langChip: {
    paddingHorizontal: scale(14),
    height: verticalScale(34),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.35)',
    backgroundColor: 'rgba(21,114,183,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    marginBottom: verticalScale(10),
  },
  langChipActive: {
    backgroundColor: 'rgba(21,114,183,0.14)',
    borderColor: 'rgba(21,114,183,0.55)',
  },
  langText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  langTextActive: { color: colors.primaryBlue },
  reviewCard: {
    backgroundColor: '#F6F8FB',
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  reviewTime: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  reviewText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: verticalScale(18),
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: colors.background,
  },
  feeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  feeValue: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.primaryGreen,
  },
  cta: {
    width: 'auto',
    paddingHorizontal: scale(20),
    marginVertical: 0,
    borderRadius: scale(12),
  },
});
