import { useColorScheme } from 'react-native';

export const useAuthPalette = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    isDark,
    background: isDark ? '#07111F' : '#F5F8FC',
    surface: isDark ? '#0E1C2F' : '#FFFFFF',
    card: isDark ? '#16263C' : '#EAF2FB',
    text: isDark ? '#F8FAFC' : '#101828',
    mutedText: isDark ? '#94A3B8' : '#667085',
    accent: '#1572B7',
    accentSoft: isDark ? 'rgba(21,114,183,0.18)' : '#E8F4FD',
    success: '#40B346',
    danger: '#EF4444',
    warning: '#F59E0B',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16,24,40,0.08)',
  };
};
