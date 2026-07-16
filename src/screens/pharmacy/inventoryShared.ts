import { useQuery, useQueryClient } from '@tanstack/react-query';

import { pharmacyInventoryImportService } from '../../api/pharmacyInventoryImportService';
import { pharmacyInventoryService } from '../../api/pharmacyInventoryService';
import type {
  PharmyxInventoryAdjustment,
  PharmyxInventoryImport,
  PharmyxInventoryItem,
} from '../../api/pharmyx';
import { useAuthStore } from '../../state/authStore';
import { parseJwt } from '../../utils/jwt';

export const getEntityId = (
  entity: { id?: string; _id?: string } | null | undefined,
) => entity?.id || entity?._id || '';

export const getMedicineName = (
  item: PharmyxInventoryItem | PharmyxInventoryAdjustment | null | undefined,
) =>
  item?.medicine?.name ||
  item?.medicine?.brandName ||
  item?.medicine?.genericName ||
  'Medicine item';

export const getInventoryItemKey = (item: PharmyxInventoryItem, index: number) =>
  getEntityId(item) ||
  [getMedicineName(item), item.batchNumber || 'batch', index].join('-');

export const getInventoryImportKey = (
  item: PharmyxInventoryImport,
  index: number,
) =>
  getEntityId(item) ||
  [item.fileName || item.originalFileName || 'import', item.createdAt || index].join(
    '-',
  );

export const getInventoryAdjustmentKey = (
  item: PharmyxInventoryAdjustment,
  index: number,
) =>
  getEntityId(item) ||
  [getMedicineName(item), item.type || 'adjustment', item.createdAt || index].join(
    '-',
  );

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0,
  );

export const formatDate = (value?: string) => {
  if (!value) return 'No date';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No date';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const statusTone = (status?: string) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized.includes('success') || normalized.includes('complete')) {
    return {
      backgroundColor: '#EAF8ED',
      borderColor: '#B7E7C3',
      textColor: '#16824D',
      label: 'Verified',
    };
  }

  if (normalized.includes('fail') || normalized.includes('error')) {
    return {
      backgroundColor: '#FFF0F0',
      borderColor: '#F5C4C4',
      textColor: '#D64545',
      label: 'Failed',
    };
  }

  return {
    backgroundColor: '#FFF7E8',
    borderColor: '#F3D29D',
    textColor: '#B9750F',
    label: 'Processing',
  };
};

export function useInventoryData(options?: {
  lowStockLimit?: number;
  inventoryLimit?: number;
  importLimit?: number;
  adjustmentLimit?: number;
  lowStockOnly?: boolean;
}) {
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const jwtPayload = parseJwt(accessToken);
  const pharmacyId = String(
    authUser?.pharmacyId || jwtPayload?.pharmacyId || authUser?._id || '',
  );
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: [
      'inventory-dashboard-list',
      pharmacyId,
      !!options?.lowStockOnly,
      options?.inventoryLimit || 40,
    ],
    queryFn: () =>
      options?.lowStockOnly
        ? pharmacyInventoryService.lowStock({
            pharmacyId: pharmacyId || undefined,
            page: 1,
            limit: options?.inventoryLimit || 40,
          })
        : pharmacyInventoryService.list({
            pharmacyId: pharmacyId || undefined,
            isActive: true,
            page: 1,
            limit: options?.inventoryLimit || 40,
          }),
    enabled: !!pharmacyId,
  });

  const lowStockQuery = useQuery({
    queryKey: [
      'inventory-dashboard-low-stock',
      pharmacyId,
      options?.lowStockLimit || 10,
    ],
    queryFn: () =>
      pharmacyInventoryService.lowStock({
        pharmacyId: pharmacyId || undefined,
        page: 1,
        limit: options?.lowStockLimit || 10,
      }),
    enabled: !!pharmacyId,
  });

  const adjustmentsQuery = useQuery({
    queryKey: [
      'inventory-dashboard-adjustments',
      pharmacyId,
      options?.adjustmentLimit || 8,
    ],
    queryFn: () =>
      pharmacyInventoryService.adjustments({
        pharmacyId: pharmacyId || undefined,
        page: 1,
        limit: options?.adjustmentLimit || 8,
      }),
    enabled: !!pharmacyId,
  });

  const importsQuery = useQuery({
    queryKey: ['inventory-dashboard-imports', options?.importLimit || 10],
    queryFn: () =>
      pharmacyInventoryImportService.list({
        page: 1,
        limit: options?.importLimit || 10,
      }),
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard-list'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard-low-stock'] }),
      queryClient.invalidateQueries({
        queryKey: ['inventory-dashboard-adjustments'],
      }),
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard-imports'] }),
    ]);
  };

  return {
    pharmacyId,
    inventoryQuery,
    lowStockQuery,
    adjustmentsQuery,
    importsQuery,
    refreshAll,
  };
}
