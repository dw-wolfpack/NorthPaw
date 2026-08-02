const AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
const { AppState, Linking, Platform } = require('react-native');
const { trackEvent } = require('./analytics');

let Constants = null;
try {
  Constants = require('expo-constants').default || require('expo-constants');
} catch (_) {}

let StoreReview = null;
try {
  StoreReview = require('expo-store-review');
} catch (_) {}

const REVIEW_STORAGE_KEY = '@northpaw_review_prompt_data_v1';

// Session-level guard to ensure prompt is shown at most once per foreground app session
let reviewPromptShownThisSession = false;

function isShownThisSession() {
  return reviewPromptShownThisSession;
}

function markShownThisSession() {
  reviewPromptShownThisSession = true;
}

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDaysDiff(startDateStr, endDateStr) {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

async function getReviewData() {
  try {
    const json = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json);
      return {
        reviewState: parsed.reviewState || 'neverShown',
        firstEligibleDate: parsed.firstEligibleDate,
        lastPromptDate: parsed.lastPromptDate,
        uniqueUsageDays: Array.isArray(parsed.uniqueUsageDays) ? parsed.uniqueUsageDays : [],
        uniqueUsageDaysAtLastPrompt: parsed.uniqueUsageDaysAtLastPrompt,
        reviewAttemptDate: parsed.reviewAttemptDate,
      };
    }
  } catch (e) {
    console.warn('[ReviewPrompt] Failed to load review data:', e);
  }
  return {
    reviewState: 'neverShown',
    uniqueUsageDays: [],
  };
}

async function saveReviewData(data) {
  try {
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[ReviewPrompt] Failed to save review data:', e);
  }
}

async function recordUsageDay(dateOverride) {
  // Only count if app is active in foreground
  if (AppState.currentState !== 'active' && AppState.currentState !== 'unknown' && !dateOverride) {
    return getReviewData();
  }

  const data = await getReviewData();
  const today = dateOverride || getLocalDateString();
  
  if (!data.uniqueUsageDays.includes(today)) {
    data.uniqueUsageDays = [...data.uniqueUsageDays, today].sort();
    await saveReviewData(data);
  }
  return data;
}

async function checkReviewEligibility(params) {
  const { onboardingDone = true, isCriticalFlow, todayOverride } = params || {};
  
  // 1. Session-level guard: never show twice in the same foreground session
  if (reviewPromptShownThisSession) return false;
  if (!onboardingDone) return false;
  if (isCriticalFlow) return false;
  if (AppState.currentState !== 'active' && AppState.currentState !== 'unknown' && !todayOverride) {
    return false;
  }

  const data = await getReviewData();
  const today = todayOverride || getLocalDateString();

  if (data.reviewState === 'completed' || data.reviewState === 'suppressed') {
    return false;
  }

  const usageDaysCount = data.uniqueUsageDays.length;
  if (usageDaysCount < 7) {
    return false;
  }

  if (data.reviewState === 'neverShown') {
    return true;
  }

  if (data.reviewState === 'remindLater') {
    if (!data.lastPromptDate) return false;

    const daysSincePrompt = calculateDaysDiff(data.lastPromptDate, today);
    const lastPromptUsageCount = data.uniqueUsageDaysAtLastPrompt || 0;
    const additionalUsageDays = usageDaysCount - lastPromptUsageCount;

    if (daysSincePrompt >= 30 && additionalUsageDays >= 4) {
      return true;
    }
    return false;
  }

  return false;
}

async function openStoreFallback() {
  const appVersion = Constants?.expoConfig?.version || '1.0.0';
  const data = await getReviewData();

  await trackEvent('review_store_fallback_opened', {
    platform: Platform.OS,
    app_version: appVersion,
    unique_usage_days: data.uniqueUsageDays.length,
  });

  const iosUrl = 'https://apps.apple.com/app/id6763930232?action=write-review';
  const androidUrl = 'market://details?id=com.northpaw.app';
  const androidWebUrl = 'https://play.google.com/store/apps/details?id=com.northpaw.app';

  const targetUrl = Platform.OS === 'ios' ? iosUrl : androidUrl;

  try {
    const supported = await Linking.canOpenURL(targetUrl);
    if (supported) {
      await Linking.openURL(targetUrl);
    } else if (Platform.OS === 'android') {
      await Linking.openURL(androidWebUrl);
    }
  } catch (e) {
    console.warn('[ReviewPrompt] Failed to open store URL:', e);
  }
}

