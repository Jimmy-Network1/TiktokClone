import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Play, ChevronLeft, MessageCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

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
        { count: followers },
        { count: following },
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

      if (profileError) throw profileError;
      if (videosError) throw videosError;

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

        if (followStateError) throw followStateError;
        setIsFollowing(!!followRow);
      }
    } catch {
      console.error('Public profile load error');
      Alert.alert('Erreur', 'Impossible de charger ce profil.');
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

    if (currentUserId === userId) return;

    const previousState = isFollowing;
    setFollowBusy(true);
    setIsFollowing(!previousState);
    setFollowersCount(count => (previousState ? Math.max(0, count - 1) : count + 1));

    try {
      if (previousState) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
      } else {
        await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: userId,
        });
      }
    } catch {
      setIsFollowing(previousState);
      setFollowersCount(count => (previousState ? count + 1 : Math.max(0, count - 1)));
      Alert.alert('Erreur', "L'action a échoué.");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessagePress = async () => {
    if (!currentUserId) {
      navigation.navigate('Auth');
      return;
    }

    if (currentUserId === userId) return;

    try {
      // 1. Check if conversation already exists
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (partError) throw partError;

      const myConvIds = participations.map(p => p.conversation_id);

      const { data: commonConv, error: commonError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', myConvIds)
        .eq('user_id', userId)
        .maybeSingle();

      if (commonError) throw commonError;

      if (commonConv) {
        // Conversation exists
        navigation.navigate('Chat', { 
          conversationId: commonConv.conversation_id, 
          otherUser: profile 
        });
      } else {
        // Create new conversation
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (newConvError) throw newConvError;

        // Add both participants
        const { error: partAddError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConv.id, user_id: currentUserId },
            { conversation_id: newConv.id, user_id: userId }
          ]);

        if (partAddError) throw partAddError;

        navigation.navigate('Chat', { 
          conversationId: newConv.id, 
          otherUser: profile 
        });
      }
    } catch {
      console.error('Error starting chat');
      Alert.alert('Erreur', 'Impossible de démarrer la conversation.');
    }
  };

  const renderHeader = () => (
    <View className="items-center px-5 pb-6 pt-6">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border-2 border-[#25F4EE]">
        <Text className="text-3xl font-bold text-white">
          {(profile?.username || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text className="mt-4 text-xl font-bold text-white">
        @{profile?.username || 'utilisateur'}
      </Text>

      <View className="mt-6 flex-row items-center justify-center space-x-8">
        <View className="items-center px-4">
           <Text className="text-lg font-bold text-white">{followingCount}</Text>
           <Text className="text-xs text-zinc-500 font-medium uppercase tracking-tighter">Abonnements</Text>
        </View>
        <View className="items-center px-4">
           <Text className="text-lg font-bold text-white">{followersCount}</Text>
           <Text className="text-xs text-zinc-500 font-medium uppercase tracking-tighter">Abonnés</Text>
        </View>
        <View className="items-center px-4">
           <Text className="text-lg font-bold text-white">{videos.length}</Text>
           <Text className="text-xs text-zinc-500 font-medium uppercase tracking-tighter">J'aime</Text>
        </View>
      </View>

      {currentUserId !== userId && (
        <View className="flex-row mt-6 space-x-2">
          <TouchableOpacity
            className={`w-40 rounded-md py-3 items-center ${
              isFollowing ? 'bg-zinc-900 border border-white/10' : 'bg-[#FE2C55]'
            }`}
            disabled={followBusy}
            onPress={handleToggleFollow}
          >
            <Text className="text-white font-bold text-sm">
              {isFollowing ? 'Abonné' : "S'abonner"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="w-12 rounded-md bg-zinc-900 border border-white/10 py-3 items-center justify-center"
            onPress={handleMessagePress}
          >
            <MessageCircle color="white" size={20} />
          </TouchableOpacity>
        </View>
      )}

      {profile?.bio && (
        <Text className="mt-4 text-sm text-zinc-400 text-center px-10">
          {profile.bio}
        </Text>
      )}

      <View className="mt-8 w-full border-t border-white/5 flex-row">
         <View className="flex-1 items-center py-3 border-b-2 border-white">
            <Play color="white" size={20} />
         </View>
         <View className="flex-1 items-center py-3">
            <Text className="text-zinc-600">🔒</Text>
         </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-2 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text className="text-white font-bold text-base">
           {profile?.username || 'Profil'}
        </Text>
        <View className="w-7" />
      </View>

      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.4 }}
            className="border-[0.5px] border-black bg-zinc-900 overflow-hidden relative"
            onPress={() => navigation.navigate('Home', { initialVideoId: item.id })}
          >
            <View className="flex-1 items-center justify-center">
               <Play color="rgba(255,255,255,0.2)" size={40} />
            </View>
            <View className="absolute bottom-1 left-1 flex-row items-center">
               <Play color="white" size={12} />
               <Text className="text-white text-[10px] font-bold ml-1">
                  {item.likes.length}
               </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Text className="text-zinc-500 font-medium">Aucune vidéo publiée.</Text>
          </View>
        }
      />
    </View>
  );
};

export default PublicProfileScreen;
