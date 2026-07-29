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
  const readinessDays = await getQualifiedReadinessDaysCount();
  const outcomes = await getOutingOutcomes();
  
  // Exclude 'did_not_go' from training personal tolerance baseline
  const validOutcomes = outcomes.filter((o) => o.response !== 'did_not_go');
  const distinctDays = new Set(
    validOutcomes.map((o) => new Date(o.recordedAt).toISOString().split('T')[0])
  ).size;

  const readinessProgress = Math.min(1, readinessDays / COMPANION_REQUIREMENTS.READINESS_DAYS);
  const outcomesProgress = Math.min(1, validOutcomes.length / COMPANION_REQUIREMENTS.OUTCOMES_COUNT);
  const daysProgress = Math.min(1, distinctDays / COMPANION_REQUIREMENTS.OUTCOME_DAYS);

  const totalProgress = Math.round(((readinessProgress + outcomesProgress + daysProgress) / 3) * 100);

  const isEligible =
    readinessDays >= COMPANION_REQUIREMENTS.READINESS_DAYS &&
    validOutcomes.length >= COMPANION_REQUIREMENTS.OUTCOMES_COUNT &&
    distinctDays >= COMPANION_REQUIREMENTS.OUTCOME_DAYS;

  return {
    isEligible,
    qualifiedReadinessDays: readinessDays,
    qualifiedOutcomesCount: validOutcomes.length,
    distinctOutcomeDaysCount: distinctDays,
    requiredReadinessDays: COMPANION_REQUIREMENTS.READINESS_DAYS,
    requiredOutcomes: COMPANION_REQUIREMENTS.OUTCOMES_COUNT,
    requiredOutcomeDays: COMPANION_REQUIREMENTS.OUTCOME_DAYS,
    progressPercent: totalProgress,
  };
}
