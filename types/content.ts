export type ContentTier = 'free' | 'premium';

export type Card = {
  id: string;
  packId: string;
  title: string;
  subtitle?: string;
  body: string[];
  tags: string[];
  disclaimer?: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  hint?: string;
};

export type Checklist = {
  id: string;
  packId: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
};

export type Pack = {
  id: string;
  title: string;
  description: string;
  tier: ContentTier;
  regionNote?: string;
};

export type HazardMonth = {
  month: number;
  title: string;
  bullets: string[];
};

export type ContentLibrary = {
  version: string;
  packs: Pack[];
  cards: Card[];
  checklists: Checklist[];
  hazardCalendar: HazardMonth[];
};
