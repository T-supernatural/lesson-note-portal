import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export const fetchNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data as Notification[]) ?? [];
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read_at'>) => {
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: notification.user_id,
    p_lesson_note_id: notification.lesson_note_id,
    p_title: notification.title,
    p_message: notification.message,
  });
  if (error) throw error;
  return data as Notification;
};

export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw error;
};