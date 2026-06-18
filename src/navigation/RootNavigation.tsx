import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeIcon = ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />;
const DiscoverIcon = ({ color, size }: { color: string; size: number }) => <Search color={color} size={size} />;
const InboxIcon = ({ color, size }: { color: string; size: number }) => <MessageCircle color={color} size={size} />;
const ProfileIcon = ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />;

const PlusIcon = ({ focused }: { focused: boolean }) => (
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

const getFeedScreen = () => require('../screens/FeedScreen').default;
const getDiscoverScreen = () => require('../screens/DiscoverScreen').default;
const getUploadScreen = () => require('../screens/UploadScreen').default;
const getInboxScreen = () => require('../screens/InboxScreen').default;
const getProfileScreen = () => require('../screens/ProfileScreen').default;
const getAuthScreen = () => require('../screens/AuthScreen').default;
const getCommentsScreen = () => require('../screens/CommentsScreen').default;
const getPublicProfileScreen = () => require('../screens/PublicProfileScreen').default;
const getEditProfileScreen = () => require('../screens/EditProfileScreen').default;
const getConversationsScreen = () => require('../screens/ConversationsScreen').default;
const getChatScreen = () => require('../screens/ChatScreen').default;
const getLiveScreen = () => require('../screens/LiveScreen').default;
const getHashtagScreen = () => require('../screens/HashtagScreen').default;
const getStoryViewScreen = () => require('../screens/StoryViewScreen').default;
const getHostLiveScreen = () => require('../screens/HostLiveScreen').default;
const getSettingsScreen = () => require('../screens/SettingsScreen').default;
const getCollectionsScreen = () => require('../screens/CollectionsScreen').default;
const getCollectionDetailScreen = () => require('../screens/CollectionDetailScreen').default;

const MainTabs: React.FC<any> = ({ navigation }) => {
  const { session } = useAuth();

  return (
    <Tab.Navigator
      detachInactiveScreens
      screenOptions={{
        headerShown: false,
        lazy: true,
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
        getComponent={getFeedScreen}
        options={{
          tabBarIcon: HomeIcon,
          tabBarLabel: 'Accueil'
        }}
      />
      <Tab.Screen
        name="Discover"
        getComponent={getDiscoverScreen}
        options={{
          tabBarIcon: DiscoverIcon,
          tabBarLabel: 'Découvrir'
        }}
      />
      <Tab.Screen
        name="Upload"
        getComponent={getUploadScreen}
        options={{
          tabBarIcon: ({ focused }) => <PlusIcon focused={focused} />,
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
        getComponent={getInboxScreen}
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
        getComponent={getProfileScreen}
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

const RootNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Auth" getComponent={getAuthScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen 
        name="Comments" 
        getComponent={getCommentsScreen} 
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen name="PublicProfile" getComponent={getPublicProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="EditProfile"
        getComponent={getEditProfileScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Conversations" getComponent={getConversationsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Chat" getComponent={getChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Live" getComponent={getLiveScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Hashtag" getComponent={getHashtagScreen} />
      <Stack.Screen name="HashtagFeed" getComponent={getFeedScreen} />
      <Stack.Screen 
        name="StoryView" 
        getComponent={getStoryViewScreen} 
        options={{ presentation: 'transparentModal', animation: 'fade' }} 
      />
      <Stack.Screen name="HostLive" getComponent={getHostLiveScreen} />
      <Stack.Screen name="Settings" getComponent={getSettingsScreen} />
      <Stack.Screen name="Collections" getComponent={getCollectionsScreen} />
      <Stack.Screen name="CollectionDetail" getComponent={getCollectionDetailScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigation;
