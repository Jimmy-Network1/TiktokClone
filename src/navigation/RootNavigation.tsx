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
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import UploadScreen from '../screens/UploadScreen';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeIcon = ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />;
const DiscoverIcon = ({ color, size }: { color: string; size: number }) => <Search color={color} size={size} />;
const PlusIcon = () => (
  <View className="bg-white rounded-lg px-3 py-1">
    <PlusSquare color="#000" size={24} />
  </View>
);
const InboxIcon = ({ color, size }: { color: string; size: number }) => <MessageCircle color={color} size={size} />;
const ProfileIcon = ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />;

const MainTabs: React.FC = () => {
  const { session } = useAuth();

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
        component={FeedScreen}
        options={{
          tabBarIcon: HomeIcon,
          tabBarLabel: 'Accueil'
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: DiscoverIcon,
          tabBarLabel: 'Amis'
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: PlusIcon,
          tabBarLabel: () => null,
        }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarIcon: InboxIcon,
          tabBarLabel: 'Boîte'
        }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ProfileIcon,
          tabBarLabel: 'Profil'
        }}
        listeners={{ tabPress: requireAuth }}
      />
    </Tab.Navigator>
  );
};

const RootNavigation: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
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
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigation;
