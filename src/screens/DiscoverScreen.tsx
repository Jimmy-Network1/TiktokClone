import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, SectionList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

interface DiscoverProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
}

interface DiscoverVideo {
  id: string;
  caption: string | null;
  user_id: string;
  profiles: {
    username: string | null;
  } | null;
}

interface DiscoverHashtag {
  id: string;
  tag: string;
  videoCount: number;
}

type DiscoverItem = DiscoverProfile | DiscoverVideo | DiscoverHashtag;

interface DiscoverSection {
  title: string;
  data: DiscoverItem[];
  type: 'profile' | 'video' | 'hashtag';
}

const DiscoverScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<DiscoverVideo[]>([]);
  const [popularHashtags] = useState<DiscoverHashtag[]>([
    { id: 'h1', tag: 'G4', videoCount: 124 },
    { id: 'h2', tag: 'Vibes', videoCount: 89 },
    { id: 'h3', tag: 'Animation', videoCount: 54 },
    { id: 'h4', tag: 'Art', videoCount: 42 },
    { id: 'h5', tag: 'Sunset', videoCount: 31 },
  ]);

  const loadDiscoverData = useCallback(async (rawQuery: string) => {
    try {
      setLoading(true);
      const search = rawQuery.trim();

      if (!search) {
        // 1. Fetch Trending Videos via the new logic
        const { data: trendingData, error: trendingError } = await supabase
          .from('videos')
          .select(`
            id,
            caption,
            user_id,
            profiles (username),
            likes (count)
          `)
          .order('created_at', { ascending: false }) // Fallback to recent for now, but counting likes
          .limit(10);

        // 2. Fetch Top Creators
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, full_name, bio')
          .limit(10);

        if (trendingError) throw trendingError;

        setTrendingVideos(((trendingData || []) as any[]).map(item => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        })));
        setProfiles((profileData as DiscoverProfile[]) || []);
        return;
      }

      // Search logic remains the same
      const [{ data: profileData }, { data: videosData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, bio')
          .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
          .limit(20),
        supabase
          .from('videos')
          .select(`
            id,
            caption,
            user_id,
            profiles (username)
          `)
          .ilike('caption', `%${search}%`)
          .limit(20),
      ]);

      setProfiles((profileData as DiscoverProfile[]) || []);
      setTrendingVideos(((videosData || []) as any[]).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      })));
    } catch (error) {
      console.error('Error loading discover data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    loadDiscoverData(debouncedQuery);
  }, [debouncedQuery, loadDiscoverData]);

  const sections: DiscoverSection[] = [
    ...(!debouncedQuery ? [{ title: 'Hashtags populaires 🔥', data: popularHashtags, type: 'hashtag' as const }] : []),
    { title: debouncedQuery ? 'Résultats : Créateurs' : 'Créateurs à la une', data: profiles, type: 'profile' },
    { title: debouncedQuery ? 'Résultats : Vidéos' : 'Vidéos populaires', data: trendingVideos, type: 'video' },
  ];

  return (
    <View className="flex-1 bg-black">
      <View className="border-b border-white/10 px-5 pb-5 pt-14">
        <Text className="text-3xl font-bold text-white">Découvrir</Text>
        <Text className="mt-1 text-sm text-zinc-400">
          Recherchez des créateurs et des vidéos à suivre.
        </Text>
        <TextInput
          className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
          placeholder="Rechercher un profil ou un mot clé..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading && profiles.length === 0 && trendingVideos.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : (
        <SectionList<DiscoverItem, DiscoverSection>
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          renderSectionHeader={({ section: { title, data } }) => (
            <View className="bg-black px-5 py-3">
              <Text className="text-xl font-bold text-white">{title}</Text>
              {data.length === 0 && (
                <Text className="mt-2 text-sm text-zinc-500">Aucun résultat trouvé.</Text>
              )}
            </View>
          )}
          renderItem={({ item, section }) => {
            if (section.type === 'hashtag') {
              const hashtagItem = item as DiscoverHashtag;
              return (
                <TouchableOpacity
                  className="mx-5 mb-3 flex-row items-center rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4"
                  onPress={() => navigation.navigate('Hashtag', { hashtag: hashtagItem.tag })}
                >
                  <View className="h-10 w-10 rounded-full bg-zinc-900 items-center justify-center mr-4 border border-white/10">
                     <Text className="text-[#2AF5FF] font-bold text-lg">#</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white">
                      #{hashtagItem.tag}
                    </Text>
                    <Text className="text-xs text-zinc-500">
                      {hashtagItem.videoCount}k vues
                    </Text>
                  </View>
                  <View className="bg-zinc-800 px-3 py-1 rounded-full">
                     <Text className="text-white text-[10px] font-bold">Explorer</Text>
                  </View>
                </TouchableOpacity>
              );
            } else if (section.type === 'profile') {
              const profile = item as DiscoverProfile;
              return (
                <TouchableOpacity
                  className="mx-5 mb-3 flex-row items-center rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4"
                  onPress={() => navigation.navigate('PublicProfile', { userId: profile.id })}
                >
                  <View className="h-12 w-12 rounded-full bg-zinc-800 items-center justify-center mr-4 border border-white/10">
                    <Text className="text-white font-bold">
                       {(profile.username || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-white">
                      @{profile.username || 'utilisateur'}
                    </Text>
                    <Text className="text-xs text-zinc-500" numberOfLines={1}>
                      {profile.full_name || 'Profil public'}
                    </Text>
                  </View>
                  <View className="bg-zinc-800 px-3 py-1 rounded-full">
                     <Text className="text-white text-[10px] font-bold">Voir</Text>
                  </View>
                </TouchableOpacity>
              );
            } else {
              // Note: For videos, we keep the original list for now but with better style.
              // A real grid would require changing the SectionList structure or using a custom layout.
              const video = item as DiscoverVideo;
              return (
                <TouchableOpacity
                  className="mx-5 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
                  onPress={() => navigation.navigate('PublicProfile', { userId: video.user_id })}
                >
                  <View className="flex-row items-center p-4">
                    <View className="h-16 w-12 rounded-lg bg-zinc-900 items-center justify-center mr-4">
                        <Text className="text-zinc-700 text-xs">VID</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-[#FE2C55]">
                        @{video.profiles?.username || 'créateur'}
                      </Text>
                      <Text className="mt-1 text-base text-white" numberOfLines={2}>
                        {video.caption || 'Sans légende'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          ListFooterComponent={<View className="h-20" />}
          refreshing={loading}
          onRefresh={() => loadDiscoverData(debouncedQuery)}
        />
      )}
    </View>
  );
};

export default DiscoverScreen;
