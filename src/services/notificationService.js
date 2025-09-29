import { supabase } from '../lib/supabase';

class NotificationService {
  // Get notifications for current user
  async getNotifications(limit = 20) {
    try {
      const { data, error } = await supabase?.from('system_notifications')?.select('*')?.order('created_at', { ascending: false })?.limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const { data, error } = await supabase?.from('system_notifications')?.select('id', { count: 'exact', head: true })?.eq('is_read', false);

      if (error) throw error;
      return { data: data || 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  }

  // Mark notification as read
  async markAsRead(id) {
    try {
      const { data, error } = await supabase?.from('system_notifications')?.update({ is_read: true })?.eq('id', id)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase?.from('system_notifications')?.update({ is_read: true })?.eq('user_id', user?.id)?.eq('is_read', false);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Create notification (admin only)
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase?.from('system_notifications')?.insert(notificationData)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Delete notification
  async deleteNotification(id) {
    try {
      const { error } = await supabase?.from('system_notifications')?.delete()?.eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Subscribe to notification changes
  subscribeToNotifications(callback) {
    return supabase?.channel('system_notifications')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_notifications' },
        callback
      )?.subscribe();
  }
}

export const notificationService = new NotificationService();
export default notificationService;