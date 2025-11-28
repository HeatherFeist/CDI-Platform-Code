import { supabase } from '../supabase';

/**
 * Send a photo to a target app by inserting a reference into the app's table.
 * @param app 'marketplace' | 'renovision'
 * @param photoUrl The public URL of the photo in the main bucket
 * @param userId The user's ID (for tracking/ownership)
 * @returns Promise<void>
 */
export async function sendPhotoToApp(app: 'marketplace' | 'renovision', photoUrl: string, userId: string): Promise<void> {
  const table = app === 'marketplace' ? 'marketplace_photos' : 'renovision_photos';
  const { error } = await supabase.from(table).insert({
    user_id: userId,
    photo_url: photoUrl,
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;
}
