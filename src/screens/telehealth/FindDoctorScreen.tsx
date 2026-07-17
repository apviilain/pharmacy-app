import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stethoscope, Search, History, Activity, Heart, Brain, Eye } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { telehealthService, Specialist } from '../../api/telehealthService';
import { useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/types';
import { env } from '../../config/env';
import { colors } from '../../theme/colors';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'FindDoctor'>;

const SPECIALTIES_MAP: Record<string, { icon: any; color: string; bgColor: string }> = {
  'general physician': { icon: Stethoscope, color: '#0EA5E9', bgColor: '#E0F2FE' },
  'cardiologist': { icon: Heart, color: '#EF4444', bgColor: '#FEE2E2' },
  'neurologist': { icon: Brain, color: '#8B5CF6', bgColor: '#EDE9FE' },
  'ophthalmologist': { icon: Eye, color: '#10B981', bgColor: '#D1FAE5' },
};

export const FindDoctorScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [doctors, setDoctors] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await telehealthService.getSpecialists();
        setDoctors(data);
      } catch (e) {
        console.error(e);
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
    return [{ id: 'all', label: 'All Specialties' }].concat(
      unique.map(spec => ({
        id: spec.toLowerCase(),
        label: spec,
      }))
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

  const renderDoctor = (item: Specialist) => {
    const id = item._id || item.id || Math.random().toString();
    const avatarUri = item.profilePictureUrl
      ? `${env.BASE_URL}${item.profilePictureUrl}`
      : item.avatarUri;
    const rating = item.rating || 4.5;
    const expYears = item.experienceYears !== undefined ? item.experienceYears : item.experience || 5;
    const specialty = item.specialization || item.specialty || 'General';

    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.86}
        style={styles.doctorCard}
        onPress={() => navigation.navigate('DoctorDetails', { doctorId: id })}
      >
        <View style={styles.docHeader}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Stethoscope size={scale(24)} color={colors.primaryBlue} />
            </View>
          )}
          <View style={styles.docInfo}>
            <Text style={styles.docName} numberOfLines={1}>
              {/^(dr\.?|doctor)\b/i.test((item.name || '').trim())
                ? item.name
                : `Dr. ${item.name || 'Specialist'}`}
            </Text>
            <Text style={styles.docSpecialty} numberOfLines={1}>
              {specialty} {item.degree ? `· ${item.degree}` : ''}
            </Text>
            <View style={styles.docStats}>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>⭐ {rating.toFixed(1)}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>💼 {expYears}y exp</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.docFooter}>
          <View>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeAmount}>{item.consultationFee ? `₹${item.consultationFee}` : 'Free'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('DoctorDetails', { doctorId: id })}
          >
            <Text style={styles.bookButtonText}>Book Consult</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Find your Specialist</Text>
            <Text style={styles.subtitle}>Book video or clinic consultations</Text>
          </View>
          <TouchableOpacity 
            style={styles.historyBtn}
            onPress={() => navigation.navigate('TelehealthHistory')}
          >
            <History size={scale(16)} color={colors.primaryBlue} />
            <Text style={styles.historyText}>My Consults</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={scale(20)} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor, specialty or symptoms..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Specialties Horizontal List */}
        {!query && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Specialties</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtiesList}>
              {dynamicCategories.slice(1, 6).map((cat) => {
                const config = SPECIALTIES_MAP[cat.id.toLowerCase()] || { icon: Activity, color: '#F59E0B', bgColor: '#FEF3C7' };
                const Icon = config.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.specialtyItem, isSelected && styles.specialtyItemActive]}
                    onPress={() => setActiveCategory(isSelected ? 'all' : cat.id)}
                  >
                    <View style={[styles.specialtyIconBox, { backgroundColor: isSelected ? colors.primaryBlue : config.bgColor }]}>
                      <Icon size={scale(24)} color={isSelected ? '#fff' : config.color} />
                    </View>
                    <Text style={[styles.specialtyText, isSelected && { color: colors.primaryBlue, fontFamily: typography.fontFamily.semiBold }]} numberOfLines={2}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Doctors</Text>
            {activeCategory !== 'all' && (
              <TouchableOpacity onPress={() => setActiveCategory('all')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Finding specialists...</Text>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Stethoscope size={scale(48)} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No doctors found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search query.</Text>
            </View>
          ) : (
            <View style={styles.doctorsList}>
              {filteredDoctors.map(renderDoctor)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    padding: scale(16),
    paddingTop: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  greeting: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(22),
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: colors.primaryBlue,
    marginTop: verticalScale(4),
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    borderRadius: scale(20),
    gap: scale(6),
  },
  historyText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(48),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: verticalScale(20),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(18),
    color: '#0F172A',
    marginLeft: scale(16),
    marginBottom: 0,
  },
  viewAllText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(14),
    color: colors.primaryBlue,
  },
  specialtiesList: {
    paddingHorizontal: scale(16),
    gap: scale(16),
  },
  specialtyItem: {
    alignItems: 'center',
    width: scale(72),
  },
  specialtyItemActive: {
    opacity: 1,
  },
  specialtyIconBox: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  specialtyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: '#475569',
    textAlign: 'center',
  },
  doctorsList: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
    gap: verticalScale(16),
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: verticalScale(12),
    marginBottom: verticalScale(12),
  },
  avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(16),
    marginRight: scale(12),
  },
  avatarFallback: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(16),
    marginRight: scale(12),
    backgroundColor: 'rgba(21,114,183,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
  },
  docSpecialty: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  docStats: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: verticalScale(6),
  },
  statBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },
  statBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(11),
    color: '#475569',
  },
  docFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: '#94A3B8',
  },
  feeAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginTop: verticalScale(2),
  },
  bookButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: scale(12),
  },
  bookButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(14),
    color: '#fff',
  },
  loadingBox: {
    padding: scale(32),
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    color: '#94A3B8',
    fontSize: moderateScale(14),
  },
  emptyBox: {
    padding: scale(32),
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    marginHorizontal: scale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginTop: verticalScale(12),
  },
  emptySub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    marginTop: verticalScale(4),
  },
});
