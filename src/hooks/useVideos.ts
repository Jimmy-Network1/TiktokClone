import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Video {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string;
  user_id: string;
  profiles: {
    id?: string;
    username: string;
    full_name?: string | null;
    avatar_url: string;
    bio?: string | null;
  };
  likes: { user_id: string }[];
  comments: { id: string }[];
}

const PUBLIC_FEED_USERNAMES = ['tiktokclone', 'tiktok_fr', 'tiktok_africa', 'demo'];
export type FeedMode = 'for_you' | 'following';

export const useVideos = (isGuest = false, mode: FeedMode = 'for_you', sessionUserId?: string) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let targetUserIds: string[] | null = null;
      
      if (mode === 'following') {
        if (!sessionUserId) {
          setVideos([]);
          setLoading(false);
          return;
        }

        const { data: followRows, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', sessionUserId);

        if (followsError) throw followsError;

        targetUserIds = (followRows || []).map(row => row.following_id);
        if (targetUserIds.length === 0) {
          setVideos([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from('videos')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          likes (user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false });

      if (targetUserIds) {
        query = query.in('user_id', targetUserIds);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Supabase fetch error details:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        throw fetchError;
      }

      const normalizedVideos = (data || []).map(item => {
        try {
          return {
            ...item,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
            likes: item.likes || [],
            comments: item.comments || [],
          };
        } catch (e) {
          console.error('Normalization error for item:', item.id, e);
          return null;
        }
      }).filter(v => v !== null) as Video[];

      if (!isGuest) {
        setVideos(normalizedVideos);
      } else {
        const guestVideos = normalizedVideos.filter(video => {
          const username = video.profiles?.username?.toLowerCase() || '';
          return PUBLIC_FEED_USERNAMES.includes(username);
        });
        setVideos(guestVideos.length > 0 ? guestVideos : normalizedVideos.slice(0, 10));
      }
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError("Impossible de charger les vidéos.");
    } finally {
      setLoading(false);
    }
  }, [isGuest, mode, sessionUserId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, refresh: fetchVideos };
};
