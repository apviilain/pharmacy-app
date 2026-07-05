import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  PermissionsAndroid,
  FlatList,
} from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  UserCircle,
  X,
  ImageIcon,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import DatePicker from "react-native-date-picker";

import { PrimaryButton } from "../../components/PrimaryButton";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { scale, verticalScale, wp } from "../../theme/responsive";

import { useAuthStore } from "../../state/authStore";
import {
  defaultOpeningHours,
  mapPharmacyProfileToUser,
  type PharmyxDayHours,
  type PharmyxOpeningHours,
} from "../../api/pharmyx";
import { pharmacyService } from "../../api/pharmacyService";
import { fileApi } from "../../api/fileApi";
import { env } from "../../config/env";
import { useFormik } from "formik";
import {
  completeProfileValidationSchema,
  type CompleteProfileFormValues,
} from "./completeProfileValidation";

type CompleteProfileNavigationProp = NativeStackNavigationProp<
  any,
  "CompleteProfile"
>;

export const CompleteProfileScreen = () => {
  const navigation = useNavigation<CompleteProfileNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [openingHours, setOpeningHours] = useState<PharmyxOpeningHours>(
    user?.openingHours || defaultOpeningHours,
  );
  const [timePickerState, setTimePickerState] = useState<{
    visible: boolean;
    day: keyof PharmyxOpeningHours | null;
    field: "open" | "close" | null;
    value: Date;
  }>({
    visible: false,
    day: null,
    field: null,
    value: new Date(),
  });
  const initialValues: CompleteProfileFormValues = {
    name: user?.name || "",
    nickname: user?.nickname || "",
    ownerName: user?.ownerName || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    latitude: user?.latitude ? String(user.latitude) : "",
    longitude: user?.longitude ? String(user.longitude) : "",
    gstNumber: user?.gstNumber || "",
    drugLicenseNumber: user?.drugLicenseNumber || "",
    gstCertificateUrl: user?.gstCertificateUrl || "",
    drugLicenseDocumentUrl: user?.drugLicenseDocumentUrl || "",
    ownerIdProofUrl: user?.ownerIdProofUrl || "",
    shopFrontPhotoUrl: user?.shopFrontPhotoUrl || "",
    pickupAvailable: user?.pickupAvailable ?? true,
    deliveryAvailable: user?.deliveryAvailable ?? true,
  };

  const formik = useFormik({
    initialValues,
    validationSchema: completeProfileValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => handleSubmit(values),
  });
  const { setValues, values } = formik;

  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || user?.avatar || "",
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const profileSteps = [
    "Basic Details",
    "Compliance & Hours",
    "Service Options",
  ] as const;
  const progressValues = useRef(
    profileSteps.map((_, index) => new Animated.Value(index === 0 ? 1 : 0)),
  ).current;

  const stepFields: Array<Array<keyof typeof initialValues>> = [
    [
      "name",
      "nickname",
      "ownerName",
      "email",
      "address",
      "city",
      "state",
      "pincode",
    ],
    [
      "gstNumber",
      "drugLicenseNumber",
      "gstCertificateUrl",
      "drugLicenseDocumentUrl",
      "ownerIdProofUrl",
      "shopFrontPhotoUrl",
    ],
    ["pickupAvailable", "deliveryAvailable"],
  ];

  // Draft Saving / Restoring
  const isInitialMount = useRef(true);
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem("draft_profile_cache");
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed?.values) {
            setValues((prev) => ({ ...prev, ...parsed.values }));
            if (parsed.openingHours) {
              setOpeningHours(parsed.openingHours);
            }
          } else {
            setValues((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (e) {
        console.log("Error loading draft", e);
      }
    };
    loadDraft();
  }, [setValues]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    AsyncStorage.setItem(
      "draft_profile_cache",
      JSON.stringify({ values, openingHours }),
    ).catch(() => {});
  }, [values, openingHours]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, [currentStep]);

  useEffect(() => {
    Animated.parallel(
      progressValues.map((value, index) =>
        Animated.timing(value, {
          toValue: index <= currentStep ? 1 : 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [currentStep, progressValues]);

  const handleImagePick = () => {
    setShowPicker(true);
  };

  const checkAndRequestCameraPermission = async () => {
    if (Platform.OS === "ios") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message:
            "Pharmacy App needs access to your camera to take a profile picture.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const checkAndRequestGalleryPermission = async () => {
    if (Platform.OS === "ios") return true;
    try {
      const permission =
        Number(Platform.Version) >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission, {
        title: "Gallery Permission",
        message:
          "Pharmacy App needs access to your gallery to choose a profile picture.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const pickFromCamera = async () => {
    const hasPermission = await checkAndRequestCameraPermission();
    if (!hasPermission) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Camera permission is required to take a photo.",
      });
      return;
    }
    setShowPicker(false);
    setTimeout(() => {
      launchCamera({ mediaType: "photo", quality: 0.8 }, handleImageResult);
    }, 400);
  };

  const pickFromGallery = async () => {
    const hasPermission = await checkAndRequestGalleryPermission();
    if (!hasPermission) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Gallery permission is required to select a photo.",
      });
      return;
    }
    setShowPicker(false);
    setTimeout(() => {
      launchImageLibrary(
        { mediaType: "photo", quality: 0.8 },
        handleImageResult,
      );
    }, 400);
  };

  const handleImageResult = async (res: any) => {
    if (res.didCancel || !res.assets || res.assets.length === 0) return;
    const selectedAsset = res.assets[0];

    setUploadingImage(true);
    try {
      const file = {
        uri: selectedAsset.uri,
        type: selectedAsset.type || "image/jpeg",
        name: selectedAsset.fileName || "profile_image.jpg",
      };
      const phone = user?.phone || user?.mobile;
      const recordId = user?._id || user?.id || phone || "new_user";

      console.log("Uploading file for record:", recordId, file);

      // fileApi.uploadFile returns the fully unwrapped response (interceptors strip AxiosResponse wrapper)
      const uploadResponse: any = await fileApi.uploadFile(
        file,
        "profile",
        recordId,
      );

      console.log("Upload response:", JSON.stringify(uploadResponse));

      // uploadResponse is already fully unwrapped by apiClient interceptors
      // Expected shape: { files: [{ url: '...' }] } or { url: '...' }
      let finalProfileImageUrl =
        uploadResponse?.files?.[0]?.url || uploadResponse?.url || "";

      // Backend returns relative URLs (e.g. '/api/static/...') — resolve to full URL
      if (finalProfileImageUrl && finalProfileImageUrl.startsWith("/")) {
        finalProfileImageUrl = `${env.BASE_URL}${finalProfileImageUrl}`;
      }

      if (finalProfileImageUrl) {
        setProfilePicture(finalProfileImageUrl);
        Toast.show({
          type: "success",
          text1: "Photo Uploaded",
          text2: "Profile picture updated successfully.",
        });
      } else {
        console.warn(
          "Upload response structure:",
          JSON.stringify(uploadResponse),
        );
        Toast.show({
          type: "error",
          text1: "Upload Issue",
          text2: "Image uploaded but URL not found in response.",
        });
      }
    } catch (error: any) {
      console.error(
        "Upload error:",
        error?.message,
        error?.response?.data || error,
      );
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2:
          error?.response?.data?.message ||
          error?.userMessage ||
          error?.message ||
          "Failed to upload profile picture.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name.trim(),
        nickname:
          values.nickname.trim() ||
          values.name.trim().split(" ")[0] ||
          "Pharmacy",
        ownerName: values.ownerName.trim(),
        phone: (user?.phone || user?.mobile || "").trim(),
        email: values.email.trim() || undefined,
        address: values.address.trim() || undefined,
        city: values.city.trim() || undefined,
        state: values.state.trim() || undefined,
        pincode: values.pincode.trim() || undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        gstNumber: values.gstNumber.trim() || undefined,
        drugLicenseNumber: values.drugLicenseNumber.trim() || undefined,
        gstCertificateUrl: values.gstCertificateUrl.trim() || undefined,
        drugLicenseDocumentUrl:
          values.drugLicenseDocumentUrl.trim() || undefined,
        ownerIdProofUrl: values.ownerIdProofUrl.trim() || undefined,
        shopFrontPhotoUrl: values.shopFrontPhotoUrl.trim() || undefined,
        openingHours,
        pickupAvailable: values.pickupAvailable,
        deliveryAvailable: values.deliveryAvailable,
        profilePictureUrl: profilePicture.trim() || undefined,
        isVerified: false,
      };

      const createdProfile = await pharmacyService.createProfile(payload);
      const mappedUser = mapPharmacyProfileToUser(createdProfile);
      if (mappedUser) {
        setUser({
          ...user,
          ...mappedUser,
          phone: mappedUser.phone || user?.phone || user?.mobile || "",
          mobile: mappedUser.mobile || user?.mobile || user?.phone || "",
        });
      }

      await AsyncStorage.removeItem("draft_profile_cache");
      await useAuthStore.getState().setProfileComplete(true);

      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error: any) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2:
          error?.response?.data?.message ||
          error.message ||
          "Error saving profile",
      });
    }
  };

  const sanitizeFormValue = (
    field: keyof typeof initialValues,
    value: string,
  ) => {
    switch (field) {
      case "pincode":
        return value.replace(/\D/g, "");
      case "ownerName":
      case "city":
      case "state":
        return value.replace(/[^a-zA-Z\s.]/g, "");
      case "email":
        return value.replace(/\s/g, "").toLowerCase();
      case "gstNumber":
        return value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
      default:
        return value;
    }
  };

  const getInputBehavior = (
    field: keyof typeof initialValues,
    fallbackKeyboardType: "default" | "numeric" | "email-address" = "default",
  ) => {
    switch (field) {
      case "pincode":
        return {
          keyboardType: "number-pad" as const,
          inputMode: "numeric" as const,
          autoCapitalize: "none" as const,
          autoCorrect: false,
        };
      case "email":
        return {
          keyboardType: "email-address" as const,
          inputMode: "email" as const,
          autoCapitalize: "none" as const,
          autoCorrect: false,
        };
      case "gstCertificateUrl":
      case "drugLicenseDocumentUrl":
      case "ownerIdProofUrl":
      case "shopFrontPhotoUrl":
        return {
          keyboardType: "url" as const,
          inputMode: "url" as const,
          autoCapitalize: "none" as const,
          autoCorrect: false,
        };
      default:
        return {
          keyboardType: fallbackKeyboardType,
          inputMode:
            fallbackKeyboardType === "numeric"
              ? ("numeric" as const)
              : ("text" as const),
          autoCapitalize: "sentences" as const,
          autoCorrect: false,
        };
    }
  };

  const renderInput = (
    label: string,
    field: keyof typeof initialValues,
    placeholder: string,
    keyboardType: "default" | "numeric" | "email-address" = "default",
    maxLength?: number,
  ) => {
    const hasError = formik.touched[field] && formik.errors[field];
    const inputBehavior = getInputBehavior(field, keyboardType);
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, hasError ? styles.inputError : null]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={String(formik.values[field] || "")}
          onChangeText={(text) =>
            formik.setFieldValue(field, sanitizeFormValue(field, text))
          }
          onBlur={formik.handleBlur(field)}
          keyboardType={inputBehavior.keyboardType}
          inputMode={inputBehavior.inputMode}
          autoCapitalize={inputBehavior.autoCapitalize}
          autoCorrect={inputBehavior.autoCorrect}
          maxLength={maxLength}
        />
        {hasError ? (
          <Text style={styles.errorText}>{String(formik.errors[field])}</Text>
        ) : null}
      </View>
    );
  };

  const renderToggleCard = (
    label: string,
    field: "pickupAvailable" | "deliveryAvailable",
    helperText: string,
  ) => {
    const isEnabled = Boolean(formik.values[field]);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => formik.setFieldValue(field, !isEnabled)}
        style={[styles.toggleCard, isEnabled && styles.toggleCardActive]}
      >
        <View style={styles.toggleContent}>
          <Text style={styles.toggleTitle}>{label}</Text>
          <Text style={styles.toggleSubtitle}>{helperText}</Text>
        </View>
        <View style={[styles.togglePill, isEnabled && styles.togglePillActive]}>
          <View
            style={[styles.toggleKnob, isEnabled && styles.toggleKnobActive]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const dayLabels: Array<{
    key: keyof PharmyxOpeningHours;
    label: string;
  }> = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const updateOpeningHour = (
    day: keyof PharmyxOpeningHours,
    field: keyof PharmyxDayHours,
    value: string | boolean,
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { isClosed: false }),
        [field]: value,
      },
    }));
  };

  const sanitizeTimeValue = (value: string) =>
    value.replace(/[^0-9:]/g, "").slice(0, 5);

  const parseTimeToDate = (time?: string) => {
    const date = new Date();
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return date;
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const formatDateToTime = (date: Date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;

  const formatTimePreview = (time: string) => {
    if (!/^\d{2}:\d{2}$/.test(time)) return time || "--:--";
    const [hoursText, minutes] = time.split(":");
    const hours = Number(hoursText);
    const meridiem = hours >= 12 ? "PM" : "AM";
    const twelveHour = hours % 12 || 12;
    return `${String(twelveHour).padStart(2, "0")}:${minutes} ${meridiem}`;
  };

  const openTimePicker = (
    day: keyof PharmyxOpeningHours,
    field: "open" | "close",
    currentValue?: string,
  ) => {
    setTimePickerState({
      visible: true,
      day,
      field,
      value: parseTimeToDate(currentValue),
    });
  };

  const handleConfirmTime = (date: Date) => {
    if (timePickerState.day && timePickerState.field) {
      updateOpeningHour(
        timePickerState.day,
        timePickerState.field,
        formatDateToTime(date),
      );
    }
    setTimePickerState((prev) => ({ ...prev, visible: false }));
  };

  const handleTimePickerValueChange = (date: Date) => {
    setTimePickerState((prev) => ({ ...prev, value: date }));
  };

  const renderOpeningHoursRow = (
    day: keyof PharmyxOpeningHours,
    label: string,
  ) => {
    const dayValue = openingHours[day] || { isClosed: false };
    const isClosed = Boolean(dayValue.isClosed);

    return (
      <View key={day} style={styles.hoursCard}>
        <View style={styles.hoursHeader}>
          <View style={styles.hoursHeaderText}>
            <Text style={styles.hoursDay}>{label}</Text>
            <Text style={styles.hoursCaption}>
              {isClosed ? "Closed for the whole day" : "Set opening and closing time"}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              const nextClosed = !isClosed;
              setOpeningHours((prev) => ({
                ...prev,
                [day]: nextClosed
                  ? { isClosed: true }
                  : {
                      open: prev[day]?.open || "09:00",
                      close: prev[day]?.close || "21:00",
                      isClosed: false,
                    },
              }));
            }}
            style={[styles.hoursStatusToggle, !isClosed && styles.hoursStatusToggleActive]}
          >
            <View style={styles.hoursStatusTrack}>
              <View
                style={[
                  styles.hoursStatusKnob,
                  !isClosed && styles.hoursStatusKnobActive,
                ]}
              />
            </View>
            <Text
              style={[
                styles.hoursStatusText,
                !isClosed && styles.hoursStatusTextActive,
              ]}
            >
              {isClosed ? "Closed" : "Open"}
            </Text>
          </TouchableOpacity>
        </View>

        {!isClosed ? (
          <View style={styles.hoursRow}>
            <View style={styles.hoursColumn}>
              <Text style={styles.hoursInputLabel}>Opening Time</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.hoursTimeBox}
                onPress={() => openTimePicker(day, "open", dayValue.open)}
              >
                <TextInput
                  style={styles.hoursTimeInput}
                  placeholder="09:00"
                  placeholderTextColor={colors.textLight}
                  value={dayValue.open || ""}
                  onChangeText={(text) =>
                    updateOpeningHour(day, "open", sanitizeTimeValue(text))
                  }
                  keyboardType="numbers-and-punctuation"
                  inputMode="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={5}
                />
                <Clock3 size={scale(16)} color={colors.primaryBlue} />
              </TouchableOpacity>
            </View>
            <View style={styles.hoursRowDividerWrap}>
              <Text style={styles.hoursRowDivider}>to</Text>
            </View>
            <View style={styles.hoursColumn}>
              <Text style={styles.hoursInputLabel}>Closing Time</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.hoursTimeBox}
                onPress={() => openTimePicker(day, "close", dayValue.close)}
              >
                <TextInput
                  style={styles.hoursTimeInput}
                  placeholder="21:00"
                  placeholderTextColor={colors.textLight}
                  value={dayValue.close || ""}
                  onChangeText={(text) =>
                    updateOpeningHour(day, "close", sanitizeTimeValue(text))
                  }
                  keyboardType="numbers-and-punctuation"
                  inputMode="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={5}
                />
                <Clock3 size={scale(16)} color={colors.primaryBlue} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.closedHelper}>
            Customers will see this pharmacy as unavailable on {label.toLowerCase()}.
          </Text>
        )}
      </View>
    );
  };

  const validateStep = async () => {
    const fields = stepFields[currentStep];
    if (!fields.length) return true;

    const errors = await formik.validateForm();
    const touchedFields = fields.reduce<Record<string, boolean>>(
      (acc, field) => {
        acc[field] = true;
        return acc;
      },
      {},
    );
    formik.setTouched({ ...formik.touched, ...touchedFields });

    const firstErrorField = fields.find((field) => Boolean(errors[field]));
    if (firstErrorField) {
      Toast.show({
        type: "error",
        text1: "Please check this step",
        text2: String(errors[firstErrorField]),
      });
      return false;
    }

    return true;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep();
    if (!isValid) return;
    setCurrentStep((prev) => Math.min(prev + 1, profileSteps.length - 1));
  };

  const handleBackStep = () => {
    if (currentStep === 0) {
      navigation.goBack();
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>
              Profile Photo
            </Text>
            <Text style={styles.sectionSubtitle}>
              Add a clear photo so your profile feels complete.
            </Text>

            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={handleImagePick} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#1572B7", "#20C997", "#1572B7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View style={styles.avatarInnerRing}>
                    {uploadingImage ? (
                      <View style={styles.avatarPlaceholder}>
                        <ActivityIndicator
                          color={colors.primaryBlue}
                          size="large"
                        />
                      </View>
                    ) : profilePicture ? (
                      <Image
                        source={{ uri: profilePicture }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <UserCircle
                          color="#B8C7D6"
                          size={scale(52)}
                          strokeWidth={1.2}
                        />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.cameraIconBadge}>
                  <Camera color="#fff" size={scale(13)} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>
                {uploadingImage ? "Uploading photo..." : "Tap to change photo"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Business Details</Text>
            {renderInput(
              "Pharmacy Name *",
              "name",
              "Enter pharmacy name",
              "default",
              50,
            )}
            {renderInput(
              "Nickname",
              "nickname",
              "Enter display nickname",
              "default",
              30,
            )}
            {renderInput(
              "Owner Name *",
              "ownerName",
              "Enter owner full name",
              "default",
              50,
            )}
            {renderInput(
              "Email Address",
              "email",
              "Enter your email",
              "email-address",
              60,
            )}

            <Text style={styles.sectionTitle}>Location & Contact</Text>
            {renderInput(
              "Address",
              "address",
              "12 Main Market, Connaught Place",
              "default",
              100,
            )}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderInput("City", "city", "City name", "default", 30)}
              </View>
              <View style={styles.halfWidth}>
                {renderInput("State", "state", "State name", "default", 30)}
              </View>
            </View>
            {renderInput("Pincode", "pincode", "6-digit pincode", "numeric", 6)}
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.sectionTitle}>Compliance & Documents</Text>
            {renderInput(
              "GST Number",
              "gstNumber",
              "07ABCDE1234F1Z5",
              "default",
              20,
            )}
            {renderInput(
              "Drug License Number",
              "drugLicenseNumber",
              "DL-DEL-2026-001234",
              "default",
              40,
            )}
            {renderInput(
              "GST Certificate URL",
              "gstCertificateUrl",
              "https://cdn.example.com/pharmacy/gst-certificate.pdf",
              "default",
              150,
            )}
            {renderInput(
              "Drug License Document URL",
              "drugLicenseDocumentUrl",
              "https://cdn.example.com/pharmacy/drug-license.pdf",
              "default",
              150,
            )}
            {renderInput(
              "Owner ID Proof URL",
              "ownerIdProofUrl",
              "https://cdn.example.com/pharmacy/owner-id.pdf",
              "default",
              150,
            )}
            {renderInput(
              "Shop Front Photo URL",
              "shopFrontPhotoUrl",
              "https://cdn.example.com/pharmacy/shop-front.jpg",
              "default",
              150,
            )}

            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <Text style={styles.sectionSubtitleInline}>
              Set daily opening and closing times for your pharmacy.
            </Text>
            {dayLabels.map(({ key, label }) =>
              renderOpeningHoursRow(key, label),
            )}
          </>
        );
      case 2:
      default:
        return (
          <>
            <Text style={styles.sectionTitle}>Service Options</Text>
            <View style={styles.toggleSection}>
              {renderToggleCard(
                "Pickup Available",
                "pickupAvailable",
                "Customers can collect orders directly from the pharmacy.",
              )}
              {renderToggleCard(
                "Delivery Available",
                "deliveryAvailable",
                "Enable doorstep medicine delivery for customers.",
              )}
            </View>
          </>
        );
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.View
          style={styles.progressHeaderWrap}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressMeta}>
              Step {currentStep + 1} of {profileSteps.length}
            </Text>
            <Text style={styles.progressTitle}>
              {profileSteps[currentStep]}
            </Text>
            <View style={styles.progressTrack}>
              {profileSteps.map((step, index) => (
                <View
                  key={step}
                  style={styles.progressSegment}
                >
                  <Animated.View
                    style={[
                      styles.progressSegmentFill,
                      {
                        width: progressValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.formContainer}>
            {/* ── Bottom Sheet Image Picker ── */}
            <Modal
              visible={showPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPicker(false)}
            >
              <Pressable
                style={styles.pickerOverlay}
                onPress={() => setShowPicker(false)}
              >
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHandle} />
                  <Text style={styles.pickerTitle}>Choose Photo</Text>
                  <TouchableOpacity
                    style={styles.pickerRow}
                    activeOpacity={0.7}
                    onPress={pickFromCamera}
                  >
                    <View
                      style={[
                        styles.pickerIconBox,
                        { backgroundColor: "#EBF5FF" },
                      ]}
                    >
                      <Camera color={colors.primaryBlue} size={22} />
                    </View>
                    <View>
                      <Text style={styles.pickerRowTitle}>Take Photo</Text>
                      <Text style={styles.pickerRowSub}>Use your camera</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerRow}
                    activeOpacity={0.7}
                    onPress={pickFromGallery}
                  >
                    <View
                      style={[
                        styles.pickerIconBox,
                        { backgroundColor: "#F0FFF4" },
                      ]}
                    >
                      <ImageIcon color="#38A169" size={22} />
                    </View>
                    <View>
                      <Text style={styles.pickerRowTitle}>
                        Choose from Gallery
                      </Text>
                      <Text style={styles.pickerRowSub}>
                        Select an existing photo
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerCancel}
                    activeOpacity={0.7}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={styles.pickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {renderStepContent()}
          </View>
        </ScrollView>
        <Modal
          visible={timePickerState.visible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setTimePickerState((prev) => ({ ...prev, visible: false }))
          }
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() =>
              setTimePickerState((prev) => ({ ...prev, visible: false }))
            }
          >
            <Pressable style={styles.timeModalContent} onPress={() => {}}>
              <View style={styles.timeModalHandle} />
              <View style={styles.timeModalHeader}>
                <View style={styles.timeModalHeaderContent}>
                  <View style={styles.timeModalIcon}>
                    <Clock3 size={scale(18)} color={colors.primaryBlue} />
                  </View>
                  <Text style={styles.timeModalTitle}>Choose Time</Text>
                  <Text style={styles.timeModalSub}>
                    You can also type time manually in the field.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setTimePickerState((prev) => ({ ...prev, visible: false }))
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={scale(20)} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.timePreviewCard}>
                <Text style={styles.timePreviewLabel}>Selected time</Text>
                <View style={styles.timePreviewValueRow}>
                  <Text style={styles.timePreviewValue}>
                    {formatTimePreview(formatDateToTime(timePickerState.value))}
                  </Text>
                  <CheckCircle2
                    size={scale(18)}
                    color={colors.primaryBlue}
                  />
                </View>
              </View>

              <View style={styles.timePickerWrap}>
                <DatePicker
                  date={timePickerState.value}
                  mode="time"
                  onDateChange={handleTimePickerValueChange}
                />
              </View>

              <View style={styles.timeModalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() =>
                    setTimePickerState((prev) => ({ ...prev, visible: false }))
                  }
                  variant="outline"
                  style={styles.timeModalButton}
                />
                <PrimaryButton
                  title="Apply"
                  onPress={() => handleConfirmTime(timePickerState.value)}
                  style={styles.timeModalButton}
                />
              </View>
            </Pressable>
          </TouchableOpacity>
        </Modal>
        <View style={styles.footer}>
          <View style={styles.actionRow}>
            <PrimaryButton
              title="Back"
              onPress={handleBackStep}
              variant="outline"
              style={styles.backButton}
            />
            <PrimaryButton
              title={
                currentStep === profileSteps.length - 1 ? "Submit" : "Next"
              }
              onPress={
                currentStep === profileSteps.length - 1
                  ? (formik.handleSubmit as any)
                  : handleNextStep
              }
              loading={loading}
              disabled={loading}
              style={styles.nextButton}
              rightIcon={<ArrowRight size={scale(20)} color="#fff" />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === "android" ? verticalScale(20) : 0,
  },
  flex1: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp("5%"),
    paddingBottom: verticalScale(132),
    paddingTop: verticalScale(12),
  },
  formContainer: {
    flex: 1,
    marginTop: 0,
  },
  progressHeaderWrap: {
    paddingHorizontal: wp("5%"),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(6),
    backgroundColor: colors.background,
  },
  progressHeader: {
    marginBottom: verticalScale(2),
  },
  progressMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: verticalScale(4),
  },
  progressTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(14),
  },
  progressTrack: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(6),
  },
  progressSegment: {
    flex: 1,
    height: verticalScale(6),
    borderRadius: scale(999),
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressSegmentFill: {
    height: "100%",
    borderRadius: scale(999),
    backgroundColor: colors.primaryBlue,
  },

  // ─── Avatar ───
  avatarWrap: { alignItems: "center", marginBottom: verticalScale(20) },
  avatarGradientRing: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    padding: 3,
    elevation: 8,
    shadowColor: "#1572B7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarInnerRing: {
    flex: 1,
    borderRadius: scale(53),
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4FD",
  },
  avatarImage: { width: "100%", height: "100%" },
  cameraIconBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primaryBlue,
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarHint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
    marginTop: verticalScale(10),
    letterSpacing: 0.3,
  },

  // ─── Bottom Sheet Picker ───
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },
  pickerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 16,
  },
  pickerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRowTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  pickerRowSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  pickerCancel: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  pickerCancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: "#EF4444",
  },

  // ─── Form ───
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.primaryBlue,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  firstSectionTitle: {
    marginTop: -verticalScale(6),
    marginBottom: verticalScale(4),
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: "#817795",
    lineHeight: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  sectionSubtitleInline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: "#817795",
    lineHeight: verticalScale(20),
    marginTop: -verticalScale(10),
    marginBottom: verticalScale(14),
  },
  inputContainer: { marginBottom: verticalScale(16) },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfWidth: { width: "48%" },
  input: {
    height: verticalScale(56),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1.5 },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: "#EF4444",
    marginTop: verticalScale(4),
  },
  hoursCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(2),
    backgroundColor: "#fff",
    marginBottom: verticalScale(12),
  },
  hoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  hoursHeaderText: {
    flex: 1,
    paddingRight: scale(12),
  },
  hoursDay: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  hoursCaption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: verticalScale(4),
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: scale(10),
    marginTop: verticalScale(4),
  },
  hoursColumn: {
    flex: 1,
  },
  hoursRowDividerWrap: {
    paddingBottom: verticalScale(16),
  },
  hoursRowDivider: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  hoursInputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  hoursTimeBox: {
    height: verticalScale(52),
    borderWidth: 1,
    borderColor: "#D8E4F0",
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FBFDFF",
  },
  hoursTimeInput: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  hoursStatusToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    borderRadius: scale(999),
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FFD5DA",
  },
  hoursStatusToggleActive: {
    backgroundColor: "#EAF7F0",
    borderColor: "#C7EBD6",
  },
  hoursStatusTrack: {
    width: scale(32),
    height: verticalScale(18),
    borderRadius: scale(999),
    backgroundColor: "#FCA5A5",
    padding: scale(2),
    justifyContent: "center",
  },
  hoursStatusKnob: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    backgroundColor: "#fff",
  },
  hoursStatusKnobActive: {
    alignSelf: "flex-end",
  },
  hoursStatusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: "#DC2626",
  },
  hoursStatusTextActive: {
    color: "#15803D",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.36)",
    justifyContent: "flex-end",
  },
  timeModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(14),
    paddingBottom:
      Platform.OS === "ios" ? verticalScale(30) : verticalScale(20),
  },
  timeModalHandle: {
    width: scale(42),
    height: verticalScale(4),
    borderRadius: scale(999),
    backgroundColor: "rgba(15, 23, 42, 0.10)",
    alignSelf: "center",
    marginBottom: verticalScale(14),
  },
  timeModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: scale(12),
    marginBottom: verticalScale(10),
  },
  timeModalHeaderContent: {
    flex: 1,
  },
  timeModalIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
  },
  timeModalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
  },
  timeModalSub: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  timePreviewCard: {
    marginTop: verticalScale(4),
    marginBottom: verticalScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: scale(18),
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DDEAF8",
  },
  timePreviewLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: verticalScale(6),
  },
  timePreviewValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timePreviewValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  timePickerWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
    borderRadius: scale(20),
    backgroundColor: "#FBFDFF",
  },
  timeModalActions: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: verticalScale(14),
  },
  timeModalButton: {
    flex: 1,
  },
  closedBadge: {
    borderRadius: scale(999),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: "#E8F4FD",
  },
  closedBadgeActive: {
    backgroundColor: "#FEF2F2",
  },
  closedBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primaryBlue,
  },
  closedBadgeTextActive: {
    color: "#DC2626",
  },
  closedHelper: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: verticalScale(12),
  },
  inputDisabled: { backgroundColor: "#F3F6FB", color: colors.textLight },
  footer: {
    paddingHorizontal: wp("5%"),
    paddingTop: verticalScale(10),
    paddingBottom:
      Platform.OS === "ios" ? verticalScale(24) : verticalScale(18),
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  backButton: {
    flex: 0.85,
  },
  nextButton: {
    flex: 1.3,
  },
  toggleSection: {
    gap: verticalScale(12),
    marginBottom: verticalScale(8),
  },
  toggleCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleCardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: "#F5FAFF",
  },
  toggleContent: {
    flex: 1,
    paddingRight: scale(12),
  },
  toggleTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  toggleSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: verticalScale(3),
    lineHeight: verticalScale(18),
  },
  togglePill: {
    width: scale(44),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#D7E2EE",
    padding: scale(3),
    justifyContent: "center",
  },
  togglePillActive: {
    backgroundColor: colors.primaryBlue,
  },
  toggleKnob: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: "#fff",
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
  },

  // ─── Dropdown Trigger ───
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  dropdownPlaceholder: {
    color: colors.textLight,
  },

  // ─── Dropdown Bottom Sheet ───
  dropdownSheet: {
    maxHeight: "60%",
  },
  dropdownList: {
    maxHeight: verticalScale(320),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemSelected: {
    backgroundColor: "#EBF5FF",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    marginHorizontal: -scale(4),
  },
  dropdownItemText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  dropdownItemTextSelected: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
  },
});
