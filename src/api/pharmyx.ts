export type PharmyxDayHours = {
  open?: string;
  close?: string;
  isClosed: boolean;
};

export type PharmyxOpeningHours = {
  monday?: PharmyxDayHours;
  tuesday?: PharmyxDayHours;
  wednesday?: PharmyxDayHours;
  thursday?: PharmyxDayHours;
  friday?: PharmyxDayHours;
  saturday?: PharmyxDayHours;
  sunday?: PharmyxDayHours;
};

export type SendOtpRequest = {
  phone: string;
};

export type VerifyOtpRequest = {
  phone: string;
  otp: string;
};

export type VerifyOtpResponse = {
  accessToken?: string;
  token?: string;
  jwt?: string;
  refreshToken?: string;
  pharmacy?: PharmyxPharmacyProfile | null;
  user?: PharmyxPharmacyProfile | null;
  isProfileComplete?: boolean;
  [key: string]: unknown;
};

export type PharmyxPharmacyProfile = {
  id?: string;
  _id?: string;
  name?: string;
  nickname?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gstNumber?: string;
  drugLicenseNumber?: string;
  gstCertificateUrl?: string;
  drugLicenseDocumentUrl?: string;
  ownerIdProofUrl?: string;
  shopFrontPhotoUrl?: string;
  openingHours?: PharmyxOpeningHours;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  profilePictureUrl?: string;
  profileImage?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type UpdateMyPharmacyProfileRequest = {
  name: string;
  nickname?: string;
  ownerName: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gstNumber?: string;
  drugLicenseNumber?: string;
  gstCertificateUrl?: string;
  drugLicenseDocumentUrl?: string;
  ownerIdProofUrl?: string;
  shopFrontPhotoUrl?: string;
  openingHours?: PharmyxOpeningHours;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  profilePictureUrl?: string;
};

export type ListPharmaciesParams = {
  search?: string;
  city?: string;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PharmyxMedicine = {
  id?: string;
  _id?: string;
  name?: string;
  brandName?: string;
  genericName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateMedicineRequest = {
  name: string;
  genericName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
};

export type UpdateMedicineRequest = {
  brandName?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
};

export type PharmyxCartItem = {
  id?: string;
  _id?: string;
  medicineId?: string;
  pharmacyId?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
  subtotal?: number;
  medicine?: PharmyxMedicine | null;
  name?: string;
  genericName?: string;
  manufacturer?: string;
  [key: string]: unknown;
};

export type PharmyxCart = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  items: PharmyxCartItem[];
  totalItems?: number;
  totalQuantity?: number;
  subtotal?: number;
  totalAmount?: number;
  grandTotal?: number;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type UpdatePharmacyCartItemRequest = {
  pharmacyId: string;
  medicineId: string;
  quantity: number;
};

export type MedicineAvailabilityParams = {
  medicineId: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
};

export type MedicineAvailabilityItem = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  medicineId?: string;
  pharmacyName?: string;
  name?: string;
  distanceKm?: number;
  distance?: number;
  availableQuantity?: number;
  quantity?: number;
  stock?: number;
  availableStock?: number;
  retailPrice?: number;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  pharmacy?: PharmyxPharmacyProfile | null;
  inventory?: {
    availableQuantity?: number;
    retailPrice?: number;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type PharmyxCustomer = {
  id?: string;
  _id?: string;
  name?: string;
  phone?: string;
  age?: number;
  diseaseNotes?: string;
  chronicCondition?: boolean;
  recurringMedicine?: boolean;
  recurringIntervalDays?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateCustomerRequest = {
  name: string;
  phone: string;
  age?: number;
  diseaseNotes?: string;
  chronicCondition?: boolean;
  recurringMedicine?: boolean;
  recurringIntervalDays?: number;
};

export type ListCustomersParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type PharmyxInventoryItem = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  medicineId?: string;
  medicine?: PharmyxMedicine | null;
  quantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  reorderThreshold?: number;
  rackLocation?: string;
  purchasePrice?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  batchNumber?: string;
  expiryDate?: string;
  isActive?: boolean;
  lowStock?: boolean;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type PharmyxInventoryAdjustment = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  medicineId?: string;
  inventoryId?: string;
  quantity?: number;
  reason?: string;
  notes?: string;
  type?: string;
  batchNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  medicine?: PharmyxMedicine | null;
  [key: string]: unknown;
};

export type CreateInventoryItemInput = {
  medicineId: string;
  quantity: number;
  reorderThreshold?: number;
  rackLocation?: string;
  purchasePrice?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  batchNumber?: string;
  expiryDate?: string;
  reason?: string;
  notes?: string;
};

export type CreateInventoryRequest = {
  items: CreateInventoryItemInput[];
};

export type ListInventoryParams = {
  pharmacyId?: string;
  medicineId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
};

export type InventoryActionItem = {
  medicineId: string;
  quantity: number;
};

export type InventoryActionRequest = {
  items: InventoryActionItem[];
  reason?: string;
  notes?: string;
};

export type PharmyxInventoryImport = {
  id?: string;
  _id?: string;
  importId?: string;
  status?: string;
  importMode?: string;
  fileName?: string;
  originalFileName?: string;
  createdAt?: string;
  updatedAt?: string;
  totalRows?: number;
  processedRows?: number;
  successRows?: number;
  failedRows?: number;
  summary?: Record<string, unknown>;
  preview?: Record<string, unknown>;
  rows?: Array<Record<string, unknown>>;
  errors?: Array<Record<string, unknown>>;
  warnings?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type InventoryImportMode = 'upsert' | 'insert';

export type InventoryImportPreviewInput = {
  uri: string;
  name: string;
  type?: string;
  importMode?: InventoryImportMode;
};

export type CommitInventoryImportRequest = {
  importId: string;
};

export type PharmyxOrderItem = {
  medicineId: string;
  medicineName?: string;
  orderedQty: number;
  discount?: number;
  recurring?: boolean;
  subscriptionIntervalDays?: number;
  subscriptionFrequency?: string;
  subscriptionNextRefillDate?: string;
  subscriptionReminderChannel?: string;
  [key: string]: unknown;
};

export type PharmyxOrder = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  customerId?: string;
  customer?: PharmyxCustomer | null;
  orderType?: string;
  status?: string;
  paymentStatus?: string;
  paymentMode?: string;
  deliveryMode?: string;
  deliveryAddress?: string;
  isWalkIn?: boolean;
  prescriptionUrls?: string[];
  notes?: string;
  linkedConsultationId?: string;
  linkedDiagnosticOrderId?: string;
  items?: PharmyxOrderItem[];
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreatePharmacyOrderRequest = {
  orderType: string;
  customerId: string;
  items: PharmyxOrderItem[];
  paymentMode: string;
  deliveryMode: string;
  deliveryAddress?: string;
  isWalkIn?: boolean;
  prescriptionUrls?: string[];
  notes?: string;
  linkedConsultationId?: string;
  linkedDiagnosticOrderId?: string;
};

export type UpdatePharmacyOrderRequest = {
  notes?: string;
  deliveryAddress?: string;
  paymentMode?: string;
  linkedConsultationId?: string;
  linkedDiagnosticOrderId?: string;
};

export type ListPharmacyOrdersParams = {
  pharmacyId?: string;
  customerId?: string;
  orderType?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
};

export type UpdatePharmacyOrderStatusRequest = {
  status: string;
  notes?: string;
};

export type CancelPharmacyOrderRequest = {
  notes?: string;
};

export type MarkPharmacyOrderPaidRequest = {
  paymentSource: string;
  paidDate: string;
  paidTime: string;
  notes?: string;
};

export type PharmyxOrderHealthCheck = {
  id?: string;
  _id?: string;
  orderId?: string;
  systolicBP?: number;
  diastolicBP?: number;
  fastingSugar?: number;
  postMealSugar?: number;
  hba1c?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateOrderHealthCheckRequest = {
  systolicBP?: number;
  diastolicBP?: number;
  fastingSugar?: number;
  postMealSugar?: number;
  hba1c?: number;
  notes?: string;
};

export type UpdateOrderHealthCheckRequest = CreateOrderHealthCheckRequest;

export type PharmyxSubscriptionItem = {
  medicineId: string;
  medicineName?: string;
  frequency?: string;
  intervalDays?: number;
  nextRefillDate?: string;
  reminderChannel?: string;
  [key: string]: unknown;
};

export type PharmyxSubscription = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  userId?: string;
  customerId?: string;
  status?: string;
  pausedUntil?: string;
  items?: PharmyxSubscriptionItem[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreatePharmacySubscriptionRequest = {
  userId: string;
  items: PharmyxSubscriptionItem[];
};

export type UpdatePharmacySubscriptionRequest = {
  intervalDays?: number;
  nextRefillDate?: string;
  reminderChannel?: string;
};

export type PausePharmacySubscriptionRequest = {
  pausedUntil: string;
};

export type ListPharmacySubscriptionsParams = {
  page?: number;
  limit?: number;
};

export type PharmyxWallet = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  balance?: number;
  availableBalance?: number;
  totalBalance?: number;
  currency?: string;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type PharmyxWalletTransaction = {
  id?: string;
  _id?: string;
  pharmacyId?: string;
  type?: string;
  amount?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ListWalletTransactionsParams = {
  page?: number;
  limit?: number;
};

export type WalletTopupRequest = {
  pharmacyId: string;
  amount: number;
  notes?: string;
};

export type PharmyxPatientTracking = {
  id?: string;
  _id?: string;
  userId?: string;
  customerId?: string;
  name?: string;
  phone?: string;
  diseaseNotes?: string;
  chronicCondition?: boolean;
  recurringMedicine?: boolean;
  recurringIntervalDays?: number;
  preferredFollowUpDate?: string;
  pharmacyNotes?: string;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type UpdatePatientTrackingRequest = {
  diseaseNotes?: string;
  chronicCondition?: boolean;
  recurringMedicine?: boolean;
  recurringIntervalDays?: number;
  preferredFollowUpDate?: string;
  pharmacyNotes?: string;
};

export type PharmyxTrackingSummary = {
  pharmacyId?: string;
  totalCustomers?: number;
  activeSubscriptions?: number;
  lowStockCount?: number;
  pendingOrders?: number;
  totalOrders?: number;
  totalRevenue?: number;
  [key: string]: unknown;
};

export type DiagnosticsBookingRequest = {
  integration: string;
  orderType: string;
  bookingDate: string;
  bookingTime: string;
  patientName: string;
  patientPhone: string;
  pincode: string;
  addressLine: string;
  paymentOption: string;
  testIds: string[];
  testNames: string[];
  useWalletBalance?: boolean;
};

export type DiagnosticsBooking = {
  id?: string;
  _id?: string;
  bookingId?: string;
  integration?: string;
  orderType?: string;
  bookingDate?: string;
  bookingTime?: string;
  patientName?: string;
  patientPhone?: string;
  pincode?: string;
  addressLine?: string;
  paymentOption?: string;
  paymentStatus?: string;
  status?: string;
  testIds?: string[];
  testNames?: string[];
  useWalletBalance?: boolean;
  paymentTransactionId?: string;
  amount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type DiagnosticsRetryPaymentRequest = {
  useWalletBalance: boolean;
  couponCode?: string;
};

export type DiagnosticsCancelRequest = {
  cancellationReason: string;
};

export type DiagnosticsRescheduleRequest = {
  bookingDate: string;
  bookingTime: string;
};

export type PaymentVerificationRequest = {
  paymentTransactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  module: string;
};

export const defaultOpeningHours: PharmyxOpeningHours = {
  monday: { open: '09:00', close: '21:00', isClosed: false },
  tuesday: { open: '09:00', close: '21:00', isClosed: false },
  wednesday: { open: '09:00', close: '21:00', isClosed: false },
  thursday: { open: '09:00', close: '21:00', isClosed: false },
  friday: { open: '09:00', close: '21:00', isClosed: false },
  saturday: { open: '10:00', close: '20:00', isClosed: false },
  sunday: { isClosed: true },
};

const toBoolean = (value: unknown): boolean =>
  value === true || value === 'true' || value === 1;

export const hasCompletedPharmacyProfile = (
  profile: PharmyxPharmacyProfile | null | undefined,
): boolean => {
  if (!profile) return false;
  return Boolean(profile.name?.trim() && profile.ownerName?.trim());
};

export const mapPharmacyProfileToUser = (
  profile: PharmyxPharmacyProfile | null | undefined,
) => {
  if (!profile) return null;

  return {
    ...profile,
    id: profile.id || profile._id,
    _id: profile._id || profile.id,
    name: profile.name || '',
    phone: profile.phone || '',
    mobile: profile.phone || '',
    email: profile.email || '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
    pincode: profile.pincode || '',
    latitude: profile.latitude,
    longitude: profile.longitude,
    profilePictureUrl:
      profile.profilePictureUrl || profile.profileImage || '',
    profileImage: profile.profileImage || profile.profilePictureUrl || '',
    ownerName: profile.ownerName || '',
    nickname: profile.nickname || '',
    gstNumber: profile.gstNumber || '',
    drugLicenseNumber: profile.drugLicenseNumber || '',
    gstCertificateUrl: profile.gstCertificateUrl || '',
    drugLicenseDocumentUrl: profile.drugLicenseDocumentUrl || '',
    ownerIdProofUrl: profile.ownerIdProofUrl || '',
    shopFrontPhotoUrl: profile.shopFrontPhotoUrl || '',
    openingHours: profile.openingHours || defaultOpeningHours,
    pickupAvailable: toBoolean(profile.pickupAvailable),
    deliveryAvailable: toBoolean(profile.deliveryAvailable),
    isVerified: toBoolean(profile.isVerified),
  };
};
