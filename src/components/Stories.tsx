import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface StoryCreator {
  id: string;
  username: string;
  avatar_url: string | null;
  isLive: boolean;
  seen: boolean;
}

const Stories: React.FC = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [creators, setCreators] = useState<StoryCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorsForStories = async () => {
      try {
        setLoading(true);
        // Fetch top profiles to populate stories
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .limit(10);

        if (error) throw error;

        // Map profiles to stories format
        const mapped: StoryCreator[] = (profiles || []).map((p, index) => ({
          id: p.id,
          username: p.username || 'utilisateur',
          avatar_url: p.avatar_url,
          // Let's make some creators live to show the nice feature badge
          isLive: index === 1 || index === 4,
          seen: index > 5,
        }));

        // Filter out our own profile if present, we'll prepended it manually
        const filtered = mapped.filter(c => c.id !== session?.user?.id);
        setCreators(filtered);
      } catch (err) {
        console.error('Error fetching stories profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorsForStories();
  }, [session?.user?.id]);

  const handlePressStory = (creator: StoryCreator) => {
    if (creator.isLive) {
      navigation.navigate('Live');
    } else {
      navigation.navigate('PublicProfile', { userId: creator.id });
    }
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <View className="py-2 border-b border-zinc-950 bg-black/10">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
        {/* Own story button */}
        {session?.user && (
          <TouchableOpacity 
            className="items-center mr-4 relative" 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <View className="p-0.5 rounded-full border border-zinc-700">
              <View className="p-0.5 bg-zinc-900 rounded-full w-16 h-16 items-center justify-center border border-white/5">
                <Text className="text-white font-bold text-xl">
                   {getInitials(session.user.email?.split('@')[0] || 'M')}
                </Text>
              </View>
            </View>
            <View className="absolute right-0 top-11 bg-blue-500 rounded-full border-2 border-black w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-black">+</Text>
            </View>
            <Text className="text-zinc-400 text-[11px] mt-1 font-semibold w-16 text-center" numberOfLines={1}>
              Votre story
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View className="justify-center items-center h-20 w-20">
            <ActivityIndicator color="#FE2C55" size="small" />
          </View>
        ) : (
          creators.map((story) => (
            <TouchableOpacity 
              key={story.id} 
              className="items-center mr-4" 
              activeOpacity={0.8}
              onPress={() => handlePressStory(story)}
            >
              <View className={`p-0.5 rounded-full ${story.seen ? 'border border-zinc-800' : 'border-2 border-[#FE2C55]'}`}>
                <View className="p-0.5 bg-zinc-900 rounded-full w-16 h-16 items-center justify-center border border-white/5">
                  <Text className="text-white font-bold text-lg">
                    {getInitials(story.username)}
                  </Text>
                </View>
              </View>
              
              {story.isLive && (
                <View className="absolute top-14 bg-[#FE2C55] px-1.5 rounded border border-black">
                  <Text className="text-[8px] text-white font-black">EN DIRECT</Text>
                </View>
              )}

              <Text className="text-white text-[11px] mt-1 font-medium w-16 text-center" numberOfLines={1}>
                @{story.username}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default Stories;
