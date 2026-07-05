import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Modal,
  Pressable,
} from 'react-native';
import {
  ChevronRight,
  ArrowLeft,
  Check,
  User,
  X,
  Camera,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { fileApi } from '../../api/fileApi';
import { env } from '../../config/env';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import type { RootStackParamList } from '../../navigation/types';
import { BASE_URL } from '@env';
import LinearGradient from 'react-native-linear-gradient';

// Selection Component for Dropdowns
const SelectionModal = ({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (val: string) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <Pressable style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={scale(20)} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={styles.optionItem}
              onPress={() => onSelect(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Pressable>
    </TouchableOpacity>
  </Modal>
);

// Image Picker Modal
const ImagePickerModal = ({
  visible,
  onClose,
  onCamera,
  onGallery,
}: {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <Pressable style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Profile Photo</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={scale(20)} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        <View style={styles.imagePickerOptions}>
          <TouchableOpacity
            style={styles.imagePickerOption}
            onPress={() => {
              onCamera();
              onClose();
            }}
          >
            <View
              style={[styles.imagePickerIcon, { backgroundColor: '#EAF4FF' }]}
            >
              <Camera size={scale(24)} color={colors.primaryBlue} />
            </View>
            <Text style={styles.imagePickerText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imagePickerOption}
            onPress={() => {
              onGallery();
              onClose();
            }}
          >
            <View
              style={[styles.imagePickerIcon, { backgroundColor: '#DCFCE7' }]}
            >
              <ImageIcon size={scale(24)} color="#22C55E" />
            </View>
            <Text style={styles.imagePickerText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </TouchableOpacity>
  </Modal>
);

export const EditProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const { user, saving, formData, updateField, handleUpdate } = useProfile();

  const [dateOpen, setDateOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [bloodOpen, setBloodOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

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

      const uploadRes: any = await fileApi.uploadFile(
        file,
        'profile',
        recordId,
      );

      let finalProfileImageUrl =
        uploadRes?.files?.[0]?.url || uploadRes?.url || '';

      if (finalProfileImageUrl) {
        // If relative, prepend BASE_URL handled by display logic
        updateField('profilePictureUrl', finalProfileImageUrl);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture uploaded.',
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Could not upload image.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onCamera = async () => {
    const hasPermission = await checkAndRequestCameraPermission();
    if (!hasPermission) return;
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });
    handleImageResult(result);
  };

  const onGallery = async () => {
    const hasPermission = await checkAndRequestGalleryPermission();
    if (!hasPermission) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    handleImageResult(result);
  };

  const onSave = async () => {
    const success = await handleUpdate();
    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully!',
      });
      navigation.goBack();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile.',
      });
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryBlue} />
          ) : (
            <Check size={scale(22)} color={colors.primaryBlue} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, onSave]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarOuterRing}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setImagePickerOpen(true)}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : formData.profilePictureUrl ? (
                <Image
                  source={{ uri: `${BASE_URL}${formData.profilePictureUrl}` }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.iconAvatarBox}>
                  <User size={scale(40)} color={colors.primaryBlue} />
                </View>
              )}
              <View style={styles.cameraIconBox}>
                <Camera size={scale(14)} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Full Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={val => updateField('name', val)}
              placeholder="Enter full name"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={formData.email}
              editable={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={formData.phone}
              editable={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Gender</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => setGenderOpen(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  !formData.gender && { color: colors.textLight },
                ]}
              >
                {formData.gender || 'Select Gender'}
              </Text>
              <ChevronDown size={scale(18)} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => setDateOpen(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  !formData.dob && { color: colors.textLight },
                ]}
              >
                {formData.dob || 'Select Date of Birth'}
              </Text>
              <ChevronDown size={scale(18)} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Blood Group</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => setBloodOpen(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  !formData.bloodGroup && { color: colors.textLight },
                ]}
              >
                {formData.bloodGroup || 'Select Blood Group'}
              </Text>
              <ChevronDown size={scale(18)} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Height (cm)</Text>
            <TextInput
              style={styles.formInput}
              value={formData.height}
              onChangeText={val => updateField('height', val)}
              placeholder="e.g., 175"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.formInput}
              value={formData.weight}
              onChangeText={val => updateField('weight', val)}
              placeholder="e.g., 70"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Address</Text>
            <TextInput
              style={styles.formInput}
              value={formData.address}
              onChangeText={val => updateField('address', val)}
              placeholder="House No, Street, Landmark"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>City</Text>
            <TextInput
              style={styles.formInput}
              value={formData.city}
              onChangeText={val => updateField('city', val)}
              placeholder="City name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>State</Text>
            <TextInput
              style={styles.formInput}
              value={formData.state}
              onChangeText={val => updateField('state', val)}
              placeholder="State name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Pincode</Text>
            <TextInput
              style={styles.formInput}
              value={formData.pincode}
              onChangeText={val => updateField('pincode', val)}
              placeholder="6-digit pincode"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Emergency Contact Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.emergencyContactName}
              onChangeText={val => updateField('emergencyContactName', val)}
              placeholder="Relative or friend's name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.formInput}
              value={formData.emergencyContactPhone}
              onChangeText={val => updateField('emergencyContactPhone', val)}
              placeholder="Emergency phone number"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>
      </ScrollView>

      <DatePicker
        modal
        open={dateOpen}
        date={formData.dob ? new Date(formData.dob) : new Date(2000, 0, 1)}
        mode="date"
        onConfirm={date => {
          setDateOpen(false);
          updateField('dob', date.toISOString().split('T')[0]);
        }}
        onCancel={() => setDateOpen(false)}
      />

      <SelectionModal
        visible={genderOpen}
        title="Select Gender"
        options={genderOptions}
        onSelect={val => {
          updateField('gender', val);
          setGenderOpen(false);
        }}
        onClose={() => setGenderOpen(false)}
      />

      <SelectionModal
        visible={bloodOpen}
        title="Select Blood Group"
        options={bloodGroups}
        onSelect={val => {
          updateField('bloodGroup', val);
          setBloodOpen(false);
        }}
        onClose={() => setBloodOpen(false)}
      />

      <ImagePickerModal
        visible={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onCamera={onCamera}
        onGallery={onGallery}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingBottom: verticalScale(30),
    alignItems: 'center',
    borderBottomLeftRadius: scale(32),
    borderBottomRightRadius: scale(32),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    color: '#fff',
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightBtn: {
    padding: scale(8),
  },
  content: { padding: scale(20), paddingBottom: verticalScale(40) },
  avatarSection: {
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  avatarOuterRing: {
    width: scale(102),
    height: scale(102),
    borderRadius: scale(51),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { width: '100%', height: '100%', borderRadius: scale(45) },
  iconAvatarBox: {
    width: '100%',
    height: '100%',
    borderRadius: scale(45),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBox: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryBlue,
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: scale(24),
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formGroup: { marginBottom: verticalScale(18) },
  formLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
    marginLeft: scale(4),
  },
  formInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    height: verticalScale(50),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  disabledInput: { backgroundColor: '#F3F4F6', color: colors.textLight },
  inputText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(32),
    borderTopRightRadius: scale(32),
    padding: scale(24),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    color: colors.textHeader,
  },
  optionItem: {
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  imagePickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: verticalScale(20),
  },
  imagePickerOption: { alignItems: 'center' },
  imagePickerIcon: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
  },
  imagePickerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
});
