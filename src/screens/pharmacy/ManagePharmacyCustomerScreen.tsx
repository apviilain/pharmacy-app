import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '../../navigation/types';
import { pharmacyCustomerService } from '../../api/pharmacyCustomerService';
import type { CreateCustomerRequest } from '../../api/pharmyx';
import { ApiError } from '../../api/errorHandler';

import { LabeledField, FormToggle } from './components/PharmacyShared';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { premiumTheme, radii, spacing, premiumTypography } from '../../theme/tokens';

const DEFAULT_CUSTOMER_FORM: CreateCustomerRequest = {
  name: '',
  phone: '',
  age: undefined,
  diseaseNotes: '',
  chronicCondition: false,
  recurringMedicine: false,
  recurringIntervalDays: 0,
};

export function ManagePharmacyCustomerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateCustomerRequest>(DEFAULT_CUSTOMER_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (payload: CreateCustomerRequest) =>
      pharmacyCustomerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacyCustomers'] });
      Toast.show({
        type: 'success',
        text1: 'Customer added successfully',
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
          text1: 'Failed to add customer',
          text2: apiErr.message || 'An unknown error occurred',
        });
      }
    },
  });

  const handleSave = () => {
    setErrors({});
    if (!form.name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Name is required' }));
      return;
    }
    if (!form.phone.trim() || form.phone.length < 10) {
      setErrors((prev) => ({ ...prev, phone: 'Valid phone number is required' }));
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.textHeader} size={scale(24)} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Add Customer</Text>
            <Text style={styles.headerSubtitle}>Create a pharmacy customer profile</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <LabeledField
            label="Customer Name"
            value={form.name}
            onChangeText={(text: string) => setForm((c) => ({ ...c, name: text }))}
            placeholder="Ex. Ravi Sharma"
            error={errors.name}
          />
          
          <LabeledField
            label="Phone"
            value={form.phone}
            onChangeText={(text: string) => setForm((c) => ({ ...c, phone: text }))}
            placeholder="10-digit number"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          
          <LabeledField
            label="Age (Optional)"
            value={form.age ? String(form.age) : ''}
            onChangeText={(text: string) => setForm((c) => ({ ...c, age: text ? Number(text) : undefined }))}
            placeholder="Ex. 45"
            keyboardType="numeric"
            error={errors.age}
          />

          <View style={styles.divider} />

          <FormToggle
            label="Chronic Condition"
            value={form.chronicCondition || false}
            onValueChange={(val: boolean) => setForm((c) => ({ ...c, chronicCondition: val }))}
            hint="Patient requires long-term medication."
          />

          <FormToggle
            label="Recurring Medicine"
            value={form.recurringMedicine || false}
            onValueChange={(val: boolean) => setForm((c) => ({ ...c, recurringMedicine: val }))}
            hint="Automatically remind for refills."
          />

          {form.recurringMedicine && (
            <View style={styles.indentedField}>
              <LabeledField
                label="Recurring Interval (Days)"
                value={form.recurringIntervalDays ? String(form.recurringIntervalDays) : ''}
                onChangeText={(text: string) => setForm((c) => ({ ...c, recurringIntervalDays: text ? Number(text) : undefined }))}
                placeholder="e.g. 30"
                keyboardType="numeric"
                error={errors.recurringIntervalDays}
              />
            </View>
          )}

          <View style={styles.divider} />

          <LabeledField
            label="Disease Notes (Optional)"
            value={form.diseaseNotes || ''}
            onChangeText={(text: string) => setForm((c) => ({ ...c, diseaseNotes: text }))}
            placeholder="Brief notes about conditions..."
            multiline
            error={errors.diseaseNotes}
          />

          <View style={styles.actions}>
            <PrimaryButton
              title={createMutation.isPending ? 'Saving...' : 'Add Customer'}
              onPress={handleSave}
              disabled={createMutation.isPending}
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
});
