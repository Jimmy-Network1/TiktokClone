import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import AuthWall from '../components/AuthWall';

interface ProfileScreenProps {
  session: Session | null;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ session }) => {
  const navigation = useNavigation<any>();

  if (!session) {
    return (
      <AuthWall
        title="Profil reserve"
        message="Connectez-vous pour voir votre profil, vos informations et gerer votre compte."
        onPress={() => navigation.navigate('Auth')}
      />
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Profil</Text>
      <View className="items-center">
        <Text className="text-gray-600 mb-4">Connecte en tant que : {session.user.email}</Text>
        <TouchableOpacity
          className="bg-red-500 px-6 py-2 rounded-full"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-white font-bold">Deconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;
