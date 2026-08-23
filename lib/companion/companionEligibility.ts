import { getQualifiedReadinessDaysCount, getOutingOutcomes } from '../outings';

export type CompanionEligibility = {
  isEligible: boolean;
  qualifiedReadinessDays: number;
  qualifiedOutcomesCount: number;
  distinctOutcomeDaysCount: number;
  requiredReadinessDays: number;
  requiredOutcomes: number;
  requiredOutcomeDays: number;
  progressPercent: number;
};

export const COMPANION_REQUIREMENTS = {
  READINESS_DAYS: 7,
  OUTCOMES_COUNT: 5,
  OUTCOME_DAYS: 3,
};

export async function checkCompanionEligibility(): Promise<CompanionEligibility> {
  const actualReadinessDays = await getQualifiedReadinessDaysCount();
  const outcomes = await getOutingOutcomes();
  const validOutcomes = outcomes.filter((o) => o.response !== 'did_not_go');
  const actualDistinctDays = new Set(
    validOutcomes.map((o) => new Date(o.recordedAt).toISOString().split('T')[0])
  ).size;

  const isEligible =
    actualReadinessDays >= COMPANION_REQUIREMENTS.READINESS_DAYS &&
    validOutcomes.length >= COMPANION_REQUIREMENTS.OUTCOMES_COUNT &&
    actualDistinctDays >= COMPANION_REQUIREMENTS.OUTCOME_DAYS;

  // Use actual counts
  const readinessDays = actualReadinessDays;
  const outcomesCount = validOutcomes.length;
  const distinctDays = actualDistinctDays;

  const readinessProgress = Math.min(1, readinessDays / COMPANION_REQUIREMENTS.READINESS_DAYS);
  const outcomesProgress = Math.min(1, outcomesCount / COMPANION_REQUIREMENTS.OUTCOMES_COUNT);
  const daysProgress = Math.min(1, distinctDays / COMPANION_REQUIREMENTS.OUTCOME_DAYS);

  const totalProgress = (actualReadinessDays === 0 && validOutcomes.length === 0)
    ? 0
    : Math.round(((readinessProgress + outcomesProgress + daysProgress) / 3) * 100);

  return {
    isEligible,
    qualifiedReadinessDays: readinessDays,
    qualifiedOutcomesCount: outcomesCount,
    distinctOutcomeDaysCount: distinctDays,
    requiredReadinessDays: COMPANION_REQUIREMENTS.READINESS_DAYS,
    requiredOutcomes: COMPANION_REQUIREMENTS.OUTCOMES_COUNT,
    requiredOutcomeDays: COMPANION_REQUIREMENTS.OUTCOME_DAYS,
    progressPercent: totalProgress,
  };
}
