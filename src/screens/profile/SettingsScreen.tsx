import React, { useEffect } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View, Platform, PermissionsAndroid, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { useSettingsStore } from '../../state/settingsStore';
import { RootStackParamList } from '../../navigation/types';

const APP_VERSION = require('../../../package.json').version;

type SettingsNav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const Row = ({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    onPress={onPress}
    style={styles.row}
    disabled={!onPress}
  >
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
    </View>
    {right ?? <ChevronRight size={scale(18)} color={colors.textLight} />}
  </TouchableOpacity>
);

export const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNav>();
  const insets = useSafeAreaInsets();
  const { 
    pushEnabled, 
    twoFactorEnabled, 
    togglePush, 
    toggleTwoFactor,
    bootstrapSettings
  } = useSettingsStore();

  useEffect(() => {
    bootstrapSettings();
  }, [bootstrapSettings]);

  const handlePushToggle = async (newValue: boolean) => {
    if (newValue) {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Toast.show({
              type: 'info',
              text1: 'Permission Required',
              text2: 'Please enable notifications in system settings.',
              onPress: () => Linking.openSettings(),
            });
            return;
          } else {
            Toast.show({
              type: 'success',
              text1: 'Enabled',
              text2: 'Push notifications are now active.',
            });
          }
        } catch (err) {
          console.warn(err);
        }
      } else if (Platform.OS === 'ios') {
        Toast.show({
          type: 'info',
          text1: 'System Permission',
          text2: 'Ensure notifications are enabled in iOS settings.',
        });
      } else {
        // Android < 13
        Toast.show({
          type: 'success',
          text1: 'Enabled',
          text2: 'Push notifications are now active.',
        });
      }
    }
    togglePush(newValue);
  };

  const handleHelpSupport = async () => {
    const phone = '917857955595';
    const message = 'Hello Pharmacy App team, I need help with the app.';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
    const fallbackUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    try {
      const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);
      await Linking.openURL(canOpenWhatsapp ? whatsappUrl : fallbackUrl);
    } catch (err) {
      console.error('Failed to open WhatsApp support:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to open WhatsApp support right now.',
      });
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <Row
          title="Push Notifications"
          subtitle="Appointments, orders, reports"
          right={<Switch value={pushEnabled} onValueChange={handlePushToggle} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <Row
          title="Two-Factor Auth"
          subtitle="OTP on every login"
          right={<Switch value={twoFactorEnabled} onValueChange={toggleTwoFactor} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <Row 
          title="Privacy Policy" 
          onPress={() => {
            Linking.openURL('https://www.atharvhealthcare.com/privacy-policy').catch(err => {
              console.error('Failed to open Privacy Policy:', err);
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open Privacy Policy' });
            });
          }}
        />
        <Row 
          title="Terms of Service" 
          onPress={() => {
            Linking.openURL('https://www.atharvhealthcare.com/privacy-policy').catch(err => {
              console.error('Failed to open Terms of Service:', err);
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open Terms of Service' });
            });
          }}
        />
        <Row 
          title="Help & Support" 
          subtitle="Chat on WhatsApp"
          onPress={handleHelpSupport}
        />
      </View>

      <Text style={[styles.version, { marginBottom: insets.bottom + verticalScale(14) }]}>
        {`Pharmacy App v${APP_VERSION}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: scale(16), paddingTop: verticalScale(14) },
  sectionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: verticalScale(10),
  },
  row: {
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowContent: {
    flex: 1,
    paddingRight: scale(12),
  },
  rowTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md, color: colors.textHeader },
  rowSub: { marginTop: verticalScale(2), fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textLight },
  version: {
    marginTop: 'auto',
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
});
