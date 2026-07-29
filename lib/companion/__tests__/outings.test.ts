import { startOuting, finishOuting, getActiveOuting, recordQualifiedReadinessDay } from '../../outings';

const store: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete store[key];
    return Promise.resolve();
  }),
}));

describe('Phase E & F: Outings & Outcomes Lifecycle', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
  });

  it('Starts active outing and persists snapshot on-device', async () => {
    const outing = await startOuting({
      dogId: 'dog_123',
      expectedDurationMinutes: 25,
      source: 'home',
      snapshot: {
        id: 'snap_1',
        weatherTimestamp: '2026-07-15T14:00:00Z',
        algorithmVersion: '6.0.0-phaseB',
        surfaceType: 'asphalt',
        estimatedSurfaceF: 112.5,
        confidence: 'high',
        riskCategory: 'hot',
      },
    });

    expect(outing.status).toBe('active');
    expect(outing.expectedDurationMinutes).toBe(25);

    const active = await getActiveOuting();
    expect(active).not.toBeNull();
    expect(active?.id).toBe(outing.id);
  });

  it('Finishes active outing with 1-tap outcome response', async () => {
    const outing = await startOuting({
      dogId: 'dog_123',
      expectedDurationMinutes: 10,
      source: 'hand_test',
      snapshot: {
        id: 'snap_1',
        weatherTimestamp: '2026-07-15T14:00:00Z',
        algorithmVersion: '6.0.0-phaseB',
        surfaceType: 'asphalt',
        estimatedSurfaceF: 95.0,
        confidence: 'high',
        riskCategory: 'warm',
      },
    });

    const outcome = await finishOuting(outing.id, 'as_usual', []);
    expect(outcome.response).toBe('as_usual');
    expect(outcome.outingId).toBe(outing.id);

    const activeAfter = await getActiveOuting();
    expect(activeAfter).toBeNull();
  });

  it('Deduplicates qualified readiness days per unique calendar day', async () => {
    const count1 = await recordQualifiedReadinessDay('2026-07-15T10:00:00Z');
    expect(count1).toBe(1);

    // Second render on same day does not double count
    const count2 = await recordQualifiedReadinessDay('2026-07-15T16:00:00Z');
    expect(count2).toBe(1);

    // Next day increments count
    const count3 = await recordQualifiedReadinessDay('2026-07-16T09:00:00Z');
    expect(count3).toBe(2);
  });
});
