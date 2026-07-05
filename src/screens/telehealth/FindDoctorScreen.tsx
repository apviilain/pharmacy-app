import React, { useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Search, Star, Stethoscope } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { env } from '../../config/env';
import { scale, verticalScale } from '../../theme/responsive';
import { PrimaryButton } from '../../components/PrimaryButton';
import { telehealthService, Specialist } from '../../api/telehealthService';
import type { RootStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { ListSkeleton } from '../../components/ListSkeleton';

type Props = NativeStackScreenProps<RootStackParamList, 'FindDoctor'>;

export const FindDoctorScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [doctors, setDoctors] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await telehealthService.getSpecialists();
        setDoctors(data);
      } catch (error) {
        console.error('Failed to fetch specialists', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const dynamicCategories = useMemo(() => {
    const specs = doctors
      .map(d => d.specialization || d.specialty)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(specs));
    return [
      { id: 'all', label: 'All' },
      ...unique.map(s => ({ id: s.toLowerCase(), label: s })),
    ];
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter(d => {
      const docName = d.name || '';
      const docSpecialty = d.specialization || d.specialty || '';
      const docDegree = d.degree || '';
      const matchesQuery =
        !q ||
        docName.toLowerCase().includes(q) ||
        docSpecialty.toLowerCase().includes(q) ||
        docDegree.toLowerCase().includes(q);
      const matchesCat =
        activeCat === 'all' ||
        docSpecialty.toLowerCase() === activeCat.toLowerCase();
      return matchesQuery && matchesCat;
    });
  }, [query, activeCat, doctors]);

  const renderDoctor = ({ item }: { item: Specialist }) => {
    console.log('item', item);

    // Map backend response fields to UI (handling missing fields with fallbacks)
    const id = item._id || item.id || Math.random().toString();
    const avatarUri = item.profilePictureUrl
      ? `${env.BASE_URL}${item.profilePictureUrl}`
      : item.avatarUri;
    const rating = item.rating || 4.5;
    const expYears =
      item.experienceYears !== undefined
        ? item.experienceYears
        : item.experience || 5;
    const patientsCount = item.patients || '1k+';
    const specialty = item.specialization || item.specialty || 'General';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => navigation.navigate('DoctorDetails', { doctorId: id })}
      >
        <View style={styles.cardTopRow}>
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
              <Stethoscope size={scale(24)} color={colors.primaryBlue} />
            </View>
          )}
          <View style={styles.docMeta}>
            <Text style={styles.docName} numberOfLines={1}>
              {/^(dr\.?|doctor)\b/i.test(item.name.trim())
                ? item.name
                : `Dr. ${item.name}`}
            </Text>
            <Text style={styles.docSub} numberOfLines={1}>
              {specialty} {item.degree ? `· ${item.degree}` : ''}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statText}>{rating.toFixed(1)}</Text>
              </View>
              <View style={[styles.statItem, { marginLeft: scale(12) }]}>
                <Text style={styles.statEmoji}>💼</Text>
                <Text style={styles.statText}>{expYears}y</Text>
              </View>
              <View style={[styles.statItem, { marginLeft: scale(12) }]}>
                <Text style={styles.statEmoji}>👥</Text>
                <Text style={styles.statText}>{patientsCount}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.feeText}>
            {item.consultationFee ? `₹${item.consultationFee}` : 'Free'}
          </Text>
          <PrimaryButton
            title="Book Now"
            onPress={() =>
              navigation.navigate('DoctorDetails', { doctorId: id })
            }
            style={styles.bookBtn}
            textStyle={styles.bookBtnText}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.container}>

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Search size={scale(18)} color={colors.textLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
        </View>

        <View style={{ flexGrow: 0, minHeight: verticalScale(44) }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {dynamicCategories.map(c => {
              const active = c.id === activeCat;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.8}
                  onPress={() => setActiveCat(c.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ListSkeleton />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={d => d._id || d.id || Math.random().toString()}
            renderItem={renderDoctor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 20,
                  color: colors.textSecondary,
                }}
              >
                No doctors found.
              </Text>
            }
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },
  searchBox: {
    height: verticalScale(44),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#F6F8FB',
    paddingHorizontal: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(10),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: verticalScale(12),
    marginBottom: verticalScale(20),
  },
  chip: {
    paddingHorizontal: scale(14),
    height: verticalScale(34),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    maxWidth: scale(180),
  },
  chipActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: 'rgba(21,114,183,0.5)',
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.primaryBlue },
  listContent: { paddingBottom: verticalScale(20) },
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: scale(14),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(16),
    backgroundColor: '#eee',
  },
  docMeta: { flex: 1, marginLeft: scale(12) },
  docName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  docSub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(6),
  },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statEmoji: {
    fontSize: scale(14),
  },
  statText: {
    marginLeft: scale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  dot: {
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: 'rgba(0,0,0,0.16)',
    marginHorizontal: scale(10),
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(12),
  },
  feeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.primaryGreen,
  },
  bookBtn: {
    width: scale(120),
    height: verticalScale(40),
    borderRadius: scale(10),
    marginVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: { fontSize: typography.fontSize.md },
});
