import { useState, useEffect, useCallback } from 'react';
import {
  defaultOpeningHours,
  hasCompletedPharmacyProfile,
  mapPharmacyProfileToUser,
} from '../api/pharmyx';
import { pharmacyService } from '../api/pharmacyService';
import { useAuthStore } from '../state/authStore';

export const useProfile = () => {
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    gstNumber: '',
    drugLicenseNumber: '',
    gstCertificateUrl: '',
    drugLicenseDocumentUrl: '',
    ownerIdProofUrl: '',
    shopFrontPhotoUrl: '',
    pickupAvailable: true,
    deliveryAvailable: true,
    profilePictureUrl: '',
  });

  const populateForm = useCallback((data: any) => {
    if (!data) return;
    setFormData({
      name: data.name || '',
      nickname: data.nickname || '',
      ownerName: data.ownerName || '',
      email: data.email || '',
      phone: data.phone || data.mobile || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      latitude:
        data.latitude !== undefined && data.latitude !== null
          ? String(data.latitude)
          : '',
      longitude:
        data.longitude !== undefined && data.longitude !== null
          ? String(data.longitude)
          : '',
      gstNumber: data.gstNumber || '',
      drugLicenseNumber: data.drugLicenseNumber || '',
      gstCertificateUrl: data.gstCertificateUrl || '',
      drugLicenseDocumentUrl: data.drugLicenseDocumentUrl || '',
      ownerIdProofUrl: data.ownerIdProofUrl || '',
      shopFrontPhotoUrl: data.shopFrontPhotoUrl || '',
      pickupAvailable: data.pickupAvailable ?? true,
      deliveryAvailable: data.deliveryAvailable ?? true,
      profilePictureUrl:
        data.profileImage || data.profilePicture || data.profilePictureUrl || data.avatar || '',
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getMyProfile();
      const data = mapPharmacyProfileToUser(response);

      if (data) {
        setUser({
          ...user,
          ...data,
          phone: data.phone || user?.phone || '',
          mobile: data.mobile || user?.mobile || user?.phone || '',
        });
        populateForm(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  }, [setUser, populateForm]);

  useEffect(() => {
    // Always fetch fresh profile data on mount
    fetchProfile();
  }, []);

  // Also sync formData whenever user object changes (e.g. from other screens)
  useEffect(() => {
    if (user) {
      populateForm(user);
      setLoading(false);
    }
  }, [user, populateForm]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim() || 'My Pharmacy',
        nickname:
          formData.nickname.trim() ||
          formData.name.trim().split(' ')[0] ||
          'Pharmacy',
        ownerName:
          formData.ownerName.trim() ||
          user?.ownerName ||
          formData.name.trim() ||
          'Owner',
        phone: formData.phone.trim() || user?.phone || user?.mobile || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        latitude: parseOptionalNumber(formData.latitude),
        longitude: parseOptionalNumber(formData.longitude),
        gstNumber: formData.gstNumber.trim() || undefined,
        drugLicenseNumber: formData.drugLicenseNumber.trim() || undefined,
        gstCertificateUrl: formData.gstCertificateUrl.trim() || undefined,
        drugLicenseDocumentUrl:
          formData.drugLicenseDocumentUrl.trim() || undefined,
        ownerIdProofUrl: formData.ownerIdProofUrl.trim() || undefined,
        shopFrontPhotoUrl: formData.shopFrontPhotoUrl.trim() || undefined,
        profilePictureUrl: formData.profilePictureUrl.trim() || undefined,
        pickupAvailable: formData.pickupAvailable,
        deliveryAvailable: formData.deliveryAvailable,
        openingHours: user?.openingHours || defaultOpeningHours,
      };

      const updateResponse = await pharmacyService.updateMyProfile(payload);
      const refreshedProfile = await pharmacyService.getMyProfile();
      const updatedProfile = refreshedProfile || updateResponse;
      const mappedUser = mapPharmacyProfileToUser(updatedProfile);
      if (mappedUser) {
        setUser({
          ...user,
          ...mappedUser,
          phone: mappedUser.phone || user?.phone || '',
          mobile: mappedUser.mobile || user?.mobile || user?.phone || '',
        });
      }
      await useAuthStore
        .getState()
        .setProfileComplete(hasCompletedPharmacyProfile(updatedProfile));
      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Failed to update profile', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    user,
    loading,
    saving,
    formData,
    updateField,
    handleUpdate,
  };
};
