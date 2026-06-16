import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { launchImageLibrary } from 'react-native-image-picker';

export interface StoryItem {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
}

export interface StoryCreator {
  id: string; // user_id
  username: string;
  avatar_url: string | null;
  isLive: boolean;
  seen: boolean;
  stories: StoryItem[];
}

const Stories: React.FC = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [creators, setCreators] = useState<StoryCreator[]>([]);
  const [ownStories, setOwnStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingStory, setUploadingStory] = useState(false);

  const fetchCreatorsForStories = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 1. Récupérer les stories réelles
      const { data: dbStories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          media_url,
          media_type,
          user_id,
          created_at,
          profiles (username, avatar_url)
        `)
        .gt('created_at', yesterday)
        .order('created_at', { ascending: true });

      if (storiesError) throw storiesError;

      // Regrouper par user_id
      const groupsMap = new Map<string, StoryCreator>();
      
      (dbStories || []).forEach((s: any) => {
        const userId = s.user_id;
        const profile = s.profiles;
        const storyItem: StoryItem = {
          id: s.id,
          media_url: s.media_url,
          media_type: s.media_type,
          created_at: s.created_at
        };

        if (groupsMap.has(userId)) {
          groupsMap.get(userId)!.stories.push(storyItem);
        } else {
          groupsMap.set(userId, {
            id: userId,
            username: profile?.username || 'utilisateur',
            avatar_url: profile?.avatar_url || null,
            isLive: false,
            seen: false,
            stories: [storyItem]
          });
        }
      });

      const realCreators = Array.from(groupsMap.values());

      // 2. Récupérer des profils mockés en compléments (pour le design premium)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .limit(10);

      const mockCreators: StoryCreator[] = [];
      if (!profilesError && profiles) {
        profiles.forEach((p, index) => {
          if (p.id !== session?.user?.id && !groupsMap.has(p.id)) {
            mockCreators.push({
              id: p.id,
              username: p.username || 'utilisateur',
              avatar_url: p.avatar_url,
              isLive: index === 1 || index === 4,
              seen: index > 5,
              stories: [
                {
                  id: `mock-story-${p.id}`,
                  media_url: index % 2 === 0 
                    ? 'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500'
                    : 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
                  media_type: 'image',
                  created_at: new Date().toISOString()
                }
              ]
            });
          }
        });
      }

      // Fusionner les vrais créateurs et les mocks (vrais en premier)
      const allCreators = [...realCreators, ...mockCreators].filter(c => c.id !== session?.user?.id);
      
      // Stocker notre propre groupe de stories
      const ownGroup = realCreators.find(c => c.id === session?.user?.id);
      setOwnStories(ownGroup?.stories || []);

      setCreators(allCreators);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCreatorsForStories();
    }, [session?.user?.id])
  );

  const handleCreateStory = async () => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'mixed',
      quality: 0.8,
    });

    if (result.assets && result.assets[0].uri) {
      const asset = result.assets[0];
      const isVideo = asset.type?.startsWith('video/') || asset.uri.endsWith('.mp4');
      const ext = isVideo ? 'mp4' : 'jpg';
      const fileName = `story-${session.user.id}-${Date.now()}.${ext}`;
      
      setUploadingStory(true);
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(fileName, blob, {
            contentType: isVideo ? 'video/mp4' : 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName);

        // Insérer l'enregistrement en DB
        const { error: insertError } = await supabase
          .from('stories')
          .insert({
            user_id: session.user.id,
            media_url: publicUrl,
            media_type: isVideo ? 'video' : 'image',
          });

        if (insertError) throw insertError;

        Alert.alert('Succès', 'Votre story a été publiée avec succès !');
        fetchCreatorsForStories();
      } catch (err: any) {
        console.error('Story publication error:', err);
        Alert.alert('Erreur', `Impossible de publier la story : ${err.message || String(err)}`);
      } finally {
        setUploadingStory(false);
      }
    }
  };

  const handlePressStory = (creator: StoryCreator) => {
    if (creator.isLive) {
      navigation.navigate('Live');
    } else {
      navigation.navigate('StoryView', { creator });
    }
  };

  const handlePressOwnStory = () => {
    if (ownStories.length > 0) {
      const username = session?.user?.email?.split('@')[0] || 'utilisateur';
      navigation.navigate('StoryView', {
        creator: {
          id: session?.user?.id,
          username: username,
          avatar_url: null,
          isLive: false,
          seen: false,
          stories: ownStories
        }
      });
    } else {
      handleCreateStory();
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
          <View className="mr-4 items-center">
            <TouchableOpacity 
              className="items-center relative" 
              activeOpacity={0.8}
              onPress={handlePressOwnStory}
            >
              <View className={`p-0.5 rounded-full ${ownStories.length > 0 ? 'border-2 border-[#2AF5FF]' : 'border border-zinc-700'}`}>
                <View className="p-0.5 bg-zinc-900 rounded-full w-16 h-16 items-center justify-center border border-white/5">
                  {uploadingStory ? (
                    <ActivityIndicator color="#2AF5FF" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-xl">
                       {getInitials(session.user.email?.split('@')[0] || 'M')}
                    </Text>
                  )}
                </View>
              </View>
              {ownStories.length === 0 && (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleCreateStory}
                  className="absolute right-0 top-11 bg-blue-500 rounded-full border-2 border-black w-5 h-5 items-center justify-center"
                >
                  <Text className="text-white text-xs font-black">+</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <Text className="text-zinc-400 text-[11px] mt-1 font-semibold w-16 text-center" numberOfLines={1}>
              Votre story
            </Text>
          </View>
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
