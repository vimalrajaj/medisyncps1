import { supabase } from '../lib/supabase';

class FileUploadService {
  // Get all file uploads for current user or all (if admin)
  async getUploads() {
    try {
      const { data, error } = await supabase?.from('file_uploads')?.select(`
          *,
          uploaded_by:user_profiles!uploaded_by(full_name, organization)
        `)?.order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Create new file upload record
  async createUploadRecord(uploadData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase?.from('file_uploads')?.insert({
          ...uploadData,
          uploaded_by: user?.id
        })?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update upload status and progress
  async updateUploadStatus(id, statusData) {
    try {
      const { data, error } = await supabase?.from('file_uploads')?.update(statusData)?.eq('id', id)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Delete upload record
  async deleteUpload(id) {
    try {
      const { error } = await supabase?.from('file_uploads')?.delete()?.eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Get upload statistics
  async getUploadStats() {
    try {
      const { data: totalUploads, error: totalError } = await supabase?.from('file_uploads')?.select('id', { count: 'exact', head: true });

      const { data: completedUploads, error: completedError } = await supabase?.from('file_uploads')?.select('processed_records.sum()')?.eq('upload_status', 'completed');

      const { data: recentUploads, error: recentError } = await supabase?.from('file_uploads')?.select('*')?.order('created_at', { ascending: false })?.limit(5);

      if (totalError || completedError || recentError) {
        throw totalError || completedError || recentError;
      }

      const totalProcessedRecords = completedUploads?.[0]?.sum || 0;

      return {
        data: {
          totalUploads: totalUploads || 0,
          totalProcessedRecords,
          recentUploads: recentUploads || []
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Subscribe to upload changes
  subscribeToUploads(callback) {
    return supabase?.channel('file_uploads')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'file_uploads' },
        callback
      )?.subscribe();
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;