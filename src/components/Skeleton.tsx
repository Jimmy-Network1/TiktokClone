import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = 4, className }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          opacity,
          backgroundColor: '#27272a', // zinc-800
        },
      ]}
      className={className}
    />
  );
};

export const VideoSkeleton = () => (
  <View style={StyleSheet.absoluteFill} className="bg-black justify-end p-5">
    <View className="flex-row items-end">
      <View className="flex-1">
        <Skeleton width="60%" height={20} className="mb-3" />
        <Skeleton width="40%" height={15} className="mb-2" />
        <Skeleton width="80%" height={15} className="mb-10" />
      </View>
      <View className="items-center space-y-6 mb-10">
        <Skeleton width={50} height={50} borderRadius={25} />
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
    </View>
  </View>
);

export const ProfileSkeleton = () => (
  <View className="flex-1 bg-black p-5">
    <View className="items-center mt-10">
      <Skeleton width={100} height={100} borderRadius={50} />
      <Skeleton width={150} height={25} className="mt-4" />
      <View className="flex-row mt-6 space-x-8">
        <Skeleton width={60} height={40} />
        <Skeleton width={60} height={40} />
        <Skeleton width={60} height={40} />
      </View>
      <Skeleton width="80%" height={40} borderRadius={8} className="mt-8" />
    </View>
    <View className="flex-row flex-wrap mt-10">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={{ width: '33.33%', padding: 1 }}>
          <Skeleton width="100%" height={180} borderRadius={0} />
        </View>
      ))}
    </View>
  </View>
);

export default Skeleton;
