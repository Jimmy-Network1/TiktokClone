import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import CommentsScreen from '../screens/CommentsScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import InboxScreen from '../screens/InboxScreen';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react-native';
import { Session } from '@supabase/supabase-js';
import { Text, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import UploadScreen from '../screens/UploadScreen';

const LockedPlaceholder = ({ title }: { title: string }) => (
  <View className="flex-1 items-center justify-center bg-black px-6">
    <Text className="text-2xl font-bold text-white">{title}</Text>
    <Text className="mt-3 text-center text-zinc-400">
      Cette section est reservee aux utilisateurs connectes.
    </Text>
  </View>
);

interface MainTabsProps {
  session: Session | null;
}

const MainTabs: React.FC<MainTabsProps> = ({ session }) => {
  const requireAuth = ({ navigation, preventDefault }: any) => {
    if (session?.user) {
      return;
    }

    preventDefault();
    navigation.navigate('Auth');
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen
        name="Home"
        children={() => <FeedScreen isGuest={!session?.user} session={session} />}
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Upload"
        children={() => <UploadScreen session={session} />}
        options={{
          tabBarIcon: ({ color }) => <PlusSquare color={color} size={32} />,
          tabBarLabel: () => null,
        }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tab.Screen
        name="Inbox"
        children={() => <InboxScreen session={session} />}
        options={{
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
        }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tab.Screen
        name="Profile"
        children={() => <ProfileScreen session={session} />}
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
        listeners={{ tabPress: requireAuth }}
      />
    </Tab.Navigator>
  );
};

interface RootNavigationProps {
  session: Session | null;
}

const RootNavigation: React.FC<RootNavigationProps> = ({ session }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">{() => <MainTabs session={session} />}</Stack.Screen>
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigation;
