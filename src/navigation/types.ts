export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  GlobalSearch: undefined;
  PathkindBooking: undefined;
  Appointments: undefined;
  AppointmentDetails: { appointmentId: string; appointment?: any; fromNotification?: boolean };
  Orders: undefined;
  HealthVault: undefined;
  Profile: undefined;
  Ambulance: undefined;
  Wallet: undefined;
  Settings: undefined;
  ReferEarn: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  MyMembers: undefined;
  FindDoctor: undefined;
  DoctorDetails: { doctorId: string };
  SelectMember: { doctorId: string };
  AddMember: { doctorId?: string; member?: any };
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
    // New: Pre-created booking data from SlotSelection
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
  Pharmacy: undefined;
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  OtpVerification: { phone: string };
  CompleteProfile: undefined;
  MpinSetup: { fromSettings?: boolean } | undefined;
  MpinUnlock: undefined;
};
