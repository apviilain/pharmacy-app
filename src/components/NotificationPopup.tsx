import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Bell, X, Video, CheckCircle2, Calendar } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import notifee from '@notifee/react-native';

import { useNotificationStore } from '../state/notificationStore';
import { navigationRef } from '../navigation/navigationRef';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

const { width } = Dimensions.get('window');

export const NotificationPopup = () => {
  const { currentNotification, isVisible, hideNotification } = useNotificationStore();
  const slideAnim = useRef(new Animated.Value(-200)).current;

  const isSuccess = currentNotification?.type === 'booking_success';

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: verticalScale(60),
        useNativeDriver: true,
        bounciness: 10,
        speed: 12,
      }).start();

      // Auto-hide after 15 seconds (give more time for choice)
      const timer = setTimeout(() => {
        closePopup();
      }, 15000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const closePopup = async () => {
    if (currentNotification?.id && !isSuccess) {
      try {
        await notifee.cancelNotification(currentNotification.id);
      } catch (e) {
        console.log('Error canceling notification:', e);
      }
    }
    hideNotification();
  };

  const handleAction = async () => {
    if (isSuccess) {
      if (navigationRef.isReady()) {
        (navigationRef as any).reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Appointments' } }],
        });
      }
    } else {
      if (currentNotification?.appointmentId && navigationRef.isReady()) {
        (navigationRef as any).navigate('ConsultationRoom', {
          appointmentId: currentNotification.appointmentId,
          doctorId: currentNotification.doctorId || '',
          dateLabel: currentNotification.dateLabel || 'Today',
          timeLabel: currentNotification.timeStr || 'N/A',
        });
      }
    }
    closePopup();
  };

  if (!isVisible && (slideAnim as any)._value === -200) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        isSuccess && { shadowColor: colors.primaryGreen },
      ]}
    >
      <LinearGradient
        colors={isSuccess ? ['#ffffff', '#f8fff8'] : ['#ffffff', '#f8fbff']}
        style={[styles.card, isSuccess && { borderColor: 'rgba(64,179,70,0.15)' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={isSuccess ? [colors.primaryGreen, '#2D8E32'] : [colors.primaryBlue, '#0D5A92']}
              style={styles.iconGradient}
            >
              {isSuccess ? (
                <CheckCircle2 size={scale(18)} color="#fff" />
              ) : (
                <Bell size={scale(18)} color="#fff" />
              )}
            </LinearGradient>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentNotification?.title || (isSuccess ? 'Booking Confirmed' : 'Appointment Reminder')}
            </Text>
            {currentNotification?.patientName ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Patient: </Text>
                <Text style={[styles.detailValue, isSuccess && { color: colors.primaryGreen }]}>
                  {currentNotification.patientName}
                </Text>
              </View>
            ) : null}
            <Text style={styles.body} numberOfLines={2}>
              {currentNotification?.body || (
                <>
                  {currentNotification?.concern}{' '}
                  {currentNotification?.timeStr ? `at ${currentNotification.timeStr}` : ''}
                </>
              )}
            </Text>
          </View>
          <TouchableOpacity onPress={closePopup} style={styles.closeBtn}>
            <X size={scale(18)} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={closePopup} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>{isSuccess ? 'Not Now' : 'Dismiss'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleAction} style={{ flex: 1 }}>
            <LinearGradient
              colors={isSuccess ? [colors.primaryGreen, '#2D8E32'] : [colors.primaryBlue, '#0D5A92']}
              style={styles.actionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSuccess ? (
                <Calendar size={scale(16)} color="#fff" style={{ marginRight: scale(6) }} />
              ) : (
                <Video size={scale(16)} color="#fff" style={{ marginRight: scale(6) }} />
              )}
              <Text style={styles.actionText}>
                {isSuccess ? 'View Appointments' : 'Join Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: width - scale(32),
    alignSelf: 'center',
    zIndex: 99999,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 12,
  },
  card: {
    borderRadius: scale(20),
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: scale(12),
  },
  iconGradient: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(2),
  },
  body: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm - 1,
    color: colors.textSecondary,
    lineHeight: verticalScale(16),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },
  detailLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  detailValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  closeBtn: {
    padding: scale(4),
  },
  footer: {
    flexDirection: 'row',
    marginTop: verticalScale(16),
    gap: scale(10),
  },
  dismissBtn: {
    flex: 0.4,
    height: verticalScale(40),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  dismissText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actionBtn: {
    height: verticalScale(40),
    borderRadius: scale(10),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: '#fff',
  },
});
