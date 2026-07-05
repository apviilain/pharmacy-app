import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

interface CustomDropdownProps {
  label: string;
  value: string;
  onSelect: (item: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  onSelect,
  options,
  placeholder = 'Select option',
  error,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.inputContainer,
          visible && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={scale(18)} color={colors.textLight} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Bottom Sheet Modal */}
      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={scale(20)} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const isSelected = item === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemActive,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Check size={scale(18)} color={colors.primaryBlue} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              showsVerticalScrollIndicator={false}
              style={styles.optionsList}
            />
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: verticalScale(52),
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: scale(12),
    backgroundColor: colors.background,
    paddingHorizontal: scale(16),
  },
  inputFocused: {
    borderColor: colors.primaryBlue,
  },
  inputError: {
    borderColor: colors.error,
  },
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  placeholder: {
    color: colors.textLight,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: verticalScale(4),
  },

  // ── Bottom Sheet Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    maxHeight: '55%',
    paddingBottom: verticalScale(30),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  optionsList: {
    paddingHorizontal: scale(8),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    borderRadius: scale(10),
    marginHorizontal: scale(4),
  },
  optionItemActive: {
    backgroundColor: 'rgba(21,114,183,0.06)',
  },
  optionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  optionTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primaryBlue,
  },
  divider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginHorizontal: scale(16),
  },
});
