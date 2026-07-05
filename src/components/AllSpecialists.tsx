import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { telehealthService } from '../api/telehealthService';
import { Stethoscope } from 'lucide-react-native';
import { buildFullUrl } from '../utils/urlUtils';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';
import { SectionHeader } from './SectionHeader';

const GRADIENTS = [
  ['#E9F7EF', '#CFF2DC'],
  ['#E8F4FD', '#CFEAFF'],
  ['#FFF6E6', '#FFE4B8'],
  ['#EAF8F4', '#D5F2EA'],
];

const MAX_VISIBLE = 4;

const formatDoctorName = (name: string) => {
  const trimmedName = name.trim() || 'Doctor';
  return /^dr\.?\s/i.test(trimmedName) ? trimmedName : `Dr. ${trimmedName}`;
};

export default function AllSpecialists() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        const response = await telehealthService.getSpecialists();
        const dataArray = Array.isArray(response)
          ? response
          : (response as any)?.data || [];

        const mapped = dataArray.map((d: any, i: number) => ({
          id: d._id || d.id || String(i + 1),
          name: d.name || 'Doctor',
          specialty: d.specialization || d.specialty || 'General',
          profilePictureUrl: d.profilePictureUrl,
          colors: GRADIENTS[i % GRADIENTS.length],
        }));

        setCategories(mapped);
      } catch (error) {
        console.error('Failed to fetch specialists on home', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialists();
  }, []);

  // Show only first 4 on homescreen
  const visibleSpecialists = categories.slice(0, MAX_VISIBLE);

  const handleDoctorPress = (doctorId: string) => {
    navigation.navigate('DoctorDetails', { doctorId });
  };

  const handleViewAll = () => {
    navigation.navigate('FindDoctor');
  };

  return (
    <View>
      <SectionHeader title="All Specialists" onViewAll={handleViewAll} />
      <View
        style={[
          styles.specialistsGrid,
          visibleSpecialists.length > 0 &&
            visibleSpecialists.length < MAX_VISIBLE &&
            styles.specialistsGridCompact,
        ]}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.primaryBlue} />
          </View>
        ) : visibleSpecialists.length === 0 ? (
          <Text style={styles.noDataText}>No specialists available</Text>
        ) : (
          visibleSpecialists.map(spec => {
            const hasProfilePicture =
              typeof spec.profilePictureUrl === 'string' &&
              spec.profilePictureUrl.trim().length > 0;

            return (
              <TouchableOpacity
                key={spec.id}
                style={[
                  styles.specialistItem,
                  visibleSpecialists.length < MAX_VISIBLE &&
                    styles.specialistItemCompact,
                ]}
                activeOpacity={0.8}
                onPress={() => handleDoctorPress(spec.id)}
              >
                <LinearGradient
                  colors={spec.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.specialistAvatarBg}
                >
                  {hasProfilePicture ? (
                    <Image
                      source={{
                        uri: buildFullUrl(spec.profilePictureUrl),
                      }}
                      style={styles.specialistImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.specialistAvatarPlaceholder}>
                      <View style={styles.doctorIconBubble}>
                        <Stethoscope
                          color={colors.primaryBlue}
                          size={scale(30)}
                          strokeWidth={2.2}
                        />
                      </View>
                    </View>
                  )}
                </LinearGradient>
                <Text style={styles.specialistName} numberOfLines={2}>
                  {formatDoctorName(spec.name)}
                </Text>
                <Text style={styles.specialistSpecialty} numberOfLines={1}>
                  {spec.specialty}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  specialistsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(18),
  },
  specialistsGridCompact: {
    justifyContent: 'flex-start',
    gap: scale(10),
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
  },
  specialistItem: {
    alignItems: 'center',
    width: '23%',
  },
  specialistItemCompact: {
    width: scale(82),
  },
  specialistAvatarBg: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  specialistImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(8),
  },
  specialistAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorIconBubble: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.16)',
  },
  specialistName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: verticalScale(14),
  },
  specialistSpecialty: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs - 1,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: verticalScale(13),
  },
  noDataText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginLeft: scale(20),
    paddingVertical: verticalScale(10),
  },
});
