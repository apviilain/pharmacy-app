import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react-native';

import { pharmacyOrderService } from '../../api/pharmacyOrderService';
import type { PharmyxOrder } from '../../api/pharmyx';
import { useAuthStore } from '../../state/authStore';
import { parseJwt } from '../../utils/jwt';

export const getEntityId = (entity: { id?: string; _id?: string } | null | undefined) =>
  entity?.id || entity?._id || '';

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0,
  );

export const formatTime = (value?: string) => {
  if (!value) return 'Recent';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
};

export const normalizeState = (value?: string) => String(value || '').trim().toLowerCase();

export const getOrderCustomer = (order: PharmyxOrder) =>
  order.customer?.name || order.customerId || 'Walk-in customer';

export const getOrderStatusMeta = (order: PharmyxOrder) => {
  const status = normalizeState(order.status || 'placed');
  const paymentStatus = normalizeState(order.paymentStatus || 'pending');

  if (status === 'out_for_delivery' || status === 'out for delivery') {
    return {
      label: 'Out for Delivery',
      backgroundColor: '#EAF1FF',
      color: '#3559C7',
      icon: Truck,
    };
  }

  if (status === 'accepted' || status === 'processing') {
    return {
      label: 'Accepted',
      backgroundColor: '#EEF5FF',
      color: '#295EAA',
      icon: PackageCheck,
    };
  }

  if (status === 'delivered') {
    return {
      label: 'Delivered',
      backgroundColor: '#EAF8ED',
      color: '#1B8750',
      icon: CheckCircle2,
    };
  }

  if (paymentStatus === 'pending') {
    return {
      label: 'Pending',
      backgroundColor: '#FFF2F2',
      color: '#D64545',
      icon: CircleDollarSign,
    };
  }

  return {
    label: 'Placed',
    backgroundColor: '#F3F4F6',
    color: '#667085',
    icon: ShoppingBag,
  };
};

export function usePharmacyOrdersOverview() {
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const jwtPayload = parseJwt(accessToken);
  const pharmacyId = String(
    authUser?.pharmacyId || jwtPayload?.pharmacyId || authUser?._id || '',
  );

  const ordersQuery = useQuery({
    queryKey: ['pharmacyOrdersOverview', pharmacyId],
    queryFn: () =>
      pharmacyOrderService.list({
        pharmacyId: pharmacyId || undefined,
        page: 1,
        limit: 40,
      }),
    enabled: !!pharmacyId,
  });

  const orders = ordersQuery.data || [];

  const summary = useMemo(() => {
    const pendingOrders = orders.filter((order) => {
      const status = normalizeState(order.status);
      return ['placed', 'pending'].includes(status);
    }).length;
    const processedOrders = orders.filter((order) => {
      const status = normalizeState(order.status);
      return ['accepted', 'processing', 'ready', 'delivered'].includes(status);
    }).length;
    const pendingPayment = orders.filter(
      (order) => normalizeState(order.paymentStatus) === 'pending',
    ).length;
    const liveOrders = orders.filter((order) =>
      ['accepted', 'processing', 'out_for_delivery', 'out for delivery'].includes(
        normalizeState(order.status),
      ),
    ).length;

    return {
      totalOrders: orders.length,
      pendingOrders,
      processedOrders,
      pendingPayment,
      liveOrders,
    };
  }, [orders]);

  return {
    pharmacyId,
    ordersQuery,
    orders,
    ...summary,
  };
}
