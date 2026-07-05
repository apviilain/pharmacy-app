import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PathkindWebView from '../components/PathkindWebView';

const PATHKIND_URL =
  'https://www.pathkindlabs.com/?utm_source=Atharv_Health_Care&utm_medium=iframe&utm_campaign=partner_booking';

const PathkindBookingScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <PathkindWebView url={PATHKIND_URL} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default PathkindBookingScreen;
