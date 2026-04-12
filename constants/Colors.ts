const forest = '#1B4332';
const moss = '#2D6A4F';
const sage = '#40916C';
const cream = '#F1FAEE';
const ink = '#0D1B14';

const tintColorLight = moss;
const tintColorDark = sage;

export default {
  light: {
    text: ink,
    textSecondary: '#3d5349',
    background: cream,
    /** Softer mint for Ready tab hero (Figma-style landing). */
    readyMint: '#EEF7F3',
    surface: '#ffffff',
    border: '#d8e2dc',
    tint: tintColorLight,
    tabIconDefault: '#95a99d',
    tabIconSelected: tintColorLight,
    accent: forest,
    danger: '#9b2226',
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
  },
};
