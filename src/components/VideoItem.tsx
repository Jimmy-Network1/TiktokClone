import React, { useMemo, useState, useRef } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View, Pressable, ActivityIndicator, Share } from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';

const { height, width } = Dimensions.get('window');

interface VideoItemProps {
  video: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    userId: string;
    user: string;
    fullName?: string | null;
    description: string;
    likes: { user_id: string }[];
    comments: { id: string }[];
    shares: string;
  };
}

const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const { session } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [likes, setLikes] = useState(video.likes);
  const [isLoading, setIsLoading] = useState(true);
  const lastTap = useRef<number>(0);
  
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const likedByCurrentUser = useMemo(
    () => !!session?.user && likes.some(item => item.user_id === session.user.id),
    [likes, session],
  );

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const triggerHeartAnimation = () => {
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.5, { damping: 10, stiffness: 100 }),
      withDelay(500, withTiming(0, { duration: 200 }, () => {
        heartOpacity.value = 0;
      }))
    );
  };

  const handleLike = async (isDoubleTap = false) => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const currentUserId = session.user.id;
    
    // If double tap and already liked, just show animation
    if (isDoubleTap && likedByCurrentUser) {
      triggerHeartAnimation();
      return;
    }

    const previousLikes = likes;
    const isAddingLike = isDoubleTap || !likedByCurrentUser;

    const nextLikes = isAddingLike
      ? [...likes.filter(l => l.user_id !== currentUserId), { user_id: currentUserId }]
      : likes.filter(item => item.user_id !== currentUserId);

    setLikes(nextLikes);
    if (isAddingLike) triggerHeartAnimation();

    try {
      if (!isAddingLike) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', currentUserId);

        if (error) throw error;
      } else {
        // Use upsert or check existence to avoid unique constraint errors on double tap
        const { error } = await supabase.from('likes').upsert({
          video_id: video.id,
          user_id: currentUserId,
        }, { onConflict: 'video_id,user_id' });

        if (error) throw error;
      }
    } catch (error: any) {
      setLikes(previousLikes);
      // Silently fail for double tap if it was just a conflict
      if (!isDoubleTap) {
        Alert.alert('Erreur', error.message || "Impossible de mettre à jour le like.");
      }
    }
  };

  const handleTouch = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      handleLike(true);
    }
    lastTap.current = now;
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
    });
  };

  const handleProfilePress = () => {
    navigation.navigate('PublicProfile', {
      userId: video.userId,
    });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://tiktokclone.app/v/${video.id}`;
      await Share.share({
        message: `Regarde cette vidéo de @${video.user} sur G4 ! \n\n${shareUrl}`,
        url: video.url, // For iOS
      });
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={{ height, width }} className="relative bg-black">
      <Pressable onPress={handleTouch} style={StyleSheet.absoluteFill}>
        <Video
          source={{ uri: video.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat
          muted={false}
          paused={!isFocused}
          onLoad={() => setIsLoading(false)}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          poster={video.thumbnailUrl || undefined}
          posterResizeMode="cover"
          playInBackground={false}
          playWhenInactive={false}
        />
      </Pressable>

      {isLoading && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/20">
          <ActivityIndicator color="white" size="large" />
        </View>
      )}

      {/* Double Tap Heart Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
        <Animated.View style={animatedHeartStyle}>
          <Heart color="#FE2C55" size={100} fill="#FE2C55" />
        </Animated.View>
      </View>
      
      {/* Right Sidebar */}
      <View className="absolute right-4 bottom-32 items-center space-y-6">
        <TouchableOpacity className="items-center" onPress={() => handleLike(false)}>
          <View className="bg-white/10 p-2 rounded-full border border-white/10">
            <Heart color="white" size={30} fill={likedByCurrentUser ? '#FE2C55' : 'transparent'} />
          </View>
          <Text className="text-white text-xs mt-1 font-bold shadow-sm">{likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={handleCommentPress}>
          <View className="bg-white/10 p-2 rounded-full border border-white/10">
            <MessageCircle color="white" size={30} fill="white" />
          </View>
          <Text className="text-white text-xs mt-1 font-bold shadow-sm">{video.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={handleShare}>
          <View className="bg-white/10 p-2 rounded-full border border-white/10">
            <Share2 color="white" size={30} fill="white" />
          </View>
          <Text className="text-white text-xs mt-1 font-bold shadow-sm">{video.shares}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View className="absolute bottom-10 left-4 right-20">
        <TouchableOpacity onPress={handleProfilePress} className="flex-row items-center mb-2">
          <View className="h-9 w-9 rounded-full bg-zinc-800 border border-white/20 items-center justify-center mr-2">
             <Text className="text-white font-bold text-xs">{video.user.charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="text-white font-bold text-base shadow-lg">@{video.user}</Text>
        </TouchableOpacity>
        
        <Text className="text-white text-sm mb-4 leading-5 shadow-lg" numberOfLines={3}>
          {video.description}
        </Text>
        
        <View className="flex-row items-center">
          <Music2 color="white" size={14} />
          <View className="ml-2 overflow-hidden">
             <Text className="text-white text-xs font-medium">Son original - {video.user}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default VideoItem;
