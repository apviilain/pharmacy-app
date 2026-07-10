import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search, User, ClipboardList, Stethoscope, Wallet, FileText, Settings, Award, Ambulance, Users, BriefcaseMedical } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { env } from '../../config/env';
import { scale, verticalScale } from '../../theme/responsive';
import { telehealthService, Specialist } from '../../api/telehealthService';
import { dependentService, Dependent } from '../../api/dependentService';
import { appointmentService, Appointment } from '../../api/appointmentService';
import { getCurrentUserId } from '../../state/authStore';

interface AppFeature {
  id: string;
  title: string;
  screen: keyof RootStackParamList;
  icon: any;
  keywords: string[];
}

// Sample features to search through
const APP_FEATURES: AppFeature[] = [
  { id: '1', title: 'Find a Doctor', screen: 'FindDoctor', icon: Stethoscope, keywords: ['doctor', 'consult', 'appointment', 'telehealth', 'video call'] },
  { id: '2', title: 'My Appointments / Bookings', screen: 'Appointments', icon: ClipboardList, keywords: ['booking', 'appointment', 'history', 'upcoming', 'past'] },
  { id: '3', title: 'Health Vault (Records)', screen: 'HealthVault', icon: FileText, keywords: ['health', 'vault', 'files', 'records', 'medical', 'reports', 'prescriptions'] },
  { id: '4', title: 'Wallet & Payments', screen: 'Wallet', icon: Wallet, keywords: ['wallet', 'money', 'payment', 'balance', 'add money', 'recharge'] },
  { id: '5', title: 'Pathkind Lab Tests', screen: 'PathkindBooking', icon: BriefcaseMedical, keywords: ['lab', 'test', 'pathology', 'pathkind', 'blood test', 'diagnostic'] },
  { id: '6', title: 'Ambulance', screen: 'Ambulance', icon: Ambulance, keywords: ['ambulance', 'emergency', 'sos', 'vehicle'] },
  { id: '7', title: 'My Family & Members', screen: 'MyMembers', icon: Users, keywords: ['family', 'members', 'dependents', 'add member'] },
  { id: '8', title: 'Refer & Earn', screen: 'ReferEarn', icon: Award, keywords: ['refer', 'earn', 'invite', 'friends', 'bonus', 'coupon'] },
  { id: '9', title: 'Settings', screen: 'Settings', icon: Settings, keywords: ['settings', 'preferences', 'account', 'password', 'logout'] },
  { id: '10', title: 'My Profile', screen: 'Profile', icon: User, keywords: ['profile', 'me', 'details', 'edit profile', 'account'] },
];

