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
import LiveScreen from '../screens/LiveScreen';
import UploadScreen from '../screens/UploadScreen';
import HashtagScreen from '../screens/HashtagScreen';
import StoryViewScreen from '../screens/StoryViewScreen';
import HostLiveScreen from '../screens/HostLiveScreen';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeIcon = ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />;
const DiscoverIcon = ({ color, size }: { color: string; size: number }) => <Search color={color} size={size} />;
const PlusIcon = ({ focused }: { focused: boolean }) => {
  return (
    <View style={{ 
      backgroundColor: focused ? '#FFF' : '#2AF5FF', 
      borderRadius: 10, 
      paddingHorizontal: 12, 
      paddingVertical: 4,
      transform: [{ scale: focused ? 1.1 : 1 }]
    }}>
      <PlusSquare color="#000" size={26} strokeWidth={2.5} />
    </View>
  );
};
const InboxIcon = ({ color, size }: { color: string; size: number }) => <MessageCircle color={color} size={size} />;
const ProfileIcon = ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />;

const PlusIconWrapper = ({ focused }: { focused: boolean }) => <PlusIcon focused={focused} />;

const MainTabs: React.FC<any> = ({ navigation }) => {
  const { session } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#000', 
          borderTopWidth: 0.5, 
          borderTopColor: '#222',
          height: 65, 
          paddingBottom: 10,
          paddingTop: 5
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
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
          tabBarLabel: 'Découvrir'
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: PlusIconWrapper,
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            if (!session?.user) {
              e.preventDefault();
              navigation.navigate('Auth');
            }
          },
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarIcon: InboxIcon,
          tabBarLabel: 'Boîte'
        }}
        listeners={{
          tabPress: (e) => {
            if (!session?.user) {
              e.preventDefault();
              navigation.navigate('Auth');
            }
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ProfileIcon,
          tabBarLabel: 'Profil'
        }}
        listeners={{
          tabPress: (e) => {
            if (!session?.user) {
              e.preventDefault();
              navigation.navigate('Auth');
            }
          },
        }}
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
      <Stack.Screen name="Live" component={LiveScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Hashtag" component={HashtagScreen} />
      <Stack.Screen name="HashtagFeed" component={FeedScreen} />
      <Stack.Screen 
        name="StoryView" 
        component={StoryViewScreen} 
        options={{ presentation: 'transparentModal', animation: 'fade' }} 
      />
      <Stack.Screen name="HostLive" component={HostLiveScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigation;
