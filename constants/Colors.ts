const forest = '#1B4332';
const moss = '#2D6A4F';
const sage = '#40916C';
const cream = '#F1FAEE';
const ink = '#0D1B14';

const tintColorLight = '#3A7D5E';
const tintColorDark = sage;

export default {
  light: {
    text: ink,
    textSecondary: '#2F3E36',
    background: '#F8FBF9',
    readyMint: '#E8F5F0',
    surface: '#ffffff',
    border: '#CFDBD5',
    tint: tintColorLight,
    tabIconDefault: '#88998E',
    tabIconSelected: tintColorLight,
    accent: forest,
    danger: '#B91C1C',
    selectedBg: 'rgba(58, 125, 94, 0.08)',
  },
  dark: {
    text: cream,
    textSecondary: '#b7c4bc',
    background: ink,
    readyMint: '#0f1f18',
    surface: '#13261c',
    border: '#2a3d32',
    tint: tintColorDark,
    tabIconDefault: '#6b7a72',
    tabIconSelected: tintColorDark,
    accent: sage,
    danger: '#e07a5f',
    selectedBg: 'rgba(64, 145, 108, 0.15)',
  },
};
