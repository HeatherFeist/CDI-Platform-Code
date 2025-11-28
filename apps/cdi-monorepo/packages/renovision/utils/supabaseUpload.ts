import { supabase } from '../supabase';

/**
 * Uploads a file to Supabase Storage and returns the public URL if successful.
 * @param file File to upload
 * @param bucketName Supabase storage bucket name
 * @param folderPath Optional folder path (e.g., userId, timestamp)
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadFileToSupabase(file: File, bucketName: string, folderPath?: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  // Get public URL
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error('Failed to get public URL');
  return data.publicUrl;
}
