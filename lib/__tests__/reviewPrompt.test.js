const AsyncStorage = require('@react-native-async-storage/async-storage');

const mockPlatform = { OS: 'ios' };
const mockLinking = { canOpenURL: jest.fn(), openURL: jest.fn() };
const mockAppState = { currentState: 'active' };

jest.mock('react-native', () => ({
  Platform: mockPlatform,
  Linking: mockLinking,
  AppState: mockAppState,
}));

const mockStoreReview = {
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
};

jest.mock('expo-store-review', () => mockStoreReview);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../analytics', () => ({
  trackEvent: jest.fn(),
}));

const {
  getReviewData,
  saveReviewData,
  recordUsageDay,
  checkReviewEligibility,
  handleLeaveAReview,
  handleMaybeLater,
  handleNeverAskAgain,
  resetReviewDataForTesting,
  markShownThisSession,
} = require('../reviewPrompt');

describe('NorthPaw Review Prompt Flow & Eligibility Engine', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAppState.currentState = 'active';
    mockPlatform.OS = 'ios';
    await resetReviewDataForTesting();
    await AsyncStorage.clear();
  });

  it('Test 1: No prompt before 7 unique calendar usage days', async () => {
    const dates = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25'];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    const data = await getReviewData();
    expect(data.uniqueUsageDays.length).toBe(6);

    const eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-07-26',
    });
    expect(eligible).toBe(false);
  });

  it('Test 2: Prompt becomes eligible on the 7th unique usage day when onboarding is complete', async () => {
    const dates = [
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
      '2026-07-26',
    ];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    const data = await getReviewData();
    expect(data.uniqueUsageDays.length).toBe(7);

    const eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-07-26',
    });
    expect(eligible).toBe(true);
  });

  it('Test 3: Onboarding MUST be complete for eligibility', async () => {
    const dates = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    const eligibleIncompleteOnboarding = await checkReviewEligibility({
      onboardingDone: false,
      isCriticalFlow: false,
      todayOverride: '2026-07-26',
    });
    expect(eligibleIncompleteOnboarding).toBe(false);
  });

  it('Test 4: Prompt CANNOT appear during critical flow (7s timer or open modal)', async () => {
    const dates = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    const eligibleCriticalFlow = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: true,
      todayOverride: '2026-07-26',
    });
    expect(eligibleCriticalFlow).toBe(false);
  });

  it('Test 5: Duplicate app launches on the same local calendar date do NOT count as additional unique days', async () => {
    const today = '2026-07-26';
    await recordUsageDay(today);
    await recordUsageDay(today);
    await recordUsageDay(today);

    const data = await getReviewData();
    expect(data.uniqueUsageDays.length).toBe(1);
    expect(data.uniqueUsageDays).toEqual(['2026-07-26']);
  });

  it('Test 6: Maybe Later requires BOTH 30 calendar days AND 4 additional unique usage days', async () => {
    const initialDates = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07'];
    for (const d of initialDates) {
      await recordUsageDay(d);
    }

    await handleMaybeLater();

    // Set lastPromptDate to '2026-07-07' for deterministic testing
    let data = await getReviewData();
    data.lastPromptDate = '2026-07-07';
    await saveReviewData(data);

    expect(data.reviewState).toBe('remindLater');
    expect(data.uniqueUsageDaysAtLastPrompt).toBe(7);

    // Scenario A: 35 days passed, but only 2 additional usage days (total 9) -> NOT ELIGIBLE
    await recordUsageDay('2026-08-10');
    await recordUsageDay('2026-08-11');

    let eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-08-12',
    });
    expect(eligible).toBe(false);

    // Scenario B: 15 days passed (2026-07-22), but 5 additional usage days -> NOT ELIGIBLE (needs 30 days)
    await recordUsageDay('2026-07-15');
    await recordUsageDay('2026-07-16');
    await recordUsageDay('2026-07-17');

    eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-07-22',
    });
    expect(eligible).toBe(false);

    // Scenario C: 38 days passed (2026-08-14) AND 5 additional usage days -> ELIGIBLE!
    eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-08-14',
    });
    expect(eligible).toBe(true);
  });

  it('Test 7: Never Ask Again permanently suppresses future custom prompts', async () => {
    const dates = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    await handleNeverAskAgain();

    const data = await getReviewData();
    expect(data.reviewState).toBe('suppressed');

    const eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-08-30',
    });
    expect(eligible).toBe(false);
  });

  it('Test 8: Leave a Review sets completed state and permanently suppresses future prompts', async () => {
    const dates = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    mockStoreReview.isAvailableAsync.mockResolvedValue(true);
    mockStoreReview.requestReview.mockResolvedValue(undefined);

    await handleLeaveAReview();

    const data = await getReviewData();
    expect(data.reviewState).toBe('completed');
    expect(data.reviewAttemptDate).toBeDefined();

    const eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-08-30',
    });
    expect(eligible).toBe(false);
  });

  it('Test 9: Opens store URL write-review page directly without triggering lingering in-app overlay', async () => {
    mockLinking.canOpenURL.mockResolvedValue(true);

    await handleLeaveAReview();
    expect(mockLinking.openURL).toHaveBeenCalled();
  });

  it('Test 10: Session-level guard prevents prompt from appearing twice in the same foreground session', async () => {
    const dates = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'];
    for (const d of dates) {
      await recordUsageDay(d);
    }

    let eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-07-26',
    });
    expect(eligible).toBe(true);

    markShownThisSession();

    eligible = await checkReviewEligibility({
      onboardingDone: true,
      isCriticalFlow: false,
      todayOverride: '2026-07-26',
    });
    expect(eligible).toBe(false);
  });

  it('Test 11: handleLeaveAReview persists completed state BEFORE launching native prompt', async () => {
    mockStoreReview.isAvailableAsync.mockImplementation(async () => {
      const data = await getReviewData();
      // State MUST already be completed when native API is called!
      expect(data.reviewState).toBe('completed');
      return true;
    });

    await handleLeaveAReview();
    const finalData = await getReviewData();
    expect(finalData.reviewState).toBe('completed');
  });
});
