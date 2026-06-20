import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Pressable, ActivityIndicator, Share, Image, Modal } from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Share2, Music2, Play, Pause, Bookmark, Folder } from 'lucide-react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
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
  video: any;
  isActive: boolean;
  shouldPreload?: boolean;
}

const VIDEO_BUFFER_CONFIG = {
  minBufferMs: 8000,
  maxBufferMs: 20000,
  bufferForPlaybackMs: 750,
  bufferForPlaybackAfterRebufferMs: 1500,
  backBufferDurationMs: 120000,
  cacheSizeMB: 256,
};

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive, shouldPreload = false }) => {
  const { session } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [likes, setLikes] = useState(video.likes || []);
  const [bookmarks, setBookmarks] = useState(video.bookmarks || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const lastTap = useRef<number>(0);
  const sourceUri = typeof video?.url === 'string' ? video.url.trim() : '';
  const thumbnailUri = typeof video?.thumbnailUrl === 'string' ? video.thumbnailUrl.trim() : '';
  const safeUsername = video?.user || 'G4_User';
  const shouldMountVideo = !!sourceUri && (isActive || shouldPreload);
  
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

  useEffect(() => {
    setPlaybackError(null);
    if (!shouldMountVideo) {
      setIsLoading(false);
      setProgress(0);
      return;
    }

    if (isActive) {
      setIsLoading(true);
    }
  }, [isActive, shouldMountVideo, sourceUri]);

  const diskStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pauseIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
    opacity: pauseOpacity.value,
  }));

  const likedByCurrentUser = useMemo(
    () => !!session?.user && likes.some((item: any) => item.user_id === session.user.id),
    [likes, session],
  );

  const bookmarkedByCurrentUser = useMemo(
    () => !!session?.user && bookmarks.some((item: any) => item.user_id === session.user.id),
    [bookmarks, session],
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
  };

  const handleLike = async (isDoubleTap = false, x = 0, y = 0) => {
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
      ? [...likes.filter((l: any) => l.user_id !== currentUserId), { user_id: currentUserId }]
      : likes.filter((item: any) => item.user_id !== currentUserId);

    setLikes(nextLikes);
    if (isAddingLike) triggerHeartAnimation();

    try {
      if (!isAddingLike) {
        await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('likes').upsert({ video_id: video.id, user_id: currentUserId }, { onConflict: 'video_id,user_id' });
      }
    } catch (e) {
      setLikes(previousLikes);
    }
  };

  const handleBookmark = async () => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }
    const currentUserId = session.user.id;
    const previousBookmarks = bookmarks;
    const isAddingBookmark = !bookmarkedByCurrentUser;

    const nextBookmarks = isAddingBookmark
      ? [...bookmarks.filter((b: any) => b.user_id !== currentUserId), { user_id: currentUserId }]
      : bookmarks.filter((item: any) => item.user_id !== currentUserId);

    setBookmarks(nextBookmarks);

    try {
      if (!isAddingBookmark) {
        await supabase.from('bookmarks').delete().eq('video_id', video.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('bookmarks').upsert({ video_id: video.id, user_id: currentUserId }, { onConflict: 'video_id,user_id' });
      }
    } catch (e) {
      setBookmarks(previousBookmarks);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://g4.app/v/${video.id}`;
      await Share.share({
        message: `Regarde cette vidéo de @${safeUsername} sur G4 ! \n\n${shareUrl}`,
      });
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  const handleTouch = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      handleLike(true, locationX, locationY);
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
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        {shouldMountVideo && (
          <Video
            source={{
              uri: sourceUri,
              minLoadRetryCount: 2,
              bufferConfig: VIDEO_BUFFER_CONFIG,
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            repeat
            muted={false}
            paused={!isFocused || !isActive || isPaused}
            onLoadStart={() => {
              if (isActive) setIsLoading(true);
            }}
            onLoad={() => {
              setPlaybackError(null);
              setIsLoading(false);
            }}
            onReadyForDisplay={() => setIsLoading(false)}
            onBuffer={({ isBuffering }) => {
              if (isActive) setIsLoading(isBuffering);
            }}
            onError={(error) => {
              console.error('Video playback error:', video?.id, error);
              setPlaybackError('Lecture impossible');
              setIsLoading(false);
            }}
            onProgress={({ currentTime, playableDuration }) => {
              if (playableDuration > 0) setProgress(currentTime / playableDuration);
            }}
            poster={thumbnailUri || undefined}
            posterResizeMode="cover"
            playInBackground={false}
            playWhenInactive={false}
            preventsDisplaySleepDuringVideoPlayback={isActive}
            progressUpdateInterval={250}
          />
        )}

        {!sourceUri && (
          <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-zinc-950">
            <Text className="text-zinc-500 text-sm font-semibold">Vidéo indisponible</Text>
          </View>
        )}
      </Pressable>

      <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
        <Animated.View style={[pauseIndicatorStyle, styles.overlayIcon]}>
          {isPaused ? <Pause color="white" size={60} fill="white" /> : <Play color="white" size={60} fill="white" />}
        </Animated.View>
      </View>

      {isActive && isLoading && !playbackError && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/20">
          <ActivityIndicator color="#2AF5FF" size="large" />
        </View>
      )}

      {isActive && playbackError && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/40 px-8">
          <Text className="text-white text-base font-bold text-center">{playbackError}</Text>
          <Text className="text-zinc-400 text-xs text-center mt-2">Passez à la vidéo suivante ou réessayez plus tard.</Text>
        </View>
      )}

      <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
        <Animated.View style={animatedHeartStyle}>
          <Heart color="#FE2C55" size={120} fill="#FE2C55" />
        </Animated.View>
      </View>
      
      <View className="absolute right-4 bottom-32 items-center space-y-7">
        <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: video.userId })} className="mb-4">
           <View className="h-12 w-12 rounded-full border-2 border-white bg-zinc-800 items-center justify-center overflow-hidden">
              {video.avatarUrl ? (
                <Image source={{ uri: video.avatarUrl }} className="h-full w-full" />
              ) : (
                <Text className="text-white font-black text-base">{safeUsername.charAt(0).toUpperCase()}</Text>
              )}
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
          <Text className="text-white text-xs mt-1 font-bold">{formatCount(video.comments?.length || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={handleBookmark}>
          <Bookmark color="white" size={35} fill={bookmarkedByCurrentUser ? '#FFB800' : 'rgba(255,255,255,0.9)'} />
          <Text className="text-white text-xs mt-1 font-bold">Favoris</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={handleShare}>
          <Share2 color="white" size={35} fill="rgba(255,255,255,0.9)" />
          <Text className="text-white text-xs mt-1 font-bold">Partager</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-6 left-4 right-20">
        <Text className="text-white font-bold text-lg mb-2">@{safeUsername}</Text>
        <Text className="text-white text-sm mb-4 leading-5" numberOfLines={3}>
          {video.description}
        </Text>
        
        <View className="flex-row items-center bg-black/30 self-start px-3 py-1.5 rounded-full border border-white/10">
          <Music2 color="#2AF5FF" size={14} />
          <View className="ml-2">
             <Text className="text-white text-[11px] font-bold">Son original - {safeUsername}</Text>
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

export default React.memo(VideoItem, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.shouldPreload === nextProps.shouldPreload
  );
});
