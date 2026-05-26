import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Video {
  id: string;
  video_url: string;
  caption: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes: { count: number }[];
  comments: { count: number }[];
}

const PUBLIC_FEED_USERNAMES = ['tiktokclone', 'tiktok_fr', 'tiktok_africa', 'demo'];

export const useVideos = (isGuest = false) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles (username, avatar_url),
          likes (count),
          comments (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allVideos = data || [];
      if (!isGuest) {
        setVideos(allVideos);
        return;
      }

      const guestVideos = allVideos.filter(video => {
        const username = video.profiles?.username?.toLowerCase() || '';
        return PUBLIC_FEED_USERNAMES.includes(username);
      });

      // Fallback to a short curated list when the configured public creators
      // are not present yet in the database.
      setVideos(guestVideos.length > 0 ? guestVideos : allVideos.slice(0, 8));
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [isGuest]);

  return { videos, loading, refresh: fetchVideos };
};
