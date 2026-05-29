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
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={26} />,
          tabBarLabel: 'Accueil'
        }}
      >
        {(props) => <FeedScreen {...props} isGuest={!session?.user} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color }) => <Search color={color} size={26} />,
          tabBarLabel: 'Amis'
        }}
      />
      <Tab.Screen
        name="Upload"
        options={{
          tabBarIcon: () => (
            <View className="bg-white rounded-lg px-3 py-1 mt-1">
               <PlusSquare color="black" size={24} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{ tabPress: requireAuth }}
      >
        {(props) => <UploadScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Inbox"
        options={{
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={26} />,
          tabBarLabel: 'Boîte'
        }}
        listeners={{ tabPress: requireAuth }}
      >
        {(props) => <InboxScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={26} />,
          tabBarLabel: 'Profil'
        }}
        listeners={{ tabPress: requireAuth }}
      >
        {(props) => <ProfileScreen {...props} session={session} />}
      </Tab.Screen>
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
