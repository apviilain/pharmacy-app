import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, User, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fileApi } from '../../api/fileApi';
import { useProfile } from '../../hooks/useProfile';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { buildFullUrl } from '../../utils/urlUtils';

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
  const { user, saving, formData, updateField, handleUpdate } = useProfile();

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const checkAndRequestCameraPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message:
            'Pharmyx needs access to your camera to take a profile picture.',
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
          'Pharmyx needs access to your gallery to choose a profile picture.',
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

      const finalProfileImageUrl =
        uploadRes?.files?.[0]?.url || uploadRes?.url || '';

      if (finalProfileImageUrl) {
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
  }, [navigation, saving]);

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
                  source={{ uri: buildFullUrl(formData.profilePictureUrl) }}
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
            <Text style={styles.formLabel}>Pharmacy Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={val => updateField('name', val)}
              placeholder="Enter pharmacy name"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nickname</Text>
            <TextInput
              style={styles.formInput}
              value={formData.nickname}
              onChangeText={val => updateField('nickname', val)}
              placeholder="Short display name"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Owner Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.ownerName}
              onChangeText={val => updateField('ownerName', val)}
              placeholder="Enter owner name"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={styles.formInput}
              value={formData.email}
              onChangeText={val => updateField('email', val)}
              placeholder="mail@example.com"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
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
            <Text style={styles.formLabel}>Address</Text>
            <TextInput
              style={styles.formInput}
              value={formData.address}
              onChangeText={val => updateField('address', val)}
              placeholder="Shop number, street, landmark"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfGroup]}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={formData.city}
                onChangeText={val => updateField('city', val)}
                placeholder="City"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={[styles.formGroup, styles.halfGroup]}>
              <Text style={styles.formLabel}>State</Text>
              <TextInput
                style={styles.formInput}
                value={formData.state}
                onChangeText={val => updateField('state', val)}
                placeholder="State"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfGroup]}>
              <Text style={styles.formLabel}>Pincode</Text>
              <TextInput
                style={styles.formInput}
                value={formData.pincode}
                onChangeText={val => updateField('pincode', val)}
                placeholder="110001"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={[styles.formGroup, styles.halfGroup]}>
              <Text style={styles.formLabel}>GST Number</Text>
              <TextInput
                style={styles.formInput}
                value={formData.gstNumber}
                onChangeText={val => updateField('gstNumber', val)}
                placeholder="GST number"
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Drug License Number</Text>
            <TextInput
              style={styles.formInput}
              value={formData.drugLicenseNumber}
              onChangeText={val => updateField('drugLicenseNumber', val)}
              placeholder="Drug license number"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfGroup]}>
              <Text style={styles.formLabel}>Latitude</Text>
              <TextInput
                style={styles.formInput}
                value={formData.latitude}
                onChangeText={val => updateField('latitude', val)}
                placeholder="28.6315"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.halfGroup]}>
              <Text style={styles.formLabel}>Longitude</Text>
              <TextInput
                style={styles.formInput}
                value={formData.longitude}
                onChangeText={val => updateField('longitude', val)}
                placeholder="77.2167"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>GST Certificate URL</Text>
            <TextInput
              style={styles.formInput}
              value={formData.gstCertificateUrl}
              onChangeText={val => updateField('gstCertificateUrl', val)}
              placeholder="https://..."
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Drug License Document URL</Text>
            <TextInput
              style={styles.formInput}
              value={formData.drugLicenseDocumentUrl}
              onChangeText={val => updateField('drugLicenseDocumentUrl', val)}
              placeholder="https://..."
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Owner ID Proof URL</Text>
            <TextInput
              style={styles.formInput}
              value={formData.ownerIdProofUrl}
              onChangeText={val => updateField('ownerIdProofUrl', val)}
              placeholder="https://..."
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Shop Front Photo URL</Text>
            <TextInput
              style={styles.formInput}
              value={formData.shopFrontPhotoUrl}
              onChangeText={val => updateField('shopFrontPhotoUrl', val)}
              placeholder="https://..."
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Profile Picture URL</Text>
            <TextInput
              style={styles.formInput}
              value={formData.profilePictureUrl}
              onChangeText={val => updateField('profilePictureUrl', val)}
              placeholder="https://..."
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Pickup Available</Text>
                <Text style={styles.switchSubtitle}>
                  Enable in-store pickup for customers
                </Text>
              </View>
              <Switch
                value={formData.pickupAvailable}
                onValueChange={value => updateField('pickupAvailable', value)}
                trackColor={{ false: '#D8DEE8', true: '#BFDBFE' }}
                thumbColor={
                  formData.pickupAvailable ? colors.primaryBlue : '#FFFFFF'
                }
              />
            </View>

            <View style={[styles.switchRow, styles.switchDivider]}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Delivery Available</Text>
                <Text style={styles.switchSubtitle}>
                  Enable delivery from your pharmacy
                </Text>
              </View>
              <Switch
                value={formData.deliveryAvailable}
                onValueChange={value => updateField('deliveryAvailable', value)}
                trackColor={{ false: '#D8DEE8', true: '#BFDBFE' }}
                thumbColor={
                  formData.deliveryAvailable ? colors.primaryBlue : '#FFFFFF'
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>

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
  headerRightBtn: {
    padding: scale(8),
  },
  content: {
    padding: scale(20),
    paddingBottom: verticalScale(40),
  },
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
  row: {
    flexDirection: 'row',
    gap: scale(12),
  },
  halfGroup: {
    flex: 1,
  },
  formGroup: {
    marginBottom: verticalScale(18),
  },
  formLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
    marginLeft: scale(4),
  },
  formInput: {
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
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: colors.textLight,
  },
  switchCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#D9E9FB',
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(16),
  },
  switchDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E5EEF9',
  },
  switchCopy: {
    flex: 1,
    paddingRight: scale(16),
  },
  switchTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  switchSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
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
