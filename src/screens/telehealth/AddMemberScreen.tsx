import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { CustomInput } from '../../components/CustomInput';
import { CustomDropdown } from '../../components/CustomDropdown';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-native-date-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dependentService } from '../../api/dependentService';
import { getCurrentUserId } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMember'>;

export const AddMemberScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const member = (route.params as any)?.member;
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Normalizes YYYYMMDD → YYYY-MM-DD for safe Date parsing
  const normalizeDob = (raw: string): string => {
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw; // Already YYYY-MM-DD
    if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return raw;
  };

  // Safely creates a Date from a DOB string
  const safeParseDobDate = (dob: string): Date => {
    const normalized = normalizeDob(dob);
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().trim().required('Name is required'),
    relation: Yup.string().required('Relation is required'),
    contact: Yup.string()
      .matches(/^[0-9]{10}$/, 'Must be exactly 10 digits')
      .required('Contact is required'),

    email: Yup.string().email('Invalid email format').nullable().notRequired(),
    dob: Yup.string().nullable().notRequired(),
    address: Yup.string().nullable().notRequired(),
    gender: Yup.string().nullable().notRequired(),
    bloodGroup: Yup.string().nullable().notRequired(),
  });

  const handleAddMember = async (values: any, { setSubmitting }: any) => {
    const userId = getCurrentUserId();
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User is not logged in.',
      });
      return;
    }

    setLoading(true);
    try {
      // Only send filled fields
      const payload: any = {
        userId,
        name: values.fullName.trim(),
        relationship: values.relation,
        phone: values.contact,
        isActive: true,
      };

      if (values.gender?.trim()) payload.gender = values.gender.trim();

      if (values.email?.trim()) payload.email = values.email.trim();
      if (values.dob?.trim()) payload.dateOfBirth = values.dob.trim().replace(/-/g, '');
      if (values.bloodGroup?.trim()) payload.bloodGroup = values.bloodGroup.trim();
      if (values.address?.trim()) payload.address = values.address.trim();

      if (member) {
        await dependentService.updateDependent(
          member._id || member.id || '',
          userId,
          payload,
        );
      } else {
        await dependentService.createDependent(payload);
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: member ? 'Member updated successfully' : 'Member added successfully',
      });
      setTimeout(() => navigation.goBack(), 500);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to action',
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <Formik
        initialValues={{
          fullName: member?.name || '',
          relation: member?.relationship || '',
          gender: member?.gender || '',

          contact: member?.phone || '',
          email: member?.email || '',
          dob: normalizeDob(member?.dateOfBirth || ''),
          address: member?.address || '',
          bloodGroup: member?.bloodGroup || '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleAddMember}
      >
        {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <CustomInput
                label="Full Name"
                value={values.fullName}
                onChangeText={handleChange('fullName')}
                placeholder="Enter full name"
                error={touched.fullName && errors.fullName ? String(errors.fullName) : ''}
              />
              <CustomDropdown
                label="Relation"
                value={values.relation}
                onSelect={val => setFieldValue('relation', val)}
                options={[
                  'Father',
                  'Mother',
                  'Spouse',
                  'Son',
                  'Daughter',
                  'Brother',
                  'Sister',
                  'Grandfather',
                  'Grandmother',
                  'Other',
                ]}
                placeholder="Select relation"
              />
              <CustomDropdown
                label="Gender"
                value={values.gender}
                onSelect={val => setFieldValue('gender', val)}
                options={['Male', 'Female', 'Other']}
                placeholder="Select gender"
              />

              <CustomInput
                label="Contact"
                value={values.contact}
                onChangeText={text => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                  setFieldValue('contact', cleaned);
                }}
                keyboardType="number-pad"
                placeholder="Enter phone number"
                error={touched.contact && errors.contact ? String(errors.contact) : ''}
              />
              <CustomInput
                label="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                keyboardType="email-address"
                placeholder="Enter email (Optional)"
                error={touched.email && errors.email ? String(errors.email) : ''}
              />
              <TouchableOpacity onPress={() => setOpen(true)}>
                <View pointerEvents="none">
                  <CustomInput
                    label="Date of Birth"
                    value={values.dob ? safeParseDobDate(values.dob).toLocaleDateString('en-GB') : ''}
                    placeholder="Select Date of Birth"
                    error={touched.dob && errors.dob ? String(errors.dob) : ''}
                  />
                </View>
              </TouchableOpacity>

              <DatePicker
                modal
                open={open}
                date={values.dob ? safeParseDobDate(values.dob) : new Date()}
                mode="date"
                maximumDate={new Date()}
                onConfirm={date => {
                  setOpen(false);
                  setFieldValue('dob', date.toISOString().split('T')[0]);
                }}
                onCancel={() => {
                  setOpen(false);
                }}
              />
              <CustomDropdown
                label="Blood Group"
                value={values.bloodGroup}
                onSelect={val => setFieldValue('bloodGroup', val)}
                options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']}
                placeholder="Select blood group"
              />
              <CustomInput
                label="Address"
                value={values.address}
                onChangeText={handleChange('address')}
                placeholder="Enter address"
                error={touched.address && errors.address ? String(errors.address) : ''}
              />

              <View style={{ height: verticalScale(18) }} />
            </ScrollView>

            <View
              style={[
                styles.bottom,
                {
                  paddingBottom: insets.bottom > 0 ? insets.bottom + verticalScale(8) : verticalScale(16),
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              ) : (
                <PrimaryButton
                  title="Next →"
                  onPress={() => handleSubmit()}
                  style={styles.cta}
                />
              )}
            </View>
          </View>
        )}
      </Formik>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
  },
  bottom: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: colors.background,
  },
  cta: { marginVertical: 0 },
});
