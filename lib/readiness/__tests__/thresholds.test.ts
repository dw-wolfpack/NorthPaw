import { roadBandForTemp } from '../../weather/roadTemp';

describe('Phase A Regression: Canonical Threshold Boundary Classification', () => {
  it('Classifies temperatures strictly across canonical band boundaries', () => {
    // Safe: < 77°F
    expect(roadBandForTemp(76.9)).toBe('safe');
    
    // Warm: 77°F – 99.9°F
    expect(roadBandForTemp(77.0)).toBe('warm');
    expect(roadBandForTemp(99.9)).toBe('warm');
    
    // Hot: 100.0°F – 124.9°F
    expect(roadBandForTemp(100.0)).toBe('hot');
    expect(roadBandForTemp(124.9)).toBe('hot');
    
    // Danger: >= 125.0°F (Clinical Paw Burn Boundary)
    expect(roadBandForTemp(125.0)).toBe('danger');
    expect(roadBandForTemp(140.0)).toBe('danger');
  });
});
