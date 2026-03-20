import { useState, useCallback } from 'react';
import { File as ExpoFile } from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export interface WorkSlipAttachment {
  url: string;
  name: string;
  type: string;
}

/**
 * Hook for uploading, listing, and deleting work slip attachments
 * in the Supabase Storage 'work-slips' bucket.
 *
 * Files are stored at: {userId}/{shiftId}/{filename}
 */
export function useWorkSlips() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  /**
   * Upload a single work slip file to Supabase Storage.
   * Returns the attachment metadata (url, name, type) on success.
   */
  const uploadWorkSlip = useCallback(
    async (
      shiftId: string,
      file: { uri: string; name: string; type?: string }
    ): Promise<{ data: WorkSlipAttachment | null; error: Error | null }> => {
      if (!user) return { data: null, error: new Error('Not authenticated') };

      try {
        setUploading(true);

        // Determine MIME type from extension if not provided
        const mimeType = file.type || guessMimeType(file.name);

        // Build storage path: userId/shiftId/filename
        const storagePath = `${user.id}/${shiftId}/${file.name}`;

        // Read the file as ArrayBuffer using the new expo-file-system API
        const expoFile = new ExpoFile(file.uri);
        const arrayBuffer = await expoFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // File size validation (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (bytes.length > MAX_FILE_SIZE) {
          return { data: null, error: new Error('File too large. Maximum size is 10MB.') };
        }

        const { error: uploadError } = await supabase.storage
          .from('work-slips')
          .upload(storagePath, bytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          console.warn('[useWorkSlips] upload error:', uploadError.message);
          return { data: null, error: new Error(uploadError.message) };
        }

        // Get the public/signed URL
        const { data: urlData } = supabase.storage
          .from('work-slips')
          .getPublicUrl(storagePath);

        const attachment: WorkSlipAttachment = {
          url: urlData.publicUrl,
          name: file.name,
          type: mimeType,
        };

        return { data: attachment, error: null };
      } catch (err) {
        console.warn('[useWorkSlips] uploadWorkSlip failed:', err);
        return { data: null, error: err as Error };
      } finally {
        setUploading(false);
      }
    },
    [user]
  );

  /**
   * List all work slip files for a given shift.
   */
  const getWorkSlips = useCallback(
    async (
      shiftId: string
    ): Promise<{ data: WorkSlipAttachment[]; error: Error | null }> => {
      if (!user) return { data: [], error: new Error('Not authenticated') };

      try {
        const folderPath = `${user.id}/${shiftId}`;
        const { data, error } = await supabase.storage
          .from('work-slips')
          .list(folderPath);

        if (error) {
          console.warn('[useWorkSlips] list error:', error.message);
          return { data: [], error: new Error(error.message) };
        }

        const attachments: WorkSlipAttachment[] = (data ?? [])
          .filter((file) => file.name !== '.emptyFolderPlaceholder')
          .map((file) => {
            const filePath = `${folderPath}/${file.name}`;
            const { data: urlData } = supabase.storage
              .from('work-slips')
              .getPublicUrl(filePath);

            return {
              url: urlData.publicUrl,
              name: file.name,
              type: file.metadata?.mimetype || guessMimeType(file.name),
            };
          });

        return { data: attachments, error: null };
      } catch (err) {
        console.warn('[useWorkSlips] getWorkSlips failed:', err);
        return { data: [], error: err as Error };
      }
    },
    [user]
  );

  /**
   * Delete a work slip file by its storage path (userId/shiftId/filename).
   */
  const deleteWorkSlip = useCallback(
    async (path: string): Promise<{ error: Error | null }> => {
      if (!user) return { error: new Error('Not authenticated') };

      try {
        const { error } = await supabase.storage
          .from('work-slips')
          .remove([path]);

        if (error) {
          console.warn('[useWorkSlips] delete error:', error.message);
          return { error: new Error(error.message) };
        }

        return { error: null };
      } catch (err) {
        console.warn('[useWorkSlips] deleteWorkSlip failed:', err);
        return { error: err as Error };
      }
    },
    [user]
  );

  return { uploadWorkSlip, getWorkSlips, deleteWorkSlip, uploading };
}

/** Guess MIME type from file extension. */
function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}
