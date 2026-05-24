import { getDb } from '@/lib/database';

import { finalizeDogAvatar } from '@/lib/dogProfilePhoto';

export type DogProfile = {
  onboardingDone: boolean;
  dogName: string;
  dogPhotoUri: string;
  dogBreed: string;
  dogBreedMix: string;
  dogAgeGroup: string;
  dogOutingTypes: string[];
  locationPermission: string;
  notificationsPermission: string;
  dogWeightLbs: number | null;
  dogCoatType: string;
  dogColor: string;
  dogSnoutProfile: 'flat' | 'standard' | 'long';
  dogActivityBaseline: 'low' | 'moderate' | 'high';
  morningBriefTime: string;
  gearVault: Record<string, string[]>;
};

export async function getDogProfile(): Promise<DogProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    onboarding_done: number;
    dog_name: string;
    dog_photo_uri: string;
    dog_breed: string;
    dog_breed_mix: string;
    dog_age_group: string;
    dog_outing_types_json: string;
    location_permission: string;
    notifications_permission: string;
    dog_weight_lbs: number | null;
    dog_coat_type: string;
    dog_color: string;
    dog_snout_profile: string;
    dog_activity_baseline: string;
    morning_brief_time: string;
    gear_vault_json: string;
  }>(`SELECT onboarding_done, dog_name, dog_photo_uri, dog_breed, dog_breed_mix, dog_age_group, dog_outing_types_json, location_permission, notifications_permission, dog_weight_lbs, dog_coat_type, dog_color, dog_snout_profile, dog_activity_baseline, morning_brief_time, gear_vault_json FROM app_profile WHERE id = 1`);
  if (!row) {
    return {
      onboardingDone: false,
      dogName: '',
      dogPhotoUri: '',
      dogBreed: '',
      dogBreedMix: '',
      dogAgeGroup: '',
      dogOutingTypes: [],
      locationPermission: '',
      notificationsPermission: '',
      dogWeightLbs: null,
      dogCoatType: '',
      dogColor: '',
      dogSnoutProfile: 'standard',
      dogActivityBaseline: 'moderate',
      morningBriefTime: '7:00 AM',
      gearVault: {},
    };
  }
  let outingTypes: string[] = [];
  try {
    const parsed = JSON.parse(row.dog_outing_types_json || '[]');
    if (Array.isArray(parsed)) outingTypes = parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    outingTypes = [];
  }
  let gearVault: Record<string, string[]> = {};
  try {
    const parsed = JSON.parse(row.gear_vault_json || '{}');
    if (parsed && typeof parsed === 'object') {
      const result: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (Array.isArray(v)) {
          result[k] = v.filter((x): x is string => typeof x === 'string');
        }
      }
      gearVault = result;
    }
  } catch {
    gearVault = {};
  }
  return {
    onboardingDone: row.onboarding_done === 1,
    dogName: row.dog_name,
    dogPhotoUri: row.dog_photo_uri,
    dogBreed: row.dog_breed,
    dogBreedMix: row.dog_breed_mix,
    dogAgeGroup: row.dog_age_group,
    dogOutingTypes: outingTypes,
    locationPermission: row.location_permission,
    notificationsPermission: row.notifications_permission,
    dogWeightLbs: row.dog_weight_lbs,
    dogCoatType: row.dog_coat_type,
    dogColor: row.dog_color,
    dogSnoutProfile:
      row.dog_snout_profile === 'flat' || row.dog_snout_profile === 'long'
        ? row.dog_snout_profile
        : 'standard',
    dogActivityBaseline:
      row.dog_activity_baseline === 'low' || row.dog_activity_baseline === 'high'
        ? row.dog_activity_baseline
        : 'moderate',
    morningBriefTime: row.morning_brief_time || '7:00 AM',
    gearVault,
  };
}

export async function saveDogProfile(input: {
  onboardingDone: boolean;
  dogName: string;
  dogPhotoUri: string;
  dogBreed?: string;
  dogBreedMix?: string;
  dogAgeGroup?: string;
  dogOutingTypes?: string[];
  locationPermission?: string;
  notificationsPermission?: string;
  dogWeightLbs?: number | null;
  dogCoatType?: string;
  dogColor?: string;
  dogSnoutProfile?: 'flat' | 'standard' | 'long';
  dogActivityBaseline?: 'low' | 'moderate' | 'high';
  morningBriefTime?: string;
  gearVault?: Record<string, string[]>;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_profile (id, onboarding_done, dog_name, dog_photo_uri, dog_breed, dog_breed_mix, dog_age_group, dog_outing_types_json, location_permission, notifications_permission, dog_weight_lbs, dog_coat_type, dog_color, dog_snout_profile, dog_activity_baseline, morning_brief_time, gear_vault_json) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       onboarding_done = excluded.onboarding_done,
       dog_name = excluded.dog_name,
       dog_photo_uri = excluded.dog_photo_uri,
       dog_breed = excluded.dog_breed,
       dog_breed_mix = excluded.dog_breed_mix,
       dog_age_group = excluded.dog_age_group,
       dog_outing_types_json = excluded.dog_outing_types_json,
       location_permission = excluded.location_permission,
       notifications_permission = excluded.notifications_permission,
       dog_weight_lbs = excluded.dog_weight_lbs,
       dog_coat_type = excluded.dog_coat_type,
       dog_color = excluded.dog_color,
       dog_snout_profile = excluded.dog_snout_profile,
      dog_activity_baseline = excluded.dog_activity_baseline,
      morning_brief_time = excluded.morning_brief_time,
      gear_vault_json = excluded.gear_vault_json`,
    [
      input.onboardingDone ? 1 : 0,
      input.dogName.trim(),
      input.dogPhotoUri,
      (input.dogBreed ?? '').trim(),
      (input.dogBreedMix ?? '').trim(),
      (input.dogAgeGroup ?? '').trim(),
      JSON.stringify(input.dogOutingTypes ?? []),
      (input.locationPermission ?? '').trim(),
      (input.notificationsPermission ?? '').trim(),
      input.dogWeightLbs ?? null,
      (input.dogCoatType ?? '').trim(),
      (input.dogColor ?? '').trim(),
      input.dogSnoutProfile ?? 'standard',
      input.dogActivityBaseline ?? 'moderate',
      (input.morningBriefTime ?? '7:00 AM').trim(),
      JSON.stringify(input.gearVault ?? {}),
    ]
  );
}

export async function toggleGearVaultItem(conditionKey: string, itemId: string): Promise<Record<string, string[]>> {
  const current = await getDogProfile();
  const next: Record<string, string[]> = { ...current.gearVault };
  const existing = new Set(next[conditionKey] ?? []);
  if (existing.has(itemId)) {
    existing.delete(itemId);
  } else {
    existing.add(itemId);
  }
  next[conditionKey] = Array.from(existing);
  await saveDogProfile({ ...current, gearVault: next });
  return next;
}

/** Copy gallery/camera URI into stable storage; pass empty string to clear. */
export async function pickAndStoreDogPhoto(sourceUri: string): Promise<string> {
  if (!sourceUri.trim()) return '';
  return finalizeDogAvatar(sourceUri);
}
