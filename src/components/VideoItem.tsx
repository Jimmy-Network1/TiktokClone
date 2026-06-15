import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Pressable, ActivityIndicator, Share, Vibration } from 'react-native';
import { Video } from 'react-native-video';
import { Heart, MessageCircle, Share2, Music2, Play, Pause } from 'lucide-react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
// import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay,
  withTiming,
  withRepeat,
  Easing,
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
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastTap = useRef<number>(0);
  
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const pauseScale = useSharedValue(0);
  const pauseOpacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const diskStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pauseIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
    opacity: pauseOpacity.value,
  }));

  const likedByCurrentUser = useMemo(
    () => !!session?.user && likes.some(item => item.user_id === session.user.id),
    [likes, session],
  );

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const triggerPauseAnimation = () => {
    pauseScale.value = 0.5;
    pauseOpacity.value = 0.8;
    pauseScale.value = withSpring(1.2, { damping: 12 });
    pauseOpacity.value = withDelay(300, withTiming(0, { duration: 200 }));
  };

  const triggerHeartAnimation = () => {
    try {
      Vibration.vibrate(50);
    } catch (e) {}
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.5, { damping: 10, stiffness: 100 }),
      withDelay(500, withTiming(0, { duration: 200 }, () => {
        heartOpacity.value = 0;
      }))
    );
  };

  const togglePlayPause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    triggerPauseAnimation();
    try {
      Vibration.vibrate(10);
    } catch {
      // Ignore vibration error
    }
  };

  const handleLike = async (isDoubleTap = false) => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const currentUserId = session.user.id;
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
    else {
      try {
        Vibration.vibrate(20);
      } catch {
        // Ignore
      }
    }

    try {
      if (!isAddingLike) {
        await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('likes').upsert({ video_id: video.id, user_id: currentUserId }, { onConflict: 'video_id,user_id' });
      }
    } catch {
      setLikes(previousLikes);
    }
  };

  const handleTouch = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      handleLike(true);
    } else {
      setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_PRESS_DELAY) {
          togglePlayPause();
        }
      }, DOUBLE_PRESS_DELAY);
    }
    lastTap.current = now;
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <View style={{ height, width }} className="relative bg-black">
      <Pressable onPress={handleTouch} style={StyleSheet.absoluteFill}>
        <Video
          source={{ uri: video.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat
          muted={false}
          paused={!isFocused || isPaused}
          onLoad={() => setIsLoading(false)}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          onProgress={({ currentTime, playableDuration }) => {
            if (playableDuration > 0) setProgress(currentTime / playableDuration);
          }}
          poster={video.thumbnailUrl || undefined}
          posterResizeMode="cover"
        />
      </Pressable>

      <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
        <Animated.View style={[pauseIndicatorStyle, styles.overlayIcon]}>
          {isPaused ? <Pause color="white" size={60} fill="white" /> : <Play color="white" size={60} fill="white" />}
        </Animated.View>
      </View>

      {isLoading && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/20">
          <ActivityIndicator color="#2AF5FF" size="large" />
        </View>
      )}

      <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
        <Animated.View style={animatedHeartStyle}>
          <Heart color="#FE2C55" size={120} fill="#FE2C55" />
        </Animated.View>
      </View>
      
      <View className="absolute right-4 bottom-32 items-center space-y-7">
        <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: video.userId })} className="mb-4">
           <View className="h-12 w-12 rounded-full border-2 border-white bg-zinc-800 items-center justify-center">
              <Text className="text-white font-black text-base">{video.user.charAt(0).toUpperCase()}</Text>
           </View>
           <View className="absolute -bottom-2 self-center bg-[#FE2C55] rounded-full w-5 h-5 items-center justify-center border-2 border-black">
              <Text className="text-white font-bold text-xs">+</Text>
           </View>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => handleLike(false)}>
          <Heart color="white" size={35} fill={likedByCurrentUser ? '#FE2C55' : 'rgba(255,255,255,0.9)'} />
          <Text className="text-white text-xs mt-1 font-bold">{formatCount(likes.length)}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => navigation.navigate('Comments', { videoId: video.id })}>
          <MessageCircle color="white" size={35} fill="rgba(255,255,255,0.9)" />
          <Text className="text-white text-xs mt-1 font-bold">{formatCount(video.comments.length)}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => Share.share({ message: `Regarde ça sur G4 ! \n\n${video.url}` })}>
          <Share2 color="white" size={35} fill="rgba(255,255,255,0.9)" />
          <Text className="text-white text-xs mt-1 font-bold">Partager</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-6 left-4 right-20">
        <Text className="text-white font-bold text-lg mb-2">@{video.user}</Text>
        <Text className="text-white text-sm mb-4 leading-5" numberOfLines={3}>
          {video.description}
        </Text>
        
        <View className="flex-row items-center bg-black/30 self-start px-3 py-1.5 rounded-full border border-white/10">
          <Music2 color="#2AF5FF" size={14} />
          <View className="ml-2">
             <Text className="text-white text-[11px] font-bold">Son original - {video.user}</Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-6 right-4">
        <Animated.View style={[diskStyle, styles.diskContainer]}>
           <View className="w-12 h-12 rounded-full bg-zinc-900 border-[6px] border-zinc-800 items-center justify-center">
              <View className="w-5 h-5 rounded-full bg-zinc-700 border-2 border-zinc-600" />
           </View>
        </Animated.View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <View 
          style={{ width: `${progress * 100}%` }} 
          className="h-full bg-white opacity-80" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  diskContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  overlayIcon: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 20,
    borderRadius: 100,
  }
});

export default VideoItem;
