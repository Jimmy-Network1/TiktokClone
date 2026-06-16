import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import Video from 'react-native-video';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { StoryCreator } from '../components/Stories';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 secondes par story

const StoryViewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { creator } = route.params as { creator: StoryCreator };
  const stories = creator.stories;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const currentStory = stories[currentIndex];
  const progress = useSharedValue(0);
  const timerRef = useRef<any>(null);

  const startAnimation = () => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: STORY_DURATION,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(handleNext)();
      }
    });
  };

  useEffect(() => {
    if (!loading) {
      startAnimation();
    }
    return () => {
      progress.value = 0;
    };
  }, [currentIndex, loading]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setLoading(true);
      setCurrentIndex(prev => prev + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setLoading(true);
      setCurrentIndex(prev => prev - 1);
    } else {
      // Recommencer la première story
      setLoading(true);
      setCurrentIndex(0);
    }
  };

  const handleTap = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    // Si on clique à gauche du tiers de l'écran, on va à la story précédente
    if (x < width / 3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const progressStyle = (index: number) => {
    return useAnimatedStyle(() => {
      if (index < currentIndex) {
        return { width: '100%' };
      }
      if (index > currentIndex) {
        return { width: '0%' };
      }
      return {
        width: `${progress.value * 100}%`,
      };
    });
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container} className="bg-black">
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleTap} 
        style={StyleSheet.absoluteFill}
        className="justify-center items-center"
      >
        {currentStory.media_type === 'video' ? (
          <Video
            source={{ uri: currentStory.media_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            paused={loading}
            onLoad={() => setLoading(false)}
            onBuffer={({ isBuffering }) => setLoading(isBuffering)}
          />
        ) : (
          <Image
            source={{ uri: currentStory.media_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
          />
        )}
      </TouchableOpacity>

      {loading && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/30">
          <ActivityIndicator color="#FE2C55" size="large" />
        </View>
      )}

      {/* Barre de navigation haute */}
      <SafeAreaView style={styles.headerContainer} className="px-4 pt-4">
        {/* Lignes de progression de la Story */}
        <View className="flex-row space-x-1 mb-4">
          {stories.map((_, index) => (
            <View key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <Animated.View 
                style={[styles.progressIndicator, progressStyle(index)]} 
                className="bg-white h-full"
              />
            </View>
          ))}
        </View>

        {/* Info Utilisateur */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center overflow-hidden border border-white/10 mr-3">
              {creator.avatar_url ? (
                <Image source={{ uri: creator.avatar_url }} className="w-full h-full" />
              ) : (
                <Text className="text-white font-bold text-sm">{getInitials(creator.username)}</Text>
              )}
            </View>
            <View>
              <Text className="text-white font-bold text-sm">@{creator.username}</Text>
              <Text className="text-white/60 text-[9px] font-semibold">G4 Story</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="p-1 bg-black/30 rounded-full border border-white/5"
          >
            <X color="white" size={20} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingBottom: 12,
  },
  progressIndicator: {
    width: '0%',
  }
});

export default StoryViewScreen;
