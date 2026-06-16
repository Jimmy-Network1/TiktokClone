import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Pressable, ActivityIndicator, Share, Vibration, Image, Modal, FlatList } from 'react-native';
import { Video } from 'react-native-video';
import { Heart, MessageCircle, Share2, Music2, Play, Pause, EyeOff, Bookmark } from 'lucide-react-native';
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
  runOnJS,
} from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const { height, width } = Dimensions.get('window');

interface VideoItemProps {
  video: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    userId: string;
    user: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    description: string;
    likes: { user_id: string }[];
    comments: { id: string }[];
    bookmarks?: { user_id: string }[];
    shares: string;
    cutStart?: number | null;
    cutEnd?: number | null;
  };
  isActive: boolean;
}

interface TapHeart {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

// Single Tap Heart Component for Reanimated floating hearts at precise coordinates
const FloatingHeart: React.FC<{ heart: TapHeart; onFinish: () => void }> = ({ heart, onFinish }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // 60 FPS animation sequence
    scale.value = withSpring(1.2, { damping: 10, stiffness: 150 });
    translateY.value = withTiming(-100, { duration: 800, easing: Easing.out(Easing.quad) });
    opacity.value = withDelay(400, withTiming(0, { duration: 400 }, () => {
      runOnJS(onFinish)();
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: heart.x - 40, // Center heart on tap coordinates
    top: heart.y - 40,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${heart.rotation}deg` }
    ],
    opacity: opacity.value,
  }));



  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <Heart color="#FE2C55" size={80} fill="#FE2C55" />
    </Animated.View>
  );
};

const viewedVideosThisSession = new Set<string>();

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive }) => {
  const { session } = useAuth();
  const { sendNotification } = useNotifications();
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [likes, setLikes] = useState(video.likes);
  const [bookmarks, setBookmarks] = useState(video.bookmarks || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [progress, setProgress] = useState(0);
  
  // Custom states for revolutionary features
  const [tapHearts, setTapHearts] = useState<TapHeart[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [userCollections, setUserCollections] = useState<any[]>([]);
  
  const lastTap = useRef<number>(0);
  const videoPlayerRef = useRef<any>(null);
  
  const rotation = useSharedValue(0);
  const pauseScale = useSharedValue(0);
  const pauseOpacity = useSharedValue(0);

  // Focus mode overlay animation opacity
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  useEffect(() => {
    if (isActive) {
      const isMockVideo = video.id.startsWith('mock-');
      if (isMockVideo) return;
      if (viewedVideosThisSession.has(video.id)) return;

      const timer = setTimeout(async () => {
        try {
          viewedVideosThisSession.add(video.id);
          await supabase.from('video_views').insert({
            video_id: video.id,
            user_id: session?.user?.id || null
          });
        } catch (error) {
          viewedVideosThisSession.delete(video.id);
          console.error('Error recording view:', error);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, video.id, session?.user?.id]);

  const diskStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pauseIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
    opacity: pauseOpacity.value,
  }));

  // Animated style for Focus Mode transition
  const focusOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocusMode ? 0 : 1, { duration: 300 }),
  }));

  const likedByCurrentUser = useMemo(
    () => !!session?.user && likes.some(item => item.user_id === session.user.id),
    [likes, session],
  );

  const bookmarkedByCurrentUser = useMemo(
    () => !!session?.user && bookmarks.some(item => item.user_id === session.user.id),
    [bookmarks, session],
  );

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const renderDescription = (description: string) => {
    if (!description) return null;
    const words = description.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('#') && word.length > 1) {
        const cleanHashtag = word.substring(1).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        return (
          <Text 
            key={index} 
            className="text-[#2AF5FF] font-bold"
            onPress={() => {
              navigation.navigate('Hashtag', { hashtag: cleanHashtag });
            }}
          >
            {word}
          </Text>
        );
      }
      return <Text key={index}>{word}</Text>;
    });
  };

  const triggerPauseAnimation = () => {
    pauseScale.value = 0.5;
    pauseOpacity.value = 0.8;
    pauseScale.value = withSpring(1.2, { damping: 12 });
    pauseOpacity.value = withDelay(300, withTiming(0, { duration: 200 }));
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

  const handleLike = async (isDoubleTap = false, tapX?: number, tapY?: number) => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const currentUserId = session.user.id;
    const isAddingLike = isDoubleTap || !likedByCurrentUser;

    // Trigger precise floating heart animation if double tapped
    if (isDoubleTap && tapX !== undefined && tapY !== undefined) {
      try {
        Vibration.vibrate(60);
      } catch (e) {}
      
      const newHeart: TapHeart = {
        id: Math.random().toString(),
        x: tapX,
        y: tapY,
        rotation: (Math.random() - 0.5) * 30, // Random rotation between -15deg and +15deg
      };
      setTapHearts((prev) => [...prev, newHeart]);
    }

    if (isDoubleTap && likedByCurrentUser) {
      return; // Already liked, just spawn the heart
    }

    const previousLikes = likes;
    const nextLikes = isAddingLike
      ? [...likes.filter(l => l.user_id !== currentUserId), { user_id: currentUserId }]
      : likes.filter(item => item.user_id !== currentUserId);

    setLikes(nextLikes);

    if (video.id.startsWith('mock-')) {
      return;
    }

    try {
      if (!isAddingLike) {
        await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('likes').upsert({ video_id: video.id, user_id: currentUserId }, { onConflict: 'video_id,user_id' });
        
        // Notify video owner
        sendNotification(video.userId, {
          type: 'like',
          title: 'Nouveau J\'aime !',
          message: `${session.user.email?.split('@')[0]} a aimé votre vidéo.`,
          data: { videoId: video.id }
        });
      }
    } catch (error) {
      setLikes(previousLikes);
    }
  };

  const handleBookmark = async (collectionId?: string) => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const currentUserId = session.user.id;
    const isAddingBookmark = !bookmarkedByCurrentUser || collectionId !== undefined;
    const previousBookmarks = bookmarks;

    // Optimistic update
    const nextBookmarks = isAddingBookmark
      ? [...bookmarks.filter(b => b.user_id !== currentUserId), { user_id: currentUserId }]
      : bookmarks.filter(item => item.user_id !== currentUserId);

    setBookmarks(nextBookmarks);
    setShowCollections(false);

    if (video.id.startsWith('mock-')) {
      try {
        Vibration.vibrate(10);
      } catch (e) {}
      return;
    }

    try {
      if (!isAddingBookmark) {
        await supabase.from('bookmarks').delete().eq('video_id', video.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('bookmarks').upsert({ 
          video_id: video.id, 
          user_id: currentUserId,
          collection_id: collectionId || null
        }, { onConflict: 'video_id,user_id' });
      }
      try {
        Vibration.vibrate(10);
      } catch (e) {}
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setBookmarks(previousBookmarks);
    }
  };

  const openCollectionPicker = async () => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }
    
    try {
      const { data } = await supabase.from('collections').select('*');
      setUserCollections(data || []);
      setShowCollections(true);
      try { Vibration.vibrate(20); } catch (e) {}
    } catch (err) {
      console.error(err);
    }
  };

  const handleTouch = (e: any) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    // Extract tap coordinates
    const { locationX, locationY } = e.nativeEvent;

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

  const handleLongPress = () => {
    // Toggle focus mode on long press
    setIsFocusMode((prev) => !prev);
    try {
      Vibration.vibrate(100);
    } catch (e) {}
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    if (video.cutStart && video.cutStart > 0) {
      videoPlayerRef.current?.seek(video.cutStart);
    }
  };

  return (
    <View style={{ height, width }} className="relative bg-black">
      <Pressable 
        onPress={handleTouch} 
        onLongPress={handleLongPress}
        style={StyleSheet.absoluteFill}
      >
        <Video
          ref={videoPlayerRef}
          source={{ uri: video.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat={!video.cutEnd}
          muted={false}
          paused={!isFocused || !isActive || isPaused}
          rate={playbackRate}
          onLoad={handleVideoLoad}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          bufferConfig={{
            minBufferMs: 2500,
            maxBufferMs: 5000,
            bufferForPlaybackMs: 1500,
            bufferForPlaybackAfterRebufferMs: 2000
          }}
          onProgress={({ currentTime, playableDuration }) => {
            if (playableDuration > 0) {
              const start = video.cutStart || 0;
              const end = video.cutEnd || playableDuration;
              const range = end - start;
              const currentProgress = (currentTime - start) / range;
              setProgress(Math.max(0, Math.min(1, currentProgress)));
            }

            if (video.cutEnd && currentTime >= video.cutEnd) {
              videoPlayerRef.current?.seek(video.cutStart || 0);
            }
          }}
          poster={video.thumbnailUrl || undefined}
          posterResizeMode="cover"
        />
      </Pressable>

      {/* Tap Floating Hearts container */}
      {tapHearts.map((heart) => (
        <FloatingHeart
          key={heart.id}
          heart={heart}
          onFinish={() => {
            setTapHearts((prev) => prev.filter((h) => h.id !== heart.id));
          }}
        />
      ))}

      {/* Focus Mode Toast notification */}
      {isFocusMode && (
        <View className="absolute top-24 self-center bg-black/60 px-4 py-2 rounded-full border border-white/10 flex-row items-center space-x-2">
          <EyeOff color="#FE2C55" size={14} />
          <Text className="text-white text-xs font-semibold">Mode Focus actif (Appui long pour quitter)</Text>
        </View>
      )}

      {/* Play/Pause indicator overlay */}
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

      {/* Right Side Buttons Panel */}
      <Animated.View 
        style={[focusOverlayStyle]} 
        className="absolute right-4 bottom-32 items-center space-y-7"
      >
        <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: video.userId })} className="mb-4">
           <View className="h-12 w-12 rounded-full border-2 border-white bg-zinc-800 items-center justify-center overflow-hidden">
              {video.avatarUrl ? (
                <Image source={{ uri: video.avatarUrl }} className="h-full w-full" />
              ) : (
                <Text className="text-white font-black text-base">{video.user.charAt(0).toUpperCase()}</Text>
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
          <Text className="text-white text-xs mt-1 font-bold">{formatCount(video.comments.length)}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="items-center" 
          onPress={() => handleBookmark()}
          onLongPress={openCollectionPicker}
        >
          <Bookmark color="white" size={35} fill={bookmarkedByCurrentUser ? '#FFB800' : 'rgba(255,255,255,0.9)'} />
          <Text className="text-white text-xs mt-1 font-bold">Favoris</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => Share.share({ message: `Regarde ça sur G4 ! \n\n${video.url}` })}>
          <Share2 color="white" size={35} fill="rgba(255,255,255,0.9)" />
          <Text className="text-white text-xs mt-1 font-bold">Partager</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Collection Picker Modal */}
      <Modal
        visible={showCollections}
        transparent
        animationType="slide"
      >
        <Pressable 
          style={StyleSheet.absoluteFill} 
          className="bg-black/60 justify-end"
          onPress={() => setShowCollections(false)}
        >
          <View className="bg-zinc-900 rounded-t-3xl p-6 min-h-[400px]">
             <View className="w-10 h-1 bg-zinc-800 rounded-full self-center mb-6" />
             <Text className="text-white text-xl font-bold mb-6">Ajouter à une collection</Text>
             
             {userCollections.length === 0 ? (
               <View className="flex-1 items-center justify-center">
                  <Text className="text-zinc-500 text-center mb-6">Vous n'avez pas encore de collections.</Text>
                  <TouchableOpacity 
                    className="bg-[#FE2C55] px-8 py-3 rounded-full"
                    onPress={() => {
                      setShowCollections(false);
                      navigation.navigate('Collections');
                    }}
                  >
                     <Text className="text-white font-bold">Créer une collection</Text>
                  </TouchableOpacity>
               </View>
             ) : (
               <FlatList
                 data={userCollections}
                 keyExtractor={item => item.id}
                 renderItem={({ item }) => (
                   <TouchableOpacity 
                     className="flex-row items-center py-4 border-b border-white/5"
                     onPress={() => handleBookmark(item.id)}
                   >
                      <View className="bg-zinc-800 p-3 rounded-xl mr-4">
                         <Folder color="white" size={20} />
                      </View>
                      <Text className="text-white text-lg font-medium">{item.name}</Text>
                   </TouchableOpacity>
                 )}
               />
             )}
          </View>
        </Pressable>
      </Modal>

      {/* Description & Music overlay */}
      <Animated.View 
        style={[focusOverlayStyle]} 
        className="absolute bottom-6 left-4 right-20"
      >
        <Text className="text-white font-bold text-lg mb-2">@{video.user}</Text>
        <Text className="text-white text-sm mb-4 leading-5" numberOfLines={3}>
          {renderDescription(video.description)}
        </Text>
        
        <View className="flex-row items-center space-x-2">
          <View className="flex-row items-center bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
            <Music2 color="#2AF5FF" size={14} />
            <View className="ml-2 overflow-hidden w-24">
               <Text className="text-white text-[11px] font-bold" numberOfLines={1}>
                 Son original - {video.user}
               </Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => {
              setPlaybackRate(prev => {
                if (prev === 1.0) return 1.5;
                if (prev === 1.5) return 2.0;
                if (prev === 2.0) return 0.5;
                return 1.0;
              });
              try { Vibration.vibrate(15); } catch (e) {}
            }}
            className="bg-black/30 px-3 py-1.5 rounded-full border border-white/10"
          >
            <Text className="text-[#2AF5FF] text-[11px] font-black tracking-wider">{playbackRate}x</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Disk Rotating Animation */}
      <Animated.View 
        style={[diskStyle, focusOverlayStyle]} 
        className="absolute bottom-6 right-4"
      >
        <View style={styles.diskContainer}>
           <View className="w-12 h-12 rounded-full bg-zinc-900 border-[6px] border-zinc-800 items-center justify-center">
              <View className="w-5 h-5 rounded-full bg-zinc-700 border-2 border-zinc-600" />
           </View>
        </View>
      </Animated.View>

      {/* Bottom video playback indicator bar */}
      <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <View 
          style={{ width: `${progress * 100}%` }} 
          className="h-full bg-[#FE2C55] opacity-90" 
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
    prevProps.isActive === nextProps.isActive &&
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.likes.length === nextProps.video.likes.length &&
    prevProps.video.comments.length === nextProps.video.comments.length &&
    prevProps.video.bookmarks?.length === nextProps.video.bookmarks?.length
  );
});
