import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const { height, width } = Dimensions.get('window');

interface VideoItemProps {
  video: {
    id: string;
    url: string;
    userId: string;
    user: string;
    fullName?: string | null;
    description: string;
    likes: { user_id: string }[];
    comments: { id: string }[];
    shares: string;
  };
  session: Session | null;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, session }) => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [likes, setLikes] = useState(video.likes);
  const likedByCurrentUser = useMemo(
    () => !!session?.user && likes.some(item => item.user_id === session.user.id),
    [likes, session],
  );

  const handleLike = async () => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const currentUserId = session.user.id;
    const previousLikes = likes;
    const nextLikes = likedByCurrentUser
      ? likes.filter(item => item.user_id !== currentUserId)
      : [...likes, { user_id: currentUserId }];

    setLikes(nextLikes);

    try {
      if (likedByCurrentUser) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', currentUserId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('likes').insert({
          video_id: video.id,
          user_id: currentUserId,
        });

        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      setLikes(previousLikes);
      Alert.alert('Erreur', error.message || "Impossible de mettre a jour le like.");
    }
  };

  const handleCommentPress = () => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    navigation.navigate('Comments', {
      videoId: video.id,
      caption: video.description,
      ownerUsername: video.user,
      session,
    });
  };

  const handleProfilePress = () => {
    navigation.navigate('PublicProfile', {
      userId: video.userId,
    });
  };

  return (
    <View style={{ height, width }} className="relative bg-black">
      <Video
        source={{ uri: video.url }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted={false}
        paused={!isFocused}
      />
      
      {/* Right Sidebar */}
      <View className="absolute right-4 bottom-32 items-center space-y-6">
        <TouchableOpacity className="items-center" onPress={handleLike}>
          <View className="bg-white/20 p-2 rounded-full">
            <Heart color="white" size={30} fill={likedByCurrentUser ? '#FE2C55' : 'white'} />
          </View>
          <Text className="text-white text-xs mt-1 font-bold">{likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={handleCommentPress}>
          <View className="bg-white/20 p-2 rounded-full">
            <MessageCircle color="white" size={30} fill="white" />
          </View>
          <Text className="text-white text-xs mt-1 font-bold">{video.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <View className="bg-white/20 p-2 rounded-full">
            <Share2 color="white" size={30} fill="white" />
          </View>
          <Text className="text-white text-xs mt-1 font-bold">{video.shares}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View className="absolute bottom-8 left-4 right-20">
        <TouchableOpacity onPress={handleProfilePress}>
          <Text className="text-white font-bold text-lg mb-1">@{video.user}</Text>
          {video.fullName ? (
            <Text className="mb-2 text-xs font-medium text-zinc-300">{video.fullName}</Text>
          ) : (
            <View className="mb-2" />
          )}
        </TouchableOpacity>
        <Text className="text-white text-base mb-4" numberOfLines={2}>
          {video.description}
        </Text>
        <View className="flex-row items-center">
          <Music2 color="white" size={16} />
          <Text className="text-white text-sm ml-2">Original Sound - {video.user}</Text>
        </View>
      </View>
    </View>
  );
};

export default VideoItem;
