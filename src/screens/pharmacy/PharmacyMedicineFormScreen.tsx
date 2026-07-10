import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ClipboardPlus, Pill, RefreshCw } from 'lucide-react-native';

import { pharmacyMedicineService } from '../../api/pharmacyMedicineService';
import type {
  CreateMedicineRequest,
  PharmyxMedicine,
  UpdateMedicineRequest,
} from '../../api/pharmyx';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type CreateProps = NativeStackScreenProps<
  RootStackParamList,
  'PharmacyMedicineCreate'
>;
type EditProps = NativeStackScreenProps<
  RootStackParamList,
  'PharmacyMedicineEdit'
>;

type MedicineCreateForm = {
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  prescriptionRequired: boolean;
};

type MedicineEditForm = {
  brandName: string;
  manufacturer: string;
  prescriptionRequired: boolean;
};

const DEFAULT_CREATE_FORM: MedicineCreateForm = {
  name: '',
  genericName: '',
  category: '',
  dosageForm: '',
  strength: '',
  manufacturer: '',
  prescriptionRequired: false,
};

const DEFAULT_EDIT_FORM: MedicineEditForm = {
  brandName: '',
  manufacturer: '',
  prescriptionRequired: false,
};

const getMedicineId = (
  medicine: Partial<PharmyxMedicine> | null | undefined,
): string => String(medicine?.id || medicine?._id || '');

const validateCreateForm = (form: MedicineCreateForm) => {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) {
    errors.name = 'Medicine name is required';
  }
  if (!form.dosageForm.trim()) {
    errors.dosageForm = 'Dosage form is required';
  }
  return errors;
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      style={[styles.input, error && styles.inputError]}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

const SwitchRow = ({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.switchRow}>
    <View style={styles.switchContent}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Text style={styles.switchHint}>{hint}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor="#fff"
      trackColor={{ false: '#DCE8F5', true: '#6EC18A' }}
      ios_backgroundColor="#DCE8F5"
    />
  </View>
);

const MedicineFormScreen = ({
  mode,
  medicineId,
  navigation,
}: {
  mode: 'create' | 'edit';
  medicineId?: string;
  navigation: CreateProps['navigation'] | EditProps['navigation'];
}) => {
  const queryClient = useQueryClient();
  const [createForm, setCreateForm] = React.useState(DEFAULT_CREATE_FORM);
  const [editForm, setEditForm] = React.useState(DEFAULT_EDIT_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const medicineQuery = useQuery({
    queryKey: ['pharmacyMedicineDetail', medicineId],
    queryFn: () => pharmacyMedicineService.getById(medicineId || ''),
    enabled: mode === 'edit' && !!medicineId,
  });

  React.useEffect(() => {
    if (mode !== 'edit' || !medicineQuery.data) return;
    setEditForm({
      brandName: String(medicineQuery.data.brandName || ''),
      manufacturer: String(medicineQuery.data.manufacturer || ''),
      prescriptionRequired: !!medicineQuery.data.prescriptionRequired,
    });
  }, [medicineQuery.data, mode]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateMedicineRequest) =>
      pharmacyMedicineService.create(payload),
    onSuccess: async created => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyMedicines'] });
      Toast.show({
        type: 'success',
        text1: 'Medicine added',
        text2: 'The medicine has been saved successfully.',
      });
      const createdId = getMedicineId(created);
      if (createdId) {
        navigation.replace('PharmacyMedicineEdit', { medicineId: createdId });
        return;
      }
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to add medicine',
        text2: error?.message || 'Please try again.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateMedicineRequest) =>
      pharmacyMedicineService.update(medicineId || '', payload),
    onSuccess: async updated => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyMedicines'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyMedicineDetail', getMedicineId(updated)],
        }),
      ]);
      Toast.show({
        type: 'success',
        text1: 'Medicine updated',
        text2: 'The latest changes are now visible.',
      });
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update medicine',
        text2: error?.message || 'Please try again.',
      });
    },
  });

  const onSubmit = () => {
    if (mode === 'create') {
      const nextErrors = validateCreateForm(createForm);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      createMutation.mutate({
        name: createForm.name.trim(),
        genericName: createForm.genericName.trim() || undefined,
        category: createForm.category.trim() || undefined,
        dosageForm: createForm.dosageForm.trim(),
        strength: createForm.strength.trim() || undefined,
        manufacturer: createForm.manufacturer.trim() || undefined,
        prescriptionRequired: createForm.prescriptionRequired,
      });
      return;
    }

    updateMutation.mutate({
      brandName: editForm.brandName.trim() || undefined,
      manufacturer: editForm.manufacturer.trim() || undefined,
      prescriptionRequired: editForm.prescriptionRequired,
    });
  };

  const pageTitle = mode === 'create' ? 'Add Medicine' : 'Edit Medicine';
  const pageSubtitle =
    mode === 'create'
      ? 'Create a medicine on a dedicated responsive screen with cleaner spacing.'
      : 'Update medicine profile details without opening a cramped modal.';

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          mode === 'edit' ? (
            <RefreshControl
              refreshing={medicineQuery.isRefetching}
              onRefresh={() => medicineQuery.refetch()}
              tintColor={colors.primaryBlue}
            />
          ) : undefined
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            {mode === 'create' ? (
              <ClipboardPlus size={scale(22)} color={colors.primaryBlue} />
            ) : (
              <Pill size={scale(22)} color={colors.primaryBlue} />
            )}
          </View>
          <Text style={styles.heroTitle}>{pageTitle}</Text>
          <Text style={styles.heroSubtitle}>{pageSubtitle}</Text>
        </View>

        <View style={styles.formCard}>
          {mode === 'edit' && medicineQuery.isLoading && !medicineQuery.data ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primaryBlue} />
              <Text style={styles.loadingText}>Loading medicine details...</Text>
            </View>
          ) : null}

          {mode === 'edit' && medicineQuery.error && !medicineQuery.data ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load medicine details</Text>
              <Text style={styles.errorText}>Please refresh and try again.</Text>
              <PrimaryButton
                title="Retry"
                onPress={() => medicineQuery.refetch()}
                icon={<RefreshCw size={scale(18)} color="#fff" />}
              />
            </View>
          ) : null}

          {mode === 'create' ? (
            <>
              <Field
                label="Medicine Name"
                value={createForm.name}
                onChangeText={text =>
                  setCreateForm(current => ({ ...current, name: text }))
                }
                placeholder="Paracetamol 650"
                error={errors.name}
              />
              <Field
                label="Generic Name"
                value={createForm.genericName}
                onChangeText={text =>
                  setCreateForm(current => ({ ...current, genericName: text }))
                }
                placeholder="Paracetamol"
              />
              <Field
                label="Category"
                value={createForm.category}
                onChangeText={text =>
                  setCreateForm(current => ({ ...current, category: text }))
                }
                placeholder="Pain Relief"
              />
              <Field
                label="Dosage Form"
                value={createForm.dosageForm}
                onChangeText={text =>
                  setCreateForm(current => ({ ...current, dosageForm: text }))
                }
                placeholder="tablet"
                error={errors.dosageForm}
              />
              <Field
                label="Strength"
                value={createForm.strength}
                onChangeText={text =>
                  setCreateForm(current => ({ ...current, strength: text }))
                }
                placeholder="650 mg"
              />
              <Field
                label="Manufacturer"
                value={createForm.manufacturer}
                onChangeText={text =>
                  setCreateForm(current => ({ ...current, manufacturer: text }))
                }
                placeholder="ABC Pharma"
              />
              <SwitchRow
                label="Prescription Required"
                hint="Enable this when the medicine should only be dispensed with a valid prescription."
                value={createForm.prescriptionRequired}
                onValueChange={value =>
                  setCreateForm(current => ({
                    ...current,
                    prescriptionRequired: value,
                  }))
                }
              />
            </>
          ) : medicineQuery.data ? (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  {medicineQuery.data.name || medicineQuery.data.brandName || 'Medicine'}
                </Text>
                <Text style={styles.summaryText}>
                  {medicineQuery.data.genericName || 'Generic name not available'}
                </Text>
              </View>
              <Field
                label="Brand Name"
                value={editForm.brandName}
                onChangeText={text =>
                  setEditForm(current => ({ ...current, brandName: text }))
                }
                placeholder="PCM 650"
              />
              <Field
                label="Manufacturer"
                value={editForm.manufacturer}
                onChangeText={text =>
                  setEditForm(current => ({ ...current, manufacturer: text }))
                }
                placeholder="XYZ Pharma"
              />
              <SwitchRow
                label="Prescription Required"
                hint="Keep this aligned with the medicine's current dispensing rules."
                value={editForm.prescriptionRequired}
                onValueChange={value =>
                  setEditForm(current => ({
                    ...current,
                    prescriptionRequired: value,
                  }))
                }
              />
            </>
          ) : null}

          <View style={styles.actionRow}>
            <PrimaryButton
              title="Back"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.actionButton}
            />
            <PrimaryButton
              title={mode === 'create' ? 'Save Medicine' : 'Update Medicine'}
              onPress={onSubmit}
              loading={loading}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

