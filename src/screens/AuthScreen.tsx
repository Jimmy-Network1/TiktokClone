import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigation = useNavigation<any>();

  async function handleAuth() {
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
    <View className="flex-1 bg-white p-8 justify-center">
      {navigation.canGoBack() ? (
        <TouchableOpacity className="absolute left-8 top-16 z-10" onPress={() => navigation.goBack()}>
          <Text className="text-sm font-bold text-gray-500">Fermer</Text>
        </TouchableOpacity>
      ) : null}

      <Text className="text-4xl font-bold text-center mb-8">TikTok Clone</Text>
      
      <Text className="text-2xl font-semibold mb-6">
        {isSignUp ? 'Créer un compte' : 'Connexion'}
      </Text>

      {isSignUp && (
        <TextInput
          className="border border-gray-300 rounded-lg p-4 mb-4"
          placeholder="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}

      <TextInput
        className="border border-gray-300 rounded-lg p-4 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 rounded-lg p-4 mb-6"
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-black rounded-lg p-4 items-center"
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
        className="mt-4 items-center"
        onPress={() => setIsSignUp(!isSignUp)}
      >
        <Text className="text-blue-500">
          {isSignUp ? 'Déjà un compte ? Connectez-vous' : "Pas de compte ? Inscrivez-vous"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthScreen;
