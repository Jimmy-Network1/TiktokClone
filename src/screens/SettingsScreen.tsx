import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { ChevronRight, Shield, Bell, Lock, User, Info, LogOut, Trash2, Moon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const [pushEnabled, setPushEnabled] = React.useState(true);

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.navigate('Main');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos vidéos et données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            // Dans une vraie app, on appellerait une Edge Function pour supprimer l'utilisateur via Admin Auth
            Alert.alert('Information', 'Demande de suppression envoyée à l\'administrateur.');
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon: Icon, title, onPress, value, type = 'link' }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={type === 'switch'}
      className="flex-row items-center justify-between py-4 border-b border-white/5"
    >
      <View className="flex-row items-center">
        <View className="bg-zinc-900 p-2 rounded-lg mr-4">
           <Icon color="white" size={20} />
        </View>
        <Text className="text-white text-base">{title}</Text>
      </View>
      {type === 'link' && <ChevronRight color="#52525b" size={20} />}
      {type === 'switch' && (
        <Switch 
          value={value} 
          onValueChange={onPress}
          trackColor={{ false: '#27272a', true: '#FE2C55' }}
          thumbColor="white"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center border-b border-white/5">
         <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Text className="text-white text-2xl font-black">←</Text>
         </TouchableOpacity>
         <Text className="text-white text-xl font-bold">Réglages et confidentialité</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="mt-6">
           <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Compte</Text>
           <View className="bg-zinc-950/50 rounded-2xl px-4 border border-white/5">
              <SettingItem icon={User} title="Gérer le compte" onPress={() => {}} />
              <SettingItem icon={Shield} title="Confidentialité" onPress={() => {}} />
              <SettingItem icon={Lock} title="Sécurité" onPress={() => {}} />
           </View>
        </View>

        <View className="mt-8">
           <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Contenu et affichage</Text>
           <View className="bg-zinc-950/50 rounded-2xl px-4 border border-white/5">
              <SettingItem 
                icon={Bell} 
                title="Notifications" 
                type="switch" 
                value={pushEnabled} 
                onPress={() => setPushEnabled(!pushEnabled)} 
              />
              <SettingItem 
                icon={Moon} 
                title="Mode sombre" 
                type="switch" 
                value={isDarkMode} 
                onPress={() => setIsDarkMode(!isDarkMode)} 
              />
              <SettingItem icon={Info} title="Langue" onPress={() => {}} />
           </View>
        </View>

        <View className="mt-8">
           <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Support</Text>
           <View className="bg-zinc-950/50 rounded-2xl px-4 border border-white/5">
              <SettingItem icon={Info} title="Signaler un problème" onPress={() => {}} />
              <SettingItem icon={Shield} title="Centre de sécurité" onPress={() => {}} />
           </View>
        </View>

        <View className="mt-12 mb-20 space-y-4">
           <TouchableOpacity 
             onPress={handleSignOut}
             className="w-full bg-zinc-900 py-4 rounded-xl items-center border border-white/5"
           >
              <View className="flex-row items-center">
                 <LogOut color="white" size={18} />
                 <Text className="text-white font-bold ml-2">Déconnexion</Text>
              </View>
           </TouchableOpacity>

           <TouchableOpacity 
             onPress={handleDeleteAccount}
             className="w-full py-4 items-center"
           >
              <View className="flex-row items-center">
                 <Trash2 color="#ef4444" size={16} />
                 <Text className="text-red-500 font-medium ml-2 text-sm">Supprimer le compte</Text>
              </View>
           </TouchableOpacity>
           
           <Text className="text-zinc-700 text-center text-xs mt-4">
              G4 TikTok Clone v1.0.0
           </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
