import React, { useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { ListSkeleton } from '../../components/ListSkeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, Notification as NotifType } from '../../api/notificationApi';
import { useAuthStore } from '../../state/authStore';

const Item = ({
  n,
  onPress,
}: {
  n: NotifType;
  onPress: (id: string) => void;
}) => {
  const isUnread = !n.isRead;
  const emoji = n.metadata?.emoji || '🔔'; // Backup emoji
  const timeText = n.createdAt 
    ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        if (isUnread) onPress(n._id || n.id || '');
      }}
      style={[styles.item, isUnread && styles.itemHighlight]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: scale(12) }}>
        <Text style={styles.title}>{n.title}</Text>
        <Text style={styles.sub}>{n.message}</Text>
        <Text style={styles.time}>{timeText}</Text>
      </View>
      {isUnread ? <View style={styles.dot} /> : <View style={styles.emptySpacer} />}
    </TouchableOpacity>
  );
};

export const NotificationsScreen = () => {
  const user = useAuthStore(state => state.user);
  const userId = user?.id || user?._id;
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['userNotifications', userId],
    queryFn: () => notificationApi.getUserNotifications(userId!),
    enabled: !!userId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', userId] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', userId] });
    },
  });

  const { today, yesterday, older } = useMemo(() => {
    const t: NotifType[] = [];
    const y: NotifType[] = [];
    const o: NotifType[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    notifications.forEach(n => {
      if (!n.createdAt) {
         o.push(n);
         return;
      }
      const dStr = new Date(n.createdAt).toDateString();
      if (dStr === todayStr) t.push(n);
      else if (dStr === yesterdayStr) y.push(n);
      else o.push(n);
    });

    return { today: t, yesterday: y, older: o };
  }, [notifications]);

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <View style={styles.container}>

      {hasUnread && (
        <View style={styles.markAllContainer}>
          <TouchableOpacity 
             onPress={() => markAllMutation.mutate()} 
             disabled={markAllMutation.isPending}
             style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>
               {markAllMutation.isPending ? 'Marking...' : 'Mark all as read'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ListSkeleton />
        ) : notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications yet.</Text>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>TODAY</Text>
                {today.map((n) => (
                  <Item key={n._id || n.id} n={n} onPress={(id) => markAsReadMutation.mutate(id)} />
                ))}
              </>
            )}

            {yesterday.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: verticalScale(18) }]}>YESTERDAY</Text>
                {yesterday.map((n) => (
                  <Item key={n._id || n.id} n={n} onPress={(id) => markAsReadMutation.mutate(id)} />
                ))}
              </>
            )}

            {older.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: verticalScale(18) }]}>OLDER</Text>
                {older.map((n) => (
                  <Item key={n._id || n.id} n={n} onPress={(id) => markAsReadMutation.mutate(id)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: scale(16), paddingTop: verticalScale(10), paddingBottom: verticalScale(18) },
  sectionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: verticalScale(10),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  itemHighlight: {
    backgroundColor: 'rgba(21,114,183,0.06)',
    borderTopColor: 'rgba(21,114,183,0.10)',
    paddingHorizontal: scale(10),
    borderRadius: scale(12),
    marginBottom: verticalScale(10),
    borderTopWidth: 0,
  },
  iconBox: { width: scale(42), height: scale(42), borderRadius: scale(14), backgroundColor: '#F3F6FB', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: scale(16) },
  title: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md, color: colors.textHeader },
  sub: { marginTop: verticalScale(2), fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  time: { marginTop: verticalScale(6), fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textLight },
  dot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: colors.primaryBlue, marginLeft: scale(10), marginTop: verticalScale(6) },
  emptySpacer: { width: scale(8), marginLeft: scale(10) },
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: scale(20) },
  markAllContainer: { alignItems: 'flex-end', paddingHorizontal: scale(16), paddingTop: verticalScale(8) },
  markAllBtn: { padding: scale(6) },
  markAllText: { color: colors.primaryBlue, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm },
});

