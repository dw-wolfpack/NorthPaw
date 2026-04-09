import { getDb } from '@/lib/database';

import { finalizeDogAvatar } from '@/lib/dogProfilePhoto';

export type DogProfile = {
  onboardingDone: boolean;
  dogName: string;
  dogPhotoUri: string;
};

export async function getDogProfile(): Promise<DogProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    onboarding_done: number;
    dog_name: string;
    dog_photo_uri: string;
  }>(`SELECT onboarding_done, dog_name, dog_photo_uri FROM app_profile WHERE id = 1`);
  if (!row) {
    return { onboardingDone: false, dogName: '', dogPhotoUri: '' };
  }
  return {
    onboardingDone: row.onboarding_done === 1,
    dogName: row.dog_name,
    dogPhotoUri: row.dog_photo_uri,
  };
}

export async function saveDogProfile(input: {
  onboardingDone: boolean;
  dogName: string;
  dogPhotoUri: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_profile (id, onboarding_done, dog_name, dog_photo_uri) VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       onboarding_done = excluded.onboarding_done,
       dog_name = excluded.dog_name,
       dog_photo_uri = excluded.dog_photo_uri`,
    [input.onboardingDone ? 1 : 0, input.dogName.trim(), input.dogPhotoUri]
  );
}

/** Copy gallery/camera URI into stable storage; pass empty string to clear. */
export async function pickAndStoreDogPhoto(sourceUri: string): Promise<string> {
  if (!sourceUri.trim()) return '';
  return finalizeDogAvatar(sourceUri);
}
