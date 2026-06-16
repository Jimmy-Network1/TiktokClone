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
  bookmarks?: { user_id: string }[];
  cut_start?: number | null;
  cut_end?: number | null;
}

const PUBLIC_FEED_USERNAMES = ['tiktokclone', 'tiktok_fr', 'tiktok_africa', 'demo'];
export type FeedMode = 'for_you' | 'following' | 'hashtag';

const MOCK_VIDEOS: Video[] = [
  {
    id: 'mock-1',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lit-room-dancing-41743-large.mp4',
    thumbnail_url: 'https://images.pexels.com/photos/3532540/pexels-photo-3532540.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=400',
    caption: 'Bienvenue sur G4 ! 🚀 Le futur du contenu court est ici. #G4 #NextGen #Fun #Revolution',
    user_id: 'system',
    profiles: { username: 'G4_Official', avatar_url: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200', full_name: 'G4 Team' },
    likes: [{ user_id: '1' }, { user_id: '2' }, { user_id: '3' }],
    comments: [{ id: 'c1' }, { id: 'c2' }],
    bookmarks: [],
  },
  {
    id: 'mock-2',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-skater-doing-tricks-in-a-park-42290-large.mp4',
    thumbnail_url: 'https://images.pexels.com/photos/1651166/pexels-photo-1651166.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=400',
    caption: 'Nouvelle figure aujourd\'hui ! 🛹 Le skate c\'est la vie. #Skate #Sport #Animation #Sunset',
    user_id: 'system',
    profiles: { username: 'skate_master', avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200', full_name: 'Alex Skate' },
    likes: [{ user_id: '1' }],
    comments: [{ id: 'c10' }],
    bookmarks: [],
  },
  {
    id: 'mock-3',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-holding-a-sparkler-at-night-42299-large.mp4',
    thumbnail_url: 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=400',
    caption: 'Briller même dans le noir. 🎆 Le pouvoir d\'une étincelle. #Sparkler #Night #Art #Vibes',
    user_id: 'system',
    profiles: { username: 'travel_guru', avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200', full_name: 'Sophia Travel' },
    likes: [{ user_id: '1' }, { user_id: '2' }],
    comments: [{ id: 'c4' }],
    bookmarks: [],
  }
];

export const useVideos = (
  isGuest = false, 
  mode: FeedMode = 'for_you', 
  sessionUserId?: string, 
  pageSize = 5, 
  hashtag?: string,
  initialVideoId?: string
) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchVideos = useCallback(async (isRefresh = false) => {
    const currentOffset = isRefresh ? 0 : offset;
    
    try {
      if (isRefresh) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      let targetUserIds: string[] | null = null;
      let data: any[] | null = null;
      let fetchError: any = null;
      
      if (mode === 'hashtag' && hashtag) {
        const { data: hashtagData, error: hashtagError } = await supabase
          .from('videos')
          .select(`
            id,
            video_url,
            thumbnail_url,
            caption,
            user_id,
            cut_start,
            cut_end,
            profiles (id, username, full_name, avatar_url, bio),
            likes (user_id),
            comments (id),
            bookmarks (user_id)
          `)
          .ilike('caption', `%#${hashtag}%`)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + pageSize - 1);
        
        data = hashtagData;
        fetchError = hashtagError;
      } else if (mode === 'following') {
        if (!sessionUserId) {
          setVideos([]);
          setLoading(false);
          setLoadingMore(false);
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
          setLoadingMore(false);
          return;
        }
      }

      // 2. Fetch using personalized algorithm if authenticated and in For You mode
      if (mode !== 'hashtag' && mode === 'for_you' && sessionUserId && !isGuest) {
        // We call the recommended videos RPC function (returns SETOF videos, max 20)
        const { data: rpcRows, error: rpcError } = await supabase
          .rpc('get_recommended_videos', { user_uuid: sessionUserId });
        
        if (rpcError) {
          fetchError = rpcError;
        } else {
          const recommendedIds = (rpcRows || []).map((r: any) => r.id);
          if (recommendedIds.length === 0) {
            data = [];
          } else {
            // Paginate manually on the returned IDs
            const paginatedIds = recommendedIds.slice(currentOffset, currentOffset + pageSize);
            if (paginatedIds.length === 0) {
              data = [];
            } else {
              // Fetch full details with relationships for the paginated IDs
              const { data: fullData, error: fullError } = await supabase
                .from('videos')
                .select(`
                  id,
                  video_url,
                  thumbnail_url,
                  caption,
                  user_id,
                  cut_start,
                  cut_end,
                  profiles (id, username, full_name, avatar_url, bio),
                  likes (user_id),
                  comments (id),
                  bookmarks (user_id)
                `)
                .in('id', paginatedIds);
              
              if (fullError) {
                fetchError = fullError;
              } else {
                // Preserve the order returned by the recommendation algorithm
                const idToIndexMap = new Map<string, number>(
                  paginatedIds.map((id: string, index: number): [string, number] => [id, index])
                );
                data = (fullData || []).sort((a: any, b: any) => {
                  const indexA = idToIndexMap.get(a.id) ?? 999;
                  const indexB = idToIndexMap.get(b.id) ?? 999;
                  return indexA - indexB;
                });
              }
            }
          }
        }
      } else {
        // Classic query for Guest, Following, or fallback
        let query = supabase
          .from('videos')
          .select(`
            id,
            video_url,
            thumbnail_url,
            caption,
            user_id,
            cut_start,
            cut_end,
            profiles (id, username, full_name, avatar_url, bio),
            likes (user_id),
            comments (id),
            bookmarks (user_id)
          `)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + pageSize - 1);

        if (targetUserIds) {
          query = query.in('user_id', targetUserIds);
        }

        const { data: standardData, error: standardError } = await query;
        data = standardData;
        fetchError = standardError;
      }

      if (fetchError) throw fetchError;

      const normalizedVideos = (data || []).map(item => {
        try {
          return {
            ...item,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
            likes: item.likes || [],
            comments: item.comments || [],
            bookmarks: item.bookmarks || [],
            cut_start: item.cut_start,
            cut_end: item.cut_end,
          };
        } catch (e) {
          console.error('Normalization error for item:', item.id, e);
          return null;
        }
      }).filter(v => v !== null) as Video[];

      // Ensure initial video is included at the top if provided and not already present
      if (initialVideoId && currentOffset === 0) {
        const hasInitialVideo = normalizedVideos.some(v => v.id === initialVideoId);
        if (!hasInitialVideo) {
          try {
            const { data: specificVideo, error: specificError } = await supabase
              .from('videos')
              .select(`
                id,
                video_url,
                thumbnail_url,
                caption,
                user_id,
                cut_start,
                cut_end,
                profiles (id, username, full_name, avatar_url, bio),
                likes (user_id),
                comments (id),
                bookmarks (user_id)
              `)
              .eq('id', initialVideoId)
              .single();

            if (!specificError && specificVideo) {
              const normalizedSpecific = {
                ...specificVideo,
                profiles: Array.isArray(specificVideo.profiles) ? specificVideo.profiles[0] : specificVideo.profiles,
                likes: specificVideo.likes || [],
                comments: specificVideo.comments || [],
                bookmarks: specificVideo.bookmarks || [],
                cut_start: specificVideo.cut_start,
                cut_end: specificVideo.cut_end,
              } as Video;
              
              normalizedVideos.unshift(normalizedSpecific);
            }
          } catch (e) {
            console.error('Error fetching initial video:', e);
          }
        }
      }

      // Guest filter
      let finalVideos = normalizedVideos;
      if (isGuest) {
        finalVideos = normalizedVideos.filter(video => {
          const username = video.profiles?.username?.toLowerCase() || '';
          return PUBLIC_FEED_USERNAMES.includes(username);
        });
        if (finalVideos.length === 0 && currentOffset === 0) {
          finalVideos = normalizedVideos.slice(0, pageSize);
        }
      }

      if (isRefresh) {
        setVideos(finalVideos.length > 0 ? finalVideos : (currentOffset === 0 ? MOCK_VIDEOS : []));
        setOffset(finalVideos.length);
      } else {
        setVideos(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(v => v.id));
          const newVideos = finalVideos.filter(v => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
        setOffset(prev => prev + finalVideos.length);
      }

      if (finalVideos.length < pageSize) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      if (currentOffset === 0) {
        setVideos(MOCK_VIDEOS);
        setError("Impossible de joindre le serveur. Affichage du mode démo.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isGuest, mode, sessionUserId, offset, pageSize, hashtag, initialVideoId]);

  useEffect(() => {
    fetchVideos(true);
  }, [mode, sessionUserId, hashtag, initialVideoId]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchVideos(false);
    }
  }, [loading, loadingMore, hasMore, fetchVideos]);

  const refresh = useCallback(() => {
    return fetchVideos(true);
  }, [fetchVideos]);

  return { videos, loading, loadingMore, hasMore, error, refresh, loadMore };
};
