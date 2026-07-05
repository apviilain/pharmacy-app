import * as Yup from "yup";

export type CompleteProfileFormValues = {
  name: string;
  nickname: string;
  ownerName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  gstNumber: string;
  drugLicenseNumber: string;
  gstCertificateUrl: string;
  drugLicenseDocumentUrl: string;
  ownerIdProofUrl: string;
  shopFrontPhotoUrl: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
};

export const completeProfileValidationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(3, "Name too short")
    .max(50, "Name too long")
    .required("Pharmacy name is required"),
  nickname: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z0-9\s._-]*$/,
      "Nickname can only contain letters, numbers, spaces, dot, underscore, and hyphen",
    )
    .max(30, "Nickname too long"),
  ownerName: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z\s.]+$/,
      "Owner name can only contain letters and spaces",
    )
    .min(3, "Owner name too short")
    .max(50, "Owner name too long")
    .required("Owner name is required"),
  email: Yup.string().email("Enter a valid email address"),
  address: Yup.string().trim().required("Address is required"),
  city: Yup.string()
    .trim()
    .matches(/^[a-zA-Z\s.]+$/, "City can only contain letters and spaces")
    .required("City is required"),
  state: Yup.string()
    .trim()
    .matches(/^[a-zA-Z\s.]+$/, "State can only contain letters and spaces")
    .required("State is required"),
  pincode: Yup.string()
    .matches(/^\d{6}$/, "Pincode must be exactly 6 digits")
    .required("Pincode is required"),
  latitude: Yup.number()
    .typeError("Latitude must be a valid number")
    .min(-90, "Latitude must be at least -90")
    .max(90, "Latitude must be at most 90")
    .nullable(),
  longitude: Yup.number()
    .typeError("Longitude must be a valid number")
    .min(-180, "Longitude must be at least -180")
    .max(180, "Longitude must be at most 180")
    .nullable(),
  gstNumber: Yup.string()
    .trim()
    .matches(
      /^[0-9A-Z]{15}$/,
      "GST number must be 15 uppercase letters/numbers",
    )
    .nullable(),
  gstCertificateUrl: Yup.string()
    .trim()
    .url("Enter a valid GST certificate URL"),
  drugLicenseDocumentUrl: Yup.string()
    .trim()
    .url("Enter a valid drug license document URL"),
  ownerIdProofUrl: Yup.string()
    .trim()
    .url("Enter a valid owner ID proof URL"),
  shopFrontPhotoUrl: Yup.string()
    .trim()
    .url("Enter a valid shop front photo URL"),
});
