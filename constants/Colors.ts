const forest = '#1B4332';
const moss = '#2D6A4F';
const sage = '#40916C';
const cream = '#FFFFFF';
const ink = '#0D1712';

const tintColorLight = '#2D6A4F';
const tintColorDark = sage;

export default {
  light: {
    text: ink,
    textSecondary: '#374151', // High contrast dark slate gray (WCAG AAA compliant)
    background: '#F8FBF9',
    readyMint: '#E8F5F0',
    surface: '#ffffff',
    border: '#D1D5DB', // High contrast crisp border
    tint: tintColorLight,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
    accent: forest,
    danger: '#B91C1C',
    selectedBg: 'rgba(45, 106, 79, 0.10)',
  },
  dark: {
    text: cream,
    textSecondary: '#D1D5DB', // High contrast silver gray (WCAG AAA compliant)
    background: '#0F1713',
    readyMint: '#0f1f18',
    surface: '#18241D',
    border: '#2E3F34',
    tint: tintColorDark,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
    accent: sage,
    danger: '#EF4444',
    selectedBg: 'rgba(64, 145, 108, 0.20)',
  },
};
