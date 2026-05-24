import type { OutingReadinessState, ReadinessCtaAction } from '@/lib/readiness/types';

/**
 * LAYER 3 — dog-first strings are opt-in via `useDogFirstTone`; default stays neutral / human-centered.
 */

type CopyRow = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaAction: ReadinessCtaAction;
  dogToneTitle?: string;
};

const NEUTRAL: Record<OutingReadinessState, (ctx: CopyContext) => CopyRow> = {
  not_started: (ctx) => ({
    title: 'Start with today’s conditions',
    subtitle: mergeWeather('Check conditions below, then open your pack when you’re ready.', ctx.weatherHeroLine),
    ctaLabel: 'Check today’s conditions',
    ctaAction: { kind: 'open_weather' },
  }),
  conditions_checked: (ctx) => ({
    title: 'Conditions checked',
    subtitle: mergeWeather('Open today’s pack when you’re ready.', ctx.weatherHeroLine),
    ctaLabel: 'Open today’s pack',
    ctaAction: { kind: 'open_checklist', checklistId: ctx.primaryChecklistId },
  }),
  pack_started: (ctx) => ({
    title: 'Pack in progress',
    subtitle:
      ctx.totalItems >= 2
        ? mergeWeather(`${ctx.remaining} items left for today’s checklist.`, ctx.weatherHeroLine)
        : mergeWeather('One item left on today’s checklist.', ctx.weatherHeroLine),
    ctaLabel: 'Continue pack',
    ctaAction: { kind: 'open_checklist', checklistId: ctx.primaryChecklistId },
  }),
  almost_ready: (ctx) => ({
    title: 'Almost ready',
    subtitle: mergeWeather('One last item—finish when it fits your outing.', ctx.weatherHeroLine),
    ctaLabel: 'Finish pack',
    ctaAction: { kind: 'open_checklist', checklistId: ctx.primaryChecklistId },
  }),
  ready: (ctx) => ({
    title: 'Ready for your outing',
    subtitle: 'Pack looks complete—tap below to review or tweak.',
    ctaLabel: 'Review pack',
    ctaAction: { kind: 'open_checklist', checklistId: ctx.primaryChecklistId },
  }),
};

type CopyContext = {
  dogName: string;
  weatherHeroLine?: string;
  totalItems: number;
  completedItems: number;
  primaryChecklistId: string;
  remaining: number;
};

function mergeWeather(base: string, weather?: string): string {
  const w = weather?.trim();
  if (!w) return base;
  if (base.includes(w.slice(0, 24))) return base;
  return `${base} ${w}`;
}

/** Layer 3 — optional friendlier lines; keep short for hero strip. */
export function formatDogFirstCopy(
  dogName: string,
  state: OutingReadinessState,
  neutral: CopyRow
): Pick<CopyRow, 'title' | 'subtitle' | 'dogToneTitle'> {
  const name = dogName.trim() || 'Your pup';
  switch (state) {
    case 'not_started':
      return {
        title: `What ${name} needs today`,
        subtitle: neutral.subtitle,
        dogToneTitle: `${name}’s day`,
      };
    case 'conditions_checked':
      return {
        title: `${name}’s conditions are set`,
        subtitle: neutral.subtitle,
        dogToneTitle: neutral.title,
      };
    case 'pack_started':
      return {
        title: `Getting ${name}’s pack together`,
        subtitle: neutral.subtitle,
        dogToneTitle: neutral.title,
      };
    case 'almost_ready':
      return {
        title: `${name} is almost set`,
        subtitle: neutral.subtitle,
        dogToneTitle: neutral.title,
      };
    case 'ready':
      return {
        title: `${name} looks ready`,
        subtitle: neutral.subtitle,
        dogToneTitle: neutral.title,
      };
    default:
      return { title: neutral.title, subtitle: neutral.subtitle };
  }
}

type BuildCopyArgs = {
  state: OutingReadinessState;
  dogName: string;
  useDogFirstTone?: boolean;
  weatherHeroLine?: string;
  totalItems: number;
  completedItems: number;
  primaryChecklistId: string;
};

export function buildReadinessCopy(args: BuildCopyArgs): CopyRow {
  const remaining = Math.max(0, args.totalItems - args.completedItems);
  const ctx: CopyContext = {
    dogName: args.dogName,
    weatherHeroLine: args.weatherHeroLine,
    totalItems: args.totalItems,
    completedItems: args.completedItems,
    primaryChecklistId: args.primaryChecklistId,
    remaining,
  };

  const neutral = NEUTRAL[args.state](ctx);

  if (args.useDogFirstTone) {
    const dog = formatDogFirstCopy(args.dogName, args.state, neutral);
    return {
      ...neutral,
      title: dog.title,
      subtitle: dog.subtitle,
      dogToneTitle: dog.dogToneTitle,
    };
  }

  return neutral;
}
