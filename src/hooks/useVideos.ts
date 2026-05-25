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

export const useVideos = () => {
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
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return { videos, loading, refresh: fetchVideos };
};
