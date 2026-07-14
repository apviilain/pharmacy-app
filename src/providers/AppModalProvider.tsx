import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { scale, verticalScale } from '../theme/responsive';
import { typography } from '../theme/typography';

type ModalVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'confirmation'
  | 'sessionExpired'
  | 'permissionRequired'
  | 'internetLost'
  | 'serverError'
  | 'maintenance';

type ModalConfig = {
  variant: ModalVariant;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type AppModalContextValue = {
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
};

const AppModalContext = createContext<AppModalContextValue | null>(null);

export const AppModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const value = useMemo<AppModalContextValue>(
    () => ({
      showModal: nextConfig => setConfig(nextConfig),
      hideModal: () => setConfig(null),
    }),
    [],
  );

  const hide = () => setConfig(null);

  return (
    <AppModalContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(config)} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{config?.title}</Text>
            <Text style={styles.message}>{config?.message}</Text>
            <View style={styles.actions}>
              {config?.cancelText ? (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => {
                    config.onCancel?.();
                    hide();
                  }}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    {config.cancelText}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  config?.onConfirm?.();
                  hide();
                }}
              >
                <Text style={styles.buttonText}>
                  {config?.confirmText || 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppModalContext.Provider>
  );
};

export const useAppModal = () => {
  const context = useContext(AppModalContext);
  if (!context) {
    throw new Error('useAppModal must be used within AppModalProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(20),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: verticalScale(18),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: colors.primaryBlue,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    marginLeft: scale(12),
  },
  secondaryButton: {
    backgroundColor: '#EEF2F7',
  },
  buttonText: {
    color: '#fff',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  secondaryButtonText: {
    color: colors.textHeader,
  },
});