export const PharmacyMedicineCreateScreen: React.FC<CreateProps> = ({
  navigation,
}) => <MedicineFormScreen mode="create" navigation={navigation} />;

export const PharmacyMedicineEditScreen: React.FC<EditProps> = ({
  route,
  navigation,
}) => (
  <MedicineFormScreen
    mode="edit"
    medicineId={route.params.medicineId}
    navigation={navigation}
  />
);

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F4F8FC',
  },
  content: {
    padding: scale(16),
    paddingBottom: verticalScale(32),
    gap: verticalScale(16),
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#DCE8F5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  heroIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3FD',
    marginBottom: verticalScale(14),
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textHeader,
  },
  heroSubtitle: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    lineHeight: scale(22),
    color: colors.textSecondary,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#DCE8F5',
    gap: verticalScale(12),
  },
  summaryCard: {
    padding: scale(14),
    borderRadius: scale(18),
    backgroundColor: '#F6FAFE',
    borderWidth: 1,
    borderColor: '#DCE8F5',
  },
  summaryTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  summaryText: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  fieldWrap: {
    gap: verticalScale(8),
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  input: {
    minHeight: verticalScale(56),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#CFE0F1',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(16),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  inputError: {
    borderColor: '#E85D5D',
  },
  fieldError: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#D14343',
  },
  switchRow: {
    marginTop: verticalScale(4),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#DCE8F5',
    backgroundColor: '#F8FBFE',
    padding: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  switchContent: {
    flex: 1,
  },
  switchLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  switchHint: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: scale(20),
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
    marginTop: verticalScale(8),
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: scale(180),
    marginVertical: 0,
  },
  loadingCard: {
    paddingVertical: verticalScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(10),
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorCard: {
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#F5D0D0',
    backgroundColor: '#FFF7F7',
    padding: scale(16),
  },
  errorTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#B42318',
  },
  errorText: {
    marginTop: verticalScale(4),
    marginBottom: verticalScale(10),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#B42318',
  },
});
