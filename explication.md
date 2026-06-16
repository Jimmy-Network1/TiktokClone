# Explication du Projet : TikTok Clone (G4)

Ce projet est une application mobile construite avec **React Native** et **Expo**, conçue pour reproduire l'expérience utilisateur de TikTok. Il utilise **Supabase** comme backend (Base de données, Authentification, Stockage).

---

## 1. Architecture Globale

L'application suit une structure modulaire typique de React Native :

- **`App.tsx`** : Point d'entrée. Gère l'initialisation de l'authentification (avec `Supabase`), le chargement initial (avec un écran de splash personnalisé) et les erreurs globales.
- **`src/navigation/RootNavigation.tsx`** : Définit la structure de navigation principale.
    - Utilise `createBottomTabNavigator` pour les onglets principaux (Accueil, Découvrir, Upload, Inbox, Profil).
    - Utilise `createNativeStackNavigator` pour gérer les écrans secondaires en modal (Authentification, Commentaires, Édition de profil, etc.).
- **`src/context/AuthContext.tsx`** : Gère l'état de l'utilisateur connecté de manière globale.
- **`src/hooks/`** : Contient la logique métier réutilisable (`useAuth`, `useVideos`, `useNotifications`).
- **`src/components/`** : Composants UI réutilisables.
- **`src/screens/`** : Pages de l'application.
- **`supabase/`** : Contient les scripts SQL pour la configuration de la base de données (migrations, RLS, etc.).

---

## 2. Fonctionnement et Flux de Données

### A. Initialisation et Authentification (`App.tsx`)

À l'ouverture :
1. `App` appelle `initAuth` via un `useEffect`.
2. `initAuth` vérifie la session utilisateur via `supabase.auth.getSession()`.
3. Un `timeout` (8 secondes) est ajouté pour gérer les lenteurs réseau.
4. L'état `authReady` indique si l'application est prête à afficher la navigation.
5. `AuthProvider` enveloppe le contenu pour rendre les données utilisateur accessibles partout.

### B. Navigation et Accès aux Fonctionnalités (`RootNavigation.tsx`)

La navigation est divisée en deux couches :
1. **`MainTabs`** : Barre de navigation inférieure.
    - **Sécurité** : Pour les onglets `Upload`, `Inbox`, et `Profile`, des `listeners` (`tabPress`) vérifient la présence d'une session utilisateur (`!session?.user`). Si l'utilisateur n'est pas connecté, l'action est annulée (`e.preventDefault()`) et l'application redirige vers l'écran `Auth`.
2. **`RootNavigation`** : Définit la hiérarchie complète des écrans, permettant la navigation entre les onglets et les écrans modaux (par exemple, naviguer depuis le feed vers le profil public ou vers les commentaires).

### C. Gestion des Données (`Hooks` & `Supabase`)

L'application interagit avec Supabase principalement via les hooks personnalisés :
- `useAuth()` : Récupère et met à jour l'utilisateur courant.
- `useVideos()` : Gère la récupération, la pagination et les interactions sur les vidéos.
- `useNotifications()` : Gère l'affichage et la suppression des notifications utilisateur.

---

## 3. Résumé des fonctions clés

| Fonction / Hook | Rôle | Appelé par |
| :--- | :--- | :--- |
| `initAuth` | Initialise la session Supabase | `App.tsx` (useEffect) |
| `MainTabs` | Définit et protège les onglets principaux | `RootNavigation.tsx` |
| `useAuth()` | Accès à l'état de l'authentification | `MainTabs` (navigation), `AuthContext.tsx` |
| `useNotifications()` | Récupère les notifications | `AppContent` (dans `App.tsx`) |
| `tabPress` (listeners) | Vérifie l'auth avant d'accéder à un onglet | `MainTabs` (configuration des screens) |