export const GlobalSearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState<Specialist[]>([]);
  const [members, setMembers] = useState<Dependent[]>([]);
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Focus input automatically on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Fetch doctors for dynamic search
    telehealthService.getSpecialists()
      .then(data => setDoctors(data))
      .catch(console.error);

    const userId = getCurrentUserId();
    if (userId) {
      dependentService.getDependentsByUser(userId)
        .then(data => setMembers(data))
        .catch(console.error);
    }

    Promise.all([
      appointmentService.getAppointments({ status: 'upcoming' }),
      appointmentService.getAppointments({ status: 'Past' })
    ])
      .then(([up, past]) => setBookings([...up, ...past]))
      .catch(console.error);
  }, []);

  type SearchResultItem = 
    | { type: 'feature'; item: AppFeature }
    | { type: 'doctor'; item: Specialist }
    | { type: 'member'; item: Dependent }
    | { type: 'booking'; item: Appointment };

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const loweredQuery = query.toLowerCase().trim();
    const results: SearchResultItem[] = [];
    
    APP_FEATURES.forEach(feature => {
      if (feature.title.toLowerCase().includes(loweredQuery) || 
          feature.keywords.some(kw => kw.toLowerCase().includes(loweredQuery))) {
        results.push({ type: 'feature', item: feature });
      }
    });

    doctors.forEach(doc => {
      const docName = doc.name || '';
      const specialization = doc.specialization || '';
      const specialty = doc.specialty || '';
      const degree = doc.degree || '';
      if (docName.toLowerCase().includes(loweredQuery) || 
          specialization.toLowerCase().includes(loweredQuery) ||
          specialty.toLowerCase().includes(loweredQuery) ||
          degree.toLowerCase().includes(loweredQuery)) {
        results.push({ type: 'doctor', item: doc });
      }
    });

    members.forEach(member => {
      const memberName = member.name || '';
      const relation = member.relationship || '';
      if (memberName.toLowerCase().includes(loweredQuery) || 
          relation.toLowerCase().includes(loweredQuery)) {
        results.push({ type: 'member', item: member });
      }
    });

    bookings.forEach(booking => {
      const docName = booking.doctorName || '';
      const specialty = booking.specialization || '';
      if (docName.toLowerCase().includes(loweredQuery) || 
          specialty.toLowerCase().includes(loweredQuery)) {
        results.push({ type: 'booking', item: booking });
      }
    });

    return results;
  }, [query, doctors, members, bookings]);

  // Handle navigation
  const handleItemPress = (screenName: keyof RootStackParamList) => {
    // Navigate to respective feature
    if (screenName === 'Wallet') {
      (navigation as any).navigate('Wallet', {
        mode: 'pharmacy',
        title: 'Pharmacy Wallet',
      });
      return;
    }

    (navigation as any).navigate(screenName);
  };

  const renderItem = ({ item }: { item: SearchResultItem }) => {
    if (item.type === 'feature') {
      const feature = item.item;
      const Icon = feature.icon;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          activeOpacity={0.7}
          onPress={() => handleItemPress(feature.screen as any)}
        >
          <View style={styles.iconContainer}>
            <Icon color={colors.primaryBlue} size={scale(20)} />
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>{feature.title}</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'member') {
      const member = item.item;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('MyMembers')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0EFFF' }]}>
            <Users color={colors.primaryBlue} size={scale(20)} />
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>{member.name}</Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Family Member · {member.relationship}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'booking') {
      const booking = item.item;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('Appointments')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#EAF1FB' }]}>
            <ClipboardList color={colors.primaryBlue} size={scale(20)} />
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>Booking: {booking.doctorName}</Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              {booking.dateLabel} · {booking.status === 'confirmed' || booking.status === 'pending' ? 'Upcoming' : 'Completed'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      const doc = item.item;
      const id = doc._id || doc.id || '';
      const avatarUri = doc.profilePictureUrl
        ? `${env.BASE_URL}${doc.profilePictureUrl}`
        : doc.avatarUri;
      const specialty = doc.specialization || doc.specialty || 'General';

      return (
        <TouchableOpacity
          style={styles.resultItem}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('DoctorDetails', { doctorId: id })}
        >
          {avatarUri ? (
            <Image 
              source={{ uri: avatarUri }} 
              style={[styles.iconContainer, { backgroundColor: '#eee', padding: 0 }]} 
            />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: '#EAF2FB' }]}>
              <Stethoscope color={colors.primaryBlue} size={scale(20)} />
            </View>
          )}
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {/^(dr\.?|doctor)\b/i.test(doc.name.trim()) ? doc.name : `Dr. ${doc.name}`}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary }} numberOfLines={1}>
              {specialty} {doc.degree ? `· ${doc.degree}` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Header / Search Bar */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textHeader} size={scale(24)} />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <Search color="#888" size={scale(18)} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search doctors, specializations, lab tests..."
              placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {query.trim() === '' ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>Quick Suggestions</Text>
            <View style={styles.suggestionsWrapper}>
              {APP_FEATURES.slice(0, 5).map(feat => (
                <TouchableOpacity
                  key={feat.id}
                  style={styles.suggestionPill}
                  onPress={() => handleItemPress(feat.screen as any)}
                >
                  <Text style={styles.suggestionText}>{feat.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => 
              item.type === 'feature' 
                ? `f_${item.item.id}` 
                : item.type === 'member'
                ? `m_${item.item._id || item.item.id || index}`
                : item.type === 'booking'
                ? `b_${item.item.id || index}`
                : `d_${item.item._id || item.item.id || index}`
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Search color="#ddd" size={scale(48)} style={{ marginBottom: verticalScale(16) }} />
            <Text style={styles.noResultsText}>No features found for "{query}"</Text>
            <Text style={styles.noResultsSub}>Try searching for 'doctor', 'wallet', or 'settings'.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    marginRight: scale(12),
    padding: scale(4),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FB',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(44),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    paddingVertical: 0, // important for Android
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  listContent: {
    padding: scale(16),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: scale(16),
    marginBottom: verticalScale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  emptyStateContainer: {
    padding: scale(20),
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: verticalScale(16),
  },
  suggestionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  suggestionPill: {
    backgroundColor: '#fff',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  noResultsText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  noResultsSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
