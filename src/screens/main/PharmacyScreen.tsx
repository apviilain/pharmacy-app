import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from '@react-native-documents/picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileUp,
  Minus,
  Pause,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react-native';

import { ApiError } from '../../api/errorHandler';
import { pharmacyCustomerService } from '../../api/pharmacyCustomerService';
import { pharmacyInventoryImportService } from '../../api/pharmacyInventoryImportService';
import { pharmacyInventoryService } from '../../api/pharmacyInventoryService';
import { pharmacyCartService } from '../../api/pharmacyCartService';
import { pharmacyMedicineService } from '../../api/pharmacyMedicineService';
import { pharmacyOrderService } from '../../api/pharmacyOrderService';
import { pharmacySubscriptionService } from '../../api/pharmacySubscriptionService';
import { pharmacyTrackingService } from '../../api/pharmacyTrackingService';
import { pharmacyWalletService } from '../../api/pharmacyWalletService';
import { patientTrackingService } from '../../api/patientTrackingService';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type {
  CancelPharmacyOrderRequest,
  CreateOrderHealthCheckRequest,
  CreateInventoryRequest,
  CreatePharmacyOrderRequest,
  CreatePharmacySubscriptionRequest,
  CreateCustomerRequest,
  CreateMedicineRequest,
  CommitInventoryImportRequest,
  DiagnosticsBookingRequest,
  DiagnosticsCancelRequest,
  DiagnosticsRescheduleRequest,
  DiagnosticsRetryPaymentRequest,
  InventoryImportMode,
  InventoryImportPreviewInput,
  MarkPharmacyOrderPaidRequest,
  PaymentVerificationRequest,
  PharmyxCustomer,
  PharmyxInventoryImport,
  PharmyxInventoryAdjustment,
  PharmyxInventoryItem,
  PharmyxMedicine,
  PharmyxOrder,
  InventoryActionRequest,
  PausePharmacySubscriptionRequest,
  UpdatePatientTrackingRequest,
  UpdatePharmacyCartItemRequest,
  UpdatePharmacyOrderRequest,
  UpdatePharmacyOrderStatusRequest,
  UpdatePharmacySubscriptionRequest,
  UpdateOrderHealthCheckRequest,
  UpdateMedicineRequest,
  WalletTopupRequest,
} from '../../api/pharmyx';
import { useAuthStore } from '../../state/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { moderateScale, scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { parseJwt } from '../../utils/jwt';
import type { RootStackParamList } from '../../navigation/types';
import {
  locationService,
  type DeviceCoordinates,
  type LocationAccessState,
} from '../../services/locationService';
type PharmacySection =
  | 'medicines'
  | 'inventory'
  | 'customers'
  | 'orders'
  | 'subscriptions'
  | 'wallet'
  | 'tracking'
  | 'diagnostics';

type PharmacyScreenRouteParams = {
  section?: PharmacySection;
  lockedSection?: boolean;
};
type MedicineShelfTab = 'all' | 'tablets' | 'syrups' | 'wellness' | 'devices';
type MedicineBrowseTab = 'all' | 'otc' | 'rx' | 'top';
type MedicineFormMode = 'create' | 'edit';
type InventoryActionMode = 'reserve' | 'release';
type OrderActionMode = 'update' | 'status' | 'cancel' | 'markPaid';
type SubscriptionActionMode = 'update' | 'pause' | 'delete';
type HealthCheckMode = 'create' | 'edit';
type DiagnosticsActionMode = 'retry' | 'cancel' | 'reschedule';

type MedicineCreateForm = {
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  prescriptionRequired: boolean;
};

type MedicineEditForm = {
  brandName: string;
  manufacturer: string;
  prescriptionRequired: boolean;
};

type CustomerForm = {
  name: string;
  phone: string;
  age: string;
  diseaseNotes: string;
  chronicCondition: boolean;
  recurringMedicine: boolean;
  recurringIntervalDays: string;
};

type InventoryCreateForm = {
  medicineId: string;
  quantity: string;
  reorderThreshold: string;
  rackLocation: string;
  purchasePrice: string;
  retailPrice: string;
  wholesalePrice: string;
  batchNumber: string;
  expiryDate: string;
  reason: string;
  notes: string;
};

type InventoryActionForm = {
  medicineId: string;
  quantity: string;
  reason: string;
  notes: string;
};

type InventoryImportFile = {
  uri: string;
  name: string;
  type?: string;
};

type OrderCreateForm = {
  orderType: string;
  customerId: string;
  medicineId: string;
  medicineName: string;
  orderedQty: string;
  discount: string;
  recurring: boolean;
  subscriptionIntervalDays: string;
  subscriptionFrequency: string;
  subscriptionNextRefillDate: string;
  subscriptionReminderChannel: string;
  paymentMode: string;
  deliveryMode: string;
  deliveryAddress: string;
  isWalkIn: boolean;
  prescriptionUrls: string;
  notes: string;
  linkedConsultationId: string;
  linkedDiagnosticOrderId: string;
};

type OrderActionForm = {
  notes: string;
  deliveryAddress: string;
  paymentMode: string;
  linkedConsultationId: string;
  linkedDiagnosticOrderId: string;
  status: string;
  paymentSource: string;
  paidDate: string;
  paidTime: string;
};

type HealthCheckForm = {
  systolicBP: string;
  diastolicBP: string;
  fastingSugar: string;
  postMealSugar: string;
  hba1c: string;
  notes: string;
};

type SubscriptionCreateForm = {
  userId: string;
  medicineId: string;
  medicineName: string;
  frequency: string;
  intervalDays: string;
  nextRefillDate: string;
  reminderChannel: string;
};

type SubscriptionActionForm = {
  intervalDays: string;
  nextRefillDate: string;
  reminderChannel: string;
  pausedUntil: string;
};

type WalletTopupForm = {
  amount: string;
  notes: string;
};

type PatientTrackingForm = {
  diseaseNotes: string;
  chronicCondition: boolean;
  recurringMedicine: boolean;
  recurringIntervalDays: string;
  preferredFollowUpDate: string;
  pharmacyNotes: string;
};

type DiagnosticsCreateForm = {
  integration: string;
  orderType: string;
  bookingDate: string;
  bookingTime: string;
  patientName: string;
  patientPhone: string;
  pincode: string;
  addressLine: string;
  paymentOption: string;
  testIds: string;
  testNames: string;
  useWalletBalance: boolean;
};

type DiagnosticsActionForm = {
  useWalletBalance: boolean;
  couponCode: string;
  cancellationReason: string;
  bookingDate: string;
  bookingTime: string;
};

type PaymentVerificationForm = {
  paymentTransactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  module: string;
};

const DEFAULT_MEDICINE_CREATE_FORM: MedicineCreateForm = {
  name: '',
  genericName: '',
  category: '',
  dosageForm: 'tablet',
  strength: '',
  manufacturer: '',
  prescriptionRequired: false,
};

const DEFAULT_MEDICINE_EDIT_FORM: MedicineEditForm = {
  brandName: '',
  manufacturer: '',
  prescriptionRequired: false,
};

const DEFAULT_CUSTOMER_FORM: CustomerForm = {
  name: '',
  phone: '',
  age: '',
  diseaseNotes: '',
  chronicCondition: false,
  recurringMedicine: false,
  recurringIntervalDays: '',
};

const DEFAULT_INVENTORY_CREATE_FORM: InventoryCreateForm = {
  medicineId: '',
  quantity: '',
  reorderThreshold: '',
  rackLocation: '',
  purchasePrice: '',
  retailPrice: '',
  wholesalePrice: '',
  batchNumber: '',
  expiryDate: '',
  reason: 'purchase',
  notes: '',
};

const DEFAULT_INVENTORY_ACTION_FORM: InventoryActionForm = {
  medicineId: '',
  quantity: '',
  reason: '',
  notes: '',
};

const DEFAULT_ORDER_CREATE_FORM: OrderCreateForm = {
  orderType: 'online',
  customerId: '',
  medicineId: '',
  medicineName: '',
  orderedQty: '',
  discount: '',
  recurring: false,
  subscriptionIntervalDays: '',
  subscriptionFrequency: '',
  subscriptionNextRefillDate: '',
  subscriptionReminderChannel: 'both',
  paymentMode: 'online_payment',
  deliveryMode: 'delivery',
  deliveryAddress: '',
  isWalkIn: false,
  prescriptionUrls: '',
  notes: '',
  linkedConsultationId: '',
  linkedDiagnosticOrderId: '',
};

const DEFAULT_ORDER_ACTION_FORM: OrderActionForm = {
  notes: '',
  deliveryAddress: '',
  paymentMode: 'cash_on_delivery',
  linkedConsultationId: '',
  linkedDiagnosticOrderId: '',
  status: 'accepted',
  paymentSource: 'counter_cash',
  paidDate: '',
  paidTime: '',
};

const DEFAULT_HEALTH_CHECK_FORM: HealthCheckForm = {
  systolicBP: '',
  diastolicBP: '',
  fastingSugar: '',
  postMealSugar: '',
  hba1c: '',
  notes: '',
};

const DEFAULT_SUBSCRIPTION_CREATE_FORM: SubscriptionCreateForm = {
  userId: '',
  medicineId: '',
  medicineName: '',
  frequency: '',
  intervalDays: '',
  nextRefillDate: '',
  reminderChannel: 'both',
};

const DEFAULT_SUBSCRIPTION_ACTION_FORM: SubscriptionActionForm = {
  intervalDays: '',
  nextRefillDate: '',
  reminderChannel: 'both',
  pausedUntil: '',
};

const DEFAULT_WALLET_TOPUP_FORM: WalletTopupForm = {
  amount: '',
  notes: '',
};

const DEFAULT_PATIENT_TRACKING_FORM: PatientTrackingForm = {
  diseaseNotes: '',
  chronicCondition: false,
  recurringMedicine: false,
  recurringIntervalDays: '',
  preferredFollowUpDate: '',
  pharmacyNotes: '',
};

const DEFAULT_DIAGNOSTICS_CREATE_FORM: DiagnosticsCreateForm = {
  integration: 'labstack',
  orderType: 'diagnostics',
  bookingDate: '',
  bookingTime: '',
  patientName: '',
  patientPhone: '',
  pincode: '',
  addressLine: '',
  paymentOption: 'prepaid',
  testIds: '',
  testNames: '',
  useWalletBalance: false,
};

const DEFAULT_DIAGNOSTICS_ACTION_FORM: DiagnosticsActionForm = {
  useWalletBalance: false,
  couponCode: '',
  cancellationReason: 'Cancelled by pharmacy',
  bookingDate: '',
  bookingTime: '',
};

const DEFAULT_PAYMENT_VERIFICATION_FORM: PaymentVerificationForm = {
  paymentTransactionId: '',
  razorpayOrderId: '',
  razorpayPaymentId: '',
  razorpaySignature: '',
  module: 'external-bookings',
};

const getEntityId = (entity: { id?: string; _id?: string }) =>
  entity.id || entity._id || '';

const getMedicineRefId = (
  medicine:
    | string
    | { id?: string; _id?: string; name?: string; genericName?: string }
    | null
    | undefined
) => {
  if (!medicine) return '';
  if (typeof medicine === 'string') return medicine;
  return medicine.id || medicine._id || '';
};

const getMedicineRefLabel = (
  medicine:
    | string
    | { id?: string; _id?: string; name?: string; brandName?: string; genericName?: string }
    | null
    | undefined,
  fallback = 'Inventory item'
) => {
  if (!medicine) return fallback;
  if (typeof medicine === 'string') return medicine;
  return medicine.name || medicine.brandName || medicine.genericName || fallback;
};

const getInventoryItemKey = (item: PharmyxInventoryItem, index: number) =>
  getEntityId(item) ||
  [
    getMedicineRefId(item.medicineId as any) ||
      item.medicine?.id ||
      item.medicine?._id ||
      'medicine',
    item.batchNumber || 'batch',
    item.rackLocation || 'rack',
    index,
  ].join('-');

const getInventoryAdjustmentKey = (
  item: PharmyxInventoryAdjustment,
  index: number
) =>
  getEntityId(item) ||
  [
    getMedicineRefId(item.medicineId as any) ||
      item.medicine?.id ||
      item.medicine?._id ||
      'medicine',
    item.type || 'adjustment',
    item.createdAt || 'created-at',
    index,
  ].join('-');

const getInventoryImportKey = (item: PharmyxInventoryImport, index: number) =>
  getEntityId(item) ||
  [
    item.fileName || item.originalFileName || 'inventory-import',
    item.createdAt || 'created-at',
    item.importMode || 'mode',
    index,
  ].join('-');

