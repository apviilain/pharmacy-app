import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, Clock, MapPin, User, Phone, CheckCircle2 } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsCatalogService } from '../../api/diagnosticsCatalogService';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import {
  DEFAULT_FORM,
  DiagnosticsForm,
  getBookingId,
  isPaymentPending,
  toCreatePayload,
  validateCreateForm,
} from './components/DiagnosticsShared';

type Props = NativeStackScreenProps<RootStackParamList, 'DiagnosticsCreateBooking'>;

export const DiagnosticsCreateBookingScreen: React.FC<Props> = ({ route, navigation }) => {
  const queryClient = useQueryClient();
  const initialPackageIds = route.params?.selectedPackageIds || [];

  const [form, setForm] = useState<DiagnosticsForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(initialPackageIds);

  const packagesQuery = useQuery({
    queryKey: ['diagnosticsPackages', form.integration],
    queryFn: () => diagnosticsCatalogService.getPackages({ integration: form.integration }),
  });

  const slotsQuery = useQuery({
    queryKey: [
      'diagnosticsSlots',
      form.integration,
      form.bookingDate,
      form.pincode,
      selectedPackageIds.join(','),
    ],
    queryFn: () =>
      diagnosticsCatalogService.getSlots({
        integration: form.integration,
        bookingDate: form.bookingDate.trim(),
        pincode: form.pincode.trim(),
        packageIds: selectedPackageIds,
      }),
    enabled:
      /^\d{8}$/.test(form.bookingDate.trim()) &&
      form.pincode.trim().length >= 6 &&
      selectedPackageIds.length > 0,
  });

  useEffect(() => {
    if (packagesQuery.data && selectedPackageIds.length > 0) {
      const selectedPackages = packagesQuery.data.filter(item => {
        const currentId = String(item.packageId || item.id || item._id || item.code || '');
        return selectedPackageIds.includes(currentId);
      });
      
      setForm(currentForm => ({
        ...currentForm,
        testIds: selectedPackages
          .map(item => String(item.packageId || item.id || item._id || item.code || ''))
          .filter(Boolean)
          .join(', '),
        testNames: selectedPackages
          .map(item => String(item.packageName || item.displayName || item.name || item.code || ''))
          .filter(Boolean)
          .join(', '),
      }));
    }
  }, [packagesQuery.data, selectedPackageIds]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => diagnosticsBookingService.create(payload),
    onSuccess: created => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      const bookingId = getBookingId(created);
      Toast.show({
        type: 'success',
        text1: 'Booking created',
        text2: 'Diagnostics booking created successfully.',
      });
      if (bookingId) {
        if (isPaymentPending(created)) {
          navigation.replace('DiagnosticsPayment', { bookingId });
          return;
        }
        navigation.replace('DiagnosticsBookingDetails', { bookingId });
        return;
      }
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to create booking',
        text2: error?.message || 'Please try again.',
      });
    },
  });

  const submit = () => {
    const nextErrors = validateCreateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Details',
        text2: 'Please fill all required fields correctly.',
      });
      return;
    }
    createMutation.mutate(toCreatePayload(form));
  };

  const updateForm = (field: keyof DiagnosticsForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedPackages = packagesQuery.data?.filter(item => {
    const currentId = String(item.packageId || item.id || item._id || item.code || '');
    return selectedPackageIds.includes(currentId);
  }) || [];

  const totalAmount = selectedPackages.reduce((acc, curr) => acc + Number(curr.discountedPrice || curr.price || curr.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Cart Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Packages</Text>
          {selectedPackages.map(pkg => (
            <View key={pkg.packageId || pkg.id} style={styles.cartItem}>
              <View style={styles.cartItemIcon}>
                <CheckCircle2 size={scale(20)} color={colors.primaryBlue} />
              </View>
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartItemName}>{pkg.displayName || pkg.name}</Text>
                <Text style={styles.cartItemPrice}>₹{pkg.discountedPrice || pkg.price || pkg.amount}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Patient Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <User size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Patient Full Name"
                value={form.patientName}
                onChangeText={val => updateForm('patientName', val)}
              />
            </View>
            {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Phone size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.patientPhone}
                onChangeText={val => updateForm('patientPhone', val)}
              />
            </View>
            {errors.patientPhone && <Text style={styles.errorText}>{errors.patientPhone}</Text>}
          </View>
        </View>

        {/* Location Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Collection Address</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <MapPin size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Pincode (e.g. 400001)"
                keyboardType="number-pad"
                maxLength={6}
                value={form.pincode}
                onChangeText={val => updateForm('pincode', val)}
              />
            </View>
            {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { height: verticalScale(80), alignItems: 'flex-start', paddingTop: verticalScale(12) }]}>
              <TextInput
                style={[styles.input, { height: verticalScale(80), textAlignVertical: 'top' }]}
                placeholder="Complete Address (House No, Building, Street, Area)"
                multiline
                value={form.addressLine}
                onChangeText={val => updateForm('addressLine', val)}
              />
            </View>
            {errors.addressLine && <Text style={styles.errorText}>{errors.addressLine}</Text>}
          </View>
        </View>

        {/* Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Calendar size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Booking Date (YYYYMMDD)"
                keyboardType="number-pad"
                maxLength={8}
                value={form.bookingDate}
                onChangeText={val => updateForm('bookingDate', val)}
              />
            </View>
            {errors.bookingDate && <Text style={styles.errorText}>{errors.bookingDate}</Text>}
          </View>

          {slotsQuery.isLoading ? (
            <ActivityIndicator color={colors.primaryBlue} style={styles.slotsLoader} />
          ) : slotsQuery.data && slotsQuery.data.length > 0 ? (
            <View style={styles.slotsGrid}>
              {slotsQuery.data.map((slot, index) => {
                const slotTime = String(slot.startTime || slot.bookingTime || slot.label || '');
                const isSelected = form.bookingTime === slotTime;
                return (
                  <TouchableOpacity
                    key={slot.id || index}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                    onPress={() => updateForm('bookingTime', slotTime)}
                  >
                    <Clock size={scale(14)} color={isSelected ? '#fff' : '#64748B'} />
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {slotTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
             <Text style={styles.noSlotsText}>
               {form.pincode.length === 6 && form.bookingDate.length === 8 
                 ? "No slots available for this date and pincode." 
                 : "Enter a valid pincode and date to see available slots."}
             </Text>
          )}
          {errors.bookingTime && <Text style={styles.errorText}>{errors.bookingTime}</Text>}
        </View>

        <View style={{ height: verticalScale(100) }} />
      </ScrollView>

      {/* Bottom Checkout Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </View>
        <PrimaryButton
          title="Confirm Booking"
          onPress={submit}
          loading={createMutation.isPending}
          style={styles.checkoutBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginBottom: verticalScale(16),
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cartItemIcon: {
    marginTop: verticalScale(2),
    marginRight: scale(12),
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#334155',
    marginBottom: verticalScale(4),
  },
  cartItemPrice: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: verticalScale(16),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(48),
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
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardSelected: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  slotText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#475569',
    marginLeft: scale(6),
  },
  slotTextSelected: {
    color: '#fff',
  },
  noSlotsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    marginVertical: verticalScale(16),
  },
  slotsLoader: {
    marginVertical: verticalScale(20),
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  totalWrap: {
    flex: 1,
  },
  totalLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: '#64748B',
  },
  totalValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(18),
    color: '#0F172A',
  },
  checkoutBtn: {
    flex: 1.5,
  },
});
