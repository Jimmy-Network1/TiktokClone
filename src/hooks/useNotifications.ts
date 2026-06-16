import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'message' | 'follow' | 'system';
  title: string;
  message: string;
  data?: any;
}

export const useNotifications = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);

  const sendNotification = useCallback(async (targetUserId: string, notification: Omit<AppNotification, 'id'>) => {
    if (targetUserId === session?.user?.id) return; // Don't notify self

    const channel = supabase.channel(`notifications:${targetUserId}`);
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: { ...notification, id: Date.now().toString() }
    });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase.channel(`notifications:${session.user.id}`);
    
    channel
      .on('broadcast', { event: 'new_notification' }, ({ payload }) => {
        const newNotif = payload as AppNotification;
        setNotifications(prev => [newNotif, ...prev]);
        setLatestNotification(newNotif);
        
        // Auto-clear latest notification after 5 seconds
        setTimeout(() => {
          setLatestNotification(null);
        }, 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const clearNotification = () => setLatestNotification(null);

  return { notifications, latestNotification, sendNotification, clearNotification };
};
