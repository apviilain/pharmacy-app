import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';

// Screens
import PathkindBookingScreen from '../screens/PathkindBookingScreen';
import { GlobalSearchScreen } from '../screens/main/GlobalSearchScreen';
import { AppointmentDetailsScreen } from '../screens/main/AppointmentDetailsScreen';
import { AmbulanceScreen } from '../screens/main/AmbulanceScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { WalletScreen } from '../screens/profile/WalletScreen';
import { ReferEarnScreen } from '../screens/profile/ReferEarnScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyMembersScreen } from '../screens/profile/MyMembersScreen';
import { FindDoctorScreen } from '../screens/telehealth/FindDoctorScreen';
import { DoctorDetailsScreen } from '../screens/telehealth/DoctorDetailsScreen';
import { SelectMemberScreen } from '../screens/telehealth/SelectMemberScreen';
import { AddMemberScreen } from '../screens/telehealth/AddMemberScreen';
import { SlotSelectionScreen } from '../screens/telehealth/SlotSelectionScreen';
import { BookingConfirmationScreen } from '../screens/telehealth/BookingConfirmationScreen';
import { BookingSuccessScreen } from '../screens/telehealth/BookingSuccessScreen';
import { ConsultationRoomScreen } from '../screens/telehealth/ConsultationRoomScreen';
import { PharmacyScreen } from '../screens/main/PharmacyScreen';
import {
  DiagnosticsBookingDetailsScreen,
  DiagnosticsCreateBookingScreen,
  DiagnosticsPaymentScreen,
  DiagnosticsRescheduleScreen,
  DiagnosticsScreen,
} from '../screens/diagnostics/DiagnosticsScreens';
import {
  PharmacyMedicineCreateScreen,
  PharmacyMedicineEditScreen,
} from '../screens/pharmacy/PharmacyMedicineFormScreen';
import { AppHeader } from '../components/AppHeader';

