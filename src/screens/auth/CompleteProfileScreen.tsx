import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  PermissionsAndroid,
  FlatList,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowRight,
  Camera,
  UserCircle,
  ImageIcon,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';

import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, wp } from '../../theme/responsive';

import { useAuthStore } from '../../state/authStore';
import {
  defaultOpeningHours,
  mapPharmacyProfileToUser,
} from '../../api/pharmyx';
import { pharmacyService } from '../../api/pharmacyService';
import { referralApi } from '../../api/referralApi';
import { fileApi } from '../../api/fileApi';
import { env } from '../../config/env';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSecurityStore } from '../../state/securityStore';
import { useSettingsStore } from '../../state/settingsStore';

type CompleteProfileNavigationProp = NativeStackNavigationProp<
  any,
  'CompleteProfile'
>;

export const CompleteProfileScreen = () => {
  const navigation = useNavigation<CompleteProfileNavigationProp>();
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || '',
    dob: user?.dateOfBirth || '',
    height: user?.height ? String(user.height) : '',
    weight: user?.weight ? String(user.weight) : '',
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    emergencyContactName: user?.emergencyContact?.name || '',
    emergencyContactPhone: user?.emergencyContact?.phone || '',
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .min(3, 'Name too short')
      .max(50, 'Name too long')
      .required('Full name is required'),
    email: Yup.string().email('Enter a valid email address'),
    pincode: Yup.string()
      .matches(/^\d{6}$/, 'Pincode must be exactly 6 digits')
      .required('Pincode is required'),
    height: Yup.number()
      .typeError('Must be a number')
      .min(50, 'Min 50cm')
      .max(250, 'Max 250cm')
      .nullable(),
    weight: Yup.number()
      .typeError('Must be a number')
      .min(10, 'Min 10kg')
      .max(500, 'Max 500kg')
      .nullable(),
    emergencyContactPhone: Yup.string().matches(
      /^\d{10}$/,
      'Mobile number must be exactly 10 digits',
    ),
    dob: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
      .nullable(),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: values => handleSubmit(values),
  });
  const { setValues, values } = formik;

  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || user?.avatar || '',
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Dropdown & Date Picker state
  const [dropdownField, setDropdownField] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Dropdown options
  const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
  const BLOOD_GROUP_OPTIONS = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];
  const HEIGHT_OPTIONS = Array.from({ length: 201 }, (_, i) => String(i + 50)); // 50cm to 250cm

  // Draft Saving / Restoring
  const isInitialMount = useRef(true);
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem('draft_profile_cache');
        if (draft) {
          const parsed = JSON.parse(draft);
          setValues(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.log('Error loading draft', e);
      }
    };
    loadDraft();
  }, [setValues]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    AsyncStorage.setItem(
      'draft_profile_cache',
      JSON.stringify(values),
    ).catch(() => {});
  }, [values]);

  const handleImagePick = () => {
    setShowPicker(true);
  };

  const checkAndRequestCameraPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message:
            'Pharmacy App needs access to your camera to take a profile picture.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const checkAndRequestGalleryPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const permission =
        Number(Platform.Version) >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission, {
        title: 'Gallery Permission',
        message:
          'Pharmacy App needs access to your gallery to choose a profile picture.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const pickFromCamera = async () => {
    const hasPermission = await checkAndRequestCameraPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Camera permission is required to take a photo.',
      });
      return;
    }
    setShowPicker(false);
    setTimeout(() => {
      launchCamera({ mediaType: 'photo', quality: 0.8 }, handleImageResult);
    }, 400);
  };

  const pickFromGallery = async () => {
    const hasPermission = await checkAndRequestGalleryPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Gallery permission is required to select a photo.',
      });
      return;
    }
    setShowPicker(false);
    setTimeout(() => {
      launchImageLibrary(
        { mediaType: 'photo', quality: 0.8 },
        handleImageResult,
      );
    }, 400);
  };

  const handleImageResult = async (res: any) => {
    if (res.didCancel || !res.assets || res.assets.length === 0) return;
    const selectedAsset = res.assets[0];

    setUploadingImage(true);
    try {
      const file = {
        uri: selectedAsset.uri,
        type: selectedAsset.type || 'image/jpeg',
        name: selectedAsset.fileName || 'profile_image.jpg',
      };
      const phone = user?.phone || user?.mobile;
      const recordId = user?._id || user?.id || phone || 'new_user';

      console.log('Uploading file for record:', recordId, file);

      // fileApi.uploadFile returns the fully unwrapped response (interceptors strip AxiosResponse wrapper)
      const uploadResponse: any = await fileApi.uploadFile(
        file,
        'profile',
        recordId,
      );

      console.log('Upload response:', JSON.stringify(uploadResponse));

      // uploadResponse is already fully unwrapped by apiClient interceptors
      // Expected shape: { files: [{ url: '...' }] } or { url: '...' }
      let finalProfileImageUrl =
        uploadResponse?.files?.[0]?.url || uploadResponse?.url || '';

      // Backend returns relative URLs (e.g. '/api/static/...') — resolve to full URL
      if (finalProfileImageUrl && finalProfileImageUrl.startsWith('/')) {
        finalProfileImageUrl = `${env.BASE_URL}${finalProfileImageUrl}`;
      }

      if (finalProfileImageUrl) {
        setProfilePicture(finalProfileImageUrl);
        Toast.show({
          type: 'success',
          text1: 'Photo Uploaded',
          text2: 'Profile picture updated successfully.',
        });
      } else {
        console.warn(
          'Upload response structure:',
          JSON.stringify(uploadResponse),
        );
        Toast.show({
          type: 'error',
          text1: 'Upload Issue',
          text2: 'Image uploaded but URL not found in response.',
        });
      }
    } catch (error: any) {
      console.error(
        'Upload error:',
        error?.message,
        error?.response?.data || error,
      );
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2:
          error?.response?.data?.message ||
          error?.userMessage ||
          error?.message ||
          'Failed to upload profile picture.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      if (referralCode.trim().length > 0) {
        await referralApi.applyReferralCode(referralCode.trim());
      }

      const payload = {
        name: values.name.trim(),
        nickname: values.name.trim().split(' ')[0] || 'Pharmacy',
        ownerName: values.name.trim(),
        phone: (user?.phone || values.emergencyContactPhone || '').trim(),
        email: values.email.trim() || undefined,
        address: values.address.trim() || undefined,
        city: values.city.trim() || undefined,
        state: values.state.trim() || undefined,
        pincode: values.pincode.trim() || undefined,
        latitude: undefined,
        longitude: undefined,
        gstNumber: undefined,
        drugLicenseNumber: undefined,
        gstCertificateUrl: undefined,
        drugLicenseDocumentUrl: undefined,
        ownerIdProofUrl: undefined,
        shopFrontPhotoUrl: undefined,
        openingHours: defaultOpeningHours,
        pickupAvailable: true,
        deliveryAvailable: true,
        profilePictureUrl: profilePicture.trim() || undefined,
        isVerified: false,
      };

      const createdProfile = await pharmacyService.createProfile(payload);
      const mappedUser = mapPharmacyProfileToUser(createdProfile);
      if (mappedUser) {
        setUser(mappedUser);
      }

      await AsyncStorage.removeItem('draft_profile_cache');
      await useAuthStore.getState().setProfileComplete(true);

      setLoading(false);
      const { hasMpin } = useSecurityStore.getState();
      const { mpinSetupSkipped } = useSettingsStore.getState();
      const nextRoute = hasMpin || mpinSetupSkipped ? 'MainTabs' : 'MpinSetup';
      navigation.reset({ index: 0, routes: [{ name: nextRoute }] });
    } catch (error: any) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2:
          error?.response?.data?.message ||
          error.message ||
          'Error saving profile',
      });
    }
  };

  const renderInput = (
    label: string,
    field: keyof typeof initialValues,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    maxLength?: number,
  ) => {
    const hasError = formik.touched[field] && formik.errors[field];
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, hasError ? styles.inputError : null]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={String(formik.values[field] || '')}
          onChangeText={formik.handleChange(field)}
          onBlur={formik.handleBlur(field)}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {hasError ? (
          <Text style={styles.errorText}>{String(formik.errors[field])}</Text>
        ) : null}
      </View>
    );
  };

  const renderDropdown = (
    label: string,
    field: keyof typeof initialValues,
    placeholder: string,
  ) => {
    const hasError = formik.touched[field] && formik.errors[field];
    const currentValue = String(formik.values[field] || '');
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setDropdownField(field)}
          style={[
            styles.input,
            styles.dropdownTrigger,
            hasError ? styles.inputError : null,
          ]}
        >
          <Text
            style={[
              styles.dropdownText,
              !currentValue && styles.dropdownPlaceholder,
            ]}
            numberOfLines={1}
          >
            {currentValue
              ? field === 'height'
                ? `${currentValue} cm`
                : currentValue
              : placeholder}
          </Text>
          <ChevronDown color={colors.textLight} size={scale(18)} />
        </TouchableOpacity>
        {hasError ? (
          <Text style={styles.errorText}>{String(formik.errors[field])}</Text>
        ) : null}
      </View>
    );
  };

  const renderDateField = () => {
    const hasError = formik.touched.dob && formik.errors.dob;
    const currentValue = formik.values.dob;
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Date of Birth</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.input,
            styles.dropdownTrigger,
            hasError ? styles.inputError : null,
          ]}
        >
          <Text
            style={[
              styles.dropdownText,
              !currentValue && styles.dropdownPlaceholder,
            ]}
          >
            {currentValue || 'Select date of birth'}
          </Text>
          <ChevronDown color={colors.textLight} size={scale(18)} />
        </TouchableOpacity>
        {hasError ? (
          <Text style={styles.errorText}>{String(formik.errors.dob)}</Text>
        ) : null}
      </View>
    );
  };

  const getDropdownOptions = (): string[] => {
    if (dropdownField === 'gender') return GENDER_OPTIONS;
    if (dropdownField === 'bloodGroup') return BLOOD_GROUP_OPTIONS;
    if (dropdownField === 'height') return HEIGHT_OPTIONS;
    return [];
  };

  const getDropdownTitle = (): string => {
    if (dropdownField === 'gender') return 'Select Gender';
    if (dropdownField === 'bloodGroup') return 'Select Blood Group';
    if (dropdownField === 'height') return 'Select Height (cm)';
    return 'Select';
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >

          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>
            Please fill out your details so we can personalize your experience.
            Only Full Name is required.
          </Text>

          <View style={styles.formContainer}>
            {/* ── Premium Avatar Picker ── */}
            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={handleImagePick} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#1572B7', '#20C997', '#1572B7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View style={styles.avatarInnerRing}>
                    {uploadingImage ? (
                      <View style={styles.avatarPlaceholder}>
                        <ActivityIndicator
                          color={colors.primaryBlue}
                          size="large"
                        />
                      </View>
                    ) : profilePicture ? (
                      <Image
                        source={{ uri: profilePicture }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <UserCircle
                          color="#B8C7D6"
                          size={scale(52)}
                          strokeWidth={1.2}
                        />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                {/* Camera Badge */}
                <View style={styles.cameraIconBadge}>
                  <Camera color="#fff" size={scale(13)} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>
                {uploadingImage ? 'Uploading photo...' : 'Tap to change photo'}
              </Text>
            </View>

            {/* ── Bottom Sheet Image Picker ── */}
            <Modal
              visible={showPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPicker(false)}
            >
              <Pressable
                style={styles.pickerOverlay}
                onPress={() => setShowPicker(false)}
              >
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHandle} />
                  <Text style={styles.pickerTitle}>Choose Photo</Text>
                  <TouchableOpacity
                    style={styles.pickerRow}
                    activeOpacity={0.7}
                    onPress={pickFromCamera}
                  >
                    <View
                      style={[
                        styles.pickerIconBox,
                        { backgroundColor: '#EBF5FF' },
                      ]}
                    >
                      <Camera color={colors.primaryBlue} size={22} />
                    </View>
                    <View>
                      <Text style={styles.pickerRowTitle}>Take Photo</Text>
                      <Text style={styles.pickerRowSub}>Use your camera</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerRow}
                    activeOpacity={0.7}
                    onPress={pickFromGallery}
                  >
                    <View
                      style={[
                        styles.pickerIconBox,
                        { backgroundColor: '#F0FFF4' },
                      ]}
                    >
                      <ImageIcon color="#38A169" size={22} />
                    </View>
                    <View>
                      <Text style={styles.pickerRowTitle}>
                        Choose from Gallery
                      </Text>
                      <Text style={styles.pickerRowSub}>
                        Select an existing photo
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerCancel}
                    activeOpacity={0.7}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={styles.pickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {/* ── Dropdown Bottom Sheet ── */}
            <Modal
              visible={dropdownField !== null}
              transparent
              animationType="slide"
              onRequestClose={() => setDropdownField(null)}
            >
              <Pressable
                style={styles.pickerOverlay}
                onPress={() => setDropdownField(null)}
              >
                <View style={[styles.pickerSheet, styles.dropdownSheet]}>
                  <View style={styles.pickerHandle} />
                  <Text style={styles.pickerTitle}>{getDropdownTitle()}</Text>
                  <FlatList
                    data={getDropdownOptions()}
                    keyExtractor={item => item}
                    showsVerticalScrollIndicator={false}
                    style={styles.dropdownList}
                    renderItem={({ item }) => {
                      const isSelected =
                        dropdownField &&
                        String(
                          formik.values[
                            dropdownField as keyof typeof initialValues
                          ] || '',
                        ) === item;
                      return (
                        <TouchableOpacity
                          activeOpacity={0.6}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            formik.setFieldValue(dropdownField!, item);
                            setDropdownField(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {dropdownField === 'height' ? `${item} cm` : item}
                          </Text>
                          {isSelected && (
                            <Check
                              color={colors.primaryBlue}
                              size={scale(18)}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                  <TouchableOpacity
                    style={styles.pickerCancel}
                    activeOpacity={0.7}
                    onPress={() => setDropdownField(null)}
                  >
                    <Text style={styles.pickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {/* ── Date of Birth Picker ── */}
            <DatePicker
              modal
              open={showDatePicker}
              date={
                formik.values.dob
                  ? new Date(formik.values.dob)
                  : new Date(2000, 0, 1)
              }
              mode="date"
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              title="Select Date of Birth"
              confirmText="Confirm"
              cancelText="Cancel"
              onConfirm={date => {
                setShowDatePicker(false);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                formik.setFieldValue('dob', `${yyyy}-${mm}-${dd}`);
              }}
              onCancel={() => setShowDatePicker(false)}
            />

            <Text style={styles.sectionTitle}>Basic Information</Text>
            {renderInput(
              'Full Name *',
              'name',
              'Enter your full name',
              'default',
              50,
            )}
            {renderInput(
              'Email Address',
              'email',
              'Enter your email',
              'email-address',
              60,
            )}
            {renderDropdown('Gender', 'gender', 'Select gender')}
            {renderDateField()}

            <Text style={styles.sectionTitle}>Medical Details</Text>
            {renderDropdown('Blood Group', 'bloodGroup', 'Select blood group')}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderDropdown('Height (cm)', 'height', 'Select height')}
              </View>
              <View style={styles.halfWidth}>
                {renderInput('Weight (kg)', 'weight', 'e.g., 70', 'numeric', 3)}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Address</Text>
            {renderInput(
              'Address',
              'address',
              'House No, Street, Landmark',
              'default',
              100,
            )}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderInput('City', 'city', 'City Name', 'default', 30)}
              </View>
              <View style={styles.halfWidth}>
                {renderInput('State', 'state', 'State Name', 'default', 30)}
              </View>
            </View>
            {renderInput('Pincode', 'pincode', '6-digit pincode', 'numeric', 6)}

            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            {renderInput(
              'Contact Name',
              'emergencyContactName',
              "Relative or Friend's Name",
              'default',
              50,
            )}
            {renderInput(
              'Contact Phone',
              'emergencyContactPhone',
              'Emergency Phone Number',
              'numeric',
              10,
            )}

            <Text style={styles.sectionTitle}>Referrals</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter referral code"
                placeholderTextColor={colors.textLight}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton
                title="Complete & Continue"
                onPress={formik.handleSubmit as any}
                loading={loading}
                disabled={loading}
                rightIcon={<ArrowRight size={scale(20)} color="#fff" />}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flex1: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('5%'),
    paddingBottom: verticalScale(40),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textHeader,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: '#817795',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(20),
  },
  formContainer: { flex: 1 },

  // ─── Avatar ───
  avatarWrap: { alignItems: 'center', marginBottom: verticalScale(24) },
  avatarGradientRing: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    padding: 3,
    elevation: 8,
    shadowColor: '#1572B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarInnerRing: {
    flex: 1,
    borderRadius: scale(53),
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
  },
  avatarImage: { width: '100%', height: '100%' },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.primaryBlue,
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarHint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
    marginTop: verticalScale(10),
    letterSpacing: 0.3,
  },

  // ─── Bottom Sheet Picker ───
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  pickerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRowTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  pickerRowSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  pickerCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pickerCancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#EF4444',
  },

  // ─── Form ───
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.primaryBlue,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  inputContainer: { marginBottom: verticalScale(16) },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  input: {
    height: verticalScale(56),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: '#EF4444',
    marginTop: verticalScale(4),
  },
  inputDisabled: { backgroundColor: '#F3F6FB', color: colors.textLight },
  buttonContainer: { marginTop: verticalScale(20) },

  // ─── Dropdown Trigger ───
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  dropdownPlaceholder: {
    color: colors.textLight,
  },

  // ─── Dropdown Bottom Sheet ───
  dropdownSheet: {
    maxHeight: '60%',
  },
  dropdownList: {
    maxHeight: verticalScale(320),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#EBF5FF',
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    marginHorizontal: -scale(4),
  },
  dropdownItemText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  dropdownItemTextSelected: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
  },
});
