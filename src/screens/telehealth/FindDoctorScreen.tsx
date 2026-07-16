import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stethoscope } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { telehealthService, Specialist } from '../../api/telehealthService';
import { ListSkeleton } from '../../components/ListSkeleton';
import { ModuleScreen } from '../../components/ui/ModuleScreen';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { PremiumSearchField } from '../../components/ui/PremiumSearchField';
import { SectionState } from '../../components/ui/SectionState';
import type { RootStackParamList } from '../../navigation/types';
import { env } from '../../config/env';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import {
  premiumTheme,
  premiumTypography,
  radii,
  spacing,
} from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'FindDoctor'>;

export const FindDoctorScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [doctors, setDoctors] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setHasError(false);
        const data = await telehealthService.getSpecialists();
        setDoctors(data);
      } catch {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const dynamicCategories = useMemo(() => {
    const specs = doctors
      .map(doctor => doctor.specialization || doctor.specialty)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(specs));

    return [{ id: 'all', label: 'All' }].concat(
      unique.map(spec => ({
        id: spec.toLowerCase(),
        label: spec,
      })),
    );
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return doctors.filter(doctor => {
      const name = doctor.name || '';
      const specialty = doctor.specialization || doctor.specialty || '';
      const degree = doctor.degree || '';

      const matchesQuery =
        !normalizedQuery ||
        name.toLowerCase().includes(normalizedQuery) ||
        specialty.toLowerCase().includes(normalizedQuery) ||
        degree.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        activeCategory === 'all' ||
        specialty.toLowerCase() === activeCategory.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, doctors, query]);

  const renderDoctor = ({ item }: { item: Specialist }) => {
    const id = item._id || item.id || Math.random().toString();
    const avatarUri = item.profilePictureUrl
      ? `${env.BASE_URL}${item.profilePictureUrl}`
      : item.avatarUri;
    const rating = item.rating || 4.5;
    const expYears =
      item.experienceYears !== undefined
        ? item.experienceYears
        : item.experience || 5;
    const specialty = item.specialization || item.specialty || 'General';

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.cardWrap}
        onPress={() => navigation.navigate('DoctorDetails', { doctorId: id })}
      >
        <PremiumCard style={styles.card}>
          <View style={styles.cardTopRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Stethoscope size={scale(24)} color={colors.primaryBlue} />
              </View>
            )}

            <View style={styles.docMeta}>
              <Text style={styles.docName} numberOfLines={1}>
                {/^(dr\.?|doctor)\b/i.test((item.name || '').trim())
                  ? item.name
                  : `Dr. ${item.name || 'Specialist'}`}
              </Text>
              <Text style={styles.docSub} numberOfLines={1}>
                {specialty} {item.degree ? `· ${item.degree}` : ''}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>⭐ {rating.toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>💼 {expYears}y</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.feeLabel}>Consultation fee</Text>
              <Text style={styles.feeText}>
                {item.consultationFee ? `₹${item.consultationFee}` : 'Free'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('DoctorDetails', { doctorId: id })}
              activeOpacity={0.85}
            >
              <Text style={styles.bookButtonText}>Book now</Text>
            </TouchableOpacity>
          </View>
        </PremiumCard>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleScreen
      title="Doctor consultation"
      subtitle="Find specialists, compare expertise, and continue to consultation booking."
      scroll={false}
      contentContainerStyle={styles.moduleContent}
    >
      <PremiumSearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Search doctor, specialty, or degree"
      />

      <View style={styles.chipsRow}>
        <FlatList
          data={dynamicCategories}
          horizontal
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = item.id === activeCategory;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveCategory(item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <ListSkeleton />
      ) : hasError ? (
        <SectionState
          title="Unable to load doctors"
          subtitle="Please try again after a moment."
          tone="error"
        />
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={doctor => doctor._id || doctor.id || Math.random().toString()}
          renderItem={renderDoctor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <SectionState
              title="No doctors found"
              subtitle="Try another specialty or a different search keyword."
            />
          }
        />
      )}
    </ModuleScreen>
  );
};

const styles = StyleSheet.create({
  moduleContent: {
    flex: 1,
  },
  chipsRow: {
    minHeight: verticalScale(44),
  },
  chip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: premiumTheme.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: premiumTheme.blueTint,
    borderColor: '#B7D5F0',
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: premiumTheme.subtext,
  },
  chipTextActive: {
    color: colors.primaryBlue,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  cardWrap: {
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scale(66),
    height: scale(66),
    borderRadius: scale(20),
    marginRight: spacing.sm,
    backgroundColor: premiumTheme.cardMuted,
  },
  avatarFallback: {
    width: scale(66),
    height: scale(66),
    borderRadius: scale(20),
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: premiumTheme.blueTint,
  },
  docMeta: {
    flex: 1,
  },
  docName: {
    ...premiumTypography.title,
  },
  docSub: {
    ...premiumTypography.body,
    marginTop: verticalScale(2),
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statItem: {
    backgroundColor: premiumTheme.cardMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: premiumTheme.subtext,
  },
  cardBottomRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: premiumTheme.caption,
  },
  feeText: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  bookButton: {
    minHeight: verticalScale(44),
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue,
  },
  bookButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
  },
});
