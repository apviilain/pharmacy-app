import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Linking } from 'react-native';
import { Video, ExternalLink } from 'lucide-react-native';
import { telehealthService } from '../api/telehealthService';
import { getCurrentUserId } from '../state/authStore';
import { env } from '../config/env';
import { buildFullUrl } from '../utils/urlUtils';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';
import { isAppointmentPast, isWithinUpcomingWindow } from '../utils/appointmentUtils';

export const UpcomingConsultation: React.FC = () => {
  const [booking, setBooking] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          setLoading(false);
          return;
        }

        const [bookingsResp, doctorsResp] = await Promise.all([
          telehealthService.getUpcomingBookings(), // Use the new specialized endpoint
          telehealthService.getSpecialists(),
        ]);

        const bookingsArray = Array.isArray(bookingsResp) ? bookingsResp : (bookingsResp as any)?.data || [];
        const doctorsArray = Array.isArray(doctorsResp) ? doctorsResp : (doctorsResp as any)?.data || [];

        // Filter for confirmed/pending bookings that are within the 15-minute window
        const windowBookings = bookingsArray.filter((b: any) => {
          const isConfirmedOrPending = b.status === 'confirmed' || b.status === 'pending';
          return isConfirmedOrPending && isWithinUpcomingWindow(b.bookingDate, b.bookingTime, 15);
        });

        // Find the most recent confirmed or pending booking from the window ones
        const upcoming = windowBookings[0];

        if (upcoming) {
          setBooking(upcoming);
          const docId = upcoming.specialistId || upcoming.doctorId;
          const doc = doctorsArray.find((d: any) => (d._id || d.id) === docId);
          setDoctor(doc || null);
        }
      } catch (error) {
        console.error('Failed to fetch upcoming consultation', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, []);

  if (loading) {
    return <ActivityIndicator size="small" color="#fff" style={{ marginVertical: scale(20) }} />;
  }

  if (!booking) {
    return null;
  }

  const avatarUri = buildFullUrl(doctor?.profilePictureUrl) || 'https://via.placeholder.com/150';

  const bookingDateStr = booking.bookingDate
    ? `${booking.bookingDate.slice(0, 4)}-${booking.bookingDate.slice(4, 6)}-${booking.bookingDate.slice(6, 8)}`
    : 'Today';

  return (
    <View style={styles.consultationCard}>
      <View style={styles.consultationHeader}>
        <Text style={styles.consultationType}>UPCOMING CONSULTATION</Text>
        <View style={styles.inMinsBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.inMinsText}>{booking.status === 'pending' ? 'Pending' : 'Upcoming'}</Text>
        </View>
      </View>

      <View style={styles.doctorRow}>
        <Image
          source={{ uri: avatarUri }}
          style={styles.doctorAvatar}
        />
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName}>{doctor?.name || 'Doctor'}</Text>
          <Text style={styles.doctorSpec}>{doctor?.specialization || doctor?.specialty || ''}</Text>
        </View>
      </View>

      <View style={styles.consultationInfoRow}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>📅 {bookingDateStr}</Text>
        </View>
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>⏰ {booking.bookingTime || 'N/A'}</Text>
        </View>
        <View style={styles.infoBadge}>
          <Video size={scale(12)} color="#fff" />
          <Text style={[styles.infoBadgeText, { marginLeft: scale(4) }]}>{booking.consultationMode || 'Video'}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.joinButton} 
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('ConsultationRoom', {
            doctorId: doctor?.id || doctor?._id || booking?.specialistId || booking?.doctorId,
            appointmentId: booking.id || booking._id,
            dateLabel: bookingDateStr,
            timeLabel: booking.bookingTime || 'N/A',
          });
        }}
      >
        <Video size={scale(18)} color={colors.primaryBlue} fill={colors.primaryBlue} />
        <Text style={styles.joinButtonText}>Join Now</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  consultationCard: {
    backgroundColor: colors.primaryBlue,
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: verticalScale(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  consultationType: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs - 2,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  inMinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(10),
  },
  liveDot: {
    width: scale(6),
    height: scale(6),
    backgroundColor: '#00e676',
    borderRadius: scale(3),
    marginRight: scale(4),
  },
  inMinsText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(10),
    color: '#00e676',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  doctorAvatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: scale(12),
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: '#fff',
    marginBottom: verticalScale(2),
  },
  doctorSpec: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  consultationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    flexWrap: 'wrap',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: scale(8),
    marginRight: scale(8),
    marginBottom: verticalScale(8),
  },
  infoBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#fff',
  },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primaryBlue,
    marginLeft: scale(8),
  },
});
