import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, ArrowRight } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type { DiagnosticsRescheduleRequest } from '../../api/pharmyx';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type RescheduleProps = NativeStackScreenProps<RootStackParamList, 'DiagnosticsReschedule'>;

export const DiagnosticsRescheduleScreen: React.FC<RescheduleProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const queryClient = useQueryClient();
  
  // Since we rely on cache for current booking data (or use placeholders)
  const booking = diagnosticsBookingService.getSessionBookingById(bookingId);
  const [bookingDate, setBookingDate] = useState(String(booking?.bookingDate || ''));
  const [bookingTime, setBookingTime] = useState(String(booking?.bookingTime || ''));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rescheduleMutation = useMutation({
    mutationFn: (payload: DiagnosticsRescheduleRequest) =>
      diagnosticsBookingService.reschedule(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticsBooking', bookingId] });
      Toast.show({
        type: 'success',
        text1: 'Booking rescheduled',
        text2: 'Diagnostics booking has been updated.',
      });
      navigation.replace('DiagnosticsBookingDetails', { bookingId });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to reschedule',
        text2: error?.message || 'Please try again later.',
      });
    },
  });

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!/^\d{8}$/.test(bookingDate.trim())) {
      nextErrors.bookingDate = 'Booking date must be YYYYMMDD';
    }
    if (!bookingTime.trim()) {
      nextErrors.bookingTime = 'Booking time is required';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    rescheduleMutation.mutate({
      bookingDate: bookingDate.trim(),
      bookingTime: bookingTime.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Reschedule Booking</Text>
            <Text style={styles.subtitle}>Update date and time for booking #{bookingId}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Date</Text>
            <View style={[styles.inputWrapper, errors.bookingDate ? styles.inputError : null]}>
              <Calendar size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={bookingDate}
                onChangeText={val => {
                  setBookingDate(val);
                  setErrors(prev => ({ ...prev, bookingDate: '' }));
                }}
                placeholder="YYYYMMDD (e.g., 20261015)"
                keyboardType="number-pad"
                maxLength={8}
              />
            </View>
            {errors.bookingDate && <Text style={styles.errorText}>{errors.bookingDate}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Time</Text>
            <View style={[styles.inputWrapper, errors.bookingTime ? styles.inputError : null]}>
              <Clock size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={bookingTime}
                onChangeText={val => {
                  setBookingTime(val);
                  setErrors(prev => ({ ...prev, bookingTime: '' }));
                }}
                placeholder="e.g., 10:30 AM"
              />
            </View>
            {errors.bookingTime && <Text style={styles.errorText}>{errors.bookingTime}</Text>}
          </View>

          <PrimaryButton
            title="Save Changes"
            onPress={submit}
            loading={rescheduleMutation.isPending}
            icon={<ArrowRight size={scale(18)} color="#fff" />}
            style={styles.submitBtn}
          />
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
  content: {
    padding: scale(16),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: verticalScale(24),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(20),
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#64748B',
    marginTop: verticalScale(4),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#334155',
    marginBottom: verticalScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(48),
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: scale(8),
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(12),
    color: '#EF4444',
    marginTop: verticalScale(4),
    marginLeft: scale(4),
  },
  submitBtn: {
    marginTop: verticalScale(12),
  },
});
