import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../navigation/types';
import { pharmacySubscriptionService } from '../../api/pharmacySubscriptionService';
import type { 
  UpdatePharmacySubscriptionRequest, 
  PausePharmacySubscriptionRequest,
  CreatePharmacySubscriptionRequest
} from '../../api/pharmyx';
import { ApiError } from '../../api/errorHandler';
import { LabeledField, InlineError } from './components/PharmacyShared';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';

type ManagePharmacySubscriptionRouteProp = RouteProp<RootStackParamList, 'ManagePharmacySubscription'>;

const DEFAULT_UPDATE_FORM: UpdatePharmacySubscriptionRequest = {
  intervalDays: 30,
  nextRefillDate: '',
  reminderChannel: 'WHATSAPP',
};

const DEFAULT_PAUSE_FORM: PausePharmacySubscriptionRequest = {
  pausedUntil: '',
};

const DEFAULT_CREATE_FORM = {
  userId: '',
  medicineId: '',
  medicineName: '',
  frequency: '',
  intervalDays: 30,
  nextRefillDate: '',
  reminderChannel: 'WHATSAPP',
};

export function ManagePharmacySubscriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute<ManagePharmacySubscriptionRouteProp>();
  const queryClient = useQueryClient();
  
  const { mode, subscriptionId, subscription } = route.params;

  const [updateForm, setUpdateForm] = useState<UpdatePharmacySubscriptionRequest>(DEFAULT_UPDATE_FORM);
  const [pauseForm, setPauseForm] = useState<PausePharmacySubscriptionRequest>(DEFAULT_PAUSE_FORM);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'UPDATE' && subscription) {
      const intervalDays = (subscription.intervalDays as number) || (subscription.items?.[0]?.intervalDays as number) || 30;
      const nextRefillDate = (subscription.nextRefillDate as string) || (subscription.items?.[0]?.nextRefillDate as string) || '';
      const reminderChannel = (subscription.reminderChannel as string) || (subscription.items?.[0]?.reminderChannel as string) || 'WHATSAPP';
      
      setUpdateForm({
        intervalDays,
        nextRefillDate,
        reminderChannel,
      });
    } else if (mode === 'PAUSE' && subscription) {
      setPauseForm({ pausedUntil: subscription.pausedUntil || '' });
    }
  }, [mode, subscription]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePharmacySubscriptionRequest) =>
      pharmacySubscriptionService.update(subscriptionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacySubscriptions'] });
      Toast.show({ type: 'success', text1: 'Subscription updated' });
      navigation.goBack();
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if ((apiErr as any).validationErrors) setErrors((apiErr as any).validationErrors);
      else Toast.show({ type: 'error', text1: 'Update failed', text2: apiErr.message });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (payload: PausePharmacySubscriptionRequest) =>
      pharmacySubscriptionService.pause(subscriptionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacySubscriptions'] });
      Toast.show({ type: 'success', text1: 'Subscription paused' });
      navigation.goBack();
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if ((apiErr as any).validationErrors) setErrors((apiErr as any).validationErrors);
      else Toast.show({ type: 'error', text1: 'Action failed', text2: apiErr.message });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePharmacySubscriptionRequest) =>
      pharmacySubscriptionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacySubscriptions'] });
      Toast.show({ type: 'success', text1: 'Subscription created' });
      navigation.goBack();
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if ((apiErr as any).validationErrors) setErrors((apiErr as any).validationErrors);
      else Toast.show({ type: 'error', text1: 'Create failed', text2: apiErr.message });
    },
  });

  const handleSave = () => {
    setErrors({});
    if (mode === 'CREATE') {
      createMutation.mutate({
        userId: createForm.userId,
        items: [
          {
            medicineId: createForm.medicineId,
            medicineName: createForm.medicineName,
            frequency: createForm.frequency,
            intervalDays: createForm.intervalDays,
            nextRefillDate: createForm.nextRefillDate,
            reminderChannel: createForm.reminderChannel,
          }
        ]
      });
    } else if (mode === 'UPDATE') {
      updateMutation.mutate({
        ...updateForm,
        intervalDays: updateForm.intervalDays ? Number(updateForm.intervalDays) : undefined,
      });
    } else {
      pauseMutation.mutate(pauseForm);
    }
  };

  const isPending = updateMutation.isPending || pauseMutation.isPending || createMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {mode === 'CREATE' ? (
          <View style={styles.card}>
            <LabeledField
              label="User ID"
              value={createForm.userId}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, userId: val }))}
              placeholder="Enter user id"
            />
            <LabeledField
              label="Medicine ID"
              value={createForm.medicineId}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, medicineId: val }))}
              placeholder="Enter medicine id"
            />
            <LabeledField
              label="Medicine Name"
              value={createForm.medicineName}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, medicineName: val }))}
              placeholder="e.g. Paracetamol 650"
            />
            <LabeledField
              label="Frequency"
              value={createForm.frequency}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, frequency: val }))}
              placeholder="e.g. Daily after dinner"
            />
            <LabeledField
              label="Interval (Days)"
              value={String(createForm.intervalDays)}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, intervalDays: Number(val) || 0 }))}
              keyboardType="numeric"
            />
            <LabeledField
              label="Next Refill Date (YYYY-MM-DD)"
              value={createForm.nextRefillDate}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, nextRefillDate: val }))}
            />
            <LabeledField
              label="Reminder Channel"
              value={createForm.reminderChannel}
              onChangeText={(val: string) => setCreateForm((c) => ({ ...c, reminderChannel: val }))}
            />
          </View>
        ) : mode === 'UPDATE' ? (
          <View style={styles.card}>
            <LabeledField
              label="Interval (Days)"
              value={String(updateForm.intervalDays)}
              onChangeText={(val: string) => setUpdateForm((u) => ({ ...u, intervalDays: Number(val) || 0 }))}
              keyboardType="numeric"
            />
            {errors.intervalDays && <InlineError message={errors.intervalDays} />}

            <LabeledField
              label="Next Refill Date (YYYY-MM-DD)"
              value={updateForm.nextRefillDate || ''}
              onChangeText={(val: string) => setUpdateForm((u) => ({ ...u, nextRefillDate: val }))}
            />
            {errors.nextRefillDate && <InlineError message={errors.nextRefillDate} />}

            <LabeledField
              label="Reminder Channel"
              value={updateForm.reminderChannel || ''}
              onChangeText={(val: string) => setUpdateForm((u) => ({ ...u, reminderChannel: val }))}
            />
            {errors.reminderChannel && <InlineError message={errors.reminderChannel} />}
          </View>
        ) : (
          <View style={styles.card}>
            <LabeledField
              label="Paused Until (YYYY-MM-DD)"
              value={pauseForm.pausedUntil}
              onChangeText={(val: string) => setPauseForm((p) => ({ ...p, pausedUntil: val }))}
              placeholder="e.g. 2024-12-31"
            />
            {errors.pausedUntil && <InlineError message={errors.pausedUntil} />}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isPending}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <PrimaryButton 
            title={mode === 'CREATE' ? 'Create' : 'Save'} 
            onPress={handleSave} 
            disabled={isPending} 
            style={{ minWidth: scale(120) }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: scale(16), paddingBottom: verticalScale(100) },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: scale(12), 
    padding: scale(16), 
    marginBottom: verticalScale(24),
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    elevation: 2 
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: scale(12) },
  cancelButton: { paddingHorizontal: scale(16), paddingVertical: verticalScale(12) },
  cancelButtonText: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(14), color: colors.textLight },
});
