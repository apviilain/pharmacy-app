import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
import { getEntityId, EmptyState } from './components/PharmacyShared';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { pharmacyCustomerService } from '../../api/pharmacyCustomerService';
import { colors } from '../../theme/colors';
import { moderateScale, scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

export function PatientTrackingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const customersQuery = useQuery({
    queryKey: ['pharmacyCustomers'],
    queryFn: () => pharmacyCustomerService.list(),
  });

  const customers = customersQuery.data || [];

  const handleCustomerPress = (id: string) => {
    navigation.navigate('ManagePatientTracking', { customerId: id });
  };

  const renderCustomerList = () => {
    if (customersQuery.isLoading) return <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />;
    if (!customers.length) return <EmptyState title="No Customers" subtitle="Add customers to start tracking." />;

    return (
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {customers.map((c) => {
          const id = getEntityId(c);
          return (
            <TouchableOpacity
              key={id}
              style={styles.customerListItem}
              onPress={() => handleCustomerPress(id)}
            >
              <View style={styles.customerListInfo}>
                <Text style={styles.customerName}>
                  {c.name || (c as any).user?.name || (c as any).customer?.name || 'Unnamed customer'}
                </Text>
              </View>
              <ChevronRight size={scale(20)} color={colors.textLight} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header matching screenshot if needed, but AppNavigator might already provide it. We'll add a section title. */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Customers</Text>
      </View>
      
      <View style={styles.mainArea}>
        {renderCustomerList()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(18),
    color: colors.textHeader,
  },
  mainArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    flex: 1,
  },
  customerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customerListInfo: {
    flex: 1,
  },
  customerName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(16),
    color: colors.textHeader,
  },
  loader: {
    marginTop: verticalScale(32),
  },
});
