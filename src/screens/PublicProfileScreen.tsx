import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
}

interface ProfileVideo {
  id: string;
  caption: string | null;
  created_at: string;
  likes: { id: string }[];
  comments: { id: string }[];
}

interface PublicProfileRouteParams {
  userId: string;
}

const PublicProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { userId } = route.params as PublicProfileRouteParams;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const viewerId = sessionData.session?.user?.id ?? null;
      setCurrentUserId(viewerId);

      const [
        { data: profileData, error: profileError },
        { data: videosData, error: videosError },
        { count: followers, error: followersError },
        { count: following, error: followingError },
      ] = await Promise.all([
        supabase.from('profiles').select('id, username, full_name, bio').eq('id', userId).single(),
        supabase
          .from('videos')
          .select(`
            id,
            caption,
            created_at,
            likes (id),
            comments (id)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
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

      setProfile(profileData as PublicProfile);
      setVideos((videosData as ProfileVideo[]) || []);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      if (viewerId && viewerId !== userId) {
        const { data: followRow, error: followStateError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', viewerId)
          .eq('following_id', userId)
          .maybeSingle();

        if (followStateError) {
          throw followStateError;
        }

        setIsFollowing(!!followRow);
      } else {
        setIsFollowing(false);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de charger ce profil.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      navigation.navigate('Auth');
      return;
    }

    if (currentUserId === userId) {
      return;
    }

    const previousState = isFollowing;
    setFollowBusy(true);
    setIsFollowing(!previousState);
    setFollowersCount(count => (previousState ? Math.max(0, count - 1) : count + 1));

    try {
      if (previousState) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: userId,
        });

        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      setIsFollowing(previousState);
      setFollowersCount(count => (previousState ? count + 1 : Math.max(0, count - 1)));
      Alert.alert('Erreur', error.message || "Impossible de modifier l'abonnement.");
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="border-b border-white/10 px-5 pb-6 pt-14">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-sm font-bold text-zinc-400">Retour</Text>
        </TouchableOpacity>

        <View className="mt-6 h-24 w-24 items-center justify-center rounded-full bg-[#25F4EE]/15">
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
          {profile?.bio || "Ce createur n'a pas encore ajoute de bio."}
        </Text>

        {currentUserId !== userId ? (
          <TouchableOpacity
            className={`mt-5 rounded-2xl px-5 py-3 items-center ${
              isFollowing ? 'border border-white/20 bg-transparent' : 'bg-[#FE2C55]'
            }`}
            disabled={followBusy}
            onPress={handleToggleFollow}
          >
            <Text className={`font-bold ${isFollowing ? 'text-white' : 'text-white'}`}>
              {isFollowing ? 'Abonne' : "S'abonner"}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View className="mt-6 flex-row rounded-[28px] border border-white/10 bg-zinc-950 px-4 py-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">{videos.length}</Text>
            <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Videos</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">{followersCount}</Text>
            <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Abonnes</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">{followingCount}</Text>
            <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Abonnements</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, flexGrow: videos.length === 0 ? 1 : 0 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-10">
            <Text className="text-xl font-bold text-white">Aucune video publiee</Text>
            <Text className="mt-2 text-center text-zinc-400">
              Ce profil n'a pas encore partage de contenu.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-4 rounded-[28px] border border-white/10 bg-zinc-950 px-4 py-4">
            <Text className="text-base font-semibold text-white">{item.caption || 'Sans legende'}</Text>
            <View className="mt-3 flex-row">
              <Text className="mr-4 text-sm text-zinc-400">{item.likes.length} j'aime</Text>
              <Text className="text-sm text-zinc-400">{item.comments.length} commentaires</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default PublicProfileScreen;
