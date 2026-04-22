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
  }>(`SELECT onboarding_done, dog_name, dog_photo_uri, dog_breed, dog_breed_mix, dog_age_group, dog_outing_types_json, location_permission, notifications_permission, dog_weight_lbs, dog_coat_type, dog_color FROM app_profile WHERE id = 1`);
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
    };
  }
  let outingTypes: string[] = [];
  try {
    const parsed = JSON.parse(row.dog_outing_types_json || '[]');
    if (Array.isArray(parsed)) outingTypes = parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    outingTypes = [];
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
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_profile (id, onboarding_done, dog_name, dog_photo_uri, dog_breed, dog_breed_mix, dog_age_group, dog_outing_types_json, location_permission, notifications_permission, dog_weight_lbs, dog_coat_type, dog_color) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
       dog_color = excluded.dog_color`,
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
    ]
  );
}

/** Copy gallery/camera URI into stable storage; pass empty string to clear. */
export async function pickAndStoreDogPhoto(sourceUri: string): Promise<string> {
  if (!sourceUri.trim()) return '';
  return finalizeDogAvatar(sourceUri);
}
