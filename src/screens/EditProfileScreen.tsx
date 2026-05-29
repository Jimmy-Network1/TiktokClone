import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Camera } from 'lucide-react-native';

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          navigation.navigate('Auth');
          return;
        }

        setProfileId(session.user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name, bio')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setBio(data.bio || '');
      } catch (error: any) {
        console.error('Edit profile load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigation]);

  const handleSave = async () => {
    if (!profileId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || null,
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;

      Alert.alert('Succès', 'Votre profil a été mis à jour.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FE2C55" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-white text-base">Annuler</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold text-base">Modifier le profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text className={`text-base font-bold ${saving ? 'text-zinc-600' : 'text-[#FE2C55]'}`}>
            Enregistrer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5">
        {/* Avatar Section */}
        <View className="items-center py-8">
           <View className="relative">
              <View className="h-24 w-24 rounded-full bg-zinc-900 items-center justify-center border border-white/10">
                 <Text className="text-white text-3xl font-bold">
                    {(username || 'U').charAt(0).toUpperCase()}
                 </Text>
              </View>
              <View className="absolute bottom-0 right-0 bg-zinc-800 p-2 rounded-full border-2 border-black">
                 <Camera color="white" size={16} />
              </View>
           </View>
           <Text className="mt-4 text-zinc-400 text-xs">Modifier la photo</Text>
        </View>

        {/* Form */}
        <View className="mt-4">
           <View className="mb-6">
              <Text className="text-zinc-500 text-xs mb-2 ml-1 font-bold uppercase">Nom d'utilisateur</Text>
              <TextInput
                className="bg-zinc-950 border border-white/5 rounded-xl p-4 text-white"
                placeholder="Username"
                placeholderTextColor="#3f3f46"
                value={username}
                autoCapitalize="none"
                onChangeText={setUsername}
              />
           </View>

           <View className="mb-6">
              <Text className="text-zinc-500 text-xs mb-2 ml-1 font-bold uppercase">Nom complet</Text>
              <TextInput
                className="bg-zinc-950 border border-white/5 rounded-xl p-4 text-white"
                placeholder="Votre nom"
                placeholderTextColor="#3f3f46"
                value={fullName}
                onChangeText={setFullName}
              />
           </View>

           <View className="mb-6">
              <Text className="text-zinc-500 text-xs mb-2 ml-1 font-bold uppercase">Bio</Text>
              <TextInput
                className="bg-zinc-950 border border-white/5 rounded-xl p-4 text-white h-32"
                placeholder="Décrivez-vous..."
                placeholderTextColor="#3f3f46"
                value={bio}
                multiline
                textAlignVertical="top"
                onChangeText={setBio}
              />
           </View>
        </View>

        <View className="py-10 items-center">
           <Text className="text-zinc-600 text-[10px] text-center uppercase tracking-widest">
              ID: {profileId?.substring(0, 18).toUpperCase()}
           </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditProfileScreen;
