import { canAccessPack, getCard, getChecklist } from '@/lib/content';

export type WeatherSuggestion = {
  kind: 'card' | 'checklist';
  id: string;
  title: string;
  /** Short line shown under the title */
  reason: string;
};

type Candidate = {
  kind: 'card' | 'checklist';
  id: string;
  reason: string;
  priority: number;
};

export type WeatherSuggestionInput = {
  tempF: number;
  forecastShort: string;
  summary: string;
  precipChance: number | null;
  isDaytime: boolean;
};

const RAIN_RE = /rain|shower|thunder|drizzle|storm|downpour|snow|wintry|slush|ice/i;
const HOT_RE = /sunny|clear|mostly sunny|fair|hot/i;
const SMOKE_RE = /smoke|hazy|unhealthy air|aq\w*\s*alert/i;
const FOG_RE = /\bfog/i;

/**
 * Picks field cards and checklists from the library based on NWS-style signals.
 * Respects pack access: premium items are omitted for non-Pro users.
 */
export function buildWeatherSuggestions(input: WeatherSuggestionInput, isPro: boolean): WeatherSuggestion[] {
  const blob = `${input.forecastShort}\n${input.summary}`.toLowerCase();
  const precipN = input.precipChance ?? 0;
  const looksWet = precipN >= 38 || RAIN_RE.test(blob);
  const looksHot =
    input.tempF >= 86 || (input.tempF >= 80 && HOT_RE.test(blob)) || (input.tempF >= 84 && precipN < 15);
  const warmISH = input.tempF >= 70 && input.tempF < 86 && !looksWet;
  const coldISH = input.tempF <= 48;
  const freezingISH = input.tempF <= 36;
  const nightOut = !input.isDaytime;
  const foggy = FOG_RE.test(blob);
  const smoky = SMOKE_RE.test(blob);

  const candidates: Candidate[] = [];

  const add = (c: Candidate) => {
    candidates.push(c);
  };

  if (looksHot) {
    add({ kind: 'card', id: 'heat-stress-signals', reason: 'Heat risk — know the warning signs', priority: 100 });
    add({ kind: 'checklist', id: 'hot-day-compact', reason: 'Quick checks when it is hot', priority: 98 });
    add({ kind: 'card', id: 'neighborhood-heat-walks', reason: 'Pavement and shade on daily walks', priority: 92 });
    add({ kind: 'card', id: 'water-on-trail', reason: 'Water planning still matters', priority: 85 });
  }

  if (looksWet) {
    add({ kind: 'card', id: 'water-on-trail', reason: 'Hydration and soggy-trail judgment', priority: 96 });
    add({ kind: 'checklist', id: 'pre-trail-60s', reason: 'Re-check route and gear before you go', priority: 90 });
    add({ kind: 'card', id: 'paw-booties-wax', reason: 'Pads, grit, and messy surfaces', priority: 82 });
    if (coldISH || /snow|ice|winter|wintry/i.test(blob)) {
      add({ kind: 'checklist', id: 'snow-transition', reason: 'Cold / snow-line realities', priority: 88 });
    }
  }

  if (warmISH && !looksHot) {
    add({ kind: 'checklist', id: 'pre-trail-60s', reason: 'Nice day — still worth a fast scan', priority: 72 });
    add({ kind: 'card', id: 'water-on-trail', reason: 'Warm miles need water planning', priority: 68 });
    add({ kind: 'card', id: 'turn-back-rules', reason: 'When to call the outing', priority: 60 });
  }

  if (coldISH && !looksWet) {
    add({ kind: 'card', id: 'paw-booties-wax', reason: 'Cold or abrasive surfaces', priority: 78 });
    if (freezingISH || isPro) {
      add({ kind: 'checklist', id: 'snow-transition', reason: 'Shoulder-season / snow awareness', priority: 70 });
    }
  }

  if (nightOut) {
    add({ kind: 'card', id: 'night-and-visibility', reason: 'Low light and being seen', priority: 75 });
  }

  if (foggy && isPro) {
    add({ kind: 'card', id: 'coastal-fog-morning', reason: 'Fog layers and visibility shifts', priority: 86 });
  }

  if (smoky && isPro) {
    add({ kind: 'card', id: 'fire-smoke-season', reason: 'Air quality and exertion', priority: 94 });
  }

  candidates.sort((a, b) => b.priority - a.priority);

  const seen = new Set<string>();
  const out: WeatherSuggestion[] = [];

  const tryAdd = (c: Candidate) => {
    const key = `${c.kind}:${c.id}`;
    if (seen.has(key)) return;
    const packId =
      c.kind === 'card' ? getCard(c.id)?.packId : getChecklist(c.id)?.packId;
    if (!packId || !canAccessPack(packId, isPro)) return;
    const title =
      c.kind === 'card' ? getCard(c.id)?.title : getChecklist(c.id)?.title;
    if (!title) return;
    seen.add(key);
    out.push({ kind: c.kind, id: c.id, title, reason: c.reason });
  };

  for (const c of candidates) {
    tryAdd(c);
    if (out.length >= 4) return out;
  }

  const fallback: Candidate[] = [
    { kind: 'checklist', id: 'pre-trail-60s', reason: 'Quick check before you clip the leash', priority: 0 },
    { kind: 'card', id: 'turn-back-rules', reason: 'Judgment anchor any day', priority: 0 },
    { kind: 'card', id: 'water-on-trail', reason: 'Hydration baseline', priority: 0 },
  ];
  for (const c of fallback) {
    tryAdd(c);
    if (out.length >= 4) break;
  }

  return out;
}
