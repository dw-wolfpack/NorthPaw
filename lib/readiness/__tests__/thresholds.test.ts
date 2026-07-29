import { roadBandForTemp, formatTemp, toCelsius } from '../thresholds';

describe('Canonical Threshold Boundary Classification & Presentation Formatting', () => {
  it('Classifies temperatures strictly across canonical Fahrenheit boundaries', () => {
    // Safe: < 77.0°F
    expect(roadBandForTemp(76.9)).toBe('safe');
    
    // Warm: 77.0°F – 99.9°F
    expect(roadBandForTemp(77.0)).toBe('warm');
    expect(roadBandForTemp(99.9)).toBe('warm');
    
    // Hot: 100.0°F – 124.9°F
    expect(roadBandForTemp(100.0)).toBe('hot');
    expect(roadBandForTemp(124.9)).toBe('hot');
    
    // Danger: >= 125.0°F (Clinical Paw Burn Boundary)
    expect(roadBandForTemp(125.0)).toBe('danger');
    expect(roadBandForTemp(140.0)).toBe('danger');
  });

  it('Presentation Boundary Assertions: Formats exact threshold boundaries correctly in °F and °C', () => {
    // 76.9°F -> Safe boundary (25°C)
    expect(formatTemp(76.9, 'F')).toBe('77°F');
    expect(formatTemp(76.9, 'C')).toBe('25°C');

    // 77.0°F -> Warm lower boundary (25°C)
    expect(formatTemp(77.0, 'F')).toBe('77°F');
    expect(formatTemp(77.0, 'C')).toBe('25°C');

    // 99.9°F -> Warm upper boundary (38°C)
    expect(formatTemp(99.9, 'F')).toBe('100°F');
    expect(formatTemp(99.9, 'C')).toBe('38°C');

    // 100.0°F -> Hot lower boundary (38°C)
    expect(formatTemp(100.0, 'F')).toBe('100°F');
    expect(formatTemp(100.0, 'C')).toBe('38°C');

    // 124.9°F -> Hot upper boundary (52°C)
    expect(formatTemp(124.9, 'F')).toBe('125°F');
    expect(formatTemp(124.9, 'C')).toBe('52°C');

    // 125.0°F -> Danger lower boundary (52°C)
    expect(formatTemp(125.0, 'F')).toBe('125°F');
    expect(formatTemp(125.0, 'C')).toBe('52°C');
  });

  it('Celsius conversion helper accuracy', () => {
    expect(toCelsius(32)).toBe(0);
    expect(toCelsius(212)).toBe(100);
    expect(toCelsius(77)).toBe(25);
    expect(toCelsius(125)).toBe(51.7);
  });
});
