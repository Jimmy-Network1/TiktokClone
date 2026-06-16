# Documentation Technique : TikTok Clone (G4)

Ce document fournit une analyse approfondie de l'architecture, des technologies et des fonctionnalités du projet TikTok Clone (G4).

## 1. Architecture et Organisation

Le projet suit une structure modulaire typique d'une application React Native robuste :

- `src/components/` : Composants UI réutilisables (ex: `VideoItem` pour le feed, `Stories` pour les stories).
- `src/context/` : Gestion d'état globale (ex: `AuthContext` pour la session utilisateur).
- `src/hooks/` : Logique métier réutilisable et interaction avec Supabase (ex: `useVideos`, `useAuth`, `useNotifications`).
- `src/lib/` : Configuration et initialisation des services (Supabase, variables globales).
- `src/navigation/` : Définition des routes et de la structure de navigation (`RootNavigation`).
- `src/screens/` : Vues et pages de l'application.

## 2. Pile Technologique et Modules Clés

*   **Framework** : React Native / Expo
*   **Backend / DB** : Supabase (`@supabase/supabase-js`)
*   **Navigation** : React Navigation (`@react-navigation/native`, `bottom-tabs`, `native-stack`)
*   **Style** : NativeWind (Tailwind CSS pour RN)
*   **Video** : `react-native-video`
*   **Camera** : `react-native-vision-camera`
*   **Icônes** : `lucide-react-native`
*   **State / Storage** : `@react-native-async-storage/async-storage`

## 3. Concepts Clés

- **Custom Hooks** : Utilisés pour encapsuler toute la logique d'interaction avec la base de données Supabase, facilitant la réutilisabilité et la lisibilité dans les composants UI.
- **Navigation Modale** : Utilisation intensive de la configuration `presentation: 'modal'` dans `RootNavigation` pour une expérience utilisateur fluide lors de la navigation vers des écrans secondaires (Auth, Commentaires, etc.).
- **Context API** : Fournit une gestion d'état centralisée pour l'authentification, évitant le *prop drilling*.
- **Performance UI** : Utilisation de `FlatList` pour le feed vidéo avec des optimisations (`pagingEnabled`) pour reproduire l'effet de snap de TikTok.
- **Sécurité RLS** : La base de données Supabase utilise des politiques RLS (*Row Level Security*) pour garantir que les utilisateurs ne peuvent accéder qu'à leurs propres données.

## 4. Mapping Fonctionnalités / Implémentation

| Fonctionnalité | Fichier(s) d'implémentation | Fonctions/Logic clés |
| :--- | :--- | :--- |
| **Authentification** | `src/context/AuthContext.tsx`, `src/screens/AuthScreen.tsx` | `signUp`, `signInWithPassword`, `signOut`, `onAuthStateChange` |
| **Feed Vidéo** | `src/screens/FeedScreen.tsx`, `src/components/VideoItem.tsx` | `useVideos()` hook, `FlatList` mapping |
| **Upload Vidéo** | `src/screens/UploadScreen.tsx` | `react-native-vision-camera` (capture) |
| **Messagerie** | `src/screens/InboxScreen.tsx`, `src/screens/ChatScreen.tsx` | Fetch des conversations, Realtime subscriptions |
| **Profil Utilisateur**| `src/screens/ProfileScreen.tsx`, `src/screens/EditProfileScreen.tsx` | Fetch profil, `updateProfile` |
| **Notifications** | `src/hooks/useNotifications.ts` | `useNotifications()` hook (écoute en temps réel) |
| **Navigation** | `src/navigation/RootNavigation.tsx` | `createBottomTabNavigator`, `createNativeStackNavigator` |

## 5. Backend et Services avancés

- **Supabase Realtime** : Utilisé pour les fonctionnalités en temps réel, notamment la messagerie et les notifications, en écoutant les changements sur les tables SQL correspondantes.
- **Supabase Storage** : Utilisé pour stocker les fichiers multimédias (avatars, vidéos uploadées).
- **Gestion des erreurs** : Implémentée via `ErrorBoundary.tsx` pour capturer les erreurs de rendu React et éviter le crash complet de l'application.

## 6. Optimisations et Patrons de Conception

- **Patron de conception (Repository Pattern simplifié)** : Les `hooks` agissent comme une couche d'abstraction entre l'UI et le service `Supabase`, isolant la logique d'accès aux données.
- **Optimisation des performances** :
    - Utilisation de `useCallback` et `useMemo` dans les composants lourds pour éviter les re-rendus inutiles.
    - `FlatList` est utilisé avec des propriétés comme `keyExtractor` et `getItemLayout` pour une gestion efficace des listes longues.
    - `react-native-video` est configuré pour charger les vidéos de manière optimisée pour le streaming.
