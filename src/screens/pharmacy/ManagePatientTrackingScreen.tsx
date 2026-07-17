import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '../../navigation/types';
import { patientTrackingService } from '../../api/patientTrackingService';
import type { UpdatePatientTrackingRequest } from '../../api/pharmyx';
import { ApiError } from '../../api/errorHandler';

import { LabeledField, FormToggle, InlineError } from './components/PharmacyShared';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { premiumTheme, spacing, premiumTypography } from '../../theme/tokens';

type ManagePatientTrackingRouteProp = RouteProp<RootStackParamList, 'ManagePatientTracking'>;

const DEFAULT_FORM: UpdatePatientTrackingRequest = {
  diseaseNotes: '',
  chronicCondition: false,
  recurringMedicine: false,
  recurringIntervalDays: 0,
  preferredFollowUpDate: '',
  pharmacyNotes: '',
};

export function ManagePatientTrackingScreen() {
  const route = useRoute<ManagePatientTrackingRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { customerId } = route.params;

  const [form, setForm] = useState<UpdatePatientTrackingRequest>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const trackingQuery = useQuery({
    queryKey: ['patientTracking', customerId],
    queryFn: () => patientTrackingService.getById(customerId),
    enabled: !!customerId,
  });

  useEffect(() => {
    if (trackingQuery.data) {
      setForm({
        diseaseNotes: trackingQuery.data.diseaseNotes || '',
        chronicCondition: trackingQuery.data.chronicCondition || false,
        recurringMedicine: trackingQuery.data.recurringMedicine || false,
        recurringIntervalDays: trackingQuery.data.recurringIntervalDays || 0,
        preferredFollowUpDate: trackingQuery.data.preferredFollowUpDate || '',
        pharmacyNotes: trackingQuery.data.pharmacyNotes || '',
      });
    }
  }, [trackingQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePatientTrackingRequest) =>
      patientTrackingService.update(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientTracking', customerId] });
      Toast.show({
        type: 'success',
        text1: 'Patient tracking updated',
      });
      navigation.goBack();
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if ((apiErr as any).validationErrors) {
        setErrors((apiErr as any).validationErrors);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to update tracking',
          text2: apiErr.message || 'Unknown error',
        });
      }
    },
  });

  const handleSave = () => {
    setErrors({});
    updateMutation.mutate(form);
  };

  if (trackingQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.textHeader} size={scale(24)} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (trackingQuery.error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.textHeader} size={scale(24)} />
          </TouchableOpacity>
        </View>
        <InlineError
          message={(trackingQuery.error as any).message || 'Failed to load tracking data'}
          onRetry={() => trackingQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.textHeader} size={scale(24)} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Update Tracking</Text>
            <Text style={styles.headerSubtitle}>Manage patient follow-ups</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <FormToggle
            label="Chronic Condition"
            value={form.chronicCondition || false}
            onValueChange={(val: boolean) => setForm((c) => ({ ...c, chronicCondition: val }))}
          />

          <FormToggle
            label="Recurring Medicine"
            value={form.recurringMedicine || false}
            onValueChange={(val: boolean) => setForm((c) => ({ ...c, recurringMedicine: val }))}
          />

          {form.recurringMedicine && (
            <View style={styles.indentedField}>
              <LabeledField
                label="Interval (Days)"
                value={form.recurringIntervalDays ? String(form.recurringIntervalDays) : ''}
                onChangeText={(val: string) => setForm((c) => ({ ...c, recurringIntervalDays: val ? Number(val) : undefined }))}
                keyboardType="numeric"
                error={errors.recurringIntervalDays}
              />
            </View>
          )}

          <View style={styles.divider} />

          <LabeledField
            label="Follow-up Date (YYYY-MM-DD)"
            value={form.preferredFollowUpDate || ''}
            onChangeText={(val: string) => setForm((c) => ({ ...c, preferredFollowUpDate: val }))}
            placeholder="e.g. 2026-08-20"
            error={errors.preferredFollowUpDate}
          />

          <LabeledField
            label="Disease Notes"
            value={form.diseaseNotes || ''}
            onChangeText={(val: string) => setForm((c) => ({ ...c, diseaseNotes: val }))}
            multiline
            placeholder="Enter disease notes..."
            error={errors.diseaseNotes}
          />

          <LabeledField
            label="Pharmacy Internal Notes"
            value={form.pharmacyNotes || ''}
            onChangeText={(val: string) => setForm((c) => ({ ...c, pharmacyNotes: val }))}
            multiline
            placeholder="Internal notes for pharmacy staff..."
            error={errors.pharmacyNotes}
          />

          <View style={styles.actions}>
            <PrimaryButton
              title={updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumTheme.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: premiumTheme.screen,
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
    marginRight: spacing.sm,
    padding: scale(4),
  },
  headerTitle: {
    ...premiumTypography.title,
    fontSize: typography.fontSize.lg,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: verticalScale(40),
  },
  divider: {
    height: 1,
    backgroundColor: premiumTheme.cardBorder,
    marginVertical: spacing.sm,
  },
  indentedField: {
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: premiumTheme.cardBorder,
    marginLeft: spacing.sm,
  },
  actions: {
    marginTop: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