async function handleLeaveWrittenReview() {
  const data = await getReviewData();
  const today = getLocalDateString();
  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  data.reviewState = 'completed';
  data.reviewAttemptDate = new Date().toISOString();
  await saveReviewData(data);

  const daysSinceLastPrompt = data.lastPromptDate
    ? calculateDaysDiff(data.lastPromptDate, today)
    : 0;

  await trackEvent('review_prompt_written_review_tapped', {
    platform: Platform.OS,
    app_version: appVersion,
    unique_usage_days: data.uniqueUsageDays.length,
    days_since_last_prompt: daysSinceLastPrompt,
  });

  await openStoreFallback();
}

async function handleQuickStarRating(stars = 5) {
  const data = await getReviewData();
  const today = getLocalDateString();
  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  data.reviewState = 'completed';
  data.reviewAttemptDate = new Date().toISOString();
  await saveReviewData(data);

  const daysSinceLastPrompt = data.lastPromptDate
    ? calculateDaysDiff(data.lastPromptDate, today)
    : 0;

  await trackEvent('review_prompt_quick_star_tapped', {
    platform: Platform.OS,
    app_version: appVersion,
    unique_usage_days: data.uniqueUsageDays.length,
    days_since_last_prompt: daysSinceLastPrompt,
    rating_stars: stars,
  });

  try {
    const available = StoreReview ? await StoreReview.isAvailableAsync() : false;
    if (available) {
      await StoreReview.requestReview();
    }
  } catch (e) {
    console.warn('[ReviewPrompt] Quick star rating error:', e);
  }
}

async function handleLeaveAReview() {
  return handleLeaveWrittenReview();
}

async function handleMaybeLater() {
  const data = await getReviewData();
  const today = getLocalDateString();
  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  const daysSinceLastPrompt = data.lastPromptDate
    ? calculateDaysDiff(data.lastPromptDate, today)
    : 0;

  await trackEvent('review_prompt_later_tapped', {
    platform: Platform.OS,
    app_version: appVersion,
    unique_usage_days: data.uniqueUsageDays.length,
    days_since_last_prompt: daysSinceLastPrompt,
  });

  data.reviewState = 'remindLater';
  data.lastPromptDate = today;
  data.uniqueUsageDaysAtLastPrompt = data.uniqueUsageDays.length;
  await saveReviewData(data);
}

async function handleNeverAskAgain() {
  const data = await getReviewData();
  const today = getLocalDateString();
  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  const daysSinceLastPrompt = data.lastPromptDate
    ? calculateDaysDiff(data.lastPromptDate, today)
    : 0;

  await trackEvent('review_prompt_never_tapped', {
    platform: Platform.OS,
    app_version: appVersion,
    unique_usage_days: data.uniqueUsageDays.length,
    days_since_last_prompt: daysSinceLastPrompt,
  });

  data.reviewState = 'suppressed';
  await saveReviewData(data);
}

async function resetReviewDataForTesting() {
  reviewPromptShownThisSession = false;
  await AsyncStorage.removeItem(REVIEW_STORAGE_KEY);
}

function resetSessionGuard() {
  reviewPromptShownThisSession = false;
}

module.exports = {
  REVIEW_STORAGE_KEY,
  isShownThisSession,
  markShownThisSession,
  resetSessionGuard,
  getLocalDateString,
  calculateDaysDiff,
  getReviewData,
  saveReviewData,
  recordUsageDay,
  checkReviewEligibility,
  openStoreFallback,
  handleLeaveAReview,
  handleLeaveWrittenReview,
  handleQuickStarRating,
  handleMaybeLater,
  handleNeverAskAgain,
  resetReviewDataForTesting,
};
