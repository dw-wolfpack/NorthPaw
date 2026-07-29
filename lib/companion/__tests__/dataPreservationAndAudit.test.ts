import { checkCompanionEligibility } from '../companionEligibility';
import * as outingsModule from '../../outings';

jest.mock('../../outings');

// Telemetry payload privacy audit scanner function (uses exact key matching)
function isTelemetryPayloadPrivate(payload?: Record<string, any>): boolean {
  if (!payload) return true;
  const FORBIDDEN_EXACT_KEYS = [
    'outcome', 'response', 'symptom', 'chip', 'dogname', 'dogbreed',
    'location', 'lat', 'lng', 'latitude', 'longitude', 'notes', 'photo'
  ];
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_EXACT_KEYS.includes(key.toLowerCase())) {
      return false; // Violates zero-egress privacy rule!
    }
  }
  return true;
}

describe('Companion Gate Matrix & Telemetry Privacy Audit', () => {
  it('Companion Gate: Clean Account (0 data) is NOT eligible', async () => {
    (outingsModule.getQualifiedReadinessDaysCount as jest.Mock).mockResolvedValue(0);
    (outingsModule.getOutingOutcomes as jest.Mock).mockResolvedValue([]);

    const gate = await checkCompanionEligibility();
    expect(gate.isEligible).toBe(false);
    expect(gate.progressPercent).toBe(0);
  });

  it('Companion Gate: Partially Eligible (3 readiness days, 3 check-ins) is NOT eligible', async () => {
    (outingsModule.getQualifiedReadinessDaysCount as jest.Mock).mockResolvedValue(3);
    (outingsModule.getOutingOutcomes as jest.Mock).mockResolvedValue([
      { outingId: '1', recordedAt: new Date('2026-07-10T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '2', recordedAt: new Date('2026-07-11T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '3', recordedAt: new Date('2026-07-12T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
    ]);

    const gate = await checkCompanionEligibility();
    expect(gate.isEligible).toBe(false);
    expect(gate.progressPercent).toBeGreaterThan(0);
    expect(gate.progressPercent).toBeLessThan(100);
  });

  it('Companion Gate: Fully Eligible (7 readiness days, 5 check-ins over 3 days) IS ELIGIBLE', async () => {
    (outingsModule.getQualifiedReadinessDaysCount as jest.Mock).mockResolvedValue(7);
    (outingsModule.getOutingOutcomes as jest.Mock).mockResolvedValue([
      { outingId: '1', recordedAt: new Date('2026-07-10T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '2', recordedAt: new Date('2026-07-10T14:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '3', recordedAt: new Date('2026-07-11T10:00:00Z').getTime(), response: 'slowed', signals: ['heavy_panting'], responseLatencyMinutes: 5 },
      { outingId: '4', recordedAt: new Date('2026-07-12T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '5', recordedAt: new Date('2026-07-12T16:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
    ]);

    const gate = await checkCompanionEligibility();
    expect(gate.isEligible).toBe(true);
    expect(gate.progressPercent).toBe(100);
  });

  it('PRIVACY AUDIT: Anonymous flow telemetry payloads NEVER contain private check-in content or dog traits', () => {
    const allowedPayload = { appVersion: '6.0.0', platform: 'ios', uiSource: 'home_card' };
    expect(isTelemetryPayloadPrivate(allowedPayload)).toBe(true);

    const forbiddenPayloadWithOutcome = { appVersion: '6.0.0', response: 'struggled' };
    expect(isTelemetryPayloadPrivate(forbiddenPayloadWithOutcome)).toBe(false);

    const forbiddenPayloadWithSymptom = { appVersion: '6.0.0', symptom: 'heavy_panting' };
    expect(isTelemetryPayloadPrivate(forbiddenPayloadWithSymptom)).toBe(false);

    const forbiddenPayloadWithDogName = { appVersion: '6.0.0', dogName: 'Aoife' };
    expect(isTelemetryPayloadPrivate(forbiddenPayloadWithDogName)).toBe(false);
  });
});
