import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

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

        if (error) {
          throw error;
        }

        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setBio(data.bio || '');
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Impossible de charger votre profil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigation]);

  const handleSave = async () => {
    if (!profileId) {
      return;
    }

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

      if (error) {
        throw error;
      }

      Alert.alert('Succes', 'Profil mis a jour.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Mise a jour impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-5 pb-8 pt-14">
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text className="text-sm font-bold text-zinc-400">Retour</Text>
      </TouchableOpacity>

      <Text className="mt-4 text-3xl font-bold text-white">Modifier le profil</Text>

      <TextInput
        className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
        placeholder="Username"
        placeholderTextColor="#71717a"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />
      <TextInput
        className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
        placeholder="Nom complet"
        placeholderTextColor="#71717a"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        className="mt-4 min-h-32 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
        placeholder="Bio"
        placeholderTextColor="#71717a"
        value={bio}
        multiline
        onChangeText={setBio}
      />

      <TouchableOpacity
        className={`mt-6 rounded-2xl px-5 py-4 items-center ${saving ? 'bg-zinc-700' : 'bg-[#FE2C55]'}`}
        disabled={saving}
        onPress={handleSave}
      >
        <Text className="font-bold text-white">{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;
