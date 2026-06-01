import React, { useCallback, useEffect, useState } from 'react';
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

type DiscoverItem = DiscoverProfile | DiscoverVideo;

interface DiscoverSection {
  title: string;
  data: DiscoverItem[];
  type: 'profile' | 'video';
}

const DiscoverScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [videos, setVideos] = useState<DiscoverVideo[]>([]);

  const loadDiscoverData = useCallback(async (rawQuery: string) => {
    try {
      setLoading(true);
      const search = rawQuery.trim();

      if (!search) {
        const [{ data: profileData }, { data: videosData }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username, full_name, bio')
            .order('updated_at', { ascending: false })
            .limit(12),
          supabase
            .from('videos')
            .select(`
              id,
              caption,
              user_id,
              profiles (username)
            `)
            .order('created_at', { ascending: false })
            .limit(12),
        ]);

        setProfiles((profileData as DiscoverProfile[]) || []);
        setVideos(((videosData || []) as any[]).map(item => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
        })));
        return;
      }

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
      setVideos(((videosData || []) as any[]).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
      })));
    } catch (error) {
      console.error('Error loading discover data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscoverData(query);
  }, [query, loadDiscoverData]);

  const sections: DiscoverSection[] = [
    { title: 'Créateurs', data: profiles, type: 'profile' },
    { title: 'Vidéos', data: videos, type: 'video' },
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

      {loading && profiles.length === 0 && videos.length === 0 ? (
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
            if (section.type === 'profile') {
              const profile = item as DiscoverProfile;
              return (
                <TouchableOpacity
                  className="mx-5 mb-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4"
                  onPress={() => navigation.navigate('PublicProfile', { userId: profile.id })}
                >
                  <Text className="text-base font-semibold text-white">
                    @{profile.username || 'utilisateur'}
                  </Text>
                  <Text className="mt-1 text-sm text-zinc-400">
                    {profile.full_name || profile.bio || 'Profil public'}
                  </Text>
                </TouchableOpacity>
              );
            } else {
              const video = item as DiscoverVideo;
              return (
                <TouchableOpacity
                  className="mx-5 mb-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4"
                  onPress={() => navigation.navigate('PublicProfile', { userId: video.user_id })}
                >
                  <Text className="text-sm font-semibold text-zinc-300">
                    @{video.profiles?.username || 'créateur'}
                  </Text>
                  <Text className="mt-1 text-base text-white" numberOfLines={2}>
                    {video.caption || 'Sans légende'}
                  </Text>
                </TouchableOpacity>
              );
            }
          }}
          ListFooterComponent={<View className="h-20" />}
          refreshing={loading}
          onRefresh={() => loadDiscoverData(query)}
        />
      )}
    </View>
  );
};

export default DiscoverScreen;
