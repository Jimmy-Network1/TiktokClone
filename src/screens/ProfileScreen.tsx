import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import AuthWall from '../components/AuthWall';
import { Play } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

interface ProfileScreenProps {}

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
  video_url: string;
  thumbnail_url?: string | null;
  likes: { id: string }[];
  comments: { id: string }[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      const [
        profileRes,
        videosRes,
        followersRes,
        followingRes,
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
            thumbnail_url,
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

      setProfile(profileRes.data as ProfileData || { id: session.user.id, username: 'G4_User', full_name: 'G4 Explorer', bio: '' });
      setVideos((videosRes.data as ProfileVideo[]) || []);
      setFollowersCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!session) {
    return (
      <AuthWall
        title="Profil réservé"
        message="Connectez-vous pour voir votre profil, gérer vos vidéos et vos abonnements."
        onPress={() => navigation.navigate('Auth')}
      />
    );
  }

  const renderHeader = () => (
    <View className="px-5 pb-6 pt-10 items-center">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border-2 border-[#FE2C55]">
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

      <View className="mt-6 flex-row space-x-2">
        <TouchableOpacity
          className="bg-zinc-900 border border-white/10 px-8 py-3 rounded-md"
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text className="text-white font-bold text-sm">Modifier le profil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-zinc-900 border border-white/10 p-3 rounded-md"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-white font-bold text-sm">Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {profile?.bio ? (
        <Text className="mt-4 text-sm text-zinc-400 text-center px-10">
          {profile.bio}
        </Text>
      ) : (
        <Text className="mt-4 text-xs text-zinc-600 italic">
          Aucune bio ajoutée
        </Text>
      )}

      {/* Tabs placeholder */}
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

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        refreshing={loading}
        onRefresh={loadProfile}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.4 }}
            className="border-[0.5px] border-black bg-zinc-900 overflow-hidden relative"
            onPress={() => navigation.navigate('Home', { initialVideoId: item.id })}
          >
            {/* Thumbnail placeholder if no real thumbnail */}
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
          !loading ? (
            <View className="py-20 items-center justify-center">
              <Text className="text-zinc-500 font-medium">Pas encore de vidéos.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
