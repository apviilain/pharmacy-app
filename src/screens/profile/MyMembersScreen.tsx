import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Users,
  Phone,
  Mail,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { dependentService, Dependent } from '../../api/dependentService';
import { getCurrentUserId, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/types';

export const MyMembersScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);

  const storeUser = useAuthStore(state => state.user);
  const userId = getCurrentUserId() || storeUser?._id || storeUser?.id || null;

  const fetchDependents = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await dependentService.getDependentsByUser(userId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch dependents', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => navigation.navigate('AddMember', {})}
          activeOpacity={0.7}
        >
          <Plus size={scale(22)} color={colors.primaryBlue} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchDependents();
    }, [fetchDependents]),
  );

  const handleDelete = async (itemId: string) => {
    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dependentService.deleteDependent(itemId, userId!);
              setMembers(prev => prev.filter(m => (m._id || m.id) !== itemId));
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Member removed successfully.',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete member.',
              });
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Dependent }) => {
    const itemId = item._id || item.id || '';
    return (
      <View style={styles.memberCard}>
        {/* Avatar Initial */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(item.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={{ fontSize: scale(14) }}>
              {(() => {
                const rel = (item.relationship || '').toLowerCase();
                if (rel.includes('father')) return '👨';
                if (rel.includes('mother')) return '👩';
                if (
                  rel.includes('spouse') ||
                  rel.includes('wife') ||
                  rel.includes('husband')
                )
                  return '💍';
                if (rel.includes('son')) return '👦';
                if (rel.includes('daughter')) return '👧';
                if (rel.includes('brother')) return '👦';
                if (rel.includes('sister')) return '👧';
                if (rel.includes('grandfather')) return '👴';
                if (rel.includes('grandmother')) return '👵';
                if (rel.includes('self')) return '👤';
                return '👤';
              })()}
            </Text>
            <Text style={styles.memberMeta}>
              {item.relationship || 'Relation not set'}
            </Text>
          </View>
          {item.phone ? (
            <View style={styles.metaRow}>
              <Phone size={scale(12)} color={colors.textLight} />
              <Text style={styles.memberSub}>{item.phone}</Text>
            </View>
          ) : null}
          {item.email ? (
            <View style={styles.metaRow}>
              <Mail size={scale(12)} color={colors.textLight} />
              <Text style={styles.memberSub}>{item.email}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate('AddMember', { member: item })
            }
          >
            <Pencil size={scale(15)} color={colors.primaryBlue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(itemId)}
          >
            <Trash2 size={scale(15)} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Users
                size={scale(48)}
                color={colors.textLight}
                strokeWidth={1.2}
              />
            </View>
            <Text style={styles.emptyTitle}>No Members Added</Text>
            <Text style={styles.emptySubtitle}>
              Add family members or dependents to manage their health easily.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AddMember', {})}
            >
              <Plus size={scale(18)} color="#fff" />
              <Text style={styles.emptyAddText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={m => m._id || m.id || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRightBtn: {
    padding: scale(8),
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  addHeaderBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: verticalScale(30),
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderRadius: scale(16),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    backgroundColor: '#E8F2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  avatarText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: colors.primaryBlue,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(3),
    gap: scale(5),
  },
  memberMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  memberSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  actionCol: {
    alignItems: 'center',
    gap: verticalScale(8),
  },
  editBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.3)',
    backgroundColor: 'rgba(21,114,183,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
    backgroundColor: 'rgba(231,76,60,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  emptyIconWrap: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: scale(22),
    marginBottom: verticalScale(24),
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: scale(22),
    paddingVertical: verticalScale(12),
    borderRadius: scale(24),
    gap: scale(6),
    elevation: 3,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyAddText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
});
