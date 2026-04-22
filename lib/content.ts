import type {
  Card,
  Checklist,
  ContentLibrary,
  ContentTier,
  HazardMonth,
  Pack,
} from '@/types/content';

import rawLibrary from '@/assets/content/library.json';

const library = rawLibrary as ContentLibrary;

export function getLibrary(): ContentLibrary {
  return library;
}

export function getAllPacks(): Pack[] {
  return library.packs;
}

export function getPack(packId: string): Pack | undefined {
  return library.packs.find((p) => p.id === packId);
}

export function getPackTier(packId: string): ContentTier | undefined {
  return getPack(packId)?.tier;
}

export function canAccessPack(
  packId: string,
  isPro: boolean,
  activeEntitlements: string[] = []
): boolean {
  const pack = getPack(packId);
  if (!pack) return false;
  if (isPro) return true;
  if (pack.tier === 'premium' && !activeEntitlements.includes(pack.id)) return false;
  return true;
}

export function getCard(id: string): Card | undefined {
  return library.cards.find((c) => c.id === id);
}

export function getCardsForPack(packId: string): Card[] {
  return library.cards.filter((c) => c.packId === packId);
}

export function getChecklist(id: string): Checklist | undefined {
  return library.checklists.find((c) => c.id === id);
}

export function getChecklistsForPack(packId: string): Checklist[] {
  return library.checklists.filter((c) => c.packId === packId);
}

export function getAllChecklists(): Checklist[] {
  return library.checklists;
}

export function getHazardForMonth(monthIndex1to12: number): HazardMonth | undefined {
  return library.hazardCalendar.find((h) => h.month === monthIndex1to12);
}

export function getCurrentHazardMonth(): HazardMonth | undefined {
  const m = new Date().getMonth() + 1;
  return getHazardForMonth(m);
}
