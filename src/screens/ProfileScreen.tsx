import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

const ProfileScreen = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Profil</Text>
      {session ? (
        <View className="items-center">
          <Text className="text-gray-600 mb-4">Connecté en tant que : {session.user.email}</Text>
          <TouchableOpacity 
            className="bg-red-500 px-6 py-2 rounded-full"
            onPress={() => supabase.auth.signOut()}
          >
            <Text className="text-white font-bold">Déconnexion</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="items-center">
          <Text className="text-gray-600 mb-4">Vous n'êtes pas connecté.</Text>
          <TouchableOpacity 
            className="bg-black px-6 py-2 rounded-full"
            onPress={() => {/* Navigation vers Login */}}
          >
            <Text className="text-white font-bold">Se connecter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfileScreen;
