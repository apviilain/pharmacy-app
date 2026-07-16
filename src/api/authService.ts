import { publicApiClient, apiClient } from './apiClient';
import { endpoints } from './endpoints';
import {
  mapPharmacyProfileToUser,
  hasCompletedPharmacyProfile,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
} from './pharmyx';
import { pharmacyService } from './pharmacyService';
import { useAuthStore } from '../state/authStore';

const extractAuthProfile = (response: any) => {
  if (!response || typeof response !== 'object') return null;

  if (response.user && typeof response.user === 'object') {
    return response.user;
  }

  if (
    response.data &&
    typeof response.data === 'object' &&
    response.data.user &&
    typeof response.data.user === 'object'
  ) {
    return response.data.user;
  }

  return response;
};

const assertNonEmptyString = (value: unknown, name: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
};

const assertPhone = (phone: string) => {
  if (!/^\d{10}$/.test(phone))
    throw new Error('phone must be a 10-digit number');
};

const assertOtp = (otp: string) => {
  if (!/^\d{6}$/.test(otp)) throw new Error('otp must be a 6-digit number');
};

export const authService = {
  sendOtp: async (phone: string): Promise<any> => {
    assertNonEmptyString(phone, 'phone');
    assertPhone(phone);
    return publicApiClient.post(endpoints.auth.sendOtp, { phone });
  },

  loginWithOtp: async (input: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    assertNonEmptyString(input.phone, 'phone');
    assertNonEmptyString(input.otp, 'otp');
    assertPhone(input.phone);
    assertOtp(input.otp);

    const data = (await publicApiClient.post(endpoints.auth.verifyOtp, {
      phone: input.phone,
      otp: input.otp,
    })) as unknown as VerifyOtpResponse;

    const accessToken = data?.accessToken || data?.token || data?.jwt;
    const refreshToken = data?.refreshToken;

    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Login succeeded but accessToken missing');
    }

    const pharmacyProfile = data?.pharmacy || data?.user || null;
    const mappedUser = mapPharmacyProfileToUser(pharmacyProfile);
    const isProfileComplete =
      data?.isProfileComplete ?? hasCompletedPharmacyProfile(pharmacyProfile);

    await useAuthStore.getState().setTokens({ accessToken, refreshToken, isProfileComplete });
    useAuthStore.getState().setUser(
      mappedUser
        ? {
            ...mappedUser,
            phone: mappedUser.phone || input.phone,
            mobile: mappedUser.mobile || input.phone,
          }
        : {
            phone: input.phone,
            mobile: input.phone,
          },
    );

    return data;
  },

  getAuthProfile: async (): Promise<any> => {
    try {
      const response = await apiClient.get(endpoints.auth.profile);
      return extractAuthProfile(response);
    } catch (error) {
      if (error instanceof Error && (error as any).httpStatus === 404) return null;
      throw error;
    }
  },

  syncProfileAndCompletion: async (fallbackPhone?: string) => {
    const authProfile = await authService.getAuthProfile().catch(() => null);
    const profile =
      authProfile || (await pharmacyService.getMyProfile().catch(() => null));
    const existingUser = useAuthStore.getState().user;
    const mappedUser = mapPharmacyProfileToUser(profile);
    const isProfileComplete = hasCompletedPharmacyProfile(profile);

    if (mappedUser) {
      useAuthStore.getState().setUser({
        ...existingUser,
        ...mappedUser,
        phone:
          mappedUser.phone ||
          existingUser?.phone ||
          existingUser?.mobile ||
          fallbackPhone ||
          '',
        mobile:
          mappedUser.mobile ||
          existingUser?.mobile ||
          existingUser?.phone ||
          fallbackPhone ||
          '',
      });
    } else if (fallbackPhone && !existingUser?.phone && !existingUser?.mobile) {
      useAuthStore.getState().setUser({
        ...existingUser,
        phone: fallbackPhone,
        mobile: fallbackPhone,
      });
    }

    await useAuthStore.getState().setProfileComplete(isProfileComplete);
    return { profile, isProfileComplete };
  },

  logout: async (): Promise<void> => {
    await useAuthStore.getState().logout();
  },
};
