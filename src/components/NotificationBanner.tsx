import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { Heart, MessageCircle, UserPlus, Info, X } from 'lucide-react-native';
import { AppNotification } from '../hooks/useNotifications';

const { width } = Dimensions.get('window');

interface Props {
  notification: AppNotification | null;
  onClear: () => void;
}

const NotificationBanner: React.FC<Props> = ({ notification, onClear }) => {
  const translateY = useSharedValue(-150);

  useEffect(() => {
    if (notification) {
      translateY.value = withSpring(0, { damping: 12 });
    } else {
      translateY.value = withTiming(-150);
    }
  }, [notification]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart color="#FE2C55" size={20} fill="#FE2C55" />;
      case 'comment': return <MessageCircle color="#2AF5FF" size={20} fill="#2AF5FF" />;
      case 'follow': return <UserPlus color="#FFF" size={20} />;
      default: return <Info color="#FFF" size={20} />;
    }
  };

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      className="absolute top-12 left-4 right-4 z-[999]"
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={onClear}
        className="bg-zinc-900/95 border border-white/10 rounded-2xl p-4 flex-row items-center shadow-2xl"
      >
        <View className="bg-black/50 p-2 rounded-full mr-3">
          {getIcon()}
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>{notification.title}</Text>
          <Text className="text-zinc-400 text-xs" numberOfLines={1}>{notification.message}</Text>
        </View>
        <TouchableOpacity onPress={onClear} className="ml-2 p-1">
          <X color="#52525b" size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
});

export default NotificationBanner;
