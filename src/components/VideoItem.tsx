import React from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

interface VideoItemProps {
  video: {
    id: string;
    url: string;
    user: string;
    description: string;
    likes: string;
    comments: string;
    shares: string;
  };
}

const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const isFocused = useIsFocused();

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
        <TouchableOpacity className="items-center">
          <View className="bg-white/20 p-2 rounded-full">
            <Heart color="white" size={30} fill="white" />
          </View>
          <Text className="text-white text-xs mt-1 font-bold">{video.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <View className="bg-white/20 p-2 rounded-full">
            <MessageCircle color="white" size={30} fill="white" />
          </View>
          <Text className="text-white text-xs mt-1 font-bold">{video.comments}</Text>
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
        <Text className="text-white font-bold text-lg mb-2">@{video.user}</Text>
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
