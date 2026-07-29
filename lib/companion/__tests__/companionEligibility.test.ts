import { checkCompanionEligibility, COMPANION_REQUIREMENTS } from '../companionEligibility';
import * as outingsModule from '../../outings';

jest.mock('../../outings');

describe('Phase H: Companion Evidence-Gated Eligibility', () => {
  it('Denies purchase eligibility when device lacks sufficient baseline data', async () => {
    (outingsModule.getQualifiedReadinessDaysCount as jest.Mock).mockResolvedValue(2);
    (outingsModule.getOutingOutcomes as jest.Mock).mockResolvedValue([
      { outingId: '1', recordedAt: Date.now(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 }
    ]);

    const status = await checkCompanionEligibility();
    expect(status.isEligible).toBe(false);
    expect(status.progressPercent).toBeLessThan(100);
  });

  it('Unlocks purchase eligibility when device reaches 7 readiness days, 5 outcomes, and 3 distinct days', async () => {
    (outingsModule.getQualifiedReadinessDaysCount as jest.Mock).mockResolvedValue(7);
    (outingsModule.getOutingOutcomes as jest.Mock).mockResolvedValue([
      { outingId: '1', recordedAt: new Date('2026-07-10T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '2', recordedAt: new Date('2026-07-10T14:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '3', recordedAt: new Date('2026-07-11T10:00:00Z').getTime(), response: 'slowed', signals: ['heavy_panting'], responseLatencyMinutes: 5 },
      { outingId: '4', recordedAt: new Date('2026-07-12T10:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
      { outingId: '5', recordedAt: new Date('2026-07-12T16:00:00Z').getTime(), response: 'as_usual', signals: [], responseLatencyMinutes: 5 },
    ]);

    const status = await checkCompanionEligibility();
    expect(status.isEligible).toBe(true);
    expect(status.progressPercent).toBe(100);
  });
});
