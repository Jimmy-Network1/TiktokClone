import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import AuthWall from '../components/AuthWall';

interface ProfileScreenProps {
  session: Session | null;
}

interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
}

interface ProfileVideo {
  id: string;
  caption: string | null;
  created_at: string;
  video_url?: string;
  likes: { id: string }[];
  comments: { id: string }[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ session }) => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      return;
    }

    try {
      setLoading(true);

      const [
        { data: profileData, error: profileError },
        { data: videosData, error: videosError },
        { count: followers, error: followersError },
        { count: following, error: followingError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, bio')
          .eq('id', session.user.id)
          .single(),
        supabase
          .from('videos')
          .select(`
            id,
            caption,
            created_at,
            video_url,
            likes (id),
            comments (id)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', session.user.id),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', session.user.id),
      ]);

      if (profileError) {
        throw profileError;
      }

      if (videosError) {
        throw videosError;
      }

      if (followersError) {
        throw followersError;
      }

      if (followingError) {
        throw followingError;
      }

      setProfile(profileData as ProfileData);
      setVideos((videosData as ProfileVideo[]) || []);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleDeleteVideo = async (videoId: string) => {
    Alert.alert('Supprimer cette video', 'Cette action est definitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const video = videos.find(item => item.id === videoId);
            if (video?.video_url) {
              const marker = '/storage/v1/object/public/videos/';
              const storagePath = video.video_url.includes(marker)
                ? video.video_url.split(marker)[1]
                : null;

              if (storagePath) {
                await supabase.storage.from('videos').remove([storagePath]);
              }
            }

            const { error } = await supabase.from('videos').delete().eq('id', videoId);
            if (error) {
              throw error;
            }

            setVideos(current => current.filter(video => video.id !== videoId));
          } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Suppression impossible.');
          }
        },
      },
    ]);
  };

  if (!session) {
    return (
      <AuthWall
        title="Profil reserve"
        message="Connectez-vous pour voir votre profil, vos informations et gerer votre compte."
        onPress={() => navigation.navigate('Auth')}
      />
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={loadProfile}
        contentContainerStyle={{ padding: 20, flexGrow: videos.length === 0 ? 1 : 0 }}
        ListHeaderComponent={
          <View className="mb-6 rounded-[32px] border border-white/10 bg-zinc-950 px-5 py-6">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-[#FE2C55]/15">
              <Text className="text-3xl font-bold text-white">
                {(profile?.username || profile?.full_name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text className="mt-5 text-3xl font-bold text-white">
              @{profile?.username || 'utilisateur'}
            </Text>
            {profile?.full_name ? (
              <Text className="mt-2 text-base font-medium text-zinc-300">{profile.full_name}</Text>
            ) : null}
            <Text className="mt-3 text-sm leading-6 text-zinc-400">
              {profile?.bio || 'Ajoutez une bio pour personnaliser votre profil.'}
            </Text>

            <View className="mt-6 flex-row">
              <View className="mr-4 flex-1 rounded-[24px] border border-white/10 bg-black px-4 py-4">
                <Text className="text-2xl font-bold text-white">{videos.length}</Text>
                <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Videos</Text>
              </View>
              <View className="mr-4 flex-1 rounded-[24px] border border-white/10 bg-black px-4 py-4">
                <Text className="text-2xl font-bold text-white">{followersCount}</Text>
                <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Abonnes</Text>
              </View>
              <View className="flex-1 rounded-[24px] border border-white/10 bg-black px-4 py-4">
                <Text className="text-2xl font-bold text-white">{followingCount}</Text>
                <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Abonnements</Text>
              </View>
            </View>

            <TouchableOpacity
              className="mt-6 rounded-2xl bg-[#25F4EE] px-5 py-4 items-center"
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text className="font-bold text-black">Modifier le profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-3 rounded-2xl border border-white/10 px-5 py-4 items-center"
              onPress={() => supabase.auth.signOut()}
            >
              <Text className="font-bold text-white">Se deconnecter</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-10">
              <Text className="text-xl font-bold text-white">Aucune video publiee</Text>
              <Text className="mt-2 text-center text-zinc-400">
                Votre profil est pret, il ne manque plus que votre premiere publication.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="mb-4 rounded-[28px] border border-white/10 bg-zinc-950 px-4 py-4">
            <Text className="text-base font-semibold text-white">{item.caption || 'Sans legende'}</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row">
                <Text className="mr-4 text-sm text-zinc-400">{item.likes.length} j'aime</Text>
                <Text className="text-sm text-zinc-400">{item.comments.length} commentaires</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteVideo(item.id)}>
                <Text className="text-sm font-bold text-[#FE2C55]">Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default ProfileScreen;
