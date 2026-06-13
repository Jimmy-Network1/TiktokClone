import React from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';

const STORIES_DATA = [
  { id: '1', username: 'Votre story', avatar: 'https://i.pravatar.cc/150?u=me', isLive: false, seen: false },
  { id: '2', username: 'tiktok_fr', avatar: 'https://i.pravatar.cc/150?u=t1', isLive: true, seen: false },
  { id: '3', username: 'g4_gaming', avatar: 'https://i.pravatar.cc/150?u=t2', isLive: false, seen: false },
  { id: '4', username: 'music_vibes', avatar: 'https://i.pravatar.cc/150?u=t3', isLive: false, seen: true },
  { id: '5', username: 'tech_insider', avatar: 'https://i.pravatar.cc/150?u=t4', isLive: true, seen: false },
  { id: '6', username: 'travel_bug', avatar: 'https://i.pravatar.cc/150?u=t5', isLive: false, seen: true },
];

const Stories: React.FC = () => {
  return (
    <View className="py-2 border-b border-zinc-900/50">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
        {STORIES_DATA.map((story) => (
          <TouchableOpacity key={story.id} className="items-center mr-4" activeOpacity={0.8}>
            <View className={`p-0.5 rounded-full ${story.seen ? 'border border-zinc-700' : 'border-2 border-[#FE2C55]'}`}>
              <View className="p-0.5 bg-black rounded-full">
                <Image 
                  source={{ uri: story.avatar }} 
                  className="w-16 h-16 rounded-full"
                />
              </View>
            </View>
            
            {story.isLive && (
              <View className="absolute top-14 bg-[#FE2C55] px-1.5 rounded border border-black">
                <Text className="text-[10px] text-white font-black">EN DIRECT</Text>
              </View>
            )}
            
            {story.id === '1' && (
              <View className="absolute right-0 top-11 bg-blue-500 rounded-full border-2 border-black w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">+</Text>
              </View>
            )}

            <Text className="text-white text-[11px] mt-1 font-medium w-16 text-center" numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Stories;
