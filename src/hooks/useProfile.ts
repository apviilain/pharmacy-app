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
    email: '',
    phone: '',
    gender: '',
    dob: '',
    height: '',
    weight: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    profilePictureUrl: '',
  });

  const normalizeDob = (raw: string): string => {
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    return raw;
  };

  const populateForm = useCallback((data: any) => {
    if (!data) return;
    setFormData({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || data.mobile || '',
      gender: data.gender || '',
      dob: normalizeDob(data.dateOfBirth || data.dob || ''),
      height: data.height ? String(data.height) : '',
      weight: data.weight ? String(data.weight) : '',
      bloodGroup: data.bloodGroup || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      emergencyContactName: data.emergencyContact?.name || '',
      emergencyContactPhone: data.emergencyContact?.phone || '',
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim() || 'My Pharmacy',
        nickname: formData.name.trim().split(' ')[0] || 'Pharmacy',
        ownerName: user?.ownerName || formData.name.trim() || 'Owner',
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        profilePictureUrl: formData.profilePictureUrl.trim() || undefined,
        pickupAvailable: true,
        deliveryAvailable: true,
        openingHours: defaultOpeningHours,
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
