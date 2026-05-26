import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscoverData(query);
  }, [query, loadDiscoverData]);

  return (
    <View className="flex-1 bg-black">
      <View className="border-b border-white/10 px-5 pb-5 pt-14">
        <Text className="text-3xl font-bold text-white">Decouvrir</Text>
        <Text className="mt-1 text-sm text-zinc-400">
          Recherchez des createurs et des videos a suivre.
        </Text>
        <TextInput
          className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
          placeholder="Rechercher un profil ou un mot cle..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={(_, index) => `section-${index}`}
          renderItem={null}
          ListHeaderComponent={
            <View className="px-5 py-6">
              <Text className="mb-3 text-xl font-bold text-white">Createurs</Text>
              {profiles.length === 0 ? (
                <Text className="mb-6 text-sm text-zinc-500">Aucun profil trouve.</Text>
              ) : (
                profiles.map(profile => (
                  <TouchableOpacity
                    key={profile.id}
                    className="mb-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4"
                    onPress={() => navigation.navigate('PublicProfile', { userId: profile.id })}
                  >
                    <Text className="text-base font-semibold text-white">
                      @{profile.username || 'utilisateur'}
                    </Text>
                    <Text className="mt-1 text-sm text-zinc-400">
                      {profile.full_name || profile.bio || 'Profil public'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}

              <Text className="mb-3 mt-2 text-xl font-bold text-white">Videos</Text>
              {videos.length === 0 ? (
                <Text className="text-sm text-zinc-500">Aucune video trouvee.</Text>
              ) : (
                videos.map(video => (
                  <TouchableOpacity
                    key={video.id}
                    className="mb-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4"
                    onPress={() => navigation.navigate('PublicProfile', { userId: video.user_id })}
                  >
                    <Text className="text-sm font-semibold text-zinc-300">
                      @{video.profiles?.username || 'createur'}
                    </Text>
                    <Text className="mt-1 text-base text-white">{video.caption || 'Sans legende'}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

export default DiscoverScreen;
