import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSuccess'>;

export const BookingSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { paymentPending } = route.params;
  const [seconds, setSeconds] = React.useState(5);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Appointments' } }],
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={[styles.iconWrap, paymentPending && styles.iconWrapPending]}>
          <CheckCircle2
            size={scale(56)}
            color={paymentPending ? '#F59E0B' : colors.primaryGreen}
          />
        </View>
        <Text style={styles.title}>
          {paymentPending ? 'Booking Confirmed' : 'Booking Successful'}
        </Text>
        <Text style={styles.sub}>
          {paymentPending
            ? 'Your slot is secured. Please complete the payment from the Appointments section before your session starts.'
            : 'Your appointment has been booked successfully'}
        </Text>
        <Text style={[styles.countdown, paymentPending && { color: '#F59E0B' }]}>
          Redirecting in {seconds}s...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  iconWrap: {
    width: scale(92),
    height: scale(92),
    borderRadius: scale(46),
    backgroundColor: 'rgba(65,179,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: verticalScale(18),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xxl,
    color: colors.textHeader,
  },
  sub: {
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
  },
  countdown: { marginTop: verticalScale(16), fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.primaryGreen },
  iconWrapPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
});
