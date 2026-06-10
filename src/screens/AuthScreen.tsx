import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigation = useNavigation<any>();

  async function handleAuth() {
    if (!email || !password || (isSignUp && !username)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: username,
            },
          },
        });
        if (error) throw error;
        Alert.alert('Succès', 'Vérifiez votre email pour confirmer votre compte !');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
<<<<<<< HEAD
        <ScrollView contentContainerStyle={styles.scrollContent} className="justify-center p-8">
=======
        <ScrollView contentContainerStyle={[styles.scrollContent, { justifyContent: 'center' }]} className="p-8">
>>>>>>> origin
          {navigation.canGoBack() ? (
            <TouchableOpacity className="absolute left-8 top-4 z-10" onPress={() => navigation.goBack()}>
              <Text className="text-sm font-bold text-zinc-400">Fermer</Text>
            </TouchableOpacity>
          ) : null}

          <Text className="text-4xl font-bold text-center mb-10 text-white">TikTok Clone</Text>
          
          <Text className="text-2xl font-semibold mb-6 text-white">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </Text>

          {isSignUp && (
            <TextInput
              className="rounded-2xl border border-white/10 bg-zinc-950 p-4 mb-4 text-white"
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#71717a"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}

          <TextInput
            className="rounded-2xl border border-white/10 bg-zinc-950 p-4 mb-4 text-white"
            placeholder="Email"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            className="rounded-2xl border border-white/10 bg-zinc-950 p-4 mb-8 text-white"
            placeholder="Mot de passe"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            className="bg-[#FE2C55] rounded-2xl p-5 items-center"
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {isSignUp ? "S'inscrire" : 'Se connecter'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text className="text-[#25F4EE] font-medium">
              {isSignUp ? 'Déjà un compte ? Connectez-vous' : "Pas de compte ? Inscrivez-vous"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});

export default AuthScreen;
