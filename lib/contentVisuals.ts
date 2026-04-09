import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/** Replace these files under assets/images/content/ with Midjourney exports (see CONTENT_IMAGES.md). */
export const IMAGES = {
  homeHero: require('../assets/images/content/home-hero.png'),
  pack: require('../assets/images/content/pack-placeholder.png'),
  card: require('../assets/images/content/card-placeholder.png'),
} as const;

export type GradientPair = readonly [string, string];

const PACK_GRADIENTS: Record<string, GradientPair> = {
  'trail-basics': ['#2D6A4F', '#1B4332'],
  'dog-tricks': ['#7b5cbf', '#31206b'],
  'norcal-seasons': ['#40916C', '#074F57'],
};

export function gradientForPack(packId: string): GradientPair {
  return PACK_GRADIENTS[packId] ?? (['#2D6A4F', '#1B4332'] as const);
}

/** Warm / cool accents from primary tag, works until per-card art exists. */
const TAG_GRADIENTS: Record<string, GradientPair> = {
  heat: ['#e07a5f', '#9b2226'],
  water: ['#457b9d', '#1d3557'],
  safety: ['#6a994e', '#2d6a4f'],
  winter: ['#89c2d9', '#457b9d'],
  planning: ['#bc6c25', '#6f4518'],
  wildlife: ['#606c38', '#283618'],
  gear: ['#7f5539', '#432818'],
  norcal: ['#40916C', '#1B4332'],
  sierra: ['#588157', '#344e41'],
  urban: ['#bc6c25', '#6f4518'],
  car: ['#457b9d', '#1d3557'],
  travel: ['#588157', '#2d6a4f'],
  daily: ['#6a994e', '#344e41'],
  encounters: ['#9b2226', '#590d22'],
  tricks: ['#7b5cbf', '#4c1d95'],
  enrichment: ['#c084fc', '#6b21a8'],
};

const DEFAULT_TAG_GRADIENT: GradientPair = ['#2D6A4F', '#1B4332'];

export function gradientForCardTags(tags: string[]): GradientPair {
  for (const t of tags) {
    const g = TAG_GRADIENTS[t];
    if (g) return g;
  }
  return DEFAULT_TAG_GRADIENT;
}

export function iconForTag(tag: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    heat: 'thermometer',
    water: 'water',
    planning: 'map-marker-path',
    safety: 'shield-alert',
    wildlife: 'owl',
    gear: 'hiking',
    paws: 'paw',
    winter: 'snowflake',
    summer: 'white-balance-sunny',
    norcal: 'image-filter-hdr',
    sierra: 'terrain',
    ethics: 'hand-heart',
    visibility: 'flashlight',
    trails: 'sign-direction',
    spring: 'flower',
    smoke: 'weather-fog',
    bay: 'city',
    redwoods: 'tree',
    humidity: 'water-percent',
    fitness: 'run-fast',
    recovery: 'bandage',
    health: 'heart-pulse',
    judgment: 'head-cog',
    leash: 'gate',
    training: 'dog',
    etiquette: 'human-greeting-variant',
    elevation: 'trending-up',
    ticks: 'bug',
    mud: 'tractor',
    granite: 'diamond-stone',
    fog: 'weather-fog',
    first: 'medical-bag',
    weight: 'dumbbell',
    urban: 'road-variant',
    car: 'car',
    travel: 'bag-suitcase',
    daily: 'walk',
    encounters: 'dog-service',
    tricks: 'star-four-points-outline',
    enrichment: 'party-popper',
  };
  return map[tag] ?? 'pine-tree';
}