const getDiagnosticsBookingId = (
  entity: { id?: string; _id?: string; bookingId?: string } | null | undefined
) => entity?.bookingId || entity?.id || entity?._id || '';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.userMessage) {
    return error.userMessage;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const formatTimestamp = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toCompactDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const toCompactTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const countTrue = (items: boolean[]) => items.filter(Boolean).length;

const normalizeState = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase();

const SectionToggle = ({
  active,
  label,
  onPress,
  icon,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={[styles.sectionToggle, active && styles.sectionToggleActive]}
  >
    <View style={styles.sectionToggleIcon}>{icon}</View>
    <Text
      numberOfLines={1}
      style={[
        styles.sectionToggleText,
        active && styles.sectionToggleTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const StatCard = ({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: accent }]}>
      {icon}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ModuleShowcaseHeader = ({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <View style={styles.moduleShowcaseHeader}>
    <View style={styles.moduleShowcaseCopy}>
      <Text style={styles.moduleShowcaseEyebrow}>{eyebrow}</Text>
      <Text style={styles.moduleShowcaseTitle}>{title}</Text>
      <Text style={styles.moduleShowcaseSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.moduleShowcaseIconWrap}>{icon}</View>
  </View>
);

const InlineError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <View style={styles.inlineError}>
    <CircleAlert size={scale(18)} color="#B3261E" />
    <View style={styles.inlineErrorContent}>
      <Text style={styles.inlineErrorTitle}>Something went wrong</Text>
      <Text style={styles.inlineErrorText}>{message}</Text>
    </View>
    {onRetry ? (
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={styles.retryPill}
      >
        <RefreshCw size={scale(14)} color={colors.primaryBlue} />
        <Text style={styles.retryPillText}>Retry</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const EmptyState = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateIcon}>
      <Search size={scale(20)} color={colors.primaryBlue} />
    </View>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
  </View>
);

const LabeledField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  multiline?: boolean;
  error?: string;
}) => (
  <View style={styles.formField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        styles.textInput,
        multiline && styles.textArea,
        error && styles.textInputError,
      ]}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

const ToggleRow = ({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleTextWrap}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleHint}>{hint}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#D8DEE8', true: '#A7D3F2' }}
      thumbColor={value ? colors.primaryBlue : '#FFFFFF'}
    />
  </View>
);

export function PharmacyScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const route = useRoute<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const jwtPayload = parseJwt(accessToken);
  const pharmacyId = String(
    authUser?.pharmacyId || jwtPayload?.pharmacyId || authUser?._id || ''
  );

  const isTablet = width >= 768;
  const isWideLayout = width >= 1024;
  const contentWidth = Math.min(width - scale(24), isWideLayout ? 1180 : 960);
  const routeParams = (route.params || {}) as PharmacyScreenRouteParams;
  const lockedSection = !!routeParams.lockedSection;

  const [activeSection, setActiveSection] =
    useState<PharmacySection>('medicines');
  const [medicineSearchInput, setMedicineSearchInput] = useState('');
  const [medicineShelfTab, setMedicineShelfTab] =
    useState<MedicineShelfTab>('all');
  const [medicineBrowseTab, setMedicineBrowseTab] =
    useState<MedicineBrowseTab>('all');
  const [debouncedMedicineSearch, setDebouncedMedicineSearch] = useState('');
  const [medicinePage, setMedicinePage] = useState(1);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [medicineLocation, setMedicineLocation] =
    useState<DeviceCoordinates | null>(null);
  const [medicineLocationStatus, setMedicineLocationStatus] =
    useState<LocationAccessState>('idle');
  const [medicineLocationMessage, setMedicineLocationMessage] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');

  const [medicineModalVisible, setMedicineModalVisible] = useState(false);
  const [medicineFormMode, setMedicineFormMode] =
    useState<MedicineFormMode>('create');
  const [medicineCreateForm, setMedicineCreateForm] = useState(
    DEFAULT_MEDICINE_CREATE_FORM
  );
  const [medicineEditForm, setMedicineEditForm] = useState(
    DEFAULT_MEDICINE_EDIT_FORM
  );
  const [medicineErrors, setMedicineErrors] = useState<Record<string, string>>(
    {}
  );

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerForm, setCustomerForm] = useState(DEFAULT_CUSTOMER_FORM);
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>(
    {}
  );
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [inventoryCreateForm, setInventoryCreateForm] = useState(
    DEFAULT_INVENTORY_CREATE_FORM
  );
  const [inventoryErrors, setInventoryErrors] = useState<
    Record<string, string>
  >({});
  const [inventoryActionModalVisible, setInventoryActionModalVisible] =
    useState(false);
  const [inventoryActionMode, setInventoryActionMode] =
    useState<InventoryActionMode>('reserve');
  const [inventoryActionForm, setInventoryActionForm] = useState(
    DEFAULT_INVENTORY_ACTION_FORM
  );
  const [inventoryActionErrors, setInventoryActionErrors] = useState<
    Record<string, string>
  >({});
  const [inventoryImportFile, setInventoryImportFile] =
    useState<InventoryImportFile | null>(null);
  const [inventoryImportMode, setInventoryImportMode] =
    useState<InventoryImportMode>('upsert');
  const [inventoryImportPage, setInventoryImportPage] = useState(1);
  const [selectedInventoryImportId, setSelectedInventoryImportId] =
    useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState('placed');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('pending');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderCreateForm, setOrderCreateForm] = useState(
    DEFAULT_ORDER_CREATE_FORM
  );
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [orderActionModalVisible, setOrderActionModalVisible] = useState(false);
  const [orderActionMode, setOrderActionMode] =
    useState<OrderActionMode>('update');
  const [orderActionForm, setOrderActionForm] = useState(
    DEFAULT_ORDER_ACTION_FORM
  );
  const [orderActionErrors, setOrderActionErrors] = useState<
    Record<string, string>
  >({});
  const [healthCheckModalVisible, setHealthCheckModalVisible] = useState(false);
  const [healthCheckMode, setHealthCheckMode] =
    useState<HealthCheckMode>('create');
  const [healthCheckForm, setHealthCheckForm] = useState(
    DEFAULT_HEALTH_CHECK_FORM
  );
  const [healthCheckErrors, setHealthCheckErrors] = useState<
    Record<string, string>
  >({});
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('');
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subscriptionCreateForm, setSubscriptionCreateForm] = useState(
    DEFAULT_SUBSCRIPTION_CREATE_FORM
  );
  const [subscriptionErrors, setSubscriptionErrors] = useState<
    Record<string, string>
  >({});
  const [subscriptionActionModalVisible, setSubscriptionActionModalVisible] =
    useState(false);
  const [subscriptionActionMode, setSubscriptionActionMode] =
    useState<SubscriptionActionMode>('update');
  const [subscriptionActionForm, setSubscriptionActionForm] = useState(
    DEFAULT_SUBSCRIPTION_ACTION_FORM
  );
  const [subscriptionActionErrors, setSubscriptionActionErrors] = useState<
    Record<string, string>
  >({});
  const [walletTransactionPage, setWalletTransactionPage] = useState(1);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [walletTopupForm, setWalletTopupForm] = useState(
    DEFAULT_WALLET_TOPUP_FORM
  );
  const [walletErrors, setWalletErrors] = useState<Record<string, string>>({});
  const [selectedTrackingCustomerId, setSelectedTrackingCustomerId] =
    useState('');
  const [patientTrackingModalVisible, setPatientTrackingModalVisible] =
    useState(false);
  const [patientTrackingForm, setPatientTrackingForm] = useState(
    DEFAULT_PATIENT_TRACKING_FORM
  );
  const [patientTrackingErrors, setPatientTrackingErrors] = useState<
    Record<string, string>
  >({});
  const [selectedDiagnosticsBookingId, setSelectedDiagnosticsBookingId] =
    useState('');
  const [diagnosticsBookingSnapshot, setDiagnosticsBookingSnapshot] =
    useState<Record<string, unknown> | null>(null);
  const [diagnosticsModalVisible, setDiagnosticsModalVisible] = useState(false);
  const [diagnosticsCreateForm, setDiagnosticsCreateForm] = useState(
    DEFAULT_DIAGNOSTICS_CREATE_FORM
  );
  const [diagnosticsErrors, setDiagnosticsErrors] = useState<
    Record<string, string>
  >({});
  const [diagnosticsActionModalVisible, setDiagnosticsActionModalVisible] =
    useState(false);
  const [diagnosticsActionMode, setDiagnosticsActionMode] =
    useState<DiagnosticsActionMode>('retry');
  const [diagnosticsActionForm, setDiagnosticsActionForm] = useState(
    DEFAULT_DIAGNOSTICS_ACTION_FORM
  );
  const [diagnosticsActionErrors, setDiagnosticsActionErrors] = useState<
    Record<string, string>
  >({});
  const [paymentVerificationModalVisible, setPaymentVerificationModalVisible] =
    useState(false);
  const [paymentVerificationForm, setPaymentVerificationForm] = useState(
    DEFAULT_PAYMENT_VERIFICATION_FORM
  );
  const [paymentVerificationErrors, setPaymentVerificationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const section = routeParams.section;
    if (section) {
      setActiveSection(section);
    }
  }, [routeParams.section]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextValue = medicineSearchInput.trim();
      setDebouncedMedicineSearch(nextValue);
      setMedicinePage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [medicineSearchInput]);

  const medicinesQuery = useQuery({
    queryKey: ['pharmacyMedicines', debouncedMedicineSearch, medicinePage],
    queryFn: () =>
      pharmacyMedicineService.list({
        search: debouncedMedicineSearch || undefined,
        page: medicinePage,
        limit: 20,
      }),
  });

  const medicines = medicinesQuery.data || [];
  const medicineStats = useMemo(
    () => ({
      total: medicines.length,
      otc: medicines.filter((item) => !item.prescriptionRequired).length,
      rx: medicines.filter((item) => !!item.prescriptionRequired).length,
      categories: Array.from(
        new Set(
          medicines
            .map((item) => String(item.category || '').trim())
            .filter(Boolean)
        )
      ).length,
    }),
    [medicines]
  );
  const shelfFilteredMedicines = useMemo(() => {
    if (medicineShelfTab === 'all') {
      return medicines;
    }

    return medicines.filter((item) => {
      const dosageForm = String(item.dosageForm || '').toLowerCase();
      const category = String(item.category || '').toLowerCase();
      const manufacturer = String(item.manufacturer || '').toLowerCase();

      if (medicineShelfTab === 'tablets') {
        return (
          dosageForm.includes('tablet') ||
          dosageForm.includes('capsule') ||
          category.includes('tablet')
        );
      }

      if (medicineShelfTab === 'syrups') {
        return (
          dosageForm.includes('syrup') ||
          dosageForm.includes('liquid') ||
          dosageForm.includes('suspension')
        );
      }

      if (medicineShelfTab === 'wellness') {
        return (
          category.includes('vitamin') ||
          category.includes('wellness') ||
          category.includes('supplement')
        );
      }

      if (medicineShelfTab === 'devices') {
        return (
          category.includes('device') ||
          category.includes('equipment') ||
          manufacturer.includes('device')
        );
      }

      return true;
    });
  }, [medicineShelfTab, medicines]);
  const filteredMedicines = useMemo(() => {
    if (medicineBrowseTab === 'otc') {
      return shelfFilteredMedicines.filter((item) => !item.prescriptionRequired);
    }

    if (medicineBrowseTab === 'rx') {
      return shelfFilteredMedicines.filter((item) => !!item.prescriptionRequired);
    }

    if (medicineBrowseTab === 'top') {
      return [...shelfFilteredMedicines].sort((left, right) => {
        const leftScore = Number(!!left.prescriptionRequired) * 2;
        const rightScore = Number(!!right.prescriptionRequired) * 2;
        return rightScore - leftScore;
      });
    }

    return shelfFilteredMedicines;
  }, [medicineBrowseTab, shelfFilteredMedicines]);
  const medicineShelfTabs = useMemo(
    () => [
      { key: 'all' as const, label: 'All' },
      { key: 'tablets' as const, label: 'Tablets' },
      { key: 'syrups' as const, label: 'Syrups' },
      { key: 'wellness' as const, label: 'Wellness' },
      { key: 'devices' as const, label: 'Devices' },
    ],
    []
  );
  const medicineBrowseTabs = useMemo(
    () => [
      { key: 'all' as const, label: 'All Items', count: shelfFilteredMedicines.length },
      { key: 'top' as const, label: 'Top Picks', count: shelfFilteredMedicines.length },
      {
        key: 'otc' as const,
        label: 'OTC',
        count: shelfFilteredMedicines.filter((item) => !item.prescriptionRequired)
          .length,
      },
      {
        key: 'rx' as const,
        label: 'Prescription',
        count: shelfFilteredMedicines.filter((item) => !!item.prescriptionRequired)
          .length,
      },
    ],
    [shelfFilteredMedicines]
  );
  const featuredMedicine = filteredMedicines[0] || medicines[0] || null;

  useEffect(() => {
    if (!filteredMedicines.length) {
      setSelectedMedicineId('');
      return;
    }

    const selectedStillVisible = filteredMedicines.some(
      (item) => getEntityId(item) === selectedMedicineId
    );

    if (!selectedMedicineId || !selectedStillVisible) {
      setSelectedMedicineId(getEntityId(filteredMedicines[0]));
    }
  }, [filteredMedicines, selectedMedicineId]);

  const selectedMedicineSummary = medicines.find(
    (item) => getEntityId(item) === selectedMedicineId
  );

  const requestMedicineLocation = async () => {
    setMedicineLocationStatus('loading');
    setMedicineLocationMessage('');

    const result = await locationService.requestCurrentLocation();

    if (result.status === 'granted' && result.coords) {
      setMedicineLocation(result.coords);
      setMedicineLocationStatus('granted');
      setMedicineLocationMessage('');
      return;
    }

    setMedicineLocation(null);
    setMedicineLocationStatus(result.status);
    setMedicineLocationMessage(
      result.message ||
        'Location access is required to check nearby medicine availability.'
    );
  };

  useEffect(() => {
    if (activeSection === 'medicines' && medicineLocationStatus === 'idle') {
      requestMedicineLocation().catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to request location permission.';
        setMedicineLocation(null);
        setMedicineLocationStatus('unavailable');
        setMedicineLocationMessage(message);
      });
    }
  }, [activeSection, medicineLocationStatus]);

  const medicineDetailQuery = useQuery({
    queryKey: ['pharmacyMedicineDetail', selectedMedicineId],
    queryFn: () => pharmacyMedicineService.getById(selectedMedicineId),
    enabled: !!selectedMedicineId,
  });

  const selectedMedicine =
    medicineDetailQuery.data || selectedMedicineSummary || null;

  const pharmacyCartQuery = useQuery({
    queryKey: ['pharmacyCart'],
    queryFn: () => pharmacyCartService.getCart(),
  });

  const pharmacyCart = pharmacyCartQuery.data || null;
  const cartItems = pharmacyCart?.items || [];
  const selectedMedicineCartItem =
    cartItems.find(
      (item) =>
        String(
          item.medicineId || item.medicine?._id || item.medicine?.id || ''
        ) === String(selectedMedicineId || '')
    ) || null;
  const selectedMedicineCartQuantity =
    Number(selectedMedicineCartItem?.quantity || 0) || 0;
  const cartTotalItems = Number(
    pharmacyCart?.totalItems ?? pharmacyCart?.totalQuantity ?? cartItems.length
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PharmacyCart')}
          style={styles.headerCartButton}
        >
          <ShoppingCart size={scale(20)} color={colors.primaryBlue} />
          {cartTotalItems > 0 ? (
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>
                {cartTotalItems > 99 ? '99+' : cartTotalItems}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ),
    });
  }, [cartTotalItems, navigation]);

  const medicineAvailabilityQuery = useQuery({
    queryKey: [
      'medicineAvailability',
      selectedMedicineId,
      medicineLocation?.latitude,
      medicineLocation?.longitude,
    ],
    queryFn: () =>
      pharmacyMedicineService.getAvailability({
        medicineId: selectedMedicineId,
        latitude: medicineLocation?.latitude || 0,
        longitude: medicineLocation?.longitude || 0,
        radiusKm: 5,
        page: 1,
        limit: 20,
      }),
    enabled:
      activeSection === 'medicines' &&
      !!selectedMedicineId &&
      !!medicineLocation &&
      medicineLocationStatus === 'granted',
  });

  const inventoryListQuery = useQuery({
    queryKey: [
      'pharmacyInventory',
      pharmacyId,
      inventoryPage,
      inventoryLowStockOnly,
    ],
    queryFn: () =>
      inventoryLowStockOnly
        ? pharmacyInventoryService.lowStock({
            pharmacyId: pharmacyId || undefined,
            page: inventoryPage,
            limit: 20,
          })
        : pharmacyInventoryService.list({
            pharmacyId: pharmacyId || undefined,
            medicineId: selectedMedicineId || undefined,
            isActive: true,
            lowStock: false,
            page: inventoryPage,
            limit: 20,
          }),
  });

  const inventoryItems = inventoryListQuery.data || [];

  useEffect(() => {
    if (!inventoryItems.length) {
      setSelectedInventoryId('');
      return;
    }

    const selectedStillVisible = inventoryItems.some(
      (item) => getEntityId(item) === selectedInventoryId
    );

    if (!selectedInventoryId || !selectedStillVisible) {
      setSelectedInventoryId(getEntityId(inventoryItems[0]));
    }
  }, [inventoryItems, selectedInventoryId]);

  const selectedInventorySummary = inventoryItems.find(
    (item) => getEntityId(item) === selectedInventoryId
  );

  const inventoryDetailQuery = useQuery({
    queryKey: ['pharmacyInventoryDetail', selectedInventoryId],
    queryFn: () => pharmacyInventoryService.getById(selectedInventoryId),
    enabled: !!selectedInventoryId,
  });

  const selectedInventory =
    inventoryDetailQuery.data || selectedInventorySummary || null;

  const inventoryAdjustmentsQuery = useQuery({
    queryKey: ['pharmacyInventoryAdjustments', pharmacyId],
    queryFn: () =>
      pharmacyInventoryService.adjustments({
        pharmacyId: pharmacyId || undefined,
        page: 1,
        limit: 10,
      }),
  });

  const inventoryAdjustments = inventoryAdjustmentsQuery.data || [];

  const inventoryImportsQuery = useQuery({
    queryKey: ['pharmacyInventoryImports', inventoryImportPage],
    queryFn: () =>
      pharmacyInventoryImportService.list({
        page: inventoryImportPage,
        limit: 20,
      }),
  });

  const inventoryImports = inventoryImportsQuery.data || [];

  useEffect(() => {
    if (!inventoryImports.length) {
      setSelectedInventoryImportId('');
      return;
    }

    const selectedStillVisible = inventoryImports.some(
      (item) => getEntityId(item) === selectedInventoryImportId
    );

    if (!selectedInventoryImportId || !selectedStillVisible) {
      setSelectedInventoryImportId(getEntityId(inventoryImports[0]));
    }
  }, [inventoryImports, selectedInventoryImportId]);

  const selectedInventoryImportSummary = inventoryImports.find(
    (item) => getEntityId(item) === selectedInventoryImportId
  );

  const inventoryImportDetailQuery = useQuery({
    queryKey: ['pharmacyInventoryImportDetail', selectedInventoryImportId],
    queryFn: () =>
      pharmacyInventoryImportService.getById(selectedInventoryImportId),
    enabled: !!selectedInventoryImportId,
  });

  const selectedInventoryImport =
    inventoryImportDetailQuery.data || selectedInventoryImportSummary || null;

  const ordersQuery = useQuery({
    queryKey: [
      'pharmacyOrders',
      pharmacyId,
      orderStatusFilter,
      orderPaymentFilter,
      orderPage,
    ],
    queryFn: () =>
      pharmacyOrderService.list({
        pharmacyId: pharmacyId || undefined,
        orderType: 'online',
        status: orderStatusFilter || undefined,
        paymentStatus: orderPaymentFilter || undefined,
        page: orderPage,
        limit: 20,
      }),
  });

  const orders = ordersQuery.data || [];

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId('');
      return;
    }

    const selectedStillVisible = orders.some(
      (item) => getEntityId(item) === selectedOrderId
    );

    if (!selectedOrderId || !selectedStillVisible) {
      setSelectedOrderId(getEntityId(orders[0]));
    }
  }, [orders, selectedOrderId]);

  const selectedOrderSummary = orders.find(
    (item) => getEntityId(item) === selectedOrderId
  );

  const orderDetailQuery = useQuery({
    queryKey: ['pharmacyOrderDetail', selectedOrderId],
    queryFn: () => pharmacyOrderService.getById(selectedOrderId),
    enabled: !!selectedOrderId,
  });

  const selectedOrder = orderDetailQuery.data || selectedOrderSummary || null;

  const orderHealthCheckQuery = useQuery({
    queryKey: ['pharmacyOrderHealthCheck', selectedOrderId],
    queryFn: () => pharmacyOrderService.getHealthCheck(selectedOrderId),
    enabled: !!selectedOrderId,
  });

  const orderHealthCheck = orderHealthCheckQuery.data || null;

  const subscriptionsQuery = useQuery({
    queryKey: ['pharmacySubscriptions', subscriptionPage],
    queryFn: () =>
      pharmacySubscriptionService.list({
        page: subscriptionPage,
        limit: 20,
      }),
  });

  const subscriptions = subscriptionsQuery.data || [];

  useEffect(() => {
    if (!subscriptions.length) {
      setSelectedSubscriptionId('');
      return;
    }

    const selectedStillVisible = subscriptions.some(
      (item) => getEntityId(item) === selectedSubscriptionId
    );

    if (!selectedSubscriptionId || !selectedStillVisible) {
      setSelectedSubscriptionId(getEntityId(subscriptions[0]));
    }
  }, [subscriptions, selectedSubscriptionId]);

  const selectedSubscription =
    subscriptions.find(
      (item) => getEntityId(item) === selectedSubscriptionId
    ) || null;

  const walletSummaryQuery = useQuery({
    queryKey: ['pharmacyWallet'],
    queryFn: () => pharmacyWalletService.getSummary(),
  });

  const walletSummary = walletSummaryQuery.data || null;

  const walletTransactionsQuery = useQuery({
    queryKey: ['pharmacyWalletTransactions', walletTransactionPage],
    queryFn: () =>
      pharmacyWalletService.getTransactions({
        page: walletTransactionPage,
        limit: 20,
      }),
  });

  const walletTransactions = walletTransactionsQuery.data || [];

  const customersQuery = useQuery({
    queryKey: ['pharmacyCustomers'],
    queryFn: () => pharmacyCustomerService.list(),
  });

  const customers = customersQuery.data || [];

  const filteredCustomers = useMemo(() => {
    const term = customerSearchInput.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.diseaseNotes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [customerSearchInput, customers]);

  useEffect(() => {
    if (!customers.length) {
      setSelectedTrackingCustomerId('');
      return;
    }

    const selectedStillVisible = customers.some(
      (item) => getEntityId(item) === selectedTrackingCustomerId
    );

    if (!selectedTrackingCustomerId || !selectedStillVisible) {
      setSelectedTrackingCustomerId(getEntityId(customers[0]));
    }
  }, [customers, selectedTrackingCustomerId]);

  const selectedTrackingCustomer =
    customers.find(
      (item) => getEntityId(item) === selectedTrackingCustomerId
    ) || null;

  const patientTrackingQuery = useQuery({
    queryKey: ['patientTracking', selectedTrackingCustomerId],
    queryFn: () => patientTrackingService.getById(selectedTrackingCustomerId),
    enabled: !!selectedTrackingCustomerId,
  });

  const patientTracking =
    patientTrackingQuery.data || selectedTrackingCustomer || null;

  const pharmacyTrackingSummaryQuery = useQuery({
    queryKey: ['pharmacyTrackingSummary'],
    queryFn: () => pharmacyTrackingService.getSummary(),
  });

  const pharmacyTrackingByIdQuery = useQuery({
    queryKey: ['pharmacyTrackingSummaryById', pharmacyId],
    queryFn: () => pharmacyTrackingService.getByPharmacyId(pharmacyId),
    enabled: !!pharmacyId,
  });

  const pharmacyTrackingSummary =
    pharmacyTrackingByIdQuery.data || pharmacyTrackingSummaryQuery.data || null;

  const diagnosticsPaymentDetailsQuery = useQuery({
    queryKey: ['diagnosticsPaymentDetails', selectedDiagnosticsBookingId],
    queryFn: () =>
      diagnosticsBookingService.getPaymentDetails(selectedDiagnosticsBookingId),
    enabled: !!selectedDiagnosticsBookingId,
  });

  const diagnosticsPaymentDetails =
    diagnosticsPaymentDetailsQuery.data || diagnosticsBookingSnapshot || null;

  const createMedicineMutation = useMutation({
    mutationFn: (payload: CreateMedicineRequest) =>
      pharmacyMedicineService.create(payload),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyMedicines'] });
      setMedicineModalVisible(false);
      setMedicineCreateForm(DEFAULT_MEDICINE_CREATE_FORM);
      setMedicineErrors({});
      setSelectedMedicineId(getEntityId(created));
      Toast.show({
        type: 'success',
        text1: 'Medicine added',
        text2: 'The medicine has been saved successfully.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to add medicine',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: (payload: UpdatePharmacyCartItemRequest) =>
      pharmacyCartService.updateItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyCart'] });
      Toast.show({
        type: 'success',
        text1: 'Cart updated',
        text2: 'Medicine quantity has been updated in the cart.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update cart',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: (medicineId: string) =>
      pharmacyCartService.removeItem(medicineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyCart'] });
      Toast.show({
        type: 'success',
        text1: 'Item removed',
        text2: 'Medicine has been removed from the cart.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to remove item',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateSelectedMedicineCart = (quantity: number) => {
    if (!selectedMedicineId || !pharmacyId) {
      Toast.show({
        type: 'error',
        text1: 'Unable to update cart',
        text2: 'Pharmacy or medicine details are missing.',
      });
      return;
    }

    updateCartItemMutation.mutate({
      pharmacyId,
      medicineId: selectedMedicineId,
      quantity,
    });
  };

  const updateMedicineMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMedicineRequest;
    }) => pharmacyMedicineService.update(id, payload),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyMedicines'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyMedicineDetail', getEntityId(updated)],
        }),
      ]);
      setMedicineModalVisible(false);
      setMedicineErrors({});
      Toast.show({
        type: 'success',
        text1: 'Medicine updated',
        text2: 'The latest changes are now visible.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update medicine',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: CreateCustomerRequest) =>
      pharmacyCustomerService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyCustomers'] });
      setCustomerModalVisible(false);
      setCustomerForm(DEFAULT_CUSTOMER_FORM);
      setCustomerErrors({});
      Toast.show({
        type: 'success',
        text1: 'Customer added',
        text2: 'Customer details have been saved successfully.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to add customer',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: (payload: CreateInventoryRequest) =>
      pharmacyInventoryService.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyInventory'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyInventoryAdjustments'],
        }),
      ]);
      setInventoryModalVisible(false);
      setInventoryCreateForm(DEFAULT_INVENTORY_CREATE_FORM);
      setInventoryErrors({});
      Toast.show({
        type: 'success',
        text1: 'Inventory updated',
        text2: 'Stock has been added successfully.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to add stock',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const reserveInventoryMutation = useMutation({
    mutationFn: (payload: InventoryActionRequest) =>
      pharmacyInventoryService.reserve(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyInventory'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyInventoryAdjustments'],
        }),
      ]);
      setInventoryActionModalVisible(false);
      setInventoryActionForm(DEFAULT_INVENTORY_ACTION_FORM);
      setInventoryActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Stock reserved',
        text2: 'Selected inventory has been reserved.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to reserve stock',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const releaseInventoryMutation = useMutation({
    mutationFn: (payload: InventoryActionRequest) =>
      pharmacyInventoryService.release(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyInventory'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyInventoryAdjustments'],
        }),
      ]);
      setInventoryActionModalVisible(false);
      setInventoryActionForm(DEFAULT_INVENTORY_ACTION_FORM);
      setInventoryActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Stock released',
        text2: 'Reserved stock has been released.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to release stock',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const inventoryImportPreviewMutation = useMutation({
    mutationFn: (payload: InventoryImportPreviewInput) =>
      pharmacyInventoryImportService.preview(payload),
    onSuccess: async (preview) => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacyInventoryImports'],
      });
      const importId = getEntityId(preview);
      if (importId) {
        setSelectedInventoryImportId(importId);
      }
      Toast.show({
        type: 'success',
        text1: 'Import preview ready',
        text2: 'Review the preview before committing inventory changes.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Preview failed',
        text2: getErrorMessage(error, 'Unable to preview the selected file.'),
      });
    },
  });

  const inventoryImportCommitMutation = useMutation({
    mutationFn: (payload: CommitInventoryImportRequest) =>
      pharmacyInventoryImportService.commit(payload),
    onSuccess: async (committed) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyInventory'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyInventoryAdjustments'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyInventoryImports'],
        }),
      ]);
      const importId = getEntityId(committed);
      if (importId) {
        setSelectedInventoryImportId(importId);
      }
      Toast.show({
        type: 'success',
        text1: 'Import committed',
        text2: 'Inventory import has been applied successfully.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Commit failed',
        text2: getErrorMessage(
          error,
          'Unable to commit this inventory import.'
        ),
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreatePharmacyOrderRequest) =>
      pharmacyOrderService.create(payload),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] });
      setOrderModalVisible(false);
      setOrderCreateForm(DEFAULT_ORDER_CREATE_FORM);
      setOrderErrors({});
      setSelectedOrderId(getEntityId(created));
      Toast.show({
        type: 'success',
        text1: 'Order created',
        text2: 'Pharmacy order has been saved successfully.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to create order',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePharmacyOrderRequest;
    }) => pharmacyOrderService.update(id, payload),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyOrderDetail', getEntityId(updated)],
        }),
      ]);
      setOrderActionModalVisible(false);
      setOrderActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Order updated',
        text2: 'Order details have been updated.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update order',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePharmacyOrderStatusRequest;
    }) => pharmacyOrderService.updateStatus(id, payload),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyOrderDetail', getEntityId(updated)],
        }),
      ]);
      setOrderActionModalVisible(false);
      setOrderActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Status updated',
        text2: 'Order status has been updated.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update status',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelPharmacyOrderRequest;
    }) => pharmacyOrderService.cancel(id, payload),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyOrderDetail', getEntityId(updated)],
        }),
      ]);
      setOrderActionModalVisible(false);
      setOrderActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Order cancelled',
        text2: 'The pharmacy order has been cancelled.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to cancel order',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const markPaidOrderMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: MarkPharmacyOrderPaidRequest;
    }) => pharmacyOrderService.markPaid(id, payload),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyOrderDetail', getEntityId(updated)],
        }),
      ]);
      setOrderActionModalVisible(false);
      setOrderActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Payment marked',
        text2: 'Order payment has been marked as collected.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to mark payment',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const createOrderHealthCheckMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateOrderHealthCheckRequest;
    }) => pharmacyOrderService.createHealthCheck(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacyOrderHealthCheck', selectedOrderId],
      });
      setHealthCheckModalVisible(false);
      setHealthCheckErrors({});
      Toast.show({
        type: 'success',
        text1: 'Health check saved',
        text2: 'Order health check values have been recorded.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to save health check',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateOrderHealthCheckMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateOrderHealthCheckRequest;
    }) => pharmacyOrderService.updateHealthCheck(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacyOrderHealthCheck', selectedOrderId],
      });
      setHealthCheckModalVisible(false);
      setHealthCheckErrors({});
      Toast.show({
        type: 'success',
        text1: 'Health check updated',
        text2: 'The latest reading is now visible on the order.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update health check',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (payload: CreatePharmacySubscriptionRequest) =>
      pharmacySubscriptionService.create(payload),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacySubscriptions'],
      });
      setSubscriptionModalVisible(false);
      setSubscriptionCreateForm(DEFAULT_SUBSCRIPTION_CREATE_FORM);
      setSubscriptionErrors({});
      setSelectedSubscriptionId(getEntityId(created));
      Toast.show({
        type: 'success',
        text1: 'Subscription created',
        text2: 'Recurring refill plan has been saved.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to create subscription',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePharmacySubscriptionRequest;
    }) => pharmacySubscriptionService.update(id, payload),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacySubscriptions'],
      });
      setSubscriptionActionModalVisible(false);
      setSubscriptionActionErrors({});
      setSelectedSubscriptionId(getEntityId(updated) || selectedSubscriptionId);
      Toast.show({
        type: 'success',
        text1: 'Subscription updated',
        text2: 'Refill interval and reminders have been updated.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update subscription',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const pauseSubscriptionMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PausePharmacySubscriptionRequest;
    }) => pharmacySubscriptionService.pause(id, payload),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacySubscriptions'],
      });
      setSubscriptionActionModalVisible(false);
      setSubscriptionActionErrors({});
      setSelectedSubscriptionId(getEntityId(updated) || selectedSubscriptionId);
      Toast.show({
        type: 'success',
        text1: 'Subscription paused',
        text2: 'The refill plan has been paused successfully.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to pause subscription',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => pharmacySubscriptionService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pharmacySubscriptions'],
      });
      setSubscriptionActionModalVisible(false);
      setSubscriptionActionErrors({});
      Toast.show({
        type: 'success',
        text1: 'Subscription deleted',
        text2: 'The recurring refill plan has been removed.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to delete subscription',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const walletTopupMutation = useMutation({
    mutationFn: (payload: WalletTopupRequest) =>
      pharmacyWalletService.topup(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyWallet'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyWalletTransactions'],
        }),
      ]);
      setWalletModalVisible(false);
      setWalletTopupForm(DEFAULT_WALLET_TOPUP_FORM);
      setWalletErrors({});
      Toast.show({
        type: 'success',
        text1: 'Wallet topped up',
        text2: 'Pharmacy wallet balance has been refreshed.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to top up wallet',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updatePatientTrackingMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePatientTrackingRequest;
    }) => patientTrackingService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['patientTracking', selectedTrackingCustomerId],
      });
      setPatientTrackingModalVisible(false);
      setPatientTrackingErrors({});
      Toast.show({
        type: 'success',
        text1: 'Patient tracking updated',
        text2: 'Follow-up notes and refill tracking are now updated.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to update patient tracking',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const createDiagnosticsBookingMutation = useMutation({
    mutationFn: (payload: DiagnosticsBookingRequest) =>
      diagnosticsBookingService.create(payload),
    onSuccess: (created) => {
      const bookingId = getDiagnosticsBookingId(created);
      setDiagnosticsModalVisible(false);
      setDiagnosticsCreateForm(DEFAULT_DIAGNOSTICS_CREATE_FORM);
      setDiagnosticsErrors({});
      setDiagnosticsBookingSnapshot(created as Record<string, unknown>);
      if (bookingId) {
        setSelectedDiagnosticsBookingId(bookingId);
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsPaymentDetails', bookingId],
        });
      }
      Toast.show({
        type: 'success',
        text1: 'Diagnostics booking created',
        text2: 'Payment flow is ready for this diagnostics booking.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to create diagnostics booking',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const retryDiagnosticsPaymentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: DiagnosticsRetryPaymentRequest;
    }) => diagnosticsBookingService.retryPayment(id, payload),
    onSuccess: (updated) => {
      const bookingId =
        getDiagnosticsBookingId(updated) || selectedDiagnosticsBookingId;
      setDiagnosticsActionModalVisible(false);
      setDiagnosticsActionErrors({});
      setDiagnosticsBookingSnapshot(updated as Record<string, unknown>);
      if (bookingId) {
        setSelectedDiagnosticsBookingId(bookingId);
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsPaymentDetails', bookingId],
        });
      }
      Toast.show({
        type: 'success',
        text1: 'Payment retried',
        text2: 'Diagnostics payment retry has been triggered.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to retry payment',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const cancelDiagnosticsBookingMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: DiagnosticsCancelRequest;
    }) => diagnosticsBookingService.cancel(id, payload),
    onSuccess: (updated) => {
      const bookingId =
        getDiagnosticsBookingId(updated) || selectedDiagnosticsBookingId;
      setDiagnosticsActionModalVisible(false);
      setDiagnosticsActionErrors({});
      setDiagnosticsBookingSnapshot(updated as Record<string, unknown>);
      if (bookingId) {
        setSelectedDiagnosticsBookingId(bookingId);
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsPaymentDetails', bookingId],
        });
      }
      Toast.show({
        type: 'success',
        text1: 'Diagnostics booking cancelled',
        text2: 'The diagnostics booking has been cancelled.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to cancel diagnostics booking',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const rescheduleDiagnosticsBookingMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: DiagnosticsRescheduleRequest;
    }) => diagnosticsBookingService.reschedule(id, payload),
    onSuccess: (updated) => {
      const bookingId =
        getDiagnosticsBookingId(updated) || selectedDiagnosticsBookingId;
      setDiagnosticsActionModalVisible(false);
      setDiagnosticsActionErrors({});
      setDiagnosticsBookingSnapshot(updated as Record<string, unknown>);
      if (bookingId) {
        setSelectedDiagnosticsBookingId(bookingId);
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsPaymentDetails', bookingId],
        });
      }
      Toast.show({
        type: 'success',
        text1: 'Diagnostics booking rescheduled',
        text2: 'The diagnostics booking date and time have been updated.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to reschedule diagnostics booking',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const verifyDiagnosticsPaymentMutation = useMutation({
    mutationFn: (payload: PaymentVerificationRequest) =>
      diagnosticsBookingService.verifyPayment(payload),
    onSuccess: (verified) => {
      setPaymentVerificationModalVisible(false);
      setPaymentVerificationErrors({});
      setDiagnosticsBookingSnapshot((current) => ({
        ...(current || {}),
        verification: verified,
      }));
      if (selectedDiagnosticsBookingId) {
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsPaymentDetails', selectedDiagnosticsBookingId],
        });
      }
      Toast.show({
        type: 'success',
        text1: 'Payment verified',
        text2: 'Diagnostics payment verification completed.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to verify payment',
        text2: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const seedWorkspaceMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const seedKey = String(now.getTime()).slice(-6);
      const refillDate = toCompactDate(addDays(now, 30));
      const bookingDate = toCompactDate(addDays(now, 1));
      const paidTime = toCompactTime(now);
      const followUpDate = toCompactDate(addDays(now, 14));

      const medicine = await pharmacyMedicineService.create({
        name: `Demo Medicine ${seedKey}`,
        genericName: 'Paracetamol',
        category: 'Pain Relief',
        dosageForm: 'tablet',
        strength: '650 mg',
        manufacturer: 'Codex Pharma',
        prescriptionRequired: false,
      });

      const medicineId = getEntityId(medicine);
      if (!medicineId) {
        throw new Error('Medicine ID missing in create response.');
      }

      const customer = await pharmacyCustomerService.create({
        name: `Demo Customer ${seedKey}`,
        phone: `9${String(seedKey).padStart(9, '0').slice(0, 9)}`,
        age: 34,
        diseaseNotes: 'API-seeded customer for pharmacy workspace testing.',
        chronicCondition: true,
        recurringMedicine: true,
        recurringIntervalDays: 30,
      });

      const customerId = getEntityId(customer);
      if (!customerId) {
        throw new Error('Customer ID missing in create response.');
      }

      let trackingRecordId = customerId;
      try {
        const tracking = await patientTrackingService.update(customerId, {
          diseaseNotes: 'Follow-up required for seeded workspace patient.',
          chronicCondition: true,
          recurringMedicine: true,
          recurringIntervalDays: 30,
          preferredFollowUpDate: followUpDate,
          pharmacyNotes: 'Auto-created from workspace seed action.',
        });
        trackingRecordId = getEntityId(tracking || {}) || customerId;
      } catch (error) {
        trackingRecordId = customerId;
      }

      const inventoryItems = await pharmacyInventoryService.create({
        items: [
          {
            medicineId,
            quantity: 48,
            reorderThreshold: 8,
            rackLocation: 'A-12',
            purchasePrice: 48,
            retailPrice: 72,
            wholesalePrice: 64,
            batchNumber: `BATCH-${seedKey}`,
            expiryDate: toCompactDate(addDays(now, 365)),
            reason: 'Workspace API seed',
            notes:
              'Initial inventory created for testing the pharmacy workspace.',
          },
        ],
      });

      const inventoryId = getEntityId(inventoryItems[0] || {});

      const order = await pharmacyOrderService.create({
        orderType: 'online',
        customerId,
        items: [
          {
            medicineId,
            medicineName: String(
              medicine.name || medicine.brandName || 'Demo Medicine'
            ),
            orderedQty: 2,
            discount: 0,
            recurring: true,
            subscriptionIntervalDays: 30,
            subscriptionFrequency: 'Daily after dinner',
            subscriptionNextRefillDate: refillDate,
            subscriptionReminderChannel: 'both',
          },
        ],
        paymentMode: 'cash_on_delivery',
        deliveryMode: 'delivery',
        deliveryAddress: '221B Demo Street, Ahmedabad',
        isWalkIn: false,
        prescriptionUrls: [],
        notes: 'Workspace API-seeded order.',
      });

      const orderId = getEntityId(order);
      if (!orderId) {
        throw new Error('Order ID missing in create response.');
      }

      await pharmacyOrderService.createHealthCheck(orderId, {
        systolicBP: 122,
        diastolicBP: 82,
        fastingSugar: 96,
        postMealSugar: 132,
        hba1c: 5.8,
        notes: 'Demo health check added by workspace seed action.',
      });

      const subscription = await pharmacySubscriptionService.create({
        userId: customerId,
        items: [
          {
            medicineId,
            medicineName: String(
              medicine.name || medicine.brandName || 'Demo Medicine'
            ),
            frequency: 'Daily after dinner',
            intervalDays: 30,
            nextRefillDate: refillDate,
            reminderChannel: 'both',
          },
        ],
      });

      const subscriptionId = getEntityId(subscription);

      if (!pharmacyId) {
        throw new Error('Pharmacy ID unavailable for wallet top-up.');
      }

      await pharmacyWalletService.topup({
        pharmacyId,
        amount: 750,
        notes: 'Workspace API-seeded wallet top-up.',
      });

      const diagnostics = await diagnosticsBookingService.create({
        integration: 'labstack',
        orderType: 'diagnostics',
        bookingDate,
        bookingTime: '09:30',
        patientName: String(customer.name || `Demo Customer ${seedKey}`),
        patientPhone: String(customer.phone || ''),
        pincode: '380015',
        addressLine: 'Demo address for diagnostics sample booking',
        paymentOption: 'prepaid',
        testIds: ['cbc', 'thyroid'],
        testNames: ['CBC', 'Thyroid Profile'],
        useWalletBalance: false,
      });

      await pharmacyOrderService.markPaid(orderId, {
        paymentSource: 'seed_wallet_credit',
        paidDate: toCompactDate(now),
        paidTime,
        notes: 'Marked paid after wallet top-up during API seed.',
      });

      return {
        medicineId,
        customerId,
        trackingRecordId,
        inventoryId,
        orderId,
        subscriptionId,
        diagnosticsBookingId: getDiagnosticsBookingId(diagnostics),
      };
    },
    onSuccess: async (result) => {
      setSelectedMedicineId(result.medicineId);
      setSelectedTrackingCustomerId(result.customerId);
      setSelectedInventoryId(result.inventoryId);
      setSelectedOrderId(result.orderId);
      setSelectedSubscriptionId(result.subscriptionId);
      setSelectedDiagnosticsBookingId(result.diagnosticsBookingId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pharmacyMedicines'] }),
        queryClient.invalidateQueries({ queryKey: ['pharmacyMedicineDetail'] }),
        queryClient.invalidateQueries({ queryKey: ['pharmacyCustomers'] }),
        queryClient.invalidateQueries({
          queryKey: ['patientTracking', result.customerId],
        }),
        queryClient.invalidateQueries({ queryKey: ['pharmacyInventory'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyInventoryAdjustments'],
        }),
        queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] }),
        queryClient.invalidateQueries({ queryKey: ['pharmacyOrderDetail'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyOrderHealthCheck'],
        }),
        queryClient.invalidateQueries({ queryKey: ['pharmacySubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['pharmacyWallet'] }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyWalletTransactions'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyTrackingSummary'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['pharmacyTrackingSummaryById', pharmacyId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsPaymentDetails', result.diagnosticsBookingId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['diagnosticsSessionBookings'],
        }),
      ]);

      Toast.show({
        type: 'success',
        text1: 'Workspace data added',
        text2:
          'Demo records were created across pharmacy modules using live APIs.',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to add workspace data',
        text2: getErrorMessage(
          error,
          'The API seed action failed. Please check the configured backend and try again.'
        ),
      });
    },
  });

  const customerStats = {
    total: customers.length,
    chronic: countTrue(customers.map((item) => !!item.chronicCondition)),
    recurring: countTrue(customers.map((item) => !!item.recurringMedicine)),
  };
  const inventoryStats = {
    total: inventoryItems.length,
    lowStock: inventoryItems.filter((item) => !!item.lowStock).length,
    reserved: inventoryItems.reduce(
      (sum, item) => sum + Number(item.reservedQuantity || 0),
      0
    ),
  };
  const inventoryImportStats = {
    total: inventoryImports.length,
    pending: inventoryImports.filter(
      (item) => String(item.status || '').toLowerCase() === 'preview'
    ).length,
    failed: inventoryImports.filter((item) => Number(item.failedRows || 0) > 0)
      .length,
  };
  const orderStats = {
    total: orders.length,
    pending: orders.filter(
      (item) => String(item.paymentStatus || '').toLowerCase() === 'pending'
    ).length,
    accepted: orders.filter(
      (item) => String(item.status || '').toLowerCase() === 'accepted'
    ).length,
  };
  const subscriptionStats = {
    total: subscriptions.length,
    active: subscriptions.filter(
      (item) => String(item.status || '').toLowerCase() === 'active'
    ).length,
    paused: subscriptions.filter(
      (item) =>
        String(item.status || '').toLowerCase() === 'paused' ||
        !!item.pausedUntil
    ).length,
  };
  const walletStats = {
    balance: Number(
      walletSummary?.availableBalance ??
        walletSummary?.balance ??
        walletSummary?.totalBalance ??
        0
    ),
    transactions: walletTransactions.length,
    topups: walletTransactions.filter((item) =>
      String(item.type || '')
        .toLowerCase()
        .includes('top')
    ).length,
  };
  const trackingStats = {
    customers: Number(
      pharmacyTrackingSummary?.totalCustomers ?? customers.length ?? 0
    ),
    activeSubscriptions: Number(
      pharmacyTrackingSummary?.activeSubscriptions ?? subscriptionStats.active
    ),
    pendingOrders: Number(
      pharmacyTrackingSummary?.pendingOrders ?? orderStats.pending
    ),
  };
  const diagnosticsStats = {
    selected: selectedDiagnosticsBookingId ? 1 : 0,
    walletAssisted:
      diagnosticsCreateForm.useWalletBalance ||
      diagnosticsActionForm.useWalletBalance
        ? 1
        : 0,
    tests: diagnosticsCreateForm.testIds
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean).length,
  };

  useEffect(() => {
    if (
      activeSection === 'inventory' &&
      inventoryLowStockOnly &&
      inventoryStats.lowStock === 0
    ) {
      setInventoryLowStockOnly(false);
    }
  }, [activeSection, inventoryLowStockOnly, inventoryStats.lowStock]);

  const openCreateMedicineModal = () => {
    navigation.navigate('PharmacyMedicineCreate');
  };

  const openEditMedicineModal = () => {
    if (!selectedMedicine) return;
    navigation.navigate('PharmacyMedicineEdit', {
      medicineId: getEntityId(selectedMedicine),
    });
  };

  const submitCustomer = () => {
    const nextErrors: Record<string, string> = {};
    const ageValue = parseOptionalNumber(customerForm.age);
    const recurringValue = parseOptionalNumber(
      customerForm.recurringIntervalDays
    );

    if (!customerForm.name.trim()) {
      nextErrors.name = 'Customer name is required';
    }
    if (!/^\d{10}$/.test(customerForm.phone.trim())) {
      nextErrors.phone = 'Enter a valid 10 digit phone number';
    }
    if (Number.isNaN(ageValue)) {
      nextErrors.age = 'Age must be a number';
    }
    if (
      customerForm.recurringMedicine &&
      !customerForm.recurringIntervalDays.trim()
    ) {
      nextErrors.recurringIntervalDays = 'Recurring interval is required';
    } else if (customerForm.recurringMedicine && Number.isNaN(recurringValue)) {
      nextErrors.recurringIntervalDays = 'Interval must be a number';
    }

    setCustomerErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createCustomerMutation.mutate({
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      age: ageValue,
      diseaseNotes: customerForm.diseaseNotes.trim() || undefined,
      chronicCondition: customerForm.chronicCondition,
      recurringMedicine: customerForm.recurringMedicine,
      recurringIntervalDays: customerForm.recurringMedicine
        ? recurringValue
        : undefined,
    });
  };

  const openInventoryCreateModal = () => {
    setInventoryCreateForm({
      ...DEFAULT_INVENTORY_CREATE_FORM,
      medicineId: selectedMedicineId || '',
    });
    setInventoryErrors({});
    setInventoryModalVisible(true);
  };

  const openInventoryActionModal = (mode: InventoryActionMode) => {
    setInventoryActionMode(mode);
    setInventoryActionForm({
      ...DEFAULT_INVENTORY_ACTION_FORM,
      medicineId:
        getMedicineRefId(selectedInventory?.medicineId as any) ||
        selectedMedicineId ||
        '',
      reason: mode === 'reserve' ? 'internal_hold' : 'release_hold',
    });
    setInventoryActionErrors({});
    setInventoryActionModalVisible(true);
  };

  const submitInventoryCreate = () => {
    const nextErrors: Record<string, string> = {};
    const quantity = parseOptionalNumber(inventoryCreateForm.quantity);
    const reorderThreshold = parseOptionalNumber(
      inventoryCreateForm.reorderThreshold
    );
    const purchasePrice = parseOptionalNumber(
      inventoryCreateForm.purchasePrice
    );
    const retailPrice = parseOptionalNumber(inventoryCreateForm.retailPrice);
    const wholesalePrice = parseOptionalNumber(
      inventoryCreateForm.wholesalePrice
    );

    if (!inventoryCreateForm.medicineId.trim()) {
      nextErrors.medicineId = 'Medicine ID is required';
    }
    if (Number.isNaN(quantity) || quantity === undefined) {
      nextErrors.quantity = 'Quantity is required';
    }
    if (Number.isNaN(reorderThreshold)) {
      nextErrors.reorderThreshold = 'Threshold must be a number';
    }
    if (Number.isNaN(purchasePrice)) {
      nextErrors.purchasePrice = 'Purchase price must be a number';
    }
    if (Number.isNaN(retailPrice)) {
      nextErrors.retailPrice = 'Retail price must be a number';
    }
    if (Number.isNaN(wholesalePrice)) {
      nextErrors.wholesalePrice = 'Wholesale price must be a number';
    }
    if (
      inventoryCreateForm.expiryDate.trim() &&
      !/^\d{8}$/.test(inventoryCreateForm.expiryDate.trim())
    ) {
      nextErrors.expiryDate = 'Expiry date must be YYYYMMDD';
    }

    setInventoryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createInventoryMutation.mutate({
      items: [
        {
          medicineId: inventoryCreateForm.medicineId.trim(),
          quantity: Number(quantity),
          reorderThreshold:
            reorderThreshold === undefined
              ? undefined
              : Number(reorderThreshold),
          rackLocation: inventoryCreateForm.rackLocation.trim() || undefined,
          purchasePrice:
            purchasePrice === undefined ? undefined : Number(purchasePrice),
          retailPrice:
            retailPrice === undefined ? undefined : Number(retailPrice),
          wholesalePrice:
            wholesalePrice === undefined ? undefined : Number(wholesalePrice),
          batchNumber: inventoryCreateForm.batchNumber.trim() || undefined,
          expiryDate: inventoryCreateForm.expiryDate.trim() || undefined,
          reason: inventoryCreateForm.reason.trim() || undefined,
          notes: inventoryCreateForm.notes.trim() || undefined,
        },
      ],
    });
  };

  const submitInventoryAction = () => {
    const nextErrors: Record<string, string> = {};
    const quantity = parseOptionalNumber(inventoryActionForm.quantity);

    if (!inventoryActionForm.medicineId.trim()) {
      nextErrors.medicineId = 'Medicine ID is required';
    }
    if (Number.isNaN(quantity) || quantity === undefined) {
      nextErrors.quantity = 'Quantity is required';
    }

    setInventoryActionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: InventoryActionRequest = {
      items: [
        {
          medicineId: inventoryActionForm.medicineId.trim(),
          quantity: Number(quantity),
        },
      ],
      reason: inventoryActionForm.reason.trim() || undefined,
      notes: inventoryActionForm.notes.trim() || undefined,
    };

    if (inventoryActionMode === 'reserve') {
      reserveInventoryMutation.mutate(payload);
      return;
    }

    releaseInventoryMutation.mutate(payload);
  };

  const pickInventoryImportFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });
      const pickedFile = Array.isArray(result) ? result[0] : result;
      if (!pickedFile) return;

      setInventoryImportFile({
        uri: pickedFile.uri,
        name: pickedFile.name || 'inventory-import',
        type: pickedFile.type || 'application/octet-stream',
      });
    } catch (error: any) {
      if (
        error instanceof Error &&
        error.message &&
        error.message.toLowerCase().includes('cancel')
      ) {
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'File selection failed',
        text2: 'Please try selecting the import file again.',
      });
    }
  };

  const submitInventoryImportPreview = () => {
    if (!inventoryImportFile) {
      Toast.show({
        type: 'error',
        text1: 'Select a file',
        text2: 'Choose an inventory file before previewing the import.',
      });
      return;
    }

    inventoryImportPreviewMutation.mutate({
      ...inventoryImportFile,
      importMode: inventoryImportMode,
    });
  };

  const submitInventoryImportCommit = () => {
    const importId =
      getEntityId(inventoryImportPreviewMutation.data || {}) ||
      getEntityId(selectedInventoryImport || {});

    if (!importId) {
      Toast.show({
        type: 'error',
        text1: 'No import to commit',
        text2: 'Preview an import first, then commit it.',
      });
      return;
    }

    Alert.alert(
      'Commit Import',
      'This will apply the previewed inventory import to your pharmacy stock.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Commit',
          onPress: () =>
            inventoryImportCommitMutation.mutate({
              importId,
            }),
        },
      ]
    );
  };

  const openOrderCreateModal = () => {
    setOrderCreateForm({
      ...DEFAULT_ORDER_CREATE_FORM,
      customerId: customers[0] ? getEntityId(customers[0]) : '',
      medicineId: selectedMedicineId || '',
      medicineName: selectedMedicine?.name || '',
      linkedConsultationId: '',
      linkedDiagnosticOrderId: '',
    });
    setOrderErrors({});
    setOrderModalVisible(true);
  };

  const openOrderActionModal = (mode: OrderActionMode) => {
    if (!selectedOrder) return;
    setOrderActionMode(mode);
    setOrderActionForm({
      ...DEFAULT_ORDER_ACTION_FORM,
      notes: String(selectedOrder.notes || ''),
      deliveryAddress: String(selectedOrder.deliveryAddress || ''),
      paymentMode: String(selectedOrder.paymentMode || 'cash_on_delivery'),
      linkedConsultationId: String(selectedOrder.linkedConsultationId || ''),
      linkedDiagnosticOrderId: String(
        selectedOrder.linkedDiagnosticOrderId || ''
      ),
      status: String(selectedOrder.status || 'accepted'),
    });
    setOrderActionErrors({});
    setOrderActionModalVisible(true);
  };

  const openHealthCheckModal = () => {
    setHealthCheckMode(orderHealthCheck ? 'edit' : 'create');
    setHealthCheckForm({
      systolicBP: String(orderHealthCheck?.systolicBP ?? ''),
      diastolicBP: String(orderHealthCheck?.diastolicBP ?? ''),
      fastingSugar: String(orderHealthCheck?.fastingSugar ?? ''),
      postMealSugar: String(orderHealthCheck?.postMealSugar ?? ''),
      hba1c: String(orderHealthCheck?.hba1c ?? ''),
      notes: String(orderHealthCheck?.notes || ''),
    });
    setHealthCheckErrors({});
    setHealthCheckModalVisible(true);
  };

  const selectedOrderStatus = normalizeState(
    String(selectedOrder?.status || 'placed')
  );
  const selectedOrderPaymentStatus = normalizeState(
    String(selectedOrder?.paymentStatus || 'pending')
  );

  const orderActionItems = useMemo(() => {
    if (!selectedOrder) return [];

    const isCancelled = selectedOrderStatus === 'cancelled';
    const isDelivered = selectedOrderStatus === 'delivered';
    const isPaid = selectedOrderPaymentStatus === 'paid';
    const canEditCore = !isCancelled && !isDelivered;
    const canAdvanceStatus = !isCancelled && !isDelivered;
    const canCancel = !isCancelled && !isDelivered;
    const canMarkPaid = !isCancelled && !isPaid;
    const canHealthCheck = [
      'accepted',
      'processing',
      'ready',
      'delivered',
    ].includes(selectedOrderStatus);

    return [
      canEditCore
        ? {
            key: 'update',
            title: 'Update',
            variant: 'outline' as const,
            onPress: () => openOrderActionModal('update'),
          }
        : null,
      canAdvanceStatus
        ? {
            key: 'status',
            title: 'Status',
            variant: 'outline' as const,
            onPress: () => openOrderActionModal('status'),
          }
        : null,
      canMarkPaid
        ? {
            key: 'markPaid',
            title: 'Mark Paid',
            variant: 'green' as const,
            onPress: () => openOrderActionModal('markPaid'),
          }
        : null,
      canHealthCheck
        ? {
            key: 'healthCheck',
            title: orderHealthCheck
              ? 'Update Health Check'
              : 'Add Health Check',
            variant: 'outline' as const,
            onPress: openHealthCheckModal,
          }
        : null,
      canCancel
        ? {
            key: 'cancel',
            title: 'Cancel',
            variant: 'outline' as const,
            onPress: () => openOrderActionModal('cancel'),
          }
        : null,
    ].filter(Boolean) as Array<{
      key: string;
      title: string;
      variant: 'outline' | 'green';
      onPress: () => void;
    }>;
  }, [
    orderHealthCheck,
    openHealthCheckModal,
    selectedOrder,
    selectedOrderPaymentStatus,
    selectedOrderStatus,
  ]);

  const openSubscriptionCreateModal = () => {
    setSubscriptionCreateForm({
      ...DEFAULT_SUBSCRIPTION_CREATE_FORM,
      userId: selectedOrder?.customerId || getEntityId(customers[0] || {}),
      medicineId:
        selectedSubscription?.items?.[0]?.medicineId ||
        selectedOrder?.items?.[0]?.medicineId ||
        selectedMedicineId,
      medicineName: String(
        selectedSubscription?.items?.[0]?.medicineName ||
          selectedOrder?.items?.[0]?.medicineName ||
          selectedMedicine?.name ||
          ''
      ),
    });
    setSubscriptionErrors({});
    setSubscriptionModalVisible(true);
  };

  const openSubscriptionActionModal = (mode: SubscriptionActionMode) => {
    if (!selectedSubscription) return;
    const firstItem = selectedSubscription.items?.[0];
    setSubscriptionActionMode(mode);
    setSubscriptionActionForm({
      intervalDays: String(firstItem?.intervalDays ?? ''),
      nextRefillDate: String(firstItem?.nextRefillDate || ''),
      reminderChannel: String(firstItem?.reminderChannel || 'both'),
      pausedUntil: String(selectedSubscription.pausedUntil || ''),
    });
    setSubscriptionActionErrors({});
    setSubscriptionActionModalVisible(true);
  };

  const openWalletTopupModal = () => {
    setWalletTopupForm({
      ...DEFAULT_WALLET_TOPUP_FORM,
    });
    setWalletErrors({});
    setWalletModalVisible(true);
  };

  const openPatientTrackingModal = () => {
    setPatientTrackingForm({
      diseaseNotes: String(patientTracking?.diseaseNotes || ''),
      chronicCondition: !!patientTracking?.chronicCondition,
      recurringMedicine: !!patientTracking?.recurringMedicine,
      recurringIntervalDays: String(
        patientTracking?.recurringIntervalDays ?? ''
      ),
      preferredFollowUpDate: String(
        patientTracking?.preferredFollowUpDate || ''
      ),
      pharmacyNotes: String(patientTracking?.pharmacyNotes || ''),
    });
    setPatientTrackingErrors({});
    setPatientTrackingModalVisible(true);
  };

  const openDiagnosticsModal = () => {
    setDiagnosticsCreateForm({
      ...DEFAULT_DIAGNOSTICS_CREATE_FORM,
      patientName: selectedTrackingCustomer?.name || '',
      patientPhone: selectedTrackingCustomer?.phone || '',
    });
    setDiagnosticsErrors({});
    setDiagnosticsModalVisible(true);
  };

  const openDiagnosticsActionModal = (mode: DiagnosticsActionMode) => {
    setDiagnosticsActionMode(mode);
    setDiagnosticsActionForm({
      ...DEFAULT_DIAGNOSTICS_ACTION_FORM,
      bookingDate: String(
        (diagnosticsPaymentDetails as Record<string, unknown> | null)
          ?.bookingDate || ''
      ),
      bookingTime: String(
        (diagnosticsPaymentDetails as Record<string, unknown> | null)
          ?.bookingTime || ''
      ),
    });
    setDiagnosticsActionErrors({});
    setDiagnosticsActionModalVisible(true);
  };

  const openPaymentVerificationModal = () => {
    setPaymentVerificationForm({
      ...DEFAULT_PAYMENT_VERIFICATION_FORM,
      paymentTransactionId: String(
        (diagnosticsPaymentDetails as Record<string, unknown> | null)
          ?.paymentTransactionId || ''
      ),
    });
    setPaymentVerificationErrors({});
    setPaymentVerificationModalVisible(true);
  };

  const submitCreateOrder = () => {
    const nextErrors: Record<string, string> = {};
    const orderedQty = parseOptionalNumber(orderCreateForm.orderedQty);
    const discount = parseOptionalNumber(orderCreateForm.discount);
    const subscriptionIntervalDays = parseOptionalNumber(
      orderCreateForm.subscriptionIntervalDays
    );

    if (!orderCreateForm.customerId.trim()) {
      nextErrors.customerId = 'Customer ID is required';
    }
    if (!orderCreateForm.medicineId.trim()) {
      nextErrors.medicineId = 'Medicine ID is required';
    }
    if (Number.isNaN(orderedQty) || orderedQty === undefined) {
      nextErrors.orderedQty = 'Ordered quantity is required';
    }
    if (Number.isNaN(discount)) {
      nextErrors.discount = 'Discount must be a number';
    }
    if (
      orderCreateForm.recurring &&
      (Number.isNaN(subscriptionIntervalDays) ||
        subscriptionIntervalDays === undefined)
    ) {
      nextErrors.subscriptionIntervalDays = 'Subscription interval is required';
    }
    if (
      orderCreateForm.subscriptionNextRefillDate.trim() &&
      !/^\d{8}$/.test(orderCreateForm.subscriptionNextRefillDate.trim())
    ) {
      nextErrors.subscriptionNextRefillDate = 'Refill date must be YYYYMMDD';
    }

    setOrderErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createOrderMutation.mutate({
      orderType: orderCreateForm.orderType.trim(),
      customerId: orderCreateForm.customerId.trim(),
      items: [
        {
          medicineId: orderCreateForm.medicineId.trim(),
          medicineName: orderCreateForm.medicineName.trim() || undefined,
          orderedQty: Number(orderedQty),
          discount: discount === undefined ? undefined : Number(discount),
          recurring: orderCreateForm.recurring,
          subscriptionIntervalDays: orderCreateForm.recurring
            ? Number(subscriptionIntervalDays)
            : undefined,
          subscriptionFrequency:
            orderCreateForm.subscriptionFrequency.trim() || undefined,
          subscriptionNextRefillDate:
            orderCreateForm.subscriptionNextRefillDate.trim() || undefined,
          subscriptionReminderChannel:
            orderCreateForm.subscriptionReminderChannel.trim() || undefined,
        },
      ],
      paymentMode: orderCreateForm.paymentMode.trim(),
      deliveryMode: orderCreateForm.deliveryMode.trim(),
      deliveryAddress: orderCreateForm.deliveryAddress.trim() || undefined,
      isWalkIn: orderCreateForm.isWalkIn,
      prescriptionUrls: orderCreateForm.prescriptionUrls
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      notes: orderCreateForm.notes.trim() || undefined,
      linkedConsultationId:
        orderCreateForm.linkedConsultationId.trim() || undefined,
      linkedDiagnosticOrderId:
        orderCreateForm.linkedDiagnosticOrderId.trim() || undefined,
    });
  };

  const submitOrderAction = () => {
    if (!selectedOrderId) return;

    const nextErrors: Record<string, string> = {};
    if (
      orderActionMode === 'markPaid' &&
      orderActionForm.paidDate.trim() &&
      !/^\d{8}$/.test(orderActionForm.paidDate.trim())
    ) {
      nextErrors.paidDate = 'Paid date must be YYYYMMDD';
    }
    setOrderActionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (orderActionMode === 'update') {
      updateOrderMutation.mutate({
        id: selectedOrderId,
        payload: {
          notes: orderActionForm.notes.trim() || undefined,
          deliveryAddress: orderActionForm.deliveryAddress.trim() || undefined,
          paymentMode: orderActionForm.paymentMode.trim() || undefined,
          linkedConsultationId:
            orderActionForm.linkedConsultationId.trim() || undefined,
          linkedDiagnosticOrderId:
            orderActionForm.linkedDiagnosticOrderId.trim() || undefined,
        },
      });
      return;
    }

    if (orderActionMode === 'status') {
      updateOrderStatusMutation.mutate({
        id: selectedOrderId,
        payload: {
          status: orderActionForm.status.trim(),
          notes: orderActionForm.notes.trim() || undefined,
        },
      });
      return;
    }

    if (orderActionMode === 'cancel') {
      cancelOrderMutation.mutate({
        id: selectedOrderId,
        payload: {
          notes: orderActionForm.notes.trim() || undefined,
        },
      });
      return;
    }

    markPaidOrderMutation.mutate({
      id: selectedOrderId,
      payload: {
        paymentSource: orderActionForm.paymentSource.trim(),
        paidDate: orderActionForm.paidDate.trim(),
        paidTime: orderActionForm.paidTime.trim(),
        notes: orderActionForm.notes.trim() || undefined,
      },
    });
  };

  const submitHealthCheck = () => {
    if (!selectedOrderId) return;

    const nextErrors: Record<string, string> = {};
    const systolicBP = parseOptionalNumber(healthCheckForm.systolicBP);
    const diastolicBP = parseOptionalNumber(healthCheckForm.diastolicBP);
    const fastingSugar = parseOptionalNumber(healthCheckForm.fastingSugar);
    const postMealSugar = parseOptionalNumber(healthCheckForm.postMealSugar);
    const hba1c = parseOptionalNumber(healthCheckForm.hba1c);

    if (Number.isNaN(systolicBP))
      nextErrors.systolicBP = 'Enter a valid number';
    if (Number.isNaN(diastolicBP))
      nextErrors.diastolicBP = 'Enter a valid number';
    if (Number.isNaN(fastingSugar))
      nextErrors.fastingSugar = 'Enter a valid number';
    if (Number.isNaN(postMealSugar))
      nextErrors.postMealSugar = 'Enter a valid number';
    if (Number.isNaN(hba1c)) nextErrors.hba1c = 'Enter a valid number';

    setHealthCheckErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      systolicBP: systolicBP === undefined ? undefined : Number(systolicBP),
      diastolicBP: diastolicBP === undefined ? undefined : Number(diastolicBP),
      fastingSugar:
        fastingSugar === undefined ? undefined : Number(fastingSugar),
      postMealSugar:
        postMealSugar === undefined ? undefined : Number(postMealSugar),
      hba1c: hba1c === undefined ? undefined : Number(hba1c),
      notes: healthCheckForm.notes.trim() || undefined,
    };

    if (healthCheckMode === 'create') {
      createOrderHealthCheckMutation.mutate({ id: selectedOrderId, payload });
      return;
    }

    updateOrderHealthCheckMutation.mutate({ id: selectedOrderId, payload });
  };

  const submitCreateSubscription = () => {
    const nextErrors: Record<string, string> = {};
    const intervalDays = parseOptionalNumber(
      subscriptionCreateForm.intervalDays
    );

    if (!subscriptionCreateForm.userId.trim()) {
      nextErrors.userId = 'User ID is required';
    }
    if (!subscriptionCreateForm.medicineId.trim()) {
      nextErrors.medicineId = 'Medicine ID is required';
    }
    if (Number.isNaN(intervalDays) || intervalDays === undefined) {
      nextErrors.intervalDays = 'Interval days is required';
    }
    if (
      subscriptionCreateForm.nextRefillDate.trim() &&
      !/^\d{8}$/.test(subscriptionCreateForm.nextRefillDate.trim())
    ) {
      nextErrors.nextRefillDate = 'Next refill date must be YYYYMMDD';
    }

    setSubscriptionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createSubscriptionMutation.mutate({
      userId: subscriptionCreateForm.userId.trim(),
      items: [
        {
          medicineId: subscriptionCreateForm.medicineId.trim(),
          medicineName: subscriptionCreateForm.medicineName.trim() || undefined,
          frequency: subscriptionCreateForm.frequency.trim() || undefined,
          intervalDays: Number(intervalDays),
          nextRefillDate:
            subscriptionCreateForm.nextRefillDate.trim() || undefined,
          reminderChannel:
            subscriptionCreateForm.reminderChannel.trim() || undefined,
        },
      ],
    });
  };

  const submitSubscriptionAction = () => {
    if (!selectedSubscriptionId) return;

    const nextErrors: Record<string, string> = {};
    const intervalDays = parseOptionalNumber(
      subscriptionActionForm.intervalDays
    );

    if (subscriptionActionMode === 'update' && Number.isNaN(intervalDays)) {
      nextErrors.intervalDays = 'Interval must be a valid number';
    }
    if (
      subscriptionActionMode === 'update' &&
      subscriptionActionForm.nextRefillDate.trim() &&
      !/^\d{8}$/.test(subscriptionActionForm.nextRefillDate.trim())
    ) {
      nextErrors.nextRefillDate = 'Next refill date must be YYYYMMDD';
    }
    if (
      subscriptionActionMode === 'pause' &&
      !/^\d{8}$/.test(subscriptionActionForm.pausedUntil.trim())
    ) {
      nextErrors.pausedUntil = 'Paused until must be YYYYMMDD';
    }

    setSubscriptionActionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (subscriptionActionMode === 'update') {
      updateSubscriptionMutation.mutate({
        id: selectedSubscriptionId,
        payload: {
          intervalDays:
            intervalDays === undefined ? undefined : Number(intervalDays),
          nextRefillDate:
            subscriptionActionForm.nextRefillDate.trim() || undefined,
          reminderChannel:
            subscriptionActionForm.reminderChannel.trim() || undefined,
        },
      });
      return;
    }

    if (subscriptionActionMode === 'pause') {
      pauseSubscriptionMutation.mutate({
        id: selectedSubscriptionId,
        payload: {
          pausedUntil: subscriptionActionForm.pausedUntil.trim(),
        },
      });
      return;
    }

    Alert.alert(
      'Delete Subscription',
      'This will permanently remove the selected recurring medicine plan.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteSubscriptionMutation.mutate(selectedSubscriptionId),
        },
      ]
    );
  };

  const submitWalletTopup = () => {
    const nextErrors: Record<string, string> = {};
    const amount = parseOptionalNumber(walletTopupForm.amount);

    if (!pharmacyId) {
      nextErrors.amount = 'Pharmacy ID is unavailable for top-up';
    }
    if (Number.isNaN(amount) || amount === undefined || Number(amount) <= 0) {
      nextErrors.amount = 'Enter a valid top-up amount';
    }

    setWalletErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    walletTopupMutation.mutate({
      pharmacyId,
      amount: Number(amount),
      notes: walletTopupForm.notes.trim() || undefined,
    });
  };

  const submitPatientTracking = () => {
    if (!selectedTrackingCustomerId) return;

    const nextErrors: Record<string, string> = {};
    const recurringIntervalDays = parseOptionalNumber(
      patientTrackingForm.recurringIntervalDays
    );

    if (
      patientTrackingForm.recurringMedicine &&
      (Number.isNaN(recurringIntervalDays) ||
        recurringIntervalDays === undefined)
    ) {
      nextErrors.recurringIntervalDays = 'Recurring interval is required';
    }
    if (
      patientTrackingForm.preferredFollowUpDate.trim() &&
      !/^\d{8}$/.test(patientTrackingForm.preferredFollowUpDate.trim())
    ) {
      nextErrors.preferredFollowUpDate =
        'Preferred follow-up date must be YYYYMMDD';
    }

    setPatientTrackingErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updatePatientTrackingMutation.mutate({
      id: selectedTrackingCustomerId,
      payload: {
        diseaseNotes: patientTrackingForm.diseaseNotes.trim() || undefined,
        chronicCondition: patientTrackingForm.chronicCondition,
        recurringMedicine: patientTrackingForm.recurringMedicine,
        recurringIntervalDays: patientTrackingForm.recurringMedicine
          ? Number(recurringIntervalDays)
          : undefined,
        preferredFollowUpDate:
          patientTrackingForm.preferredFollowUpDate.trim() || undefined,
        pharmacyNotes: patientTrackingForm.pharmacyNotes.trim() || undefined,
      },
    });
  };

  const submitCreateDiagnosticsBooking = () => {
    const nextErrors: Record<string, string> = {};

    if (!/^\d{8}$/.test(diagnosticsCreateForm.bookingDate.trim())) {
      nextErrors.bookingDate = 'Booking date must be YYYYMMDD';
    }
    if (!diagnosticsCreateForm.bookingTime.trim()) {
      nextErrors.bookingTime = 'Booking time is required';
    }
    if (!diagnosticsCreateForm.patientName.trim()) {
      nextErrors.patientName = 'Patient name is required';
    }
    if (!/^\d{10}$/.test(diagnosticsCreateForm.patientPhone.trim())) {
      nextErrors.patientPhone = 'Enter a valid 10 digit phone number';
    }
    if (!diagnosticsCreateForm.pincode.trim()) {
      nextErrors.pincode = 'Pincode is required';
    }
    if (!diagnosticsCreateForm.addressLine.trim()) {
      nextErrors.addressLine = 'Address is required';
    }

    const testIds = diagnosticsCreateForm.testIds
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const testNames = diagnosticsCreateForm.testNames
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!testIds.length) {
      nextErrors.testIds = 'At least one test ID is required';
    }
    if (!testNames.length) {
      nextErrors.testNames = 'At least one test name is required';
    }

    setDiagnosticsErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createDiagnosticsBookingMutation.mutate({
      integration: diagnosticsCreateForm.integration.trim(),
      orderType: diagnosticsCreateForm.orderType.trim(),
      bookingDate: diagnosticsCreateForm.bookingDate.trim(),
      bookingTime: diagnosticsCreateForm.bookingTime.trim(),
      patientName: diagnosticsCreateForm.patientName.trim(),
      patientPhone: diagnosticsCreateForm.patientPhone.trim(),
      pincode: diagnosticsCreateForm.pincode.trim(),
      addressLine: diagnosticsCreateForm.addressLine.trim(),
      paymentOption: diagnosticsCreateForm.paymentOption.trim(),
      testIds,
      testNames,
      useWalletBalance: diagnosticsCreateForm.useWalletBalance,
    });
  };

  const submitDiagnosticsAction = () => {
    if (!selectedDiagnosticsBookingId) return;

    const nextErrors: Record<string, string> = {};
    if (
      diagnosticsActionMode === 'cancel' &&
      !diagnosticsActionForm.cancellationReason.trim()
    ) {
      nextErrors.cancellationReason = 'Cancellation reason is required';
    }
    if (
      diagnosticsActionMode === 'reschedule' &&
      !/^\d{8}$/.test(diagnosticsActionForm.bookingDate.trim())
    ) {
      nextErrors.bookingDate = 'Booking date must be YYYYMMDD';
    }
    if (
      diagnosticsActionMode === 'reschedule' &&
      !diagnosticsActionForm.bookingTime.trim()
    ) {
      nextErrors.bookingTime = 'Booking time is required';
    }
    setDiagnosticsActionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (diagnosticsActionMode === 'retry') {
      retryDiagnosticsPaymentMutation.mutate({
        id: selectedDiagnosticsBookingId,
        payload: {
          useWalletBalance: diagnosticsActionForm.useWalletBalance,
          couponCode: diagnosticsActionForm.couponCode.trim() || undefined,
        },
      });
      return;
    }

    if (diagnosticsActionMode === 'cancel') {
      cancelDiagnosticsBookingMutation.mutate({
        id: selectedDiagnosticsBookingId,
        payload: {
          cancellationReason: diagnosticsActionForm.cancellationReason.trim(),
        },
      });
      return;
    }

    rescheduleDiagnosticsBookingMutation.mutate({
      id: selectedDiagnosticsBookingId,
      payload: {
        bookingDate: diagnosticsActionForm.bookingDate.trim(),
        bookingTime: diagnosticsActionForm.bookingTime.trim(),
      },
    });
  };

  const submitPaymentVerification = () => {
    const nextErrors: Record<string, string> = {};
    if (!paymentVerificationForm.paymentTransactionId.trim()) {
      nextErrors.paymentTransactionId = 'Payment transaction ID is required';
    }
    if (!paymentVerificationForm.razorpayOrderId.trim()) {
      nextErrors.razorpayOrderId = 'Razorpay order ID is required';
    }
    if (!paymentVerificationForm.razorpayPaymentId.trim()) {
      nextErrors.razorpayPaymentId = 'Razorpay payment ID is required';
    }
    if (!paymentVerificationForm.razorpaySignature.trim()) {
      nextErrors.razorpaySignature = 'Razorpay signature is required';
    }

    setPaymentVerificationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    verifyDiagnosticsPaymentMutation.mutate({
      paymentTransactionId: paymentVerificationForm.paymentTransactionId.trim(),
      razorpayOrderId: paymentVerificationForm.razorpayOrderId.trim(),
      razorpayPaymentId: paymentVerificationForm.razorpayPaymentId.trim(),
      razorpaySignature: paymentVerificationForm.razorpaySignature.trim(),
      module: paymentVerificationForm.module.trim(),
    });
  };

  const renderMedicineList = () => {
    if (medicinesQuery.isLoading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading medicines...</Text>
        </View>
      );
    }

    if (medicinesQuery.error) {
      return (
        <InlineError
          message={getErrorMessage(
            medicinesQuery.error,
            'Unable to load medicines right now.'
          )}
          onRetry={() => medicinesQuery.refetch()}
        />
      );
    }

    if (!filteredMedicines.length) {
      return (
        <EmptyState
          title="No medicines found"
          subtitle="Try another shelf tab or adjust the search term."
        />
      );
    }

    return (
      <View style={styles.medicineGrid}>
        {filteredMedicines.map((item, index) => {
          const entityId = getEntityId(item);
          const isSelected = entityId === selectedMedicineId;
          const chipLabel = item.strength || item.dosageForm || 'In stock';

          return (
            <TouchableOpacity
              key={entityId}
              activeOpacity={0.88}
              onPress={() => setSelectedMedicineId(entityId)}
              style={[
                styles.medicineGridCard,
                isSelected && styles.medicineGridCardSelected,
              ]}
            >
              <View
                style={[
                  styles.medicineGridArtwork,
                  item.prescriptionRequired
                    ? styles.medicineGridArtworkRx
                    : styles.medicineGridArtworkOtc,
                ]}
              >
                {index === 0 ? (
                  <View style={styles.medicineBestSellerBadge}>
                    <Text style={styles.medicineBestSellerBadgeText}>
                      Top pick
                    </Text>
                  </View>
                ) : null}

                <View style={styles.medicineGridPillIcon}>
                  <Pill
                    size={scale(22)}
                    color={item.prescriptionRequired ? '#1572B7' : '#D97706'}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedMedicineId(entityId)}
                  style={styles.medicineGridAddButton}
                >
                  <Plus size={scale(16)} color={colors.primaryBlue} />
                </TouchableOpacity>
              </View>

              <View style={styles.medicinePriceRow}>
                <View style={styles.medicinePriceChip}>
                  <Text style={styles.medicinePriceChipText}>{chipLabel}</Text>
                </View>
                <Text style={styles.medicineStrikeText}>
                  {item.prescriptionRequired ? 'Rx' : 'OTC'}
                </Text>
              </View>

              <Text style={styles.medicineGridTitle} numberOfLines={2}>
                {item.name || 'Unnamed medicine'}
              </Text>
              <Text style={styles.medicineGridSubtitle} numberOfLines={2}>
                {item.genericName || item.manufacturer || 'Pharmacy medicine'}
              </Text>
              <Text style={styles.medicineGridMeta} numberOfLines={1}>
                {item.category || item.dosageForm || '1 unit'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderMedicineDetails = () => {
    if (!selectedMedicineId) {
      return (
        <EmptyState
          title="Select a medicine"
          subtitle="Tap any medicine on the left to load its latest details."
        />
      );
    }

    if (medicineDetailQuery.isLoading && !selectedMedicine) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading medicine details...</Text>
        </View>
      );
    }

    if (medicineDetailQuery.error && !selectedMedicine) {
      return (
        <InlineError
          message={getErrorMessage(
            medicineDetailQuery.error,
            'Unable to load medicine details.'
          )}
          onRetry={() => medicineDetailQuery.refetch()}
        />
      );
    }

    if (!selectedMedicine) {
      return (
        <EmptyState
          title="Medicine details unavailable"
          subtitle="Try refreshing the list and selecting the medicine again."
        />
      );
    }

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {selectedMedicine.name ||
                selectedMedicine.brandName ||
                'Medicine'}
            </Text>
            <Text style={styles.detailSubtitle}>
              {selectedMedicine.genericName ||
                selectedMedicine.category ||
                'Medicine profile'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openEditMedicineModal}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.medicineCartHero}>
          <View style={styles.medicineCartHeroCopy}>
            <Text style={styles.medicineCartHeroEyebrow}>Pharmacy Cart</Text>
            <Text style={styles.medicineCartHeroTitle}>
              {selectedMedicineCartQuantity > 0
                ? `${selectedMedicineCartQuantity} item${
                    selectedMedicineCartQuantity === 1 ? '' : 's'
                  } added for this medicine`
                : 'Add this medicine to your pharmacy cart'}
            </Text>
          </View>
          <View style={styles.medicineCartHeroActionWrap}>
            {selectedMedicineCartQuantity > 0 ? (
              <View style={styles.medicineCartStepper}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={updateCartItemMutation.isPending}
                  onPress={() => updateSelectedMedicineCart(-1)}
                  style={styles.medicineCartStepButton}
                >
                  <Minus size={scale(16)} color={colors.primaryBlue} />
                </TouchableOpacity>
                <View style={styles.medicineCartQuantityBadge}>
                  <Text style={styles.medicineCartQuantityText}>
                    {selectedMedicineCartQuantity}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={updateCartItemMutation.isPending}
                  onPress={() => updateSelectedMedicineCart(1)}
                  style={[
                    styles.medicineCartStepButton,
                    styles.medicineCartStepButtonFilled,
                  ]}
                >
                  <Plus size={scale(16)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={updateCartItemMutation.isPending}
                onPress={() => updateSelectedMedicineCart(2)}
                style={styles.medicineCartAddButton}
              >
                <ShoppingCart size={scale(18)} color="#FFFFFF" />
                <Text style={styles.medicineCartAddButtonText}>
                  Add 2 to cart
                </Text>
              </TouchableOpacity>
            )}

            {selectedMedicineCartQuantity > 0 ? (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={removeCartItemMutation.isPending}
                onPress={() =>
                  removeCartItemMutation.mutate(selectedMedicineId)
                }
                style={styles.medicineCartRemoveButton}
              >
                <Trash2 size={scale(16)} color="#B45309" />
                <Text style={styles.medicineCartRemoveButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {medicineDetailQuery.error ? (
          <InlineError
            message={getErrorMessage(
              medicineDetailQuery.error,
              'Showing cached medicine data.'
            )}
            onRetry={() => medicineDetailQuery.refetch()}
          />
        ) : null}

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Brand Name</Text>
            <Text style={styles.detailValue}>
              {selectedMedicine.brandName || 'Not added yet'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Dosage Form</Text>
            <Text style={styles.detailValue}>
              {selectedMedicine.dosageForm || 'Not added yet'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Strength</Text>
            <Text style={styles.detailValue}>
              {selectedMedicine.strength || 'Not added yet'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Manufacturer</Text>
            <Text style={styles.detailValue}>
              {selectedMedicine.manufacturer || 'Not added yet'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Prescription</Text>
            <Text style={styles.detailValue}>
              {selectedMedicine.prescriptionRequired
                ? 'Required'
                : 'Not required'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(
                selectedMedicine.updatedAt || selectedMedicine.createdAt
              )}
            </Text>
          </View>
        </View>

        <View style={styles.availabilitySection}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.availabilityTitle}>Nearby Availability</Text>
            <Text style={styles.availabilitySubtitle}>
              Requires live device location within 5 km radius
            </Text>
          </View>

          {medicineLocationStatus === 'loading' ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primaryBlue} />
              <Text style={styles.loadingText}>Checking your location...</Text>
            </View>
          ) : medicineLocationStatus !== 'granted' ? (
            <View
              style={[
                styles.detailStatusBanner,
                styles.detailStatusWarning,
                styles.availabilityBlockedCard,
              ]}
            >
              <Text style={styles.detailStatusEyebrow}>Location Required</Text>
              <Text style={styles.detailStatusTitle}>
                Enable location to continue
              </Text>
              <Text style={styles.detailStatusText}>
                {medicineLocationMessage ||
                  'Medicine availability works only after location permission is allowed.'}
              </Text>
              <View style={styles.availabilityActionRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    requestMedicineLocation().catch((error) => {
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'Unable to request location permission.';
                      setMedicineLocationStatus('unavailable');
                      setMedicineLocationMessage(message);
                    });
                  }}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>
                    Enable Location
                  </Text>
                </TouchableOpacity>
                {(medicineLocationStatus === 'blocked' ||
                  medicineLocationStatus === 'denied') && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      locationService.openSettings().catch(() => {
                        Toast.show({
                          type: 'error',
                          text1: 'Unable to open settings',
                          text2:
                            'Please open app settings manually and allow location access.',
                        });
                      });
                    }}
                    style={styles.availabilitySecondaryButton}
                  >
                    <Text style={styles.availabilitySecondaryButtonText}>
                      Open Settings
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : medicineAvailabilityQuery.isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primaryBlue} />
              <Text style={styles.loadingText}>
                Loading nearby pharmacies...
              </Text>
            </View>
          ) : medicineAvailabilityQuery.error ? (
            <InlineError
              message={getErrorMessage(
                medicineAvailabilityQuery.error,
                'Unable to load nearby medicine availability.'
              )}
              onRetry={() => medicineAvailabilityQuery.refetch()}
            />
          ) : !medicineAvailabilityQuery.data?.length ? (
            <EmptyState
              title="No nearby pharmacies found"
              subtitle="No medicine availability was returned for your current location."
            />
          ) : (
            <View style={styles.availabilityList}>
              {medicineAvailabilityQuery.data.map((item, index) => {
                const pharmacyName =
                  String(
                    item.pharmacyName ||
                      item.name ||
                      item.pharmacy?.name ||
                      'Nearby Pharmacy'
                  ) || 'Nearby Pharmacy';
                const distance =
                  Number(item.distanceKm ?? item.distance ?? 0) || 0;
                const availableQty =
                  Number(
                    item.availableQuantity ??
                      item.quantity ??
                      item.stock ??
                      item.availableStock ??
                      item.inventory?.availableQuantity ??
                      0
                  ) || 0;
                const retailPrice =
                  Number(
                    item.retailPrice ??
                      item.price ??
                      item.inventory?.retailPrice ??
                      0
                  ) || 0;
                const address = [item.address, item.city, item.state]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <View
                    key={String(
                      item.id || item._id || `${pharmacyName}-${index}`
                    )}
                    style={styles.availabilityCard}
                  >
                    <View style={styles.listCardTop}>
                      <View style={styles.listTitleWrap}>
                        <Text style={styles.listTitle}>{pharmacyName}</Text>
                        <Text style={styles.listSubtitle}>
                          {distance > 0
                            ? `${distance.toFixed(1)} km away`
                            : 'Nearby pharmacy'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          availableQty > 0
                            ? styles.badgeSuccess
                            : styles.badgeWarning,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            availableQty > 0
                              ? styles.badgeTextSuccess
                              : styles.badgeTextWarning,
                          ]}
                        >
                          {availableQty > 0 ? 'Available' : 'Low/Unknown'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.medicineMetaRow}>
                      <Text style={styles.metaLabel}>Stock</Text>
                      <Text style={styles.metaValue}>
                        {availableQty || 'NA'}
                      </Text>
                    </View>
                    <View style={styles.medicineMetaRow}>
                      <Text style={styles.metaLabel}>Price</Text>
                      <Text style={styles.metaValue}>
                        {retailPrice > 0 ? `₹${retailPrice}` : 'NA'}
                      </Text>
                    </View>
                    <View style={styles.medicineMetaRow}>
                      <Text style={styles.metaLabel}>Address</Text>
                      <Text style={styles.metaValue}>
                        {address || 'Address unavailable'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderInventoryList = () => {
    if (inventoryListQuery.isLoading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      );
    }

    if (inventoryListQuery.error) {
      return (
        <InlineError
          message={getErrorMessage(
            inventoryListQuery.error,
            'Unable to load inventory right now.'
          )}
          onRetry={() => inventoryListQuery.refetch()}
        />
      );
    }

    if (!inventoryItems.length) {
      return (
        <EmptyState
          title="No inventory found"
          subtitle="Add stock or switch off the low-stock filter to see more items."
        />
      );
    }

    return inventoryItems.map((item, index) => {
      const entityId = getEntityId(item);
      const isSelected = entityId === selectedInventoryId;
      const medicineName =
        item.medicine?.name ||
        item.medicine?.brandName ||
        selectedMedicine?.name ||
        getMedicineRefLabel(item.medicineId as any) ||
        'Inventory item';

      return (
        <TouchableOpacity
          key={getInventoryItemKey(item, index)}
          activeOpacity={0.88}
          onPress={() => setSelectedInventoryId(entityId)}
          style={[styles.listCard, isSelected && styles.listCardSelected]}
        >
          <View style={styles.listCardTop}>
            <View style={styles.listTitleWrap}>
              <Text style={styles.listTitle}>{medicineName}</Text>
              <Text style={styles.listSubtitle}>
                Batch {item.batchNumber || 'NA'} · Rack{' '}
                {item.rackLocation || 'NA'}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                item.lowStock ? styles.badgeWarning : styles.badgeSuccess,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  item.lowStock
                    ? styles.badgeTextWarning
                    : styles.badgeTextSuccess,
                ]}
              >
                {item.lowStock ? 'Low Stock' : 'In Stock'}
              </Text>
            </View>
          </View>

          <View style={styles.medicineMetaRow}>
            <Text style={styles.metaLabel}>Available</Text>
            <Text style={styles.metaValue}>
              {String(item.availableQuantity ?? item.quantity ?? 0)}
            </Text>
          </View>
          <View style={styles.medicineMetaRow}>
            <Text style={styles.metaLabel}>Reserved</Text>
            <Text style={styles.metaValue}>
              {String(item.reservedQuantity ?? 0)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderInventoryDetails = () => {
    if (!selectedInventoryId) {
      return (
        <EmptyState
          title="Select an inventory item"
          subtitle="Choose any stock entry to inspect quantity, pricing, and adjustment context."
        />
      );
    }

    if (inventoryDetailQuery.isLoading && !selectedInventory) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading inventory details...</Text>
        </View>
      );
    }

    if (inventoryDetailQuery.error && !selectedInventory) {
      return (
        <InlineError
          message={getErrorMessage(
            inventoryDetailQuery.error,
            'Unable to load inventory details.'
          )}
          onRetry={() => inventoryDetailQuery.refetch()}
        />
      );
    }

    if (!selectedInventory) {
      return (
        <EmptyState
          title="Inventory details unavailable"
          subtitle="Try refreshing the inventory list and selecting the item again."
        />
      );
    }

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {selectedInventory.medicine?.name ||
                selectedInventory.medicine?.brandName ||
                getMedicineRefLabel(selectedInventory.medicineId as any) ||
                'Inventory item'}
            </Text>
            <Text style={styles.detailSubtitle}>
              Batch {selectedInventory.batchNumber || 'NA'} · Rack{' '}
              {selectedInventory.rackLocation || 'NA'}
            </Text>
          </View>
        </View>

        {inventoryDetailQuery.error ? (
          <InlineError
            message={getErrorMessage(
              inventoryDetailQuery.error,
              'Showing cached inventory data.'
            )}
            onRetry={() => inventoryDetailQuery.refetch()}
          />
        ) : null}

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>
              {String(selectedInventory.quantity ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>
              {String(selectedInventory.availableQuantity ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reserved</Text>
            <Text style={styles.detailValue}>
              {String(selectedInventory.reservedQuantity ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reorder Threshold</Text>
            <Text style={styles.detailValue}>
              {String(selectedInventory.reorderThreshold ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Retail Price</Text>
            <Text style={styles.detailValue}>
              ₹{String(selectedInventory.retailPrice ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Expiry</Text>
            <Text style={styles.detailValue}>
              {selectedInventory.expiryDate || 'Not added yet'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderInventoryAdjustments = () => {
    if (inventoryAdjustmentsQuery.isLoading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading adjustments...</Text>
        </View>
      );
    }

    if (inventoryAdjustmentsQuery.error) {
      return (
        <InlineError
          message={getErrorMessage(
            inventoryAdjustmentsQuery.error,
            'Unable to load stock adjustments.'
          )}
          onRetry={() => inventoryAdjustmentsQuery.refetch()}
        />
      );
    }

    if (!inventoryAdjustments.length) {
      return (
        <EmptyState
          title="No stock adjustments yet"
          subtitle="Reserve, release, or add stock to build the adjustment history."
        />
      );
    }

    return inventoryAdjustments.map((item, index) => (
      <View
        key={getInventoryAdjustmentKey(item, index)}
        style={styles.adjustmentCard}
      >
        <View style={styles.listCardTop}>
          <View style={styles.listTitleWrap}>
            <Text style={styles.listTitle}>
              {item.medicine?.name ||
                getMedicineRefLabel(item.medicineId as any, 'Inventory change')}
            </Text>
            <Text style={styles.listSubtitle}>
              {item.reason || item.type || 'Adjustment'}
            </Text>
          </View>
          <Text style={styles.adjustmentQty}>
            {item.quantity ? `${item.quantity}` : '0'}
          </Text>
        </View>
        <Text style={styles.adjustmentNote}>
          {item.notes || formatTimestamp(item.createdAt)}
        </Text>
      </View>
    ));
  };

  const renderInventoryImportPreview = () => {
    const preview =
      inventoryImportPreviewMutation.data || selectedInventoryImport;

    if (inventoryImportPreviewMutation.isPending) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>
            Uploading file and building preview...
          </Text>
        </View>
      );
    }

    if (!preview) {
      return (
        <EmptyState
          title="No import preview yet"
          subtitle="Choose a file, preview the import, then commit once the rows look correct."
        />
      );
    }

    const previewRows = Array.isArray(preview.rows) ? preview.rows.length : 0;

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {String(
                preview.fileName ||
                  preview.originalFileName ||
                  'Inventory import preview'
              )}
            </Text>
            <Text style={styles.detailSubtitle}>
              Mode{' '}
              {String(preview.importMode || inventoryImportMode).toUpperCase()}{' '}
              · Status {String(preview.status || 'preview')}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Import ID</Text>
            <Text style={styles.detailValue}>
              {getEntityId(preview) || 'Pending'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Rows</Text>
            <Text style={styles.detailValue}>
              {String(preview.totalRows ?? previewRows ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Success Rows</Text>
            <Text style={styles.detailValue}>
              {String(preview.successRows ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Failed Rows</Text>
            <Text style={styles.detailValue}>
              {String(preview.failedRows ?? 0)}
            </Text>
          </View>
        </View>

        {Array.isArray(preview.errors) && preview.errors.length > 0 ? (
          <View style={styles.importAlertBox}>
            <Text style={styles.importAlertTitle}>Errors detected</Text>
            <Text style={styles.importAlertText}>
              {JSON.stringify(preview.errors[0])}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderInventoryImportsList = () => {
    if (inventoryImportsQuery.isLoading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading import history...</Text>
        </View>
      );
    }

    if (inventoryImportsQuery.error) {
      return (
        <InlineError
          message={getErrorMessage(
            inventoryImportsQuery.error,
            'Unable to load inventory import history.'
          )}
          onRetry={() => inventoryImportsQuery.refetch()}
        />
      );
    }

    if (!inventoryImports.length) {
      return (
        <EmptyState
          title="No inventory imports yet"
          subtitle="Preview and commit a file to start your import history."
        />
      );
    }

    return inventoryImports.map((item, index) => {
      const entityId = getEntityId(item);
      const isSelected = entityId === selectedInventoryImportId;
      return (
        <TouchableOpacity
          key={getInventoryImportKey(item, index)}
          activeOpacity={0.88}
          onPress={() => setSelectedInventoryImportId(entityId)}
          style={[styles.listCard, isSelected && styles.listCardSelected]}
        >
          <View style={styles.listCardTop}>
            <View style={styles.listTitleWrap}>
              <Text style={styles.listTitle}>
                {String(
                  item.fileName || item.originalFileName || 'Inventory import'
                )}
              </Text>
              <Text style={styles.listSubtitle}>
                {String(item.importMode || 'upsert').toUpperCase()} ·{' '}
                {formatTimestamp(item.createdAt)}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                Number(item.failedRows || 0) > 0
                  ? styles.badgeWarning
                  : styles.badgeSuccess,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  Number(item.failedRows || 0) > 0
                    ? styles.badgeTextWarning
                    : styles.badgeTextSuccess,
                ]}
              >
                {String(item.status || 'processed')}
              </Text>
            </View>
          </View>
          <View style={styles.medicineMetaRow}>
            <Text style={styles.metaLabel}>Rows</Text>
            <Text style={styles.metaValue}>
              {String(item.totalRows ?? item.processedRows ?? 0)}
            </Text>
          </View>
          <View style={styles.medicineMetaRow}>
            <Text style={styles.metaLabel}>Failures</Text>
            <Text style={styles.metaValue}>{String(item.failedRows ?? 0)}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderInventoryImportDetails = () => {
    if (!selectedInventoryImportId) {
      return (
        <EmptyState
          title="Select an import"
          subtitle="Tap an import from history to inspect status, row counts, and errors."
        />
      );
    }

    if (inventoryImportDetailQuery.isLoading && !selectedInventoryImport) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading import details...</Text>
        </View>
      );
    }

    if (inventoryImportDetailQuery.error && !selectedInventoryImport) {
      return (
        <InlineError
          message={getErrorMessage(
            inventoryImportDetailQuery.error,
            'Unable to load import details.'
          )}
          onRetry={() => inventoryImportDetailQuery.refetch()}
        />
      );
    }

    if (!selectedInventoryImport) {
      return (
        <EmptyState
          title="Import details unavailable"
          subtitle="Refresh the import history and choose the import again."
        />
      );
    }

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {String(
                selectedInventoryImport.fileName ||
                  selectedInventoryImport.originalFileName ||
                  'Inventory import'
              )}
            </Text>
            <Text style={styles.detailSubtitle}>
              {String(selectedInventoryImport.status || 'processed')} · ID{' '}
              {getEntityId(selectedInventoryImport)}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Mode</Text>
            <Text style={styles.detailValue}>
              {String(
                selectedInventoryImport.importMode || 'upsert'
              ).toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Processed Rows</Text>
            <Text style={styles.detailValue}>
              {String(
                selectedInventoryImport.processedRows ??
                  selectedInventoryImport.totalRows ??
                  0
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Success Rows</Text>
            <Text style={styles.detailValue}>
              {String(selectedInventoryImport.successRows ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Failed Rows</Text>
            <Text style={styles.detailValue}>
              {String(selectedInventoryImport.failedRows ?? 0)}
            </Text>
          </View>
        </View>

        {Array.isArray(selectedInventoryImport.errors) &&
        selectedInventoryImport.errors.length > 0 ? (
          <View style={styles.importAlertBox}>
            <Text style={styles.importAlertTitle}>Latest error</Text>
            <Text style={styles.importAlertText}>
              {JSON.stringify(selectedInventoryImport.errors[0])}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderOrdersList = () => {
    if (ordersQuery.isLoading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading pharmacy orders...</Text>
        </View>
      );
    }

    if (ordersQuery.error) {
      return (
        <InlineError
          message={getErrorMessage(
            ordersQuery.error,
            'Unable to load pharmacy orders right now.'
          )}
          onRetry={() => ordersQuery.refetch()}
        />
      );
    }

    if (!orders.length) {
      return (
        <EmptyState
          title="No pharmacy orders found"
          subtitle="Create a new order or relax the status/payment filters."
        />
      );
    }

    return orders.map((item) => {
      const entityId = getEntityId(item);
      const isSelected = entityId === selectedOrderId;
      const firstItem = item.items?.[0];
      return (
        <TouchableOpacity
          key={entityId}
          activeOpacity={0.88}
          onPress={() => setSelectedOrderId(entityId)}
          style={[styles.listCard, isSelected && styles.listCardSelected]}
        >
          <View style={styles.listCardTop}>
            <View style={styles.listTitleWrap}>
              <Text style={styles.listTitle}>
                {firstItem?.medicineName ||
                  firstItem?.medicineId ||
                  'Pharmacy order'}
              </Text>
              <Text style={styles.listSubtitle}>
                {String(item.orderType || 'online').toUpperCase()} · Customer{' '}
                {item.customerId || 'NA'}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                String(item.paymentStatus || '').toLowerCase() === 'paid'
                  ? styles.badgeSuccess
                  : styles.badgeWarning,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  String(item.paymentStatus || '').toLowerCase() === 'paid'
                    ? styles.badgeTextSuccess
                    : styles.badgeTextWarning,
                ]}
              >
                {String(item.paymentStatus || 'pending')}
              </Text>
            </View>
          </View>
          <View style={styles.medicineMetaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>
              {String(item.status || 'placed')}
            </Text>
          </View>
          <View style={styles.medicineMetaRow}>
            <Text style={styles.metaLabel}>Qty</Text>
            <Text style={styles.metaValue}>
              {String(firstItem?.orderedQty || 0)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderOrderDetails = () => {
    if (!selectedOrderId) {
      return (
        <EmptyState
          title="Select an order"
          subtitle="Choose a pharmacy order to review items, payment, and delivery details."
        />
      );
    }

    if (orderDetailQuery.isLoading && !selectedOrder) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      );
    }

    if (orderDetailQuery.error && !selectedOrder) {
      return (
        <InlineError
          message={getErrorMessage(
            orderDetailQuery.error,
            'Unable to load pharmacy order details.'
          )}
          onRetry={() => orderDetailQuery.refetch()}
        />
      );
    }

    if (!selectedOrder) {
      return (
        <EmptyState
          title="Order details unavailable"
          subtitle="Refresh the list and choose the order again."
        />
      );
    }

    const firstItem = selectedOrder.items?.[0];
    const statusToneStyle =
      selectedOrderStatus === 'cancelled'
        ? styles.detailStatusDanger
        : selectedOrderStatus === 'delivered'
        ? styles.detailStatusSuccess
        : selectedOrderPaymentStatus === 'pending'
        ? styles.detailStatusWarning
        : styles.detailStatusInfo;

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {firstItem?.medicineName ||
                firstItem?.medicineId ||
                'Pharmacy order'}
            </Text>
            <Text style={styles.detailSubtitle}>
              {String(selectedOrder.status || 'placed')} ·{' '}
              {String(selectedOrder.paymentStatus || 'pending')}
            </Text>
          </View>
        </View>

        <View style={[styles.detailStatusBanner, statusToneStyle]}>
          <Text style={styles.detailStatusEyebrow}>Current Workflow</Text>
          <Text style={styles.detailStatusTitle}>
            {selectedOrderStatus === 'cancelled'
              ? 'Order cancelled'
              : selectedOrderStatus === 'delivered'
              ? 'Order delivered'
              : selectedOrderPaymentStatus === 'pending'
              ? 'Payment is still pending'
              : 'Order is actively in progress'}
          </Text>
          <Text style={styles.detailStatusText}>
            {selectedOrderPaymentStatus === 'pending'
              ? 'Use Mark Paid or update the order status after confirming payment.'
              : selectedOrderStatus === 'ready'
              ? 'This order is ready for pickup or final delivery handoff.'
              : selectedOrderStatus === 'processing'
              ? 'Continue updating status as the order moves toward readiness.'
              : 'Only actions relevant to the current state are shown above.'}
          </Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Customer ID</Text>
            <Text style={styles.detailValue}>
              {selectedOrder.customerId || 'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Mode</Text>
            <Text style={styles.detailValue}>
              {selectedOrder.paymentMode || 'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Delivery Mode</Text>
            <Text style={styles.detailValue}>
              {selectedOrder.deliveryMode || 'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ordered Qty</Text>
            <Text style={styles.detailValue}>
              {String(firstItem?.orderedQty || 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Recurring</Text>
            <Text style={styles.detailValue}>
              {firstItem?.recurring ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(
                selectedOrder.updatedAt || selectedOrder.createdAt
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.customerNotesLabel}>Delivery Address</Text>
        <Text style={styles.customerNotes}>
          {selectedOrder.deliveryAddress || 'No delivery address added yet.'}
        </Text>

        <Text style={styles.customerNotesLabel}>Notes</Text>
        <Text style={styles.customerNotes}>
          {selectedOrder.notes || 'No order notes added yet.'}
        </Text>

        <Text style={styles.customerNotesLabel}>Health Check</Text>
        {orderHealthCheckQuery.isLoading ? (
          <Text style={styles.customerNotes}>Loading latest readings...</Text>
        ) : orderHealthCheck ? (
          <Text style={styles.customerNotes}>
            BP {orderHealthCheck.systolicBP || '-'} /{' '}
            {orderHealthCheck.diastolicBP || '-'} · Fasting{' '}
            {orderHealthCheck.fastingSugar || '-'} · Post Meal{' '}
            {orderHealthCheck.postMealSugar || '-'} · HbA1c{' '}
            {orderHealthCheck.hba1c || '-'}
            {orderHealthCheck.notes ? `\n${orderHealthCheck.notes}` : ''}
          </Text>
        ) : (
          <Text style={styles.customerNotes}>
            No order health check has been added yet.
          </Text>
        )}
      </View>
    );
  };

  const renderSubscriptionsList = () => null;

  const renderSubscriptionDetails = () => {
    if (!selectedSubscriptionId) {
      return (
        <EmptyState
          title="Select a subscription"
          subtitle="Choose a refill plan to review interval and reminder settings."
        />
      );
    }

    if (!selectedSubscription) {
      return (
        <EmptyState
          title="Subscription unavailable"
          subtitle="Refresh the list and select the subscription again."
        />
      );
    }

    const firstItem = selectedSubscription.items?.[0];

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {firstItem?.medicineName ||
                firstItem?.medicineId ||
                'Subscription'}
            </Text>
            <Text style={styles.detailSubtitle}>
              {String(
                selectedSubscription.status ||
                  (selectedSubscription.pausedUntil ? 'paused' : 'active')
              )}{' '}
              · ID {selectedSubscriptionId}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>User ID</Text>
            <Text style={styles.detailValue}>
              {selectedSubscription.userId ||
                selectedSubscription.customerId ||
                'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>
              {firstItem?.frequency || 'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Interval Days</Text>
            <Text style={styles.detailValue}>
              {String(firstItem?.intervalDays || '-')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reminder Channel</Text>
            <Text style={styles.detailValue}>
              {firstItem?.reminderChannel || 'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Next Refill</Text>
            <Text style={styles.detailValue}>
              {firstItem?.nextRefillDate || 'NA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Paused Until</Text>
            <Text style={styles.detailValue}>
              {selectedSubscription.pausedUntil || 'Not paused'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWalletTransactions = () => {
    if (walletTransactionsQuery.isLoading) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading wallet transactions...</Text>
        </View>
      );
    }

    if (walletTransactionsQuery.error) {
      return (
        <InlineError
          message={getErrorMessage(
            walletTransactionsQuery.error,
            'Unable to load wallet transactions right now.'
          )}
          onRetry={() => walletTransactionsQuery.refetch()}
        />
      );
    }

    if (!walletTransactions.length) {
      return (
        <EmptyState
          title="No wallet transactions found"
          subtitle="Top up the wallet to begin your wallet history."
        />
      );
    }

    return walletTransactions.map((item) => (
      <View key={getEntityId(item)} style={styles.adjustmentCard}>
        <View style={styles.listCardTop}>
          <View style={styles.listTitleWrap}>
            <Text style={styles.listTitle}>
              {String(item.type || 'transaction').toUpperCase()}
            </Text>
            <Text style={styles.listSubtitle}>
              {String(item.status || 'processed')} ·{' '}
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.adjustmentQty}>₹{String(item.amount ?? 0)}</Text>
        </View>
        <Text style={styles.adjustmentNote}>
          {item.notes || 'No transaction note added.'}
        </Text>
      </View>
    ));
  };

  const renderWalletDetails = () => {
    if (walletSummaryQuery.isLoading && !walletSummary) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading wallet balance...</Text>
        </View>
      );
    }

    if (walletSummaryQuery.error && !walletSummary) {
      return (
        <InlineError
          message={getErrorMessage(
            walletSummaryQuery.error,
            'Unable to load the wallet summary.'
          )}
          onRetry={() => walletSummaryQuery.refetch()}
        />
      );
    }

    if (!walletSummary) {
      return (
        <EmptyState
          title="Wallet summary unavailable"
          subtitle="Refresh the pharmacy wallet to fetch the latest balance."
        />
      );
    }

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>Pharmacy Wallet</Text>
            <Text style={styles.detailSubtitle}>
              Balance and recent activity
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available Balance</Text>
            <Text style={styles.detailValue}>
              ₹
              {String(
                walletSummary.availableBalance ??
                  walletSummary.balance ??
                  walletSummary.totalBalance ??
                  0
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Currency</Text>
            <Text style={styles.detailValue}>
              {String(walletSummary.currency || 'INR')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(
                walletSummary.updatedAt || walletSummary.createdAt
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPatientTrackingDetails = () => {
    if (!selectedTrackingCustomerId) {
      return (
        <EmptyState
          title="Select a customer"
          subtitle="Choose a customer to view patient tracking notes and follow-up details."
        />
      );
    }

    if (patientTrackingQuery.isLoading && !patientTracking) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading patient tracking...</Text>
        </View>
      );
    }

    if (patientTrackingQuery.error && !patientTracking) {
      return (
        <InlineError
          message={getErrorMessage(
            patientTrackingQuery.error,
            'Unable to load patient tracking right now.'
          )}
          onRetry={() => patientTrackingQuery.refetch()}
        />
      );
    }

    if (!patientTracking) {
      return (
        <EmptyState
          title="Patient tracking unavailable"
          subtitle="Refresh customer tracking and choose the patient again."
        />
      );
    }

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {patientTracking.name ||
                selectedTrackingCustomer?.name ||
                'Patient tracking'}
            </Text>
            <Text style={styles.detailSubtitle}>
              {patientTracking.phone ||
                selectedTrackingCustomer?.phone ||
                'Phone unavailable'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openPatientTrackingModal}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>Update</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Chronic Condition</Text>
            <Text style={styles.detailValue}>
              {patientTracking.chronicCondition ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Recurring Medicine</Text>
            <Text style={styles.detailValue}>
              {patientTracking.recurringMedicine ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Recurring Interval</Text>
            <Text style={styles.detailValue}>
              {String(patientTracking.recurringIntervalDays || '-')} days
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Follow-up Date</Text>
            <Text style={styles.detailValue}>
              {String(patientTracking.preferredFollowUpDate || 'Not set')}
            </Text>
          </View>
        </View>

        <Text style={styles.customerNotesLabel}>Disease Notes</Text>
        <Text style={styles.customerNotes}>
          {String(
            patientTracking.diseaseNotes || 'No disease notes added yet.'
          )}
        </Text>

        <Text style={styles.customerNotesLabel}>Pharmacy Notes</Text>
        <Text style={styles.customerNotes}>
          {String(
            patientTracking.pharmacyNotes || 'No pharmacy notes added yet.'
          )}
        </Text>
      </View>
    );
  };

  const renderTrackingCustomerList = () => null;

  const renderPharmacyTrackingSummary = () => {
    if (
      pharmacyTrackingSummaryQuery.isLoading &&
      pharmacyTrackingByIdQuery.isLoading &&
      !pharmacyTrackingSummary
    ) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>
            Loading pharmacy tracking summary...
          </Text>
        </View>
      );
    }

    if (
      pharmacyTrackingSummaryQuery.error &&
      pharmacyTrackingByIdQuery.error &&
      !pharmacyTrackingSummary
    ) {
      return (
        <InlineError
          message={getErrorMessage(
            pharmacyTrackingByIdQuery.error ||
              pharmacyTrackingSummaryQuery.error,
            'Unable to load pharmacy tracking summary.'
          )}
          onRetry={() => {
            pharmacyTrackingSummaryQuery.refetch();
            pharmacyTrackingByIdQuery.refetch();
          }}
        />
      );
    }

    if (!pharmacyTrackingSummary) {
      return (
        <EmptyState
          title="Tracking summary unavailable"
          subtitle="Refresh the summary to fetch the latest pharmacy activity totals."
        />
      );
    }

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>Pharmacy Tracking Summary</Text>
            <Text style={styles.detailSubtitle}>
              Performance snapshot for this pharmacy
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Customers</Text>
            <Text style={styles.detailValue}>
              {String(
                pharmacyTrackingSummary.totalCustomers ?? customers.length
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Active Subscriptions</Text>
            <Text style={styles.detailValue}>
              {String(
                pharmacyTrackingSummary.activeSubscriptions ??
                  subscriptionStats.active
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pending Orders</Text>
            <Text style={styles.detailValue}>
              {String(
                pharmacyTrackingSummary.pendingOrders ?? orderStats.pending
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Low Stock Count</Text>
            <Text style={styles.detailValue}>
              {String(
                pharmacyTrackingSummary.lowStockCount ?? inventoryStats.lowStock
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Orders</Text>
            <Text style={styles.detailValue}>
              {String(pharmacyTrackingSummary.totalOrders ?? orderStats.total)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Revenue</Text>
            <Text style={styles.detailValue}>
              ₹{String(pharmacyTrackingSummary.totalRevenue ?? 0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDiagnosticsDetails = () => {
    if (!selectedDiagnosticsBookingId && !diagnosticsPaymentDetails) {
      return (
        <EmptyState
          title="No diagnostics booking selected"
          subtitle="Create a diagnostics booking or paste a booking ID to manage payment actions."
        />
      );
    }

    if (
      diagnosticsPaymentDetailsQuery.isLoading &&
      !diagnosticsPaymentDetails
    ) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>
            Loading diagnostics payment details...
          </Text>
        </View>
      );
    }

    if (diagnosticsPaymentDetailsQuery.error && !diagnosticsPaymentDetails) {
      return (
        <InlineError
          message={getErrorMessage(
            diagnosticsPaymentDetailsQuery.error,
            'Unable to load diagnostics payment details.'
          )}
          onRetry={() => diagnosticsPaymentDetailsQuery.refetch()}
        />
      );
    }

    const details = diagnosticsPaymentDetails as Record<string, unknown>;

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>
              {String(details?.patientName || 'Diagnostics booking')}
            </Text>
            <Text style={styles.detailSubtitle}>
              Booking{' '}
              {selectedDiagnosticsBookingId ||
                getDiagnosticsBookingId(details as any)}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <Text style={styles.detailValue}>
              {String(details?.paymentStatus || 'Pending')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Booking Status</Text>
            <Text style={styles.detailValue}>
              {String(details?.status || 'Created')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {String(details?.bookingDate || 'NA')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {String(details?.bookingTime || 'NA')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              ₹{String(details?.amount ?? 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Option</Text>
            <Text style={styles.detailValue}>
              {String(details?.paymentOption || 'NA')}
            </Text>
          </View>
        </View>

        <Text style={styles.customerNotesLabel}>Tests</Text>
        <Text style={styles.customerNotes}>
          {Array.isArray(details?.testNames)
            ? details.testNames.join(', ')
            : 'No tests captured yet.'}
        </Text>

        <Text style={styles.customerNotesLabel}>Address</Text>
        <Text style={styles.customerNotes}>
          {String(details?.addressLine || 'No address available')}
        </Text>
      </View>
    );
  };

  const renderCustomers = () => null;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={
              medicinesQuery.isRefetching ||
              inventoryListQuery.isRefetching ||
              inventoryAdjustmentsQuery.isRefetching ||
              inventoryImportsQuery.isRefetching ||
              ordersQuery.isRefetching ||
              subscriptionsQuery.isRefetching ||
              walletSummaryQuery.isRefetching ||
              walletTransactionsQuery.isRefetching ||
              patientTrackingQuery.isRefetching ||
              pharmacyTrackingSummaryQuery.isRefetching ||
              pharmacyTrackingByIdQuery.isRefetching ||
              diagnosticsPaymentDetailsQuery.isRefetching ||
              customersQuery.isRefetching
            }
            onRefresh={() => {
              medicinesQuery.refetch();
              inventoryListQuery.refetch();
              inventoryAdjustmentsQuery.refetch();
              inventoryImportsQuery.refetch();
              ordersQuery.refetch();
              subscriptionsQuery.refetch();
              walletSummaryQuery.refetch();
              walletTransactionsQuery.refetch();
              customersQuery.refetch();
              if (selectedTrackingCustomerId) {
                patientTrackingQuery.refetch();
              }
              pharmacyTrackingSummaryQuery.refetch();
              pharmacyTrackingByIdQuery.refetch();
              if (selectedDiagnosticsBookingId) {
                diagnosticsPaymentDetailsQuery.refetch();
              }
              if (selectedMedicineId) {
                medicineDetailQuery.refetch();
              }
              if (selectedInventoryId) {
                inventoryDetailQuery.refetch();
              }
              if (selectedInventoryImportId) {
                inventoryImportDetailQuery.refetch();
              }
              if (selectedOrderId) {
                orderDetailQuery.refetch();
                orderHealthCheckQuery.refetch();
              }
            }}
            tintColor={colors.primaryBlue}
          />
        }
      >
        <View style={[styles.innerContainer, { width: contentWidth }]}>
          {!lockedSection ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sectionToggleRowContent}
                style={styles.sectionToggleRow}
              >
                <SectionToggle
                  active={activeSection === 'medicines'}
                  label="Medicines"
                  onPress={() => setActiveSection('medicines')}
                  icon={
                    <Pill
                      size={scale(18)}
                      color={
                        activeSection === 'medicines'
                          ? '#fff'
                          : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'customers'}
                  label="Customers"
                  onPress={() => setActiveSection('customers')}
                  icon={
                    <UserRound
                      size={scale(18)}
                      color={
                        activeSection === 'customers'
                          ? '#fff'
                          : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'inventory'}
                  label="Inventory"
                  onPress={() => setActiveSection('inventory')}
                  icon={
                    <ShieldCheck
                      size={scale(18)}
                      color={
                        activeSection === 'inventory'
                          ? '#fff'
                          : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'orders'}
                  label="Orders"
                  onPress={() => setActiveSection('orders')}
                  icon={
                    <ArrowRight
                      size={scale(18)}
                      color={
                        activeSection === 'orders' ? '#fff' : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'subscriptions'}
                  label="Subscriptions"
                  onPress={() => setActiveSection('subscriptions')}
                  icon={
                    <Clock3
                      size={scale(18)}
                      color={
                        activeSection === 'subscriptions'
                          ? '#fff'
                          : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'wallet'}
                  label="Wallet"
                  onPress={() => setActiveSection('wallet')}
                  icon={
                    <ShieldCheck
                      size={scale(18)}
                      color={
                        activeSection === 'wallet' ? '#fff' : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'tracking'}
                  label="Tracking"
                  onPress={() => setActiveSection('tracking')}
                  icon={
                    <Users
                      size={scale(18)}
                      color={
                        activeSection === 'tracking'
                          ? '#fff'
                          : colors.primaryBlue
                      }
                    />
                  }
                />
                <SectionToggle
                  active={activeSection === 'diagnostics'}
                  label="Diagnostics"
                  onPress={() => setActiveSection('diagnostics')}
                  icon={
                    <CircleAlert
                      size={scale(18)}
                      color={
                        activeSection === 'diagnostics'
                          ? '#fff'
                          : colors.primaryBlue
                      }
                    />
                  }
                />
              </ScrollView>
            </>
          ) : null}

          {activeSection === 'medicines' ? (
            <View style={[styles.sectionCard, styles.sectionCardMedicines]}>
              <View style={styles.medicinesStorefrontTop}>
                <View style={styles.medicinesStorefrontSearchRow}>
                  <View style={styles.medicinesStorefrontSearchBar}>
                    <Search size={scale(18)} color="#1F2937" />
                    <TextInput
                      value={medicineSearchInput}
                      onChangeText={setMedicineSearchInput}
                      placeholder='Search for "dolo & more"'
                      placeholderTextColor="#6B7280"
                      style={styles.medicinesStorefrontSearchInput}
                    />
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.medicineShelfTabsScroll}
                  contentContainerStyle={styles.medicineShelfTabsContent}
                >
                  {medicineShelfTabs.map((tab) => {
                    const isActive = tab.key === medicineShelfTab;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        activeOpacity={0.85}
                        onPress={() => setMedicineShelfTab(tab.key)}
                        style={styles.medicineShelfTabPill}
                      >
                        <Text
                          style={[
                            styles.medicineShelfTabPillText,
                            isActive && styles.medicineShelfTabPillTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                        {isActive ? (
                          <View style={styles.medicineShelfTabUnderline} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.medicinesListPanel}>
                <View style={styles.medicinesStorefrontHeader}>
                  <Text style={styles.medicinesStorefrontHeading}>Buy Again</Text>
                  <Text style={styles.medicinesStorefrontDivider}>
                    Page {medicinePage} · {filteredMedicines.length} items
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.medicineBrowseTabs}
                  style={styles.medicineBrowseTabsScroll}
                >
                  {medicineBrowseTabs.map((tab) => {
                    const isActive = tab.key === medicineBrowseTab;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        activeOpacity={0.85}
                        onPress={() => setMedicineBrowseTab(tab.key)}
                        style={[
                          styles.medicineBrowseTab,
                          isActive && styles.medicineBrowseTabActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.medicineBrowseTabText,
                            isActive && styles.medicineBrowseTabTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {renderMedicineList()}
              </View>
            </View>
          ) : activeSection === 'inventory' ? (
            <View style={[styles.sectionCard, styles.sectionCardInventory]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchHint}>
                    {selectedMedicineId ? 'Filtered stock' : 'All stock'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    isTablet && styles.toolbarActionsTabletWide,
                  ]}
                >
                  {(inventoryStats.lowStock > 0 || inventoryLowStockOnly) && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setInventoryLowStockOnly((current) => !current);
                        setInventoryPage(1);
                      }}
                      style={[
                        styles.filterAction,
                        inventoryLowStockOnly && styles.filterActionActive,
                      ]}
                    >
                      <CircleAlert
                        size={scale(15)}
                        color={
                          inventoryLowStockOnly ? '#FFFFFF' : colors.primaryBlue
                        }
                      />
                      <Text
                        style={[
                          styles.filterActionText,
                          inventoryLowStockOnly &&
                            styles.filterActionTextActive,
                        ]}
                      >
                        Low Stock
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Stock entries"
                  value={String(inventoryStats.total)}
                  accent="rgba(21,114,183,0.10)"
                  icon={<Pill size={scale(18)} color={colors.primaryBlue} />}
                />
                {(inventoryStats.lowStock > 0 || inventoryLowStockOnly) && (
                  <StatCard
                    label="Low stock"
                    value={String(inventoryStats.lowStock)}
                    accent="rgba(233,84,84,0.12)"
                    icon={<CircleAlert size={scale(18)} color="#D14343" />}
                  />
                )}
                <StatCard
                  label="Reserved qty"
                  value={String(inventoryStats.reserved)}
                  accent="rgba(245,158,11,0.14)"
                  icon={<Clock3 size={scale(18)} color="#D97706" />}
                />
                <StatCard
                  label="Import previews"
                  value={String(inventoryImportStats.pending)}
                  accent="rgba(64,179,70,0.12)"
                  icon={<Users size={scale(18)} color={colors.primaryGreen} />}
                />
              </View>

              <View style={styles.inventoryActionRow}>
                <PrimaryButton
                  title="Add Stock"
                  onPress={openInventoryCreateModal}
                  icon={<Plus size={scale(18)} color="#fff" />}
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Reserve Stock"
                  onPress={() => openInventoryActionModal('reserve')}
                  variant="outline"
                  icon={
                    <ShieldCheck size={scale(16)} color={colors.primaryBlue} />
                  }
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Release Stock"
                  onPress={() => openInventoryActionModal('release')}
                  variant="outline"
                  icon={
                    <RefreshCw size={scale(16)} color={colors.primaryBlue} />
                  }
                  style={styles.inventoryActionButton}
                />
              </View>

              <View style={styles.importWorkspace}>
                <View style={styles.importWorkspaceHeader}>
                  <Text style={styles.panelTitle}>Inventory Imports</Text>
                  <Text style={styles.panelSubtitle}>Bulk stock updates</Text>
                </View>

                <View style={styles.importControlRow}>
                  <PrimaryButton
                    title={inventoryImportFile ? 'Change File' : 'Choose File'}
                    onPress={pickInventoryImportFile}
                    variant="outline"
                    icon={
                      <FileUp size={scale(16)} color={colors.primaryBlue} />
                    }
                    style={styles.importControlButton}
                  />
                  <PrimaryButton
                    title="Preview Import"
                    onPress={submitInventoryImportPreview}
                    loading={inventoryImportPreviewMutation.isPending}
                    icon={<Search size={scale(16)} color="#FFFFFF" />}
                    style={styles.importControlButton}
                  />
                  <PrimaryButton
                    title="Commit Import"
                    onPress={submitInventoryImportCommit}
                    loading={inventoryImportCommitMutation.isPending}
                    variant="green"
                    icon={<ShieldCheck size={scale(16)} color="#FFFFFF" />}
                    style={styles.importControlButton}
                  />
                </View>

                <View style={styles.importModeRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setInventoryImportMode('upsert')}
                    style={[
                      styles.filterAction,
                      inventoryImportMode === 'upsert' &&
                        styles.filterActionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterActionText,
                        inventoryImportMode === 'upsert' &&
                          styles.filterActionTextActive,
                      ]}
                    >
                      Upsert
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setInventoryImportMode('insert')}
                    style={[
                      styles.filterAction,
                      inventoryImportMode === 'insert' &&
                        styles.filterActionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterActionText,
                        inventoryImportMode === 'insert' &&
                          styles.filterActionTextActive,
                      ]}
                    >
                      Insert
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.importFileText}>
                    {inventoryImportFile?.name || 'No file selected'}
                  </Text>
                </View>

                {renderInventoryImportPreview()}

                <View
                  style={[
                    styles.panelLayout,
                    isTablet && styles.panelLayoutTablet,
                  ]}
                >
                  <View
                    style={[
                      styles.panel,
                      isTablet && styles.medicineListPanelTablet,
                    ]}
                  >
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>Import History</Text>
                      <Text style={styles.panelSubtitle}>
                        Page {inventoryImportPage} · {inventoryImports.length}{' '}
                        result
                        {inventoryImports.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    {renderInventoryImportsList()}
                    <View style={styles.paginationRow}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={inventoryImportPage === 1}
                        onPress={() =>
                          setInventoryImportPage((current) =>
                            Math.max(1, current - 1)
                          )
                        }
                        style={[
                          styles.paginationButton,
                          inventoryImportPage === 1 &&
                            styles.paginationButtonDisabled,
                        ]}
                      >
                        <ChevronLeft
                          size={scale(16)}
                          color={
                            inventoryImportPage === 1
                              ? colors.textLight
                              : colors.primaryBlue
                          }
                        />
                        <Text
                          style={[
                            styles.paginationText,
                            inventoryImportPage === 1 &&
                              styles.paginationTextDisabled,
                          ]}
                        >
                          Previous
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={inventoryImports.length < 20}
                        onPress={() =>
                          setInventoryImportPage((current) => current + 1)
                        }
                        style={[
                          styles.paginationButton,
                          inventoryImports.length < 20 &&
                            styles.paginationButtonDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.paginationText,
                            inventoryImports.length < 20 &&
                              styles.paginationTextDisabled,
                          ]}
                        >
                          Next
                        </Text>
                        <ChevronRight
                          size={scale(16)}
                          color={
                            inventoryImports.length < 20
                              ? colors.textLight
                              : colors.primaryBlue
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.panel,
                      isTablet && styles.medicineDetailPanelTablet,
                    ]}
                  >
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>Import Details</Text>
                      <Text style={styles.panelSubtitle}>Import status</Text>
                    </View>
                    {renderInventoryImportDetails()}
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineListPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Stock List</Text>
                    <Text style={styles.panelSubtitle}>
                      Page {inventoryPage} · {inventoryItems.length} result
                      {inventoryItems.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {renderInventoryList()}
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={inventoryPage === 1}
                      onPress={() =>
                        setInventoryPage((current) => Math.max(1, current - 1))
                      }
                      style={[
                        styles.paginationButton,
                        inventoryPage === 1 && styles.paginationButtonDisabled,
                      ]}
                    >
                      <ChevronLeft
                        size={scale(16)}
                        color={
                          inventoryPage === 1
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                      <Text
                        style={[
                          styles.paginationText,
                          inventoryPage === 1 && styles.paginationTextDisabled,
                        ]}
                      >
                        Previous
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={inventoryItems.length < 20}
                      onPress={() => setInventoryPage((current) => current + 1)}
                      style={[
                        styles.paginationButton,
                        inventoryItems.length < 20 &&
                          styles.paginationButtonDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paginationText,
                          inventoryItems.length < 20 &&
                            styles.paginationTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <ChevronRight
                        size={scale(16)}
                        color={
                          inventoryItems.length < 20
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Stock Details</Text>
                    <Text style={styles.panelSubtitle}>
                      Stock and adjustments
                    </Text>
                  </View>
                  {renderInventoryDetails()}
                  <View style={styles.adjustmentsSection}>
                    <Text style={styles.adjustmentsTitle}>
                      Recent Adjustments
                    </Text>
                    {renderInventoryAdjustments()}
                  </View>
                </View>
              </View>
            </View>
          ) : activeSection === 'orders' ? (
            <View style={[styles.sectionCard, styles.sectionCardOrders]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchHint}>
                    Filters: status {orderStatusFilter} · payment{' '}
                    {orderPaymentFilter}
                  </Text>
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    styles.orderToolbarActions,
                    isTablet && styles.toolbarActionsTabletWide,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      setOrderStatusFilter((current) =>
                        current === 'placed' ? 'accepted' : 'placed'
                      )
                    }
                    style={[styles.filterAction, styles.orderFilterAction]}
                  >
                    <Text style={styles.filterActionText}>Toggle Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      setOrderPaymentFilter((current) =>
                        current === 'pending' ? 'paid' : 'pending'
                      )
                    }
                    style={[styles.filterAction, styles.orderFilterAction]}
                  >
                    <Text style={styles.filterActionText}>Toggle Payment</Text>
                  </TouchableOpacity>
                  <PrimaryButton
                    title="New Order"
                    onPress={openOrderCreateModal}
                    icon={<Plus size={scale(18)} color="#fff" />}
                    style={styles.orderToolbarPrimaryButton}
                  />
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Orders"
                  value={String(orderStats.total)}
                  accent="rgba(21,114,183,0.10)"
                  icon={
                    <ArrowRight size={scale(18)} color={colors.primaryBlue} />
                  }
                />
                <StatCard
                  label="Accepted"
                  value={String(orderStats.accepted)}
                  accent="rgba(64,179,70,0.12)"
                  icon={
                    <ShieldCheck size={scale(18)} color={colors.primaryGreen} />
                  }
                />
                <StatCard
                  label="Pending Payment"
                  value={String(orderStats.pending)}
                  accent="rgba(245,158,11,0.14)"
                  icon={<Clock3 size={scale(18)} color="#D97706" />}
                />
              </View>

              <View style={[styles.inventoryActionRow, styles.orderActionRow]}>
                {orderActionItems.length ? (
                  orderActionItems.map((action) => (
                    <PrimaryButton
                      key={action.key}
                      title={action.title}
                      onPress={action.onPress}
                      variant={action.variant}
                      icon={
                        <ArrowRight
                          size={scale(16)}
                          color={
                            action.variant === 'outline'
                              ? colors.primaryBlue
                              : '#FFFFFF'
                          }
                        />
                      }
                      style={styles.orderActionButton}
                    />
                  ))
                ) : (
                  <View style={styles.orderActionEmptyState}>
                    <Text style={styles.orderActionEmptyTitle}>
                      Select an order to continue
                    </Text>
                    <Text style={styles.orderActionEmptyText}>
                      Choose an order to view actions.
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineListPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Order List</Text>
                    <Text style={styles.panelSubtitle}>
                      Page {orderPage} · {orders.length} result
                      {orders.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {renderOrdersList()}
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={orderPage === 1}
                      onPress={() =>
                        setOrderPage((current) => Math.max(1, current - 1))
                      }
                      style={[
                        styles.paginationButton,
                        orderPage === 1 && styles.paginationButtonDisabled,
                      ]}
                    >
                      <ChevronLeft
                        size={scale(16)}
                        color={
                          orderPage === 1
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                      <Text
                        style={[
                          styles.paginationText,
                          orderPage === 1 && styles.paginationTextDisabled,
                        ]}
                      >
                        Previous
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={orders.length < 20}
                      onPress={() => setOrderPage((current) => current + 1)}
                      style={[
                        styles.paginationButton,
                        orders.length < 20 && styles.paginationButtonDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paginationText,
                          orders.length < 20 && styles.paginationTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <ChevronRight
                        size={scale(16)}
                        color={
                          orders.length < 20
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Order Details</Text>
                    <Text style={styles.panelSubtitle}>Order summary</Text>
                  </View>
                  {renderOrderDetails()}
                </View>
              </View>
            </View>
          ) : activeSection === 'subscriptions' ? (
            <View style={[styles.sectionCard, styles.sectionCardSubscriptions]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchHint}>Refill plans</Text>
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    isTablet && styles.toolbarActionsTabletWide,
                  ]}
                >
                <PrimaryButton
                  title="New Subscription"
                  onPress={openSubscriptionCreateModal}
                  icon={<Plus size={scale(18)} color="#fff" />}
                  style={styles.inventoryActionButton}
                />
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Subscriptions"
                  value={String(subscriptionStats.total)}
                  accent="rgba(21,114,183,0.10)"
                  icon={<Clock3 size={scale(18)} color={colors.primaryBlue} />}
                />
                <StatCard
                  label="Active"
                  value={String(subscriptionStats.active)}
                  accent="rgba(64,179,70,0.12)"
                  icon={
                    <ShieldCheck size={scale(18)} color={colors.primaryGreen} />
                  }
                />
                <StatCard
                  label="Paused"
                  value={String(subscriptionStats.paused)}
                  accent="rgba(245,158,11,0.14)"
                  icon={<CircleAlert size={scale(18)} color="#D97706" />}
                />
              </View>

              <View style={styles.inventoryActionRow}>
                <PrimaryButton
                  title="Update Plan"
                  onPress={() => openSubscriptionActionModal('update')}
                  variant="outline"
                  icon={<Pencil size={scale(16)} color={colors.primaryBlue} />}
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Pause Plan"
                  onPress={() => openSubscriptionActionModal('pause')}
                  variant="outline"
                  icon={<Pause size={scale(16)} color={colors.primaryBlue} />}
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Delete Plan"
                  onPress={() => openSubscriptionActionModal('delete')}
                  variant="outline"
                  icon={<Trash2 size={scale(16)} color="#B45309" />}
                  style={styles.inventoryActionButton}
                />
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineListPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Subscription List</Text>
                    <Text style={styles.panelSubtitle}>
                      Page {subscriptionPage} · {subscriptions.length} result
                      {subscriptions.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {renderSubscriptionsList()}
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={subscriptionPage === 1}
                      onPress={() =>
                        setSubscriptionPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      style={[
                        styles.paginationButton,
                        subscriptionPage === 1 &&
                          styles.paginationButtonDisabled,
                      ]}
                    >
                      <ChevronLeft
                        size={scale(16)}
                        color={
                          subscriptionPage === 1
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                      <Text
                        style={[
                          styles.paginationText,
                          subscriptionPage === 1 &&
                            styles.paginationTextDisabled,
                        ]}
                      >
                        Previous
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={subscriptions.length < 20}
                      onPress={() =>
                        setSubscriptionPage((current) => current + 1)
                      }
                      style={[
                        styles.paginationButton,
                        subscriptions.length < 20 &&
                          styles.paginationButtonDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paginationText,
                          subscriptions.length < 20 &&
                            styles.paginationTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <ChevronRight
                        size={scale(16)}
                        color={
                          subscriptions.length < 20
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Subscription Details</Text>
                    <Text style={styles.panelSubtitle}>Refill schedule</Text>
                  </View>
                  {renderSubscriptionDetails()}
                </View>
              </View>
            </View>
          ) : activeSection === 'wallet' ? (
            <View style={[styles.sectionCard, styles.sectionCardWallet]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchHint}>Wallet overview</Text>
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    isTablet && styles.toolbarActionsTabletWide,
                  ]}
                >
                  <PrimaryButton
                    title="Top Up Wallet"
                    onPress={openWalletTopupModal}
                    icon={<Plus size={scale(18)} color="#fff" />}
                    style={styles.inventoryActionButton}
                  />
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Available Balance"
                  value={`₹${String(walletStats.balance)}`}
                  accent="rgba(21,114,183,0.10)"
                  icon={
                    <ShieldCheck size={scale(18)} color={colors.primaryBlue} />
                  }
                />
                <StatCard
                  label="Transactions"
                  value={String(walletStats.transactions)}
                  accent="rgba(64,179,70,0.12)"
                  icon={
                    <ArrowRight size={scale(18)} color={colors.primaryGreen} />
                  }
                />
                <StatCard
                  label="Top-Ups"
                  value={String(walletStats.topups)}
                  accent="rgba(245,158,11,0.14)"
                  icon={<Clock3 size={scale(18)} color="#D97706" />}
                />
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineListPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Transactions</Text>
                    <Text style={styles.panelSubtitle}>
                      Page {walletTransactionPage} · {walletTransactions.length}{' '}
                      result
                      {walletTransactions.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {renderWalletTransactions()}
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={walletTransactionPage === 1}
                      onPress={() =>
                        setWalletTransactionPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      style={[
                        styles.paginationButton,
                        walletTransactionPage === 1 &&
                          styles.paginationButtonDisabled,
                      ]}
                    >
                      <ChevronLeft
                        size={scale(16)}
                        color={
                          walletTransactionPage === 1
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                      <Text
                        style={[
                          styles.paginationText,
                          walletTransactionPage === 1 &&
                            styles.paginationTextDisabled,
                        ]}
                      >
                        Previous
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={walletTransactions.length < 20}
                      onPress={() =>
                        setWalletTransactionPage((current) => current + 1)
                      }
                      style={[
                        styles.paginationButton,
                        walletTransactions.length < 20 &&
                          styles.paginationButtonDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paginationText,
                          walletTransactions.length < 20 &&
                            styles.paginationTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <ChevronRight
                        size={scale(16)}
                        color={
                          walletTransactions.length < 20
                            ? colors.textLight
                            : colors.primaryBlue
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Wallet Summary</Text>
                    <Text style={styles.panelSubtitle}>
                      Current balance and latest wallet refresh info.
                    </Text>
                  </View>
                  {renderWalletDetails()}
                </View>
              </View>
            </View>
          ) : activeSection === 'tracking' ? (
            <View style={[styles.sectionCard, styles.sectionCardTracking]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchHint}>Patient follow-ups</Text>
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    isTablet && styles.toolbarActionsTabletWide,
                  ]}
                >
                  <PrimaryButton
                    title="Update Tracking"
                    onPress={openPatientTrackingModal}
                    icon={<RefreshCw size={scale(16)} color="#FFFFFF" />}
                    style={styles.inventoryActionButton}
                  />
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Tracked Customers"
                  value={String(trackingStats.customers)}
                  accent="rgba(21,114,183,0.10)"
                  icon={<Users size={scale(18)} color={colors.primaryBlue} />}
                />
                <StatCard
                  label="Active Refills"
                  value={String(trackingStats.activeSubscriptions)}
                  accent="rgba(64,179,70,0.12)"
                  icon={<Clock3 size={scale(18)} color={colors.primaryGreen} />}
                />
                <StatCard
                  label="Pending Orders"
                  value={String(trackingStats.pendingOrders)}
                  accent="rgba(245,158,11,0.14)"
                  icon={<ArrowRight size={scale(18)} color="#D97706" />}
                />
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineListPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Patients</Text>
                    <Text style={styles.panelSubtitle}>
                      Select a customer to review disease and refill tracking.
                    </Text>
                  </View>
                  {renderTrackingCustomerList()}
                </View>

                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Patient Tracking</Text>
                    <Text style={styles.panelSubtitle}>
                      Follow-up date, pharmacy notes, and recurring interval.
                    </Text>
                  </View>
                  {renderPatientTrackingDetails()}
                </View>
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Pharmacy Summary</Text>
                    <Text style={styles.panelSubtitle}>
                      Current pharmacy totals
                    </Text>
                  </View>
                  {renderPharmacyTrackingSummary()}
                </View>
              </View>
            </View>
          ) : activeSection === 'diagnostics' ? (
            <View style={[styles.sectionCard, styles.sectionCardDiagnostics]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <TextInput
                    value={selectedDiagnosticsBookingId}
                    onChangeText={setSelectedDiagnosticsBookingId}
                    placeholder="Enter diagnostics booking ID"
                    placeholderTextColor={colors.textLight}
                    style={styles.searchInput}
                  />
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    isTablet && styles.toolbarActionsTabletWide,
                  ]}
                >
                  <PrimaryButton
                    title="New Booking"
                    onPress={openDiagnosticsModal}
                    icon={<Plus size={scale(18)} color="#fff" />}
                    style={styles.inventoryActionButton}
                  />
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Selected Booking"
                  value={String(diagnosticsStats.selected)}
                  accent="rgba(21,114,183,0.10)"
                  icon={
                    <CircleAlert size={scale(18)} color={colors.primaryBlue} />
                  }
                />
                <StatCard
                  label="Tests in Form"
                  value={String(diagnosticsStats.tests)}
                  accent="rgba(64,179,70,0.12)"
                  icon={<Pill size={scale(18)} color={colors.primaryGreen} />}
                />
                <StatCard
                  label="Wallet Assist"
                  value={String(diagnosticsStats.walletAssisted)}
                  accent="rgba(245,158,11,0.14)"
                  icon={<ShieldCheck size={scale(18)} color="#D97706" />}
                />
              </View>

              <View style={styles.inventoryActionRow}>
                <PrimaryButton
                  title="Retry Payment"
                  onPress={() => openDiagnosticsActionModal('retry')}
                  variant="outline"
                  icon={
                    <RefreshCw size={scale(16)} color={colors.primaryBlue} />
                  }
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Reschedule"
                  onPress={() => openDiagnosticsActionModal('reschedule')}
                  variant="outline"
                  icon={<Clock3 size={scale(16)} color={colors.primaryBlue} />}
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Cancel Booking"
                  onPress={() => openDiagnosticsActionModal('cancel')}
                  variant="outline"
                  icon={<CircleAlert size={scale(16)} color="#B45309" />}
                  style={styles.inventoryActionButton}
                />
                <PrimaryButton
                  title="Verify Payment"
                  onPress={openPaymentVerificationModal}
                  icon={<ShieldCheck size={scale(16)} color="#FFFFFF" />}
                  style={styles.inventoryActionButton}
                />
              </View>

              <View
                style={[
                  styles.panelLayout,
                  isTablet && styles.panelLayoutTablet,
                ]}
              >
                <View
                  style={[
                    styles.panel,
                    isTablet && styles.medicineDetailPanelTablet,
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>
                      Diagnostics Payment Details
                    </Text>
                    <Text style={styles.panelSubtitle}>
                      Selected booking and payment status
                    </Text>
                  </View>
                  {renderDiagnosticsDetails()}
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.sectionCard, styles.sectionCardCustomers]}>
              <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
                <View style={styles.searchBox}>
                  <Search size={scale(18)} color={colors.textLight} />
                  <TextInput
                    value={customerSearchInput}
                    onChangeText={setCustomerSearchInput}
                    placeholder="Search customer by name, phone, or note"
                    placeholderTextColor={colors.textLight}
                    style={styles.searchInput}
                  />
                </View>
                <View
                  style={[
                    styles.toolbarActions,
                    isTablet && styles.toolbarActionsTablet,
                  ]}
                >
                  <PrimaryButton
                    title="Add Customer"
                    onPress={() => {
                      setCustomerForm(DEFAULT_CUSTOMER_FORM);
                      setCustomerErrors({});
                      setCustomerModalVisible(true);
                    }}
                    icon={<Plus size={scale(18)} color="#fff" />}
                    style={isTablet ? styles.toolbarButtonTablet : undefined}
                  />
                </View>
              </View>

              <View style={styles.customerStatsRow}>
                <StatCard
                  label="Total customers"
                  value={String(customerStats.total)}
                  accent="rgba(21,114,183,0.10)"
                  icon={<Users size={scale(18)} color={colors.primaryBlue} />}
                />
                <StatCard
                  label="Chronic conditions"
                  value={String(customerStats.chronic)}
                  accent="rgba(233,84,84,0.12)"
                  icon={<ShieldCheck size={scale(18)} color="#D14343" />}
                />
                <StatCard
                  label="Recurring medicine"
                  value={String(customerStats.recurring)}
                  accent="rgba(64,179,70,0.12)"
                  icon={
                    <ArrowRight size={scale(18)} color={colors.primaryGreen} />
                  }
                />
              </View>

              {renderCustomers()}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={medicineModalVisible}
        onRequestClose={() => setMedicineModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMedicineModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 640 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {medicineFormMode === 'create'
                  ? 'Add Medicine'
                  : 'Edit Medicine'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {medicineFormMode === 'create'
                  ? 'Add medicine details.'
                  : 'Update medicine details.'}
              </Text>

              {medicineFormMode === 'create' ? (
                <>
                  <LabeledField
                    label="Medicine Name"
                    value={medicineCreateForm.name}
                    onChangeText={(text) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        name: text,
                      }))
                    }
                    placeholder="Paracetamol 650"
                    error={medicineErrors.name}
                  />
                  <LabeledField
                    label="Generic Name"
                    value={medicineCreateForm.genericName}
                    onChangeText={(text) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        genericName: text,
                      }))
                    }
                    placeholder="Paracetamol"
                  />
                  <LabeledField
                    label="Category"
                    value={medicineCreateForm.category}
                    onChangeText={(text) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        category: text,
                      }))
                    }
                    placeholder="Pain Relief"
                  />
                  <LabeledField
                    label="Dosage Form"
                    value={medicineCreateForm.dosageForm}
                    onChangeText={(text) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        dosageForm: text,
                      }))
                    }
                    placeholder="tablet"
                    error={medicineErrors.dosageForm}
                  />
                  <LabeledField
                    label="Strength"
                    value={medicineCreateForm.strength}
                    onChangeText={(text) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        strength: text,
                      }))
                    }
                    placeholder="650 mg"
                  />
                  <LabeledField
                    label="Manufacturer"
                    value={medicineCreateForm.manufacturer}
                    onChangeText={(text) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        manufacturer: text,
                      }))
                    }
                    placeholder="ABC Pharma"
                  />
                  <ToggleRow
                    label="Prescription Required"
                    hint="Turn this on when the medicine should be dispensed only with a valid prescription."
                    value={medicineCreateForm.prescriptionRequired}
                    onValueChange={(value) =>
                      setMedicineCreateForm((current) => ({
                        ...current,
                        prescriptionRequired: value,
                      }))
                    }
                  />
                </>
              ) : (
                <>
                  <LabeledField
                    label="Brand Name"
                    value={medicineEditForm.brandName}
                    onChangeText={(text) =>
                      setMedicineEditForm((current) => ({
                        ...current,
                        brandName: text,
                      }))
                    }
                    placeholder="PCM 650"
                  />
                  <LabeledField
                    label="Manufacturer"
                    value={medicineEditForm.manufacturer}
                    onChangeText={(text) =>
                      setMedicineEditForm((current) => ({
                        ...current,
                        manufacturer: text,
                      }))
                    }
                    placeholder="XYZ Pharma"
                  />
                  <ToggleRow
                    label="Prescription Required"
                    hint="Keep this aligned with the medicine’s current dispensing rules."
                    value={medicineEditForm.prescriptionRequired}
                    onValueChange={(value) =>
                      setMedicineEditForm((current) => ({
                        ...current,
                        prescriptionRequired: value,
                      }))
                    }
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setMedicineModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title={
                    medicineFormMode === 'create'
                      ? 'Save Medicine'
                      : 'Update Medicine'
                  }
                  onPress={() => setMedicineModalVisible(false)}
                  loading={
                    createMedicineMutation.isPending ||
                    updateMedicineMutation.isPending
                  }
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={customerModalVisible}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCustomerModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 640 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <Text style={styles.modalSubtitle}>
                Create a pharmacy customer profile with proper validation and
                feedback.
              </Text>

              <LabeledField
                label="Customer Name"
                value={customerForm.name}
                onChangeText={(text) =>
                  setCustomerForm((current) => ({ ...current, name: text }))
                }
                placeholder="Ravi Sharma"
                error={customerErrors.name}
              />
              <LabeledField
                label="Phone"
                value={customerForm.phone}
                onChangeText={(text) =>
                  setCustomerForm((current) => ({ ...current, phone: text }))
                }
                placeholder="9876543210"
                keyboardType="phone-pad"
                error={customerErrors.phone}
              />
              <LabeledField
                label="Age"
                value={customerForm.age}
                onChangeText={(text) =>
                  setCustomerForm((current) => ({ ...current, age: text }))
                }
                placeholder="34"
                keyboardType="number-pad"
                error={customerErrors.age}
              />
              <LabeledField
                label="Disease Notes"
                value={customerForm.diseaseNotes}
                onChangeText={(text) =>
                  setCustomerForm((current) => ({
                    ...current,
                    diseaseNotes: text,
                  }))
                }
                placeholder="Diabetes type 2"
                multiline
              />

              <ToggleRow
                label="Chronic Condition"
                hint="Use this for long-term conditions that need repeated attention."
                value={customerForm.chronicCondition}
                onValueChange={(value) =>
                  setCustomerForm((current) => ({
                    ...current,
                    chronicCondition: value,
                  }))
                }
              />

              <ToggleRow
                label="Recurring Medicine"
                hint="Turn this on when you need a refill cycle for the customer."
                value={customerForm.recurringMedicine}
                onValueChange={(value) =>
                  setCustomerForm((current) => ({
                    ...current,
                    recurringMedicine: value,
                    recurringIntervalDays: value
                      ? current.recurringIntervalDays
                      : '',
                  }))
                }
              />

              {customerForm.recurringMedicine ? (
                <LabeledField
                  label="Recurring Interval (Days)"
                  value={customerForm.recurringIntervalDays}
                  onChangeText={(text) =>
                    setCustomerForm((current) => ({
                      ...current,
                      recurringIntervalDays: text,
                    }))
                  }
                  placeholder="30"
                  keyboardType="number-pad"
                  error={customerErrors.recurringIntervalDays}
                />
              ) : null}

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setCustomerModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Save Customer"
                  onPress={submitCustomer}
                  loading={createCustomerMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={inventoryModalVisible}
        onRequestClose={() => setInventoryModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setInventoryModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 700 : 540) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Inventory Stock</Text>
              <Text style={styles.modalSubtitle}>
                Create a stock entry with pricing, rack, batch, and reorder
                data.
              </Text>

              <LabeledField
                label="Medicine ID"
                value={inventoryCreateForm.medicineId}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    medicineId: text,
                  }))
                }
                placeholder="64f100000000000000000002"
                error={inventoryErrors.medicineId}
              />
              <LabeledField
                label="Quantity"
                value={inventoryCreateForm.quantity}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    quantity: text,
                  }))
                }
                placeholder="100"
                keyboardType="number-pad"
                error={inventoryErrors.quantity}
              />
              <LabeledField
                label="Reorder Threshold"
                value={inventoryCreateForm.reorderThreshold}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    reorderThreshold: text,
                  }))
                }
                placeholder="15"
                keyboardType="number-pad"
                error={inventoryErrors.reorderThreshold}
              />
              <LabeledField
                label="Rack Location"
                value={inventoryCreateForm.rackLocation}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    rackLocation: text,
                  }))
                }
                placeholder="A-12"
              />
              <LabeledField
                label="Purchase Price"
                value={inventoryCreateForm.purchasePrice}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    purchasePrice: text,
                  }))
                }
                placeholder="12.5"
                keyboardType="number-pad"
                error={inventoryErrors.purchasePrice}
              />
              <LabeledField
                label="Retail Price"
                value={inventoryCreateForm.retailPrice}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    retailPrice: text,
                  }))
                }
                placeholder="18"
                keyboardType="number-pad"
                error={inventoryErrors.retailPrice}
              />
              <LabeledField
                label="Wholesale Price"
                value={inventoryCreateForm.wholesalePrice}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    wholesalePrice: text,
                  }))
                }
                placeholder="15"
                keyboardType="number-pad"
                error={inventoryErrors.wholesalePrice}
              />
              <LabeledField
                label="Batch Number"
                value={inventoryCreateForm.batchNumber}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    batchNumber: text,
                  }))
                }
                placeholder="BATCH-001"
              />
              <LabeledField
                label="Expiry Date"
                value={inventoryCreateForm.expiryDate}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    expiryDate: text,
                  }))
                }
                placeholder="20271231"
                keyboardType="number-pad"
                error={inventoryErrors.expiryDate}
              />
              <LabeledField
                label="Reason"
                value={inventoryCreateForm.reason}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    reason: text,
                  }))
                }
                placeholder="purchase"
              />
              <LabeledField
                label="Notes"
                value={inventoryCreateForm.notes}
                onChangeText={(text) =>
                  setInventoryCreateForm((current) => ({
                    ...current,
                    notes: text,
                  }))
                }
                placeholder="Initial stock load"
                multiline
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setInventoryModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Save Stock"
                  onPress={submitInventoryCreate}
                  loading={createInventoryMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={inventoryActionModalVisible}
        onRequestClose={() => setInventoryActionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setInventoryActionModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 640 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {inventoryActionMode === 'reserve'
                  ? 'Reserve Stock'
                  : 'Release Stock'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {inventoryActionMode === 'reserve'
                  ? 'Reserve stock for internal use or temporary hold.'
                  : 'Release previously reserved stock back into available inventory.'}
              </Text>

              <LabeledField
                label="Medicine ID"
                value={inventoryActionForm.medicineId}
                onChangeText={(text) =>
                  setInventoryActionForm((current) => ({
                    ...current,
                    medicineId: text,
                  }))
                }
                placeholder="64f100000000000000000002"
                error={inventoryActionErrors.medicineId}
              />
              <LabeledField
                label="Quantity"
                value={inventoryActionForm.quantity}
                onChangeText={(text) =>
                  setInventoryActionForm((current) => ({
                    ...current,
                    quantity: text,
                  }))
                }
                placeholder="5"
                keyboardType="number-pad"
                error={inventoryActionErrors.quantity}
              />
              <LabeledField
                label="Reason"
                value={inventoryActionForm.reason}
                onChangeText={(text) =>
                  setInventoryActionForm((current) => ({
                    ...current,
                    reason: text,
                  }))
                }
                placeholder={
                  inventoryActionMode === 'reserve'
                    ? 'internal_hold'
                    : 'release_hold'
                }
              />
              <LabeledField
                label="Notes"
                value={inventoryActionForm.notes}
                onChangeText={(text) =>
                  setInventoryActionForm((current) => ({
                    ...current,
                    notes: text,
                  }))
                }
                placeholder={
                  inventoryActionMode === 'reserve'
                    ? 'Reserved for internal use'
                    : 'Released internal hold'
                }
                multiline
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setInventoryActionModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title={
                    inventoryActionMode === 'reserve' ? 'Reserve' : 'Release'
                  }
                  onPress={submitInventoryAction}
                  loading={
                    reserveInventoryMutation.isPending ||
                    releaseInventoryMutation.isPending
                  }
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOrderModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 700 : 540) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Pharmacy Order</Text>
              <Text style={styles.modalSubtitle}>
                Create online or walk-in orders with recurring medicine support.
              </Text>

              <LabeledField
                label="Order Type"
                value={orderCreateForm.orderType}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    orderType: text,
                  }))
                }
                placeholder="online"
              />
              <LabeledField
                label="Customer ID"
                value={orderCreateForm.customerId}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    customerId: text,
                  }))
                }
                placeholder="64f100000000000000000004"
                error={orderErrors.customerId}
              />
              <LabeledField
                label="Medicine ID"
                value={orderCreateForm.medicineId}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    medicineId: text,
                  }))
                }
                placeholder="64f100000000000000000002"
                error={orderErrors.medicineId}
              />
              <LabeledField
                label="Medicine Name"
                value={orderCreateForm.medicineName}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    medicineName: text,
                  }))
                }
                placeholder="Paracetamol 650"
              />
              <LabeledField
                label="Ordered Quantity"
                value={orderCreateForm.orderedQty}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    orderedQty: text,
                  }))
                }
                placeholder="2"
                keyboardType="number-pad"
                error={orderErrors.orderedQty}
              />
              <LabeledField
                label="Discount"
                value={orderCreateForm.discount}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    discount: text,
                  }))
                }
                placeholder="1"
                keyboardType="number-pad"
                error={orderErrors.discount}
              />
              <LabeledField
                label="Payment Mode"
                value={orderCreateForm.paymentMode}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    paymentMode: text,
                  }))
                }
                placeholder="online_payment"
              />
              <LabeledField
                label="Delivery Mode"
                value={orderCreateForm.deliveryMode}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    deliveryMode: text,
                  }))
                }
                placeholder="delivery"
              />
              <LabeledField
                label="Delivery Address"
                value={orderCreateForm.deliveryAddress}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    deliveryAddress: text,
                  }))
                }
                placeholder="221B Baker Street, Delhi"
                multiline
              />
              <LabeledField
                label="Prescription URLs"
                value={orderCreateForm.prescriptionUrls}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    prescriptionUrls: text,
                  }))
                }
                placeholder="https://example.com/prescription.pdf"
                multiline
              />
              <LabeledField
                label="Notes"
                value={orderCreateForm.notes}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({ ...current, notes: text }))
                }
                placeholder="Urgent delivery"
                multiline
              />
              <LabeledField
                label="Linked Consultation ID"
                value={orderCreateForm.linkedConsultationId}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    linkedConsultationId: text,
                  }))
                }
                placeholder="64f100000000000000000010"
              />
              <LabeledField
                label="Linked Diagnostic Order ID"
                value={orderCreateForm.linkedDiagnosticOrderId}
                onChangeText={(text) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    linkedDiagnosticOrderId: text,
                  }))
                }
                placeholder="diag-booking-id"
              />

              <ToggleRow
                label="Recurring Medicine"
                hint="Enable a refill subscription for this medicine order."
                value={orderCreateForm.recurring}
                onValueChange={(value) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    recurring: value,
                    subscriptionIntervalDays: value
                      ? current.subscriptionIntervalDays
                      : '',
                  }))
                }
              />
              <ToggleRow
                label="Walk-in Order"
                hint="Turn this on for counter orders collected directly at the pharmacy."
                value={orderCreateForm.isWalkIn}
                onValueChange={(value) =>
                  setOrderCreateForm((current) => ({
                    ...current,
                    isWalkIn: value,
                  }))
                }
              />

              {orderCreateForm.recurring ? (
                <>
                  <LabeledField
                    label="Subscription Interval (Days)"
                    value={orderCreateForm.subscriptionIntervalDays}
                    onChangeText={(text) =>
                      setOrderCreateForm((current) => ({
                        ...current,
                        subscriptionIntervalDays: text,
                      }))
                    }
                    placeholder="30"
                    keyboardType="number-pad"
                    error={orderErrors.subscriptionIntervalDays}
                  />
                  <LabeledField
                    label="Subscription Frequency"
                    value={orderCreateForm.subscriptionFrequency}
                    onChangeText={(text) =>
                      setOrderCreateForm((current) => ({
                        ...current,
                        subscriptionFrequency: text,
                      }))
                    }
                    placeholder="Daily after dinner"
                  />
                  <LabeledField
                    label="Next Refill Date"
                    value={orderCreateForm.subscriptionNextRefillDate}
                    onChangeText={(text) =>
                      setOrderCreateForm((current) => ({
                        ...current,
                        subscriptionNextRefillDate: text,
                      }))
                    }
                    placeholder="20260810"
                    keyboardType="number-pad"
                    error={orderErrors.subscriptionNextRefillDate}
                  />
                  <LabeledField
                    label="Reminder Channel"
                    value={orderCreateForm.subscriptionReminderChannel}
                    onChangeText={(text) =>
                      setOrderCreateForm((current) => ({
                        ...current,
                        subscriptionReminderChannel: text,
                      }))
                    }
                    placeholder="both"
                  />
                </>
              ) : null}

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setOrderModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Create Order"
                  onPress={submitCreateOrder}
                  loading={createOrderMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={orderActionModalVisible}
        onRequestClose={() => setOrderActionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOrderActionModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 680 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {orderActionMode === 'update'
                  ? 'Update Order'
                  : orderActionMode === 'status'
                  ? 'Update Order Status'
                  : orderActionMode === 'cancel'
                  ? 'Cancel Order'
                  : 'Mark Order Paid'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {orderActionMode === 'update'
                  ? 'Update delivery and linked references.'
                  : orderActionMode === 'status'
                  ? 'Advance the order through the pharmacy workflow.'
                  : orderActionMode === 'cancel'
                  ? 'Cancel this pharmacy order with a note.'
                  : 'Record manual payment collection for the order.'}
              </Text>

              {orderActionMode === 'update' ? (
                <>
                  <LabeledField
                    label="Notes"
                    value={orderActionForm.notes}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        notes: text,
                      }))
                    }
                    placeholder="Deliver after 6 PM"
                    multiline
                  />
                  <LabeledField
                    label="Delivery Address"
                    value={orderActionForm.deliveryAddress}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        deliveryAddress: text,
                      }))
                    }
                    placeholder="Updated address, Delhi"
                    multiline
                  />
                  <LabeledField
                    label="Payment Mode"
                    value={orderActionForm.paymentMode}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        paymentMode: text,
                      }))
                    }
                    placeholder="cash_on_delivery"
                  />
                  <LabeledField
                    label="Linked Consultation ID"
                    value={orderActionForm.linkedConsultationId}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        linkedConsultationId: text,
                      }))
                    }
                    placeholder="64f100000000000000000010"
                  />
                  <LabeledField
                    label="Linked Diagnostic Order ID"
                    value={orderActionForm.linkedDiagnosticOrderId}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        linkedDiagnosticOrderId: text,
                      }))
                    }
                    placeholder="diag-booking-id"
                  />
                </>
              ) : null}

              {orderActionMode === 'status' ? (
                <>
                  <LabeledField
                    label="Status"
                    value={orderActionForm.status}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        status: text,
                      }))
                    }
                    placeholder="accepted"
                  />
                  <LabeledField
                    label="Notes"
                    value={orderActionForm.notes}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        notes: text,
                      }))
                    }
                    placeholder="Order accepted and being prepared"
                    multiline
                  />
                </>
              ) : null}

              {orderActionMode === 'cancel' ? (
                <LabeledField
                  label="Notes"
                  value={orderActionForm.notes}
                  onChangeText={(text) =>
                    setOrderActionForm((current) => ({
                      ...current,
                      notes: text,
                    }))
                  }
                  placeholder="Cancelled by pharmacy"
                  multiline
                />
              ) : null}

              {orderActionMode === 'markPaid' ? (
                <>
                  <LabeledField
                    label="Payment Source"
                    value={orderActionForm.paymentSource}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        paymentSource: text,
                      }))
                    }
                    placeholder="counter_cash"
                  />
                  <LabeledField
                    label="Paid Date"
                    value={orderActionForm.paidDate}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        paidDate: text,
                      }))
                    }
                    placeholder="20260705"
                    keyboardType="number-pad"
                    error={orderActionErrors.paidDate}
                  />
                  <LabeledField
                    label="Paid Time"
                    value={orderActionForm.paidTime}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        paidTime: text,
                      }))
                    }
                    placeholder="18:30"
                  />
                  <LabeledField
                    label="Notes"
                    value={orderActionForm.notes}
                    onChangeText={(text) =>
                      setOrderActionForm((current) => ({
                        ...current,
                        notes: text,
                      }))
                    }
                    placeholder="Collected at counter"
                    multiline
                  />
                </>
              ) : null}

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setOrderActionModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title={
                    orderActionMode === 'update'
                      ? 'Save Changes'
                      : orderActionMode === 'status'
                      ? 'Update Status'
                      : orderActionMode === 'cancel'
                      ? 'Cancel Order'
                      : 'Mark Paid'
                  }
                  onPress={submitOrderAction}
                  loading={
                    updateOrderMutation.isPending ||
                    updateOrderStatusMutation.isPending ||
                    cancelOrderMutation.isPending ||
                    markPaidOrderMutation.isPending
                  }
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={healthCheckModalVisible}
        onRequestClose={() => setHealthCheckModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setHealthCheckModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 680 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {healthCheckMode === 'create'
                  ? 'Add Order Health Check'
                  : 'Update Order Health Check'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Capture basic pharmacy readings against the selected order.
              </Text>

              <LabeledField
                label="Systolic BP"
                value={healthCheckForm.systolicBP}
                onChangeText={(text) =>
                  setHealthCheckForm((current) => ({
                    ...current,
                    systolicBP: text,
                  }))
                }
                placeholder="120"
                keyboardType="number-pad"
                error={healthCheckErrors.systolicBP}
              />
              <LabeledField
                label="Diastolic BP"
                value={healthCheckForm.diastolicBP}
                onChangeText={(text) =>
                  setHealthCheckForm((current) => ({
                    ...current,
                    diastolicBP: text,
                  }))
                }
                placeholder="80"
                keyboardType="number-pad"
                error={healthCheckErrors.diastolicBP}
              />
              <LabeledField
                label="Fasting Sugar"
                value={healthCheckForm.fastingSugar}
                onChangeText={(text) =>
                  setHealthCheckForm((current) => ({
                    ...current,
                    fastingSugar: text,
                  }))
                }
                placeholder="95"
                keyboardType="number-pad"
                error={healthCheckErrors.fastingSugar}
              />
              <LabeledField
                label="Post Meal Sugar"
                value={healthCheckForm.postMealSugar}
                onChangeText={(text) =>
                  setHealthCheckForm((current) => ({
                    ...current,
                    postMealSugar: text,
                  }))
                }
                placeholder="130"
                keyboardType="number-pad"
                error={healthCheckErrors.postMealSugar}
              />
              <LabeledField
                label="HbA1c"
                value={healthCheckForm.hba1c}
                onChangeText={(text) =>
                  setHealthCheckForm((current) => ({ ...current, hba1c: text }))
                }
                placeholder="5.8"
                keyboardType="number-pad"
                error={healthCheckErrors.hba1c}
              />
              <LabeledField
                label="Notes"
                value={healthCheckForm.notes}
                onChangeText={(text) =>
                  setHealthCheckForm((current) => ({ ...current, notes: text }))
                }
                placeholder="All values normal"
                multiline
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setHealthCheckModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title={
                    healthCheckMode === 'create' ? 'Save Check' : 'Update Check'
                  }
                  onPress={submitHealthCheck}
                  loading={
                    createOrderHealthCheckMutation.isPending ||
                    updateOrderHealthCheckMutation.isPending
                  }
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={subscriptionModalVisible}
        onRequestClose={() => setSubscriptionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSubscriptionModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 700 : 540) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Subscription</Text>
              <Text style={styles.modalSubtitle}>
                Start a recurring refill plan for a customer medicine.
              </Text>

              <LabeledField
                label="User ID"
                value={subscriptionCreateForm.userId}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    userId: text,
                  }))
                }
                placeholder="64f100000000000000000004"
                error={subscriptionErrors.userId}
              />
              <LabeledField
                label="Medicine ID"
                value={subscriptionCreateForm.medicineId}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    medicineId: text,
                  }))
                }
                placeholder="64f100000000000000000002"
                error={subscriptionErrors.medicineId}
              />
              <LabeledField
                label="Medicine Name"
                value={subscriptionCreateForm.medicineName}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    medicineName: text,
                  }))
                }
                placeholder="Paracetamol 650"
              />
              <LabeledField
                label="Frequency"
                value={subscriptionCreateForm.frequency}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    frequency: text,
                  }))
                }
                placeholder="Daily after dinner"
              />
              <LabeledField
                label="Interval Days"
                value={subscriptionCreateForm.intervalDays}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    intervalDays: text,
                  }))
                }
                placeholder="30"
                keyboardType="number-pad"
                error={subscriptionErrors.intervalDays}
              />
              <LabeledField
                label="Next Refill Date"
                value={subscriptionCreateForm.nextRefillDate}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    nextRefillDate: text,
                  }))
                }
                placeholder="20260730"
                keyboardType="number-pad"
                error={subscriptionErrors.nextRefillDate}
              />
              <LabeledField
                label="Reminder Channel"
                value={subscriptionCreateForm.reminderChannel}
                onChangeText={(text) =>
                  setSubscriptionCreateForm((current) => ({
                    ...current,
                    reminderChannel: text,
                  }))
                }
                placeholder="both"
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setSubscriptionModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Create Subscription"
                  onPress={submitCreateSubscription}
                  loading={createSubscriptionMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={subscriptionActionModalVisible}
        onRequestClose={() => setSubscriptionActionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSubscriptionActionModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 680 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {subscriptionActionMode === 'update'
                  ? 'Update Subscription'
                  : subscriptionActionMode === 'pause'
                  ? 'Pause Subscription'
                  : 'Delete Subscription'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {subscriptionActionMode === 'update'
                  ? 'Adjust interval, refill date, and reminder channel.'
                  : subscriptionActionMode === 'pause'
                  ? 'Temporarily pause refills until a future date.'
                  : 'Remove this refill plan.'}
              </Text>

              {subscriptionActionMode === 'update' ? (
                <>
                  <LabeledField
                    label="Interval Days"
                    value={subscriptionActionForm.intervalDays}
                    onChangeText={(text) =>
                      setSubscriptionActionForm((current) => ({
                        ...current,
                        intervalDays: text,
                      }))
                    }
                    placeholder="45"
                    keyboardType="number-pad"
                    error={subscriptionActionErrors.intervalDays}
                  />
                  <LabeledField
                    label="Next Refill Date"
                    value={subscriptionActionForm.nextRefillDate}
                    onChangeText={(text) =>
                      setSubscriptionActionForm((current) => ({
                        ...current,
                        nextRefillDate: text,
                      }))
                    }
                    placeholder="20260815"
                    keyboardType="number-pad"
                    error={subscriptionActionErrors.nextRefillDate}
                  />
                  <LabeledField
                    label="Reminder Channel"
                    value={subscriptionActionForm.reminderChannel}
                    onChangeText={(text) =>
                      setSubscriptionActionForm((current) => ({
                        ...current,
                        reminderChannel: text,
                      }))
                    }
                    placeholder="push"
                  />
                </>
              ) : null}

              {subscriptionActionMode === 'pause' ? (
                <LabeledField
                  label="Paused Until"
                  value={subscriptionActionForm.pausedUntil}
                  onChangeText={(text) =>
                    setSubscriptionActionForm((current) => ({
                      ...current,
                      pausedUntil: text,
                    }))
                  }
                  placeholder="20260730"
                  keyboardType="number-pad"
                  error={subscriptionActionErrors.pausedUntil}
                />
              ) : null}

              {subscriptionActionMode === 'delete' ? (
                <Text style={styles.modalSubtitle}>
                  This action removes the selected subscription immediately.
                </Text>
              ) : null}

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setSubscriptionActionModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title={
                    subscriptionActionMode === 'update'
                      ? 'Save Changes'
                      : subscriptionActionMode === 'pause'
                      ? 'Pause Subscription'
                      : 'Delete Subscription'
                  }
                  onPress={submitSubscriptionAction}
                  loading={
                    updateSubscriptionMutation.isPending ||
                    pauseSubscriptionMutation.isPending ||
                    deleteSubscriptionMutation.isPending
                  }
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={walletModalVisible}
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWalletModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 640 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Top Up Pharmacy Wallet</Text>
              <Text style={styles.modalSubtitle}>
                Add funds manually to the pharmacy wallet with a note.
              </Text>

              <LabeledField
                label="Amount"
                value={walletTopupForm.amount}
                onChangeText={(text) =>
                  setWalletTopupForm((current) => ({
                    ...current,
                    amount: text,
                  }))
                }
                placeholder="1500"
                keyboardType="number-pad"
                error={walletErrors.amount}
              />
              <LabeledField
                label="Notes"
                value={walletTopupForm.notes}
                onChangeText={(text) =>
                  setWalletTopupForm((current) => ({ ...current, notes: text }))
                }
                placeholder="Manual top-up"
                multiline
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setWalletModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Top Up"
                  onPress={submitWalletTopup}
                  loading={walletTopupMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={patientTrackingModalVisible}
        onRequestClose={() => setPatientTrackingModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPatientTrackingModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 700 : 540) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Update Patient Tracking</Text>
              <Text style={styles.modalSubtitle}>
                Capture follow-up preferences and chronic refill notes for the
                selected patient.
              </Text>

              <LabeledField
                label="Disease Notes"
                value={patientTrackingForm.diseaseNotes}
                onChangeText={(text) =>
                  setPatientTrackingForm((current) => ({
                    ...current,
                    diseaseNotes: text,
                  }))
                }
                placeholder="Updated chronic medication notes"
                multiline
              />

              <ToggleRow
                label="Chronic Condition"
                hint="Enable when the patient requires ongoing disease tracking."
                value={patientTrackingForm.chronicCondition}
                onValueChange={(value) =>
                  setPatientTrackingForm((current) => ({
                    ...current,
                    chronicCondition: value,
                  }))
                }
              />

              <ToggleRow
                label="Recurring Medicine"
                hint="Enable when the patient needs recurring refill follow-up."
                value={patientTrackingForm.recurringMedicine}
                onValueChange={(value) =>
                  setPatientTrackingForm((current) => ({
                    ...current,
                    recurringMedicine: value,
                  }))
                }
              />

              <LabeledField
                label="Recurring Interval Days"
                value={patientTrackingForm.recurringIntervalDays}
                onChangeText={(text) =>
                  setPatientTrackingForm((current) => ({
                    ...current,
                    recurringIntervalDays: text,
                  }))
                }
                placeholder="60"
                keyboardType="number-pad"
                error={patientTrackingErrors.recurringIntervalDays}
              />
              <LabeledField
                label="Preferred Follow-Up Date"
                value={patientTrackingForm.preferredFollowUpDate}
                onChangeText={(text) =>
                  setPatientTrackingForm((current) => ({
                    ...current,
                    preferredFollowUpDate: text,
                  }))
                }
                placeholder="20260820"
                keyboardType="number-pad"
                error={patientTrackingErrors.preferredFollowUpDate}
              />
              <LabeledField
                label="Pharmacy Notes"
                value={patientTrackingForm.pharmacyNotes}
                onChangeText={(text) =>
                  setPatientTrackingForm((current) => ({
                    ...current,
                    pharmacyNotes: text,
                  }))
                }
                placeholder="Send reminder 3 days before refill"
                multiline
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setPatientTrackingModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Save Tracking"
                  onPress={submitPatientTracking}
                  loading={updatePatientTrackingMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={diagnosticsModalVisible}
        onRequestClose={() => setDiagnosticsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDiagnosticsModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 720 : 540) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Diagnostics Booking</Text>
              <Text style={styles.modalSubtitle}>
                Book an external diagnostics test and start the payment flow.
              </Text>

              <LabeledField
                label="Integration"
                value={diagnosticsCreateForm.integration}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    integration: text,
                  }))
                }
                placeholder="labstack"
              />
              <LabeledField
                label="Booking Date"
                value={diagnosticsCreateForm.bookingDate}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    bookingDate: text,
                  }))
                }
                placeholder="20260702"
                keyboardType="number-pad"
                error={diagnosticsErrors.bookingDate}
              />
              <LabeledField
                label="Booking Time"
                value={diagnosticsCreateForm.bookingTime}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    bookingTime: text,
                  }))
                }
                placeholder="10:30"
                error={diagnosticsErrors.bookingTime}
              />
              <LabeledField
                label="Patient Name"
                value={diagnosticsCreateForm.patientName}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    patientName: text,
                  }))
                }
                placeholder="Ravi Sharma"
                error={diagnosticsErrors.patientName}
              />
              <LabeledField
                label="Patient Phone"
                value={diagnosticsCreateForm.patientPhone}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    patientPhone: text,
                  }))
                }
                placeholder="9876543210"
                keyboardType="phone-pad"
                error={diagnosticsErrors.patientPhone}
              />
              <LabeledField
                label="Pincode"
                value={diagnosticsCreateForm.pincode}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    pincode: text,
                  }))
                }
                placeholder="110001"
                keyboardType="number-pad"
                error={diagnosticsErrors.pincode}
              />
              <LabeledField
                label="Address"
                value={diagnosticsCreateForm.addressLine}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    addressLine: text,
                  }))
                }
                placeholder="221B Baker Street"
                multiline
                error={diagnosticsErrors.addressLine}
              />
              <LabeledField
                label="Payment Option"
                value={diagnosticsCreateForm.paymentOption}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    paymentOption: text,
                  }))
                }
                placeholder="prepaid"
              />
              <LabeledField
                label="Test IDs"
                value={diagnosticsCreateForm.testIds}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    testIds: text,
                  }))
                }
                placeholder="CBC001"
                error={diagnosticsErrors.testIds}
              />
              <LabeledField
                label="Test Names"
                value={diagnosticsCreateForm.testNames}
                onChangeText={(text) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    testNames: text,
                  }))
                }
                placeholder="Complete Blood Count"
                error={diagnosticsErrors.testNames}
              />

              <ToggleRow
                label="Use Wallet Balance"
                hint="Enable when diagnostics payment should use pharmacy wallet funds."
                value={diagnosticsCreateForm.useWalletBalance}
                onValueChange={(value) =>
                  setDiagnosticsCreateForm((current) => ({
                    ...current,
                    useWalletBalance: value,
                  }))
                }
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setDiagnosticsModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Create Booking"
                  onPress={submitCreateDiagnosticsBooking}
                  loading={createDiagnosticsBookingMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={diagnosticsActionModalVisible}
        onRequestClose={() => setDiagnosticsActionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDiagnosticsActionModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 680 : 520) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {diagnosticsActionMode === 'retry'
                  ? 'Retry Diagnostics Payment'
                  : diagnosticsActionMode === 'cancel'
                  ? 'Cancel Diagnostics Booking'
                  : 'Reschedule Diagnostics Booking'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {diagnosticsActionMode === 'retry'
                  ? 'Retry the diagnostics payment with optional coupon support.'
                  : diagnosticsActionMode === 'cancel'
                  ? 'Cancel the diagnostics booking with a pharmacy reason.'
                  : 'Move the diagnostics booking to a new date and time.'}
              </Text>

              {diagnosticsActionMode === 'retry' ? (
                <>
                  <LabeledField
                    label="Coupon Code"
                    value={diagnosticsActionForm.couponCode}
                    onChangeText={(text) =>
                      setDiagnosticsActionForm((current) => ({
                        ...current,
                        couponCode: text,
                      }))
                    }
                    placeholder="NEW100"
                  />
                  <ToggleRow
                    label="Use Wallet Balance"
                    hint="Apply wallet balance during payment retry."
                    value={diagnosticsActionForm.useWalletBalance}
                    onValueChange={(value) =>
                      setDiagnosticsActionForm((current) => ({
                        ...current,
                        useWalletBalance: value,
                      }))
                    }
                  />
                </>
              ) : null}

              {diagnosticsActionMode === 'cancel' ? (
                <LabeledField
                  label="Cancellation Reason"
                  value={diagnosticsActionForm.cancellationReason}
                  onChangeText={(text) =>
                    setDiagnosticsActionForm((current) => ({
                      ...current,
                      cancellationReason: text,
                    }))
                  }
                  placeholder="Cancelled by pharmacy"
                  multiline
                  error={diagnosticsActionErrors.cancellationReason}
                />
              ) : null}

              {diagnosticsActionMode === 'reschedule' ? (
                <>
                  <LabeledField
                    label="Booking Date"
                    value={diagnosticsActionForm.bookingDate}
                    onChangeText={(text) =>
                      setDiagnosticsActionForm((current) => ({
                        ...current,
                        bookingDate: text,
                      }))
                    }
                    placeholder="20260712"
                    keyboardType="number-pad"
                    error={diagnosticsActionErrors.bookingDate}
                  />
                  <LabeledField
                    label="Booking Time"
                    value={diagnosticsActionForm.bookingTime}
                    onChangeText={(text) =>
                      setDiagnosticsActionForm((current) => ({
                        ...current,
                        bookingTime: text,
                      }))
                    }
                    placeholder="11:30"
                    error={diagnosticsActionErrors.bookingTime}
                  />
                </>
              ) : null}

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setDiagnosticsActionModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title={
                    diagnosticsActionMode === 'retry'
                      ? 'Retry Payment'
                      : diagnosticsActionMode === 'cancel'
                      ? 'Cancel Booking'
                      : 'Reschedule Booking'
                  }
                  onPress={submitDiagnosticsAction}
                  loading={
                    retryDiagnosticsPaymentMutation.isPending ||
                    cancelDiagnosticsBookingMutation.isPending ||
                    rescheduleDiagnosticsBookingMutation.isPending
                  }
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={paymentVerificationModalVisible}
        onRequestClose={() => setPaymentVerificationModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPaymentVerificationModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { width: Math.min(width - scale(24), isTablet ? 700 : 540) },
            ]}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Verify Diagnostics Payment</Text>
              <Text style={styles.modalSubtitle}>
                Confirm Razorpay payment completion for this external booking.
              </Text>

              <LabeledField
                label="Payment Transaction ID"
                value={paymentVerificationForm.paymentTransactionId}
                onChangeText={(text) =>
                  setPaymentVerificationForm((current) => ({
                    ...current,
                    paymentTransactionId: text,
                  }))
                }
                placeholder="64f100000000000000000030"
                error={paymentVerificationErrors.paymentTransactionId}
              />
              <LabeledField
                label="Razorpay Order ID"
                value={paymentVerificationForm.razorpayOrderId}
                onChangeText={(text) =>
                  setPaymentVerificationForm((current) => ({
                    ...current,
                    razorpayOrderId: text,
                  }))
                }
                placeholder="order_example"
                error={paymentVerificationErrors.razorpayOrderId}
              />
              <LabeledField
                label="Razorpay Payment ID"
                value={paymentVerificationForm.razorpayPaymentId}
                onChangeText={(text) =>
                  setPaymentVerificationForm((current) => ({
                    ...current,
                    razorpayPaymentId: text,
                  }))
                }
                placeholder="pay_example"
                error={paymentVerificationErrors.razorpayPaymentId}
              />
              <LabeledField
                label="Razorpay Signature"
                value={paymentVerificationForm.razorpaySignature}
                onChangeText={(text) =>
                  setPaymentVerificationForm((current) => ({
                    ...current,
                    razorpaySignature: text,
                  }))
                }
                placeholder="signature_example"
                error={paymentVerificationErrors.razorpaySignature}
              />

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setPaymentVerificationModalVisible(false)}
                  variant="outline"
                  style={styles.modalActionButton}
                />
                <PrimaryButton
                  title="Verify Payment"
                  onPress={submitPaymentVerification}
                  loading={verifyDiagnosticsPaymentMutation.isPending}
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {!isTablet && !!selectedMedicineId && (
        <Modal
          visible={!!selectedMedicineId}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedMedicineId('')}
        >
          <View style={{ flex: 1, backgroundColor: '#F4F8FC' }}>
            <View style={[styles.toolbar, { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 40 : 16 }]}>
              <TouchableOpacity
                onPress={() => setSelectedMedicineId('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <ArrowLeft size={scale(20)} color={colors.textHeader} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: typography.fontFamily.semiBold, fontSize: scale(16), color: colors.textHeader }}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, padding: 16 }}>
              {renderMedicineDetails()}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },
  contentContainer: {
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(20),
    alignItems: 'center',
  },
  innerContainer: {
    gap: verticalScale(10),
  },
  statCard: {
    width: '48%',
    minWidth: scale(132),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(18),
    padding: scale(16),
    marginBottom: verticalScale(12),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  statIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(14),
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(22, 0.2),
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  sectionToggleRow: {
    backgroundColor: '#E8EFF6',
    borderRadius: scale(15),
    marginBottom: verticalScale(2),
  },
  sectionToggleRowContent: {
    padding: scale(4),
    paddingRight: scale(10),
  },
  sectionToggle: {
    minHeight: verticalScale(44),
    minWidth: scale(108),
    borderRadius: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: scale(12),
    marginRight: scale(6),
  },
  sectionToggleActive: {
    backgroundColor: colors.primaryBlue,
  },
  sectionToggleIcon: {
    marginRight: scale(8),
  },
  sectionToggleText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
    flexShrink: 1,
  },
  sectionToggleTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  sectionCardMedicines: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EDF3',
    padding: 0,
    overflow: 'hidden',
  },
  medicinesStorefrontTop: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
    backgroundColor: '#FFFFFF',
  },
  medicinesStorefrontSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  medicinesStorefrontSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: verticalScale(48),
    paddingHorizontal: scale(14),
  },
  medicinesStorefrontSearchInput: {
    flex: 1,
    marginLeft: scale(12),
    minHeight: verticalScale(40),
    color: colors.textHeader,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  medicineShelfTabsScroll: {
    marginHorizontal: -scale(2),
  },
  medicineShelfTabsContent: {
    paddingRight: scale(4),
  },
  medicineShelfTabPill: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(8),
    paddingTop: verticalScale(2),
    marginRight: scale(14),
    alignItems: 'center',
  },
  medicineShelfTabPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#111827',
  },
  medicineShelfTabPillTextActive: {
    color: colors.primaryBlue,
  },
  medicineShelfTabUnderline: {
    marginTop: verticalScale(8),
    width: scale(54),
    height: verticalScale(4),
    borderRadius: scale(999),
    backgroundColor: colors.primaryBlue,
  },
  medicineBrowseTabsScroll: {
    marginBottom: verticalScale(14),
  },
  medicineBrowseTabs: {
    paddingRight: scale(4),
  },
  medicineBrowseTab: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    borderBottomLeftRadius: scale(6),
    borderBottomRightRadius: scale(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFD8EE',
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryBlue,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    marginRight: scale(10),
  },
  medicineBrowseTabActive: {
    backgroundColor: '#EEF6FF',
  },
  medicineBrowseTabText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#374151',
  },
  medicineBrowseTabTextActive: {
    color: colors.primaryBlue,
  },
  sectionCardInventory: {
    backgroundColor: '#FFFCF5',
    borderColor: '#F3E2BF',
  },
  sectionCardCustomers: {
    backgroundColor: '#FAF8FF',
    borderColor: '#E8DFFD',
  },
  sectionCardOrders: {
    backgroundColor: '#FFF8F2',
    borderColor: '#F6DAC1',
  },
  sectionCardSubscriptions: {
    backgroundColor: '#FBF7FF',
    borderColor: '#E8DBFB',
  },
  sectionCardWallet: {
    backgroundColor: '#F4FCF7',
    borderColor: '#D4EEDC',
  },
  sectionCardTracking: {
    backgroundColor: '#F6FCF9',
    borderColor: '#D6EFE4',
  },
  sectionCardDiagnostics: {
    backgroundColor: '#FFF7F9',
    borderColor: '#F5D7DF',
  },
  toolbar: {
    marginBottom: verticalScale(14),
  },
  toolbarTablet: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    minHeight: verticalScale(44),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: '#D9E3EE',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(12),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    minHeight: verticalScale(42),
    paddingVertical: verticalScale(6),
  },
  searchHint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginTop: verticalScale(12),
    gap: scale(12),
  },
  toolbarActionsTablet: {
    marginTop: 0,
    marginLeft: scale(12),
    width: scale(260),
  },
  toolbarActionsTabletWide: {
    marginTop: 0,
    marginLeft: scale(12),
    flex: 1,
    justifyContent: 'flex-end',
  },
  orderToolbarActions: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 0,
  },
  toolbarButtonTablet: {
    marginVertical: 0,
  },
  toolbarPrimaryButton: {
    flex: 1,
    width: undefined,
    minWidth: 0,
    marginVertical: 0,
  },
  filterAction: {
    minHeight: verticalScale(40),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#D9E3EE',
    backgroundColor: '#F8FBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(6),
    marginRight: scale(10),
    marginBottom: verticalScale(10),
  },
  filterActionActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterActionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  filterActionTextActive: {
    color: '#FFFFFF',
  },
  orderFilterAction: {
    flex: 1,
    minWidth: 0,
    marginRight: 0,
  },
  panelLayout: {
    gap: verticalScale(16),
  },
  medicinesShowcase: {
    gap: verticalScale(16),
  },
  panelLayoutTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  panel: {
    flex: 1,
  },
  moduleShowcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: scale(22),
    borderWidth: 1,
    borderColor: '#DDEAF6',
    backgroundColor: '#F6FBFF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(16),
  },
  moduleShowcaseCopy: {
    flex: 1,
    marginRight: scale(14),
  },
  moduleShowcaseEyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: verticalScale(4),
  },
  moduleShowcaseTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  moduleShowcaseSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
  },
  moduleShowcaseIconWrap: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(16),
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicinesListPanel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(16),
  },
  medicinesDetailPanel: {
    backgroundColor: '#FFF9F7',
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: '#F1E4DD',
    padding: scale(16),
    shadowColor: '#D8BCB1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 3,
  },
  medicineListPanelTablet: {
    marginRight: scale(12),
  },
  medicineDetailPanelTablet: {
    marginLeft: scale(12),
  },
  panelHeader: {
    marginBottom: verticalScale(16),
  },
  medicinesStorefrontHeader: {
    marginBottom: verticalScale(12),
  },
  medicinesStorefrontHeading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: '#111827',
    marginBottom: verticalScale(4),
  },
  medicinesStorefrontDivider: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: '#C7CED8',
  },
  medicinesPanelHeader: {
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7DF',
  },
  panelTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  medicinesPanelSubtitle: {
    color: '#8B6F63',
  },
  panelSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
  listCard: {
    borderWidth: 1,
    borderColor: '#F3E7DF',
    borderRadius: scale(22),
    padding: scale(16),
    marginBottom: verticalScale(12),
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  listCardSelected: {
    borderColor: '#BFD8EE',
    backgroundColor: '#EEF6FF',
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.12,
  },
  medicineCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  medicineCardImageStub: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  medicineCardAction: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8EBCE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineCardActionSelected: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  listCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  listTitleWrap: {
    flex: 1,
    marginRight: scale(12),
  },
  listTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  listSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  medicineShelfTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(10),
  },
  medicineShelfTag: {
    borderRadius: scale(999),
    backgroundColor: '#FFF1D8',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    marginRight: scale(8),
    marginBottom: verticalScale(6),
  },
  medicineShelfTagSoft: {
    backgroundColor: '#EEF6FF',
  },
  medicineShelfTagText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: '#B77400',
  },
  medicineShelfTagTextSoft: {
    color: colors.primaryBlue,
  },
  badge: {
    borderRadius: scale(999),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: '#EAF8ED',
  },
  badgeWarning: {
    backgroundColor: '#FEF1E8',
  },
  badgeNeutral: {
    backgroundColor: '#EEF2F7',
  },
  badgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
  },
  badgeTextSuccess: {
    color: '#2E8E43',
  },
  badgeTextWarning: {
    color: '#C16306',
  },
  badgeTextNeutral: {
    color: '#637286',
  },
  medicineMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  metaLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  metaValue: {
    flex: 1,
    marginLeft: scale(16),
    textAlign: 'right',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  medicineCardFooter: {
    marginTop: verticalScale(6),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,111,99,0.14)',
  },
  medicineCardFooterText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: colors.primaryBlue,
  },
  medicineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  medicineGridCard: {
    width: '31.4%',
    marginBottom: verticalScale(16),
  },
  medicineGridCardSelected: {
    opacity: 0.92,
  },
  medicineGridArtwork: {
    borderRadius: scale(16),
    paddingHorizontal: scale(8),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(10),
    minHeight: verticalScale(120),
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
    overflow: 'hidden',
  },
  medicineGridArtworkOtc: {
    backgroundColor: '#FFF7E8',
  },
  medicineGridArtworkRx: {
    backgroundColor: '#EEF6FF',
  },
  medicineBestSellerBadge: {
    alignSelf: 'flex-start',
    borderRadius: scale(8),
    backgroundColor: '#FFE7A6',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(3),
  },
  medicineBestSellerBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(9),
    color: '#A16207',
  },
  medicineGridPillIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineGridAddButton: {
    alignSelf: 'flex-end',
    width: scale(34),
    height: scale(34),
    borderRadius: scale(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8EBCE1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  medicinePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  medicinePriceChip: {
    borderRadius: scale(10),
    backgroundColor: '#198A3A',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    marginRight: scale(6),
  },
  medicinePriceChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(10),
    color: '#FFFFFF',
  },
  medicineStrikeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(10),
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  medicineGridTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    lineHeight: scale(16),
    color: '#111827',
    marginBottom: verticalScale(4),
  },
  medicineGridSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(10),
    lineHeight: scale(13),
    color: '#4B5563',
    marginBottom: verticalScale(4),
  },
  medicineGridMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(10),
    color: '#7C8592',
  },
  detailCard: {
    borderWidth: 1,
    borderColor: '#F1E4DD',
    borderRadius: scale(24),
    padding: scale(18),
    backgroundColor: '#FFFFFF',
    minHeight: verticalScale(300),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  detailHeaderContent: {
    flex: 1,
    marginRight: scale(12),
  },
  detailTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(22, 0.2),
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  detailSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  secondaryAction: {
    minHeight: verticalScale(40),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scale(6),
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: scale(6),
    marginBottom: verticalScale(14),
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },
  detailValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  medicineCartHero: {
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#D9EAF8',
    backgroundColor: '#EEF7FF',
    padding: scale(16),
    marginBottom: verticalScale(18),
  },
  medicineCartHeroCopy: {
    marginBottom: verticalScale(14),
  },
  medicineCartHeroEyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: verticalScale(4),
  },
  medicineCartHeroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  medicineCartHeroActionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scale(10),
  },
  medicineCartStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9EAF8',
    padding: scale(6),
  },
  medicineCartStepButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(12),
    backgroundColor: '#EDF6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineCartStepButtonFilled: {
    backgroundColor: colors.primaryBlue,
  },
  medicineCartQuantityBadge: {
    minWidth: scale(54),
    paddingHorizontal: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineCartQuantityText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  medicineCartAddButton: {
    minHeight: verticalScale(48),
    paddingHorizontal: scale(16),
    borderRadius: scale(16),
    backgroundColor: colors.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineCartAddButtonText: {
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
  },
  medicineCartRemoveButton: {
    minHeight: verticalScale(46),
    paddingHorizontal: scale(14),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: '#F5D6A6',
    backgroundColor: '#FFF7E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineCartRemoveButtonText: {
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#A16207',
  },
  availabilitySection: {
    marginTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#E5EDF5',
    paddingTop: verticalScale(18),
  },
  availabilityHeader: {
    marginBottom: verticalScale(14),
  },
  availabilityTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  availabilitySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  availabilityBlockedCard: {
    marginBottom: 0,
  },
  availabilityActionRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(12),
    flexWrap: 'wrap',
  },
  availabilitySecondaryButton: {
    minHeight: verticalScale(40),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#D9E3EE',
    backgroundColor: '#F8FBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilitySecondaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  availabilityList: {
    gap: verticalScale(12),
  },
  availabilityCard: {
    borderWidth: 1,
    borderColor: '#E5EDF5',
    borderRadius: scale(16),
    padding: scale(14),
    backgroundColor: '#FFFFFF',
  },
  cartWorkspace: {
    marginTop: verticalScale(18),
    borderRadius: scale(26),
    borderWidth: 1,
    borderColor: '#D7EAFB',
    backgroundColor: '#FFFFFF',
    padding: scale(16),
    shadowColor: '#84BFEA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cartWorkspaceHeader: {
    marginBottom: verticalScale(16),
  },
  cartWorkspaceTitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  cartWorkspaceIcon: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(16),
    backgroundColor: '#E7F3FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  cartWorkspaceCopy: {
    flex: 1,
  },
  cartWorkspaceTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  cartWorkspaceSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
  cartWorkspaceClearButton: {
    minHeight: verticalScale(44),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: '#F5D6A6',
    backgroundColor: '#FFF9ED',
    paddingHorizontal: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  cartWorkspaceClearButtonDisabled: {
    borderColor: '#E5E9EF',
    backgroundColor: '#F5F7FA',
  },
  cartWorkspaceClearButtonText: {
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#A16207',
  },
  cartWorkspaceClearButtonTextDisabled: {
    color: colors.textLight,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
    marginBottom: verticalScale(16),
  },
  cartSummaryCard: {
    flex: 1,
    minWidth: scale(140),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E3EDF7',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  cartSummaryCardPrimary: {
    backgroundColor: '#EEF7FF',
    borderColor: '#D7EAFB',
  },
  cartSummaryLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(6),
  },
  cartSummaryValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(20, 0.2),
    color: colors.textHeader,
  },
  cartEmptyState: {
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#E5EDF5',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(20),
  },
  cartEmptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  cartEmptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
  },
  cartItemsStack: {
    gap: verticalScale(12),
  },
  cartItemCard: {
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E3EDF7',
    backgroundColor: '#FBFDFF',
    padding: scale(14),
  },
  cartItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  cartItemCopy: {
    flex: 1,
    marginRight: scale(12),
  },
  cartItemTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  cartItemSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cartItemPricePill: {
    borderRadius: scale(999),
    backgroundColor: '#EAF8ED',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
  },
  cartItemPriceText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: '#2E8E43',
  },
  cartItemFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: scale(10),
  },
  cartItemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9EAF8',
    padding: scale(5),
  },
  cartItemStepButton: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(11),
    backgroundColor: '#EDF6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemStepButtonAccent: {
    backgroundColor: colors.primaryBlue,
  },
  cartItemQuantityText: {
    minWidth: scale(46),
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  cartItemDeleteButton: {
    minHeight: verticalScale(40),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#F5D6A6',
    backgroundColor: '#FFF8EC',
    paddingHorizontal: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemDeleteText: {
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#A16207',
  },
  detailStatusBanner: {
    borderRadius: scale(18),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    marginBottom: verticalScale(16),
    borderWidth: 1,
  },
  detailStatusInfo: {
    backgroundColor: '#EDF6FD',
    borderColor: '#D2E8F8',
  },
  detailStatusSuccess: {
    backgroundColor: '#EDF9F0',
    borderColor: '#D4F0DA',
  },
  detailStatusWarning: {
    backgroundColor: '#FFF6EA',
    borderColor: '#FADFB5',
  },
  detailStatusDanger: {
    backgroundColor: '#FFF1EF',
    borderColor: '#FFD2CC',
  },
  detailStatusEyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: verticalScale(4),
  },
  detailStatusTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  detailStatusText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    gap: scale(12),
  },
  paginationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9E3EE',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    backgroundColor: '#F8FBFE',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F3F5F8',
    borderColor: '#E5E9EF',
  },
  paginationText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
    marginHorizontal: scale(4),
  },
  paginationTextDisabled: {
    color: colors.textLight,
  },
  customerStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  inventoryActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  importWorkspace: {
    marginBottom: verticalScale(16),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#E5EDF5',
    backgroundColor: '#FBFDFF',
    padding: scale(16),
  },
  importWorkspaceHeader: {
    marginBottom: verticalScale(12),
  },
  importControlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scale(4),
    marginBottom: verticalScale(10),
  },
  importControlButton: {
    flex: 1,
    minWidth: scale(128),
    marginHorizontal: scale(4),
  },
  importModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  importFileText: {
    flex: 1,
    minWidth: scale(180),
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  importAlertBox: {
    marginTop: verticalScale(12),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: '#FFD2CC',
    backgroundColor: '#FFF1EF',
    padding: scale(12),
  },
  importAlertTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#7A1D16',
    marginBottom: verticalScale(6),
  },
  importAlertText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#9F2E25',
    lineHeight: scale(18),
  },
  inventoryActionButton: {
    width: '48%',
    minWidth: scale(120),
    marginBottom: verticalScale(8),
  },
  orderToolbarPrimaryButton: {
    width: '100%',
    minWidth: 0,
    marginBottom: verticalScale(8),
  },
  orderActionRow: {
    marginTop: verticalScale(4),
    alignItems: 'stretch',
  },
  orderActionButton: {
    width: '48%',
    minWidth: 0,
    marginBottom: verticalScale(10),
  },
  orderActionEmptyState: {
    width: '100%',
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  orderActionEmptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  orderActionEmptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
  },
  customerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scale(6),
  },
  customerCard: {
    width: '100%',
    backgroundColor: '#FBFDFF',
    borderWidth: 1,
    borderColor: '#E4EDF5',
    borderRadius: scale(20),
    padding: scale(16),
    marginHorizontal: scale(6),
    marginBottom: verticalScale(12),
  },
  customerCardTablet: {
    width: '48%',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(14),
  },
  customerName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  customerPhone: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  customerAgePill: {
    borderRadius: scale(999),
    backgroundColor: '#EAF4FC',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
  },
  customerAgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: colors.primaryBlue,
  },
  customerFlags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(12),
  },
  customerNotesLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },
  customerNotes: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    lineHeight: scale(21),
  },
  adjustmentsSection: {
    marginTop: verticalScale(16),
  },
  adjustmentsTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
  adjustmentCard: {
    borderWidth: 1,
    borderColor: '#E5EDF5',
    borderRadius: scale(16),
    padding: scale(14),
    backgroundColor: '#FFFFFF',
    marginBottom: verticalScale(10),
  },
  adjustmentQty: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primaryBlue,
  },
  adjustmentNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
  headerCartButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCartBadge: {
    position: 'absolute',
    top: scale(6),
    right: scale(4),
    minWidth: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: '#E11D48',
    paddingHorizontal: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    lineHeight: scale(12),
  },
  loadingCard: {
    minHeight: verticalScale(140),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E5EDF5',
    backgroundColor: '#FBFDFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(24),
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: scale(18),
    backgroundColor: '#FFF1EF',
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#FFD2CC',
  },
  inlineErrorContent: {
    flex: 1,
    marginLeft: scale(10),
    marginRight: scale(10),
  },
  inlineErrorTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#7A1D16',
    marginBottom: verticalScale(4),
  },
  inlineErrorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#9F2E25',
    lineHeight: scale(18),
  },
  retryPill: {
    minHeight: verticalScale(34),
    paddingHorizontal: scale(12),
    borderRadius: scale(999),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  retryPillText: {
    marginLeft: scale(6),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  emptyState: {
    minHeight: verticalScale(150),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E5EDF5',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    maxWidth: scale(280),
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 21, 36, 0.44)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(12),
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(20),
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(6),
  },
  modalSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
    marginBottom: verticalScale(18),
  },
  formField: {
    marginBottom: verticalScale(14),
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  textInput: {
    minHeight: verticalScale(44),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: '#D9E3EE',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(14),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  textArea: {
    minHeight: verticalScale(104),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(14),
  },
  textInputError: {
    borderColor: colors.error,
  },
  fieldError: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  toggleRow: {
    minHeight: verticalScale(54),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(14),
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: scale(12),
  },
  toggleLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  toggleHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: verticalScale(8),
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: scale(4),
  },
});
