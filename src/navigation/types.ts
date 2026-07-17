export type RootStackParamList = {
  PharmacyHub:
    | {
        section?:
          | 'medicines'
          | 'inventory'
          | 'customers'
          | 'orders'
          | 'subscriptions'
          | 'wallet'
          | 'tracking'
          | 'diagnostics';
        lockedSection?: boolean;
      }
    | undefined;
  PharmacyMedicines:
    | {
        section?: 'medicines';
        lockedSection?: boolean;
      }
    | undefined;
  PharmacyMedicineCreate: undefined;
  PharmacyMedicineEdit: { medicineId: string };
  PharmacyCustomers: undefined;
  PharmacyInventory:
    | {
        section?: 'inventory';
        lockedSection?: boolean;
      }
    | undefined;
  PharmacyInventoryStock:
    | {
        lowStockOnly?: boolean;
      }
    | undefined;
  PharmacyInventoryImports: undefined;
  PharmacyInventoryAdjustments: undefined;
  PharmacyOrders:
    | {
        section?: 'orders';
        lockedSection?: boolean;
      }
    | undefined;
  PharmacyOrdersList: undefined;
  PharmacySubscriptions: undefined;

  PatientTracking: undefined;
  ManagePatientTracking: { customerId: string };
  ManagePharmacyCustomer: undefined;
  Diagnostics:
    | {
        section?: 'diagnostics';
        lockedSection?: boolean;
      }
    | undefined;
  DiagnosticsPackage: { packageId: string };
  DiagnosticsCreateBooking: { selectedPackageIds?: string[] } | undefined;
  DiagnosticsHistory: undefined;
  DiagnosticsBookingDetails: { bookingId: string };
  DiagnosticsPayment: { bookingId: string };
  DiagnosticsReschedule: { bookingId: string };
  MainTabs: undefined;
  Home: undefined;
  GlobalSearch: undefined;
  SelectLocation: undefined;
  NearbyMedicines: undefined;
  PharmaciesDirectory: undefined;
  PharmacyDetails: { pharmacyId: string; title?: string };
  PharmacyCart: undefined;
  TelehealthHistory: undefined;
  PathkindBooking: undefined;
  Appointments: undefined;
  AppointmentDetails: { appointmentId: string; appointment?: any; fromNotification?: boolean };
  Orders: undefined;
  HealthVault: undefined;
  Profile: undefined;
  Ambulance: undefined;
  Wallet:
    | {
        mode?: 'general' | 'pharmacy';
        title?: string;
      }
    | undefined;
  Settings: undefined;
  ReferEarn: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  MyMembers: undefined;
  FindDoctor: undefined;
  DoctorDetails: { doctorId: string };
  SelectMember: { doctorId: string };
  AddMember: { doctorId?: string; member?: any };
  TelehealthBooking: { doctorId: string };
  SlotSelection: {
    doctorId: string;
    member: {
      id: string;
      name: string;
      relation: string;
      gender: string;
      age?: string;
      contact: string;
      email: string;
      isMe?: boolean;
    };
    followUp?: {
      isFollowUp: boolean;
      parentConsultationId: string;
    };
  };
  BookingConfirmation: {
    doctorId: string;
    member: {
      id: string;
      name: string;
      relation: string;
      gender: string;
      age?: string;
      contact: string;
      email: string;
      isMe?: boolean;
    };
    dateLabel: string;
    timeLabel: string;
    slotId: string;
    rawDate: string;
    fee: number;
    concern?: string;
    documents?: {
      type: string;
      url: string;
      filename?: string;
    }[];
    mode?: string;
    followUp?: {
      isFollowUp: boolean;
      parentConsultationId: string;
    };
    bookingId?: string;
    bookingPrice?: number;
    payment?: {
      razorpayOrderId?: string;
      razorpayKeyId?: string;
      amount?: number;
      currency?: string;
      paymentTransactionId?: string;
    };
  };
  BookingSuccess: {
    doctorId: string;
    appointmentId: string;
    dateLabel: string;
    timeLabel: string;
    paymentPending?: boolean;
  };
  ConsultationRoom: {
    doctorId: string;
    appointmentId: string;
    dateLabel: string;
    timeLabel: string;
  };
  Pharmacy:
    | {
        section?:
          | 'medicines'
          | 'inventory'
          | 'customers'
          | 'orders'
          | 'subscriptions'
          | 'wallet'
          | 'tracking'
          | 'diagnostics';
        lockedSection?: boolean;
      }
    | undefined;
  ManagePharmacySubscription: { mode: 'CREATE' | 'UPDATE' | 'PAUSE'; subscriptionId?: string; subscription?: any };
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  OtpVerification: { phone: string };
  CompleteProfile: undefined;
};
