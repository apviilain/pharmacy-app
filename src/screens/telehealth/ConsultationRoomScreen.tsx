import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Video } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appointmentService } from '../../api/appointmentService';
import { telehealthService } from '../../api/telehealthService';
import { env } from '../../config/env';
import { getApptDateTime } from '../../utils/appointmentUtils';

import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultationRoom'>;

/* ── Timer formatter ── */
const formatTimer = (totalSecs: number) => {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
    2,
    '0',
  )}:${String(secs).padStart(2, '0')}`;
};

/* ── Vitals Pill ── */
const VitalPill = ({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) => (
  <View style={styles.vitalPill}>
    <Text style={[styles.vitalValue, { color }]}>{value}</Text>
    <Text style={styles.vitalLabel}>{label}</Text>
  </View>
);

const TagChip = ({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) => (
  <View style={[styles.tagChip, { backgroundColor: bg }]}>
    <Text style={[styles.tagText, { color }]} numberOfLines={1}>
      {label.length > 20 ? `${label.slice(0, 20)}…` : label}
    </Text>
  </View>
);

/* ═══════════════════════════════════════════════ */

export const ConsultationRoomScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { doctorId, appointmentId, dateLabel, timeLabel } = route.params;

  const [appointment, setAppointment] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);

  /* ── Fetch appointment + doctor data ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptData, specialists] = await Promise.all([
          appointmentService.getAppointmentById(appointmentId),
          telehealthService.getSpecialists(),
        ]);
        setAppointment(apptData);
        const found = specialists.find(
          (d: any) => (d._id || d.id) === doctorId,
        );
        setDoctor(found || null);
      } catch (err) {
        console.error('[ConsultationRoom] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appointmentId, doctorId]);

  /* ── Countdown timer ── */
  useEffect(() => {
    const apptTime = getApptDateTime(dateLabel, timeLabel);
    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((apptTime.getTime() - Date.now()) / 1000),
      );
      setSeconds(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dateLabel, timeLabel]);

  /* ── Derived values ── */
  const patientName =
    appointment?.patientName || appointment?.member?.name || 'Patient';
  const patientAge = appointment?.patientAge || appointment?.member?.age || '';
  const patientGender =
    appointment?.patientGender || appointment?.member?.gender || '';
  const shortId = appointmentId?.slice(-4).toUpperCase() || '0000';
  const concern = appointment?.primaryConcern || appointment?.concern || '';
  const mode = appointment?.consultationMode || appointment?.mode || 'video';
  const meetLink = appointment?.virtualMeeting?.joinUrl || '';
  const notes = appointment?.preConsultationNotes || appointment?.notes || '';

  const avatarUri = doctor?.profilePictureUrl
    ? `${env.BASE_URL}${doctor.profilePictureUrl}`
    : doctor?.avatarUri || '';

  const isSessionActive = seconds <= 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Patient Info Card ── */}
        <View style={styles.patientCard}>
          <View style={styles.patientRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {patientName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientMeta}>
                {patientAge ? `Age ${patientAge}` : ''}
                {patientAge && patientGender ? ' · ' : ''}
                {patientGender}
                {patientAge || patientGender ? ' · ' : ''}#{`APT-${shortId}`}
              </Text>
              <View style={styles.tagsRow}>
                <TagChip
                  label={mode === 'audio' ? '📞 Audio Call' : '📹 Video Call'}
                  color={colors.primaryBlue}
                  bg="rgba(21,114,183,0.08)"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Countdown Timer ── */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>
            {isSessionActive ? 'Session is live' : 'Session starts in'}
          </Text>
          <Text
            style={[styles.timerValue, isSessionActive && styles.timerLive]}
          >
            {isSessionActive ? '🔴 LIVE' : formatTimer(seconds)}
          </Text>
        </View>

        {/* ── Pre-Consultation Notes ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pre-Consultation Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              {notes ||
                `Patient complains of ${
                  concern || 'symptoms'
                }. No prior medications taken.`}
            </Text>
          </View>
        </View>

        <View style={{ height: verticalScale(20) }} />
      </ScrollView>

      {/* ── Bottom Actions ── */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom:
              insets.bottom > 0
                ? insets.bottom + verticalScale(8)
                : verticalScale(20),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.joinBtn}
          onPress={() => {
            if (meetLink) {
              Linking.openURL(meetLink);
            } else {
              // Fallback: try to open a generic meet link
              Linking.openURL('https://meet.google.com');
            }
          }}
        >
          <Video size={scale(20)} color="#fff" />
          <Text style={styles.joinBtnText}>Join Google Meet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ═══════════ Styles ═══════════ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },


  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },

  /* Patient Card */
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: scale(18),
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#E8F2FB',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(22),
    color: colors.primaryBlue,
  },
  patientInfo: {
    flex: 1,
    marginLeft: scale(12),
  },
  patientName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  patientMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: verticalScale(8),
    gap: scale(6),
  },
  tagChip: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
  },
  tagText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },

  /* Timer */
  timerSection: {
    alignItems: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(16),
  },
  timerLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  timerValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(48),
    color: colors.primaryBlue,
    letterSpacing: -1,
    marginTop: verticalScale(4),
  },
  timerLive: {
    fontSize: scale(32),
    color: '#E74C3C',
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(12),
  },

  /* Vitals */
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  vitalPill: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    borderRadius: scale(14),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },
  vitalValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  vitalLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: verticalScale(3),
  },

  /* Notes */
  notesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    padding: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  notesText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(22),
  },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue,
    borderRadius: scale(16),
    paddingVertical: verticalScale(16),
    gap: scale(8),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
});
