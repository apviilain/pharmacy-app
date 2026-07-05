import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { PrimaryButton } from '../../components/PrimaryButton';
import { dependentService, Dependent } from '../../api/dependentService';
import { getCurrentUserId, useAuthStore } from '../../state/authStore';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Trash2, Pencil, CheckCircle2 } from 'lucide-react-native';
import { ListSkeleton } from '../../components/ListSkeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectMember'>;

export const SelectMemberScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<Dependent[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Try multiple sources for userId
  const storeUser = useAuthStore(state => state.user);
  const userId = getCurrentUserId() || storeUser?._id || storeUser?.id || null;

  const fetchDependents = useCallback(async () => {
    if (!userId) {
      console.log('No userId found, skipping dependent fetch');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log('Fetching dependents for userId:', userId);
      const data = await dependentService.getDependentsByUser(userId);
      console.log('Dependents fetched:', JSON.stringify(data));
      const dependents = Array.isArray(data) ? data : [];
      
      const selfMember: Dependent = {
        _id: storeUser?._id || storeUser?.id || userId!,
        id: storeUser?._id || storeUser?.id || userId!,
        name: storeUser?.name || 'Self',
        relationship: 'Self',
        gender: storeUser?.gender || '',
        age: storeUser?.age || 0,
        phone: storeUser?.phone || storeUser?.mobile || '',
        email: storeUser?.email || '',
      } as Dependent;

      const allMembers = [selfMember, ...dependents];
      setMembers(allMembers);
      
      if (!selectedId && allMembers.length > 0) {
        setSelectedId(allMembers[0]._id || allMembers[0].id || '');
      }
    } catch (error) {
      console.error('Failed to fetch dependents', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refetch every time screen comes into focus (e.g. after AddMember)
  useFocusEffect(
    useCallback(() => {
      fetchDependents();
    }, [fetchDependents]),
  );

  const selected = useMemo(
    () => members.find(m => (m._id || m.id) === selectedId) ?? members[0],
    [members, selectedId],
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
              setMembers(members.filter(m => (m._id || m.id) !== itemId));
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
    const active = itemId === selectedId;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelectedId(itemId)}
        style={[styles.memberCard, active && styles.memberCardActive]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRel}>{item.relationship}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {active && (
            <View style={{ marginRight: item.relationship !== 'Self' ? scale(12) : 0 }}>
              <CheckCircle2 size={scale(22)} color={colors.primaryBlue} fill="rgba(21,114,183,0.1)" />
            </View>
          )}
          {item.relationship !== 'Self' && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  (navigation as any).navigate('AddMember', { member: item })
                }
              >
                <Pencil size={scale(16)} color={colors.primaryBlue} />
              </TouchableOpacity>
              <View style={{ width: scale(8) }} />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(itemId)}
              >
                <Trash2 size={scale(18)} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <View style={styles.addRow}>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.addBtn}
            onPress={() =>
              navigation.navigate('AddMember', {
                doctorId: route.params.doctorId,
              })
            }
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={scale(16)} color="#fff" />
              <View style={{ width: scale(4) }} />
              <Text style={styles.addBtnText}>Add Member</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ListSkeleton />
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

      <View
        style={[
          styles.bottom,
          {
            paddingBottom:
              insets.bottom > 0
                ? insets.bottom + verticalScale(8)
                : verticalScale(16),
          },
        ]}
      >
        <PrimaryButton
          title="Next →"
          onPress={() => {
            if (!selected) return;
            navigation.navigate('SlotSelection', {
              doctorId: route.params.doctorId,
              member: {
                id: selected._id || selected.id || '',
                name: selected.name || '',
                relation: selected.relationship || '',
                gender: selected.gender || '',

                contact: selected.phone || '',
                email: selected.email || '',
              },
            });
          }}
          disabled={!selected}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: verticalScale(12),
  },
  addLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  addBtn: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: scale(14),
    height: verticalScale(34),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#fff',
  },
  listContent: { paddingBottom: verticalScale(20) },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderRadius: scale(14),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: verticalScale(12),
  },
  memberCardActive: {
    borderColor: colors.primaryBlue,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  memberName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  memberRel: {
    marginTop: verticalScale(3),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  editBtn: {
    height: verticalScale(34),
    width: verticalScale(34),
    borderRadius: scale(17),
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,114,183,0.05)',
  },
  deleteBtn: {
    height: verticalScale(34),
    width: verticalScale(34),
    borderRadius: scale(17),
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  editText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  bottom: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: colors.background,
  },
  cta: { marginVertical: 0 },
});
