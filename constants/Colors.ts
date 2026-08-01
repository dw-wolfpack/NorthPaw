const forest = '#1B4332';
const moss = '#2D6A4F';
const sage = '#40916C';
const cream = '#FFFFFF';
const ink = '#0D1712';

const tintColorLight = '#2D6A4F';
const tintColorDark = sage;

export default {
  light: {
    text: '#111827', // High contrast dark charcoal (WCAG AAA)
    textSecondary: '#374151', // High contrast dark slate gray (WCAG AAA)
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
    cautionText: '#1E1B4B', // Dark Navy Black text over amber pill (WCAG AAA)
    cautionBg: '#F59E0B',
    disclaimerText: '#1F2937',
    cardOpaque: '#FFFFFF',
    handTestRing: 'rgba(18, 31, 24, 0.14)',
  },
  dark: {
    text: '#F9FAFB', // Pure bright white neutral (WCAG AAA)
    textSecondary: '#E5E7EB', // High contrast silver gray (WCAG AAA)
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
    cautionText: '#FEF3C7',
    cautionBg: '#B45309',
    disclaimerText: '#F3F4F6',
    cardOpaque: '#122017',
    handTestRing: 'rgba(255, 255, 255, 0.20)',
  },
};