// Auth Flow Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { CompleteProfileScreen } from '../screens/auth/CompleteProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={({ navigation, route }) => {
          let title: string = route.name;
          switch (route.name) {
            case 'PharmacyHub': title = 'Pharmacy Hub'; break;
            case 'PharmacyMedicines': title = 'Pharmacy Medicines'; break;
            case 'PharmacyMedicineCreate': title = 'Add Medicine'; break;
            case 'PharmacyMedicineEdit': title = 'Edit Medicine'; break;
            case 'PharmacyCustomers': title = 'Pharmacy Customers'; break;
            case 'PharmacyInventory': title = 'Pharmacy Inventory'; break;
            case 'PharmacyOrders': title = 'Pharmacy Orders'; break;
            case 'PharmacySubscriptions': title = 'Pharmacy Subscriptions'; break;
            case 'PatientTracking': title = 'Patient Tracking'; break;
            case 'Diagnostics': title = 'Diagnostics'; break;
            case 'DiagnosticsCreateBooking': title = 'Create Booking'; break;
            case 'DiagnosticsBookingDetails': title = 'Booking Details'; break;
            case 'DiagnosticsPayment': title = 'Payment'; break;
            case 'DiagnosticsReschedule': title = 'Reschedule Booking'; break;
            case 'PathkindBooking': title = 'Book Test'; break;
            case 'Appointments': title = 'My Appointments'; break;
            case 'HealthVault': title = 'Health Vault'; break;
            case 'Profile': title = 'My Profile'; break;
            case 'GlobalSearch': title = 'Search'; break;
            case 'AppointmentDetails': title = 'Appointment Details'; break;
            case 'Ambulance': title = 'Ambulance Service'; break;
            case 'Wallet':
              title =
                (route.params as RootStackParamList['Wallet'])?.title ||
                'My Wallet';
              break;
            case 'Settings': title = 'Settings'; break;
            case 'ReferEarn': title = 'Refer & Earn'; break;
            case 'Notifications': title = 'Notifications'; break;
            case 'EditProfile': title = 'Edit Profile'; break;
            case 'MyMembers': title = 'My Members'; break;
            case 'FindDoctor': title = 'Find Doctor'; break;
            case 'DoctorDetails': title = 'Doctor Details'; break;
            case 'SelectMember': title = 'Select Patient'; break;
            case 'AddMember': title = 'Add Patient'; break;
            case 'SlotSelection': title = 'Select Slot'; break;
            case 'BookingConfirmation': title = 'Confirm Booking'; break;
            case 'BookingSuccess': title = 'Booking Successful'; break;
            case 'ConsultationRoom': title = 'Consultation'; break;
            case 'Pharmacy': title = 'Pharmacy'; break;
            case 'SignIn': title = 'Sign In'; break;
            case 'SignUp': title = 'Sign Up'; break;
            case 'OtpVerification': title = 'Verification'; break;
            case 'CompleteProfile': title = 'Complete Profile'; break;
            default: break;
          }

          const noHeaderScreens = [
            'Splash',
            'SignIn',
            'SignUp',
            'OtpVerification',
            'CompleteProfile',
            'MainTabs',
            'GlobalSearch',
            'BookingSuccess',
          ];
          const isHeaderShown = !noHeaderScreens.includes(route.name);

          return {
            headerShown: isHeaderShown,
            header: (props) => (
              <AppHeader
                title={title}
                showBack={navigation.canGoBack()}
                onBackPress={() => navigation.goBack()}
                backgroundColor="#fff"
                right={props.options.headerRight?.({})}
              />
            ),
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerShadowVisible: false,
          };
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />

        {/* Main App with Tabs */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        <Stack.Screen name="Ambulance" component={AmbulanceScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ReferEarn" component={ReferEarnScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MyMembers" component={MyMembersScreen} />
        <Stack.Screen name="PathkindBooking" component={PathkindBookingScreen} />
        <Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />

        {/* Telehealth Flow */}
        <Stack.Screen name="FindDoctor" component={FindDoctorScreen} />
        <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
        <Stack.Screen name="SelectMember" component={SelectMemberScreen} />
        <Stack.Screen name="AddMember" component={AddMemberScreen} />
        <Stack.Screen name="SlotSelection" component={SlotSelectionScreen} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
        <Stack.Screen
          name="ConsultationRoom"
          component={ConsultationRoomScreen}
          options={({ navigation: nav }) => ({
            headerRight: () => (
              <TouchableOpacity
                onPress={() => nav.goBack()}
                activeOpacity={0.7}
                style={{ paddingHorizontal: 8 }}
              >
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#E74C3C' }}>End</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="PharmacyHub" component={PharmacyScreen} />
        <Stack.Screen
          name="PharmacyMedicines"
          component={PharmacyScreen}
          initialParams={{ section: 'medicines', lockedSection: true }}
        />
        <Stack.Screen
          name="PharmacyMedicineCreate"
          component={PharmacyMedicineCreateScreen}
        />
        <Stack.Screen
          name="PharmacyMedicineEdit"
          component={PharmacyMedicineEditScreen}
        />
        <Stack.Screen
          name="PharmacyCustomers"
          component={PharmacyScreen}
          initialParams={{ section: 'customers', lockedSection: true }}
        />
        <Stack.Screen
          name="PharmacyInventory"
          component={PharmacyScreen}
          initialParams={{ section: 'inventory', lockedSection: true }}
        />
        <Stack.Screen
          name="PharmacyOrders"
          component={PharmacyScreen}
          initialParams={{ section: 'orders', lockedSection: true }}
        />
        <Stack.Screen
          name="PharmacySubscriptions"
          component={PharmacyScreen}
          initialParams={{ section: 'subscriptions', lockedSection: true }}
        />
        <Stack.Screen
          name="PatientTracking"
          component={PharmacyScreen}
          initialParams={{ section: 'tracking', lockedSection: true }}
        />
        <Stack.Screen
          name="Diagnostics"
          component={DiagnosticsScreen}
        />
        <Stack.Screen
          name="DiagnosticsCreateBooking"
          component={DiagnosticsCreateBookingScreen}
        />
        <Stack.Screen
          name="DiagnosticsBookingDetails"
          component={DiagnosticsBookingDetailsScreen}
        />
        <Stack.Screen
          name="DiagnosticsPayment"
          component={DiagnosticsPaymentScreen}
        />
        <Stack.Screen
          name="DiagnosticsReschedule"
          component={DiagnosticsRescheduleScreen}
        />
        <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
