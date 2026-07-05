import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';

import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { typography } from '../../theme/typography';

type Palette = {
  surface: string;
  card: string;
  text: string;
  accent: string;
  border: string;
  mutedText: string;
};

type Props = {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onBiometricPress?: () => void;
  biometricAvailable?: boolean;
  disabled?: boolean;
  palette: Palette;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const Key = memo(
  ({ label, onPress, disabled, palette }: { label: string; onPress: () => void; disabled?: boolean; palette: Palette }) => (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Vibration.vibrate(10);
        onPress();
      }}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: pressed ? palette.card : palette.surface,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Text style={[styles.keyText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  ),
);

export const NumericKeypad = ({
  onDigitPress,
  onBackspace,
  onBiometricPress,
  biometricAvailable,
  disabled,
  palette,
}: Props) => (
  <View style={styles.container}>
    {Array.from({ length: 4 }).map((_, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.row}>
        {rowIndex < 3 ? (
          KEYS.slice(rowIndex * 3, rowIndex * 3 + 3).map(key => (
            <Key
              key={key}
              label={key}
              onPress={() => onDigitPress(key)}
              disabled={disabled}
              palette={palette}
            />
          ))
        ) : (
          <>
            <Pressable
              disabled={!biometricAvailable || disabled}
              onPress={() => {
                if (!onBiometricPress) return;
                Vibration.vibrate(10);
                onBiometricPress();
              }}
              style={({ pressed }) => [
                styles.iconKey,
                {
                  backgroundColor: pressed ? palette.card : palette.surface,
                  borderColor: palette.border,
                  opacity: biometricAvailable && !disabled ? 1 : 0.45,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Fingerprint size={scale(24)} color={palette.accent} />
            </Pressable>
            <Key
              label="0"
              onPress={() => onDigitPress('0')}
              disabled={disabled}
              palette={palette}
            />
            <Pressable
              disabled={disabled}
              onPress={() => {
                Vibration.vibrate(10);
                onBackspace();
              }}
              style={({ pressed }) => [
                styles.iconKey,
                {
                  backgroundColor: pressed ? palette.card : palette.surface,
                  borderColor: palette.border,
                  opacity: disabled ? 0.45 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Delete size={scale(22)} color={palette.text} />
              <Text style={[styles.iconLabel, { color: palette.mutedText }]}>Delete</Text>
            </Pressable>
          </>
        )}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: scale(30),
    paddingHorizontal: scale(4),
    paddingTop: verticalScale(2),
    paddingBottom: verticalScale(2),
    gap: verticalScale(12),
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  key: {
    flex: 1,
    height: verticalScale(64),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.tiny,
  },
  keyText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(22),
    letterSpacing: 0.2,
  },
  iconKey: {
    flex: 1,
    height: verticalScale(64),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.tiny,
  },
  iconLabel: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
  },
});
