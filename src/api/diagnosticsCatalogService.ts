import { apiClient } from './apiClient';
import { endpoints } from './endpoints';
import type { DiagnosticsPackage, DiagnosticsSlot } from './pharmyx';

type DiagnosticsPackagesParams = {
  integration?: string;
  search?: string;
};

type DiagnosticsSlotsParams = {
  integration?: string;
  bookingDate: string;
  pincode?: string;
  packageIds?: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getId = (value: Record<string, unknown>) =>
  String(
    value._id ||
      value.id ||
      value.packageId ||
      value.slotId ||
      value.code ||
      '',
  );

const getArrayFromPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.packages,
    payload.tests,
    payload.slots,
    payload.records,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      const nested = getArrayFromPayload(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
};

const normalizePackage = (item: unknown): DiagnosticsPackage | null => {
  if (!isRecord(item)) return null;

  const id = getId(item);
  const name = String(
    item.packageName || item.displayName || item.name || item.testName || '',
  ).trim();

  if (!id && !name) return null;

  return {
    ...item,
    id: item.id ? String(item.id) : id || undefined,
    _id: item._id ? String(item._id) : undefined,
    packageId: item.packageId ? String(item.packageId) : id || undefined,
    code: item.code ? String(item.code) : id || undefined,
    name: name || undefined,
    packageName: name || undefined,
    displayName: name || undefined,
    amount: Number(item.amount ?? item.price ?? item.discountedPrice ?? 0),
    price: Number(item.price ?? item.amount ?? item.discountedPrice ?? 0),
    discountedPrice: Number(
      item.discountedPrice ?? item.amount ?? item.price ?? 0,
    ),
    testCount: Number(item.testCount ?? item.testsCount ?? 0),
    testsCount: Number(item.testsCount ?? item.testCount ?? 0),
    isActive:
      item.isActive === undefined ? true : Boolean(item.isActive),
  };
};

const normalizeSlot = (item: unknown): DiagnosticsSlot | null => {
  if (!isRecord(item)) return null;

  const id = getId(item);
  const startTime = String(
    item.startTime || item.bookingTime || item.label || item.slot || '',
  ).trim();

  if (!id && !startTime) return null;

  return {
    ...item,
    id: item.id ? String(item.id) : id || undefined,
    _id: item._id ? String(item._id) : undefined,
    slotId: item.slotId ? String(item.slotId) : id || undefined,
    startTime: startTime || undefined,
    bookingTime: startTime || undefined,
    label: startTime || undefined,
    bookingDate: item.bookingDate ? String(item.bookingDate) : undefined,
    date: item.date ? String(item.date) : undefined,
    isAvailable:
      item.isAvailable === undefined ? true : Boolean(item.isAvailable),
    isActive: item.isActive === undefined ? true : Boolean(item.isActive),
    packageIds: Array.isArray(item.packageIds)
      ? item.packageIds.map(value => String(value))
      : undefined,
  };
};

const getCandidatePaths = (kind: 'packages' | 'slots') => {
  if (kind === 'packages') {
    return [
      endpoints.diagnosticsBookings.packages,
      '/api/v1/external-bookings/packages',
      '/api/v1/integrations/labstack/packages',
    ];
  }

  return [
    endpoints.diagnosticsBookings.slots,
    '/api/v1/external-bookings/slots',
    '/api/v1/integrations/labstack/slots',
  ];
};

const requestFirstAvailable = async (
  paths: string[],
  params: Record<string, unknown>,
) => {
  let lastError: unknown;

  for (const path of paths) {
    try {
      return await apiClient.get(path, { params });
    } catch (error: any) {
      lastError = error;
      if (![400, 404, 405].includes(error?.httpStatus)) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const diagnosticsCatalogService = {
  getPackages: async (
    params: DiagnosticsPackagesParams = {},
  ): Promise<DiagnosticsPackage[]> => {
    const response = await requestFirstAvailable(getCandidatePaths('packages'), {
      integration: params.integration || 'labstack',
      search: params.search,
    });

    return getArrayFromPayload(response)
      .map(normalizePackage)
      .filter(Boolean) as DiagnosticsPackage[];
  },

  getSlots: async (params: DiagnosticsSlotsParams): Promise<DiagnosticsSlot[]> => {
    const response = await requestFirstAvailable(getCandidatePaths('slots'), {
      integration: params.integration || 'labstack',
      bookingDate: params.bookingDate,
      pincode: params.pincode,
      packageIds: params.packageIds?.join(','),
    });

    return getArrayFromPayload(response)
      .map(normalizeSlot)
      .filter(Boolean) as DiagnosticsSlot[];
  },
};
