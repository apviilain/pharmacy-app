import ReactNativeBiometrics from 'react-native-biometrics';

export type BiometricAvailability = {
  available: boolean;
  biometryType: string | null;
  label: string;
  code?: string;
  reason?: string;
};

export type BiometricPromptResult = {
  success: boolean;
  code:
    | 'success'
    | 'cancelled'
    | 'not_available'
    | 'not_enrolled'
    | 'permission_denied'
    | 'lockout'
    | 'unknown_error';
  message: string;
};

const resolveBiometryLabel = (biometryType: string | null) => {
  switch (biometryType) {
    case 'TouchID':
      return 'Touch ID';
    case 'FaceID':
      return 'Face ID';
    case 'Biometrics':
      return 'Fingerprint / Face Unlock';
    default:
      return 'Biometric';
  }
};

const normalizeError = (error: unknown): BiometricPromptResult => {
  const message =
    error instanceof Error ? error.message : 'Biometric authentication failed';
  const normalized = message.toLowerCase();

  if (
    normalized.includes('cancel') ||
    normalized.includes('user fallback') ||
    normalized.includes('user canceled')
  ) {
    return {
      success: false,
      code: 'cancelled',
      message: 'Authentication was cancelled.',
    };
  }

  if (
    normalized.includes('locked') ||
    normalized.includes('too many attempts') ||
    normalized.includes('lockout')
  ) {
    return {
      success: false,
      code: 'lockout',
      message: 'Biometric authentication is temporarily locked.',
    };
  }

  if (
    normalized.includes('enrolled') ||
    normalized.includes('not setup') ||
    normalized.includes('not enrolled')
  ) {
    return {
      success: false,
      code: 'not_enrolled',
      message: 'No biometric credentials are enrolled on this device.',
    };
  }

  if (
    normalized.includes('permission') ||
    normalized.includes('denied') ||
    normalized.includes('not allowed')
  ) {
    return {
      success: false,
      code: 'permission_denied',
      message: 'Biometric permission is not available.',
    };
  }

  if (
    normalized.includes('sensor') ||
    normalized.includes('biometric') ||
    normalized.includes('face') ||
    normalized.includes('touch id')
  ) {
    return {
      success: false,
      code: 'not_available',
      message: 'Biometric authentication is not available on this device.',
    };
  }

  return {
    success: false,
    code: 'unknown_error',
    message,
  };
};

export const biometricAuth = {
  async getAvailability(): Promise<BiometricAvailability> {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const result = await rnBiometrics.isSensorAvailable();
      return {
        available: !!result.available,
        biometryType: result.biometryType || null,
        label: resolveBiometryLabel(result.biometryType || null),
        code: result.error,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      return {
        available: false,
        biometryType: null,
        label: 'Biometric',
        code: normalized.code,
        reason: normalized.message,
      };
    }
  },

  async prompt(promptMessage: string): Promise<BiometricPromptResult> {
    try {
      const availability = await this.getAvailability();
      if (!availability.available) {
        return {
          success: false,
          code: availability.code === 'not_enrolled' ? 'not_enrolled' : 'not_available',
          message:
            availability.reason ||
            'Biometric authentication is not available on this device.',
        };
      }

      const rnBiometrics = new ReactNativeBiometrics();
      const result = await rnBiometrics.simplePrompt({ promptMessage });
      if (result.success) {
        return {
          success: true,
          code: 'success',
          message: 'Authenticated successfully.',
        };
      }

      return {
        success: false,
        code: 'cancelled',
        message: 'Authentication was cancelled.',
      };
    } catch (error) {
      return normalizeError(error);
    }
  },
};
