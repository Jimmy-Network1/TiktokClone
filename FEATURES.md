# Guide des Fonctionnalités G4 📱

Ce document est votre feuille de route pour expliquer le projet **G4**. Chaque section indique la fonctionnalité et le fichier correspondant pour une navigation rapide lors de votre présentation.

---

## 1. Authentification
*   **Fonctionnalité** : Permet aux utilisateurs de créer un compte et de se connecter sans vérification d'e-mail contraignante.
*   **Fichiers clés** :
    *   `src/screens/AuthScreen.tsx` : Interface et logique de connexion/inscription.
    *   `src/context/AuthContext.tsx` : Gestion de l'état de session utilisateur.

## 2. Flux Vidéo (Le "Feed")
*   **Fonctionnalité** : Affichage dynamique des vidéos avec lecture automatique et mode démo en cas d'absence de connexion.
*   **Fichiers clés** :
    *   `src/screens/FeedScreen.tsx` : Le conteneur principal du flux.
    *   `src/components/VideoItem.tsx` : Le lecteur vidéo individuel (inclut l'animation du disque rotatif).
    *   `src/hooks/useVideos.ts` : Récupération des données depuis Supabase avec mode démo.

## 3. Social & Interactions
*   **Fonctionnalité** : "Liker", commenter et partager des vidéos.
*   **Fichiers clés** :
    *   `src/components/VideoItem.tsx` : Gestion des "Likes" avec retour haptique et animation de cœur.
    *   `src/screens/CommentsScreen.tsx` : Interface de gestion des commentaires.

## 4. Création de Contenu (Upload)
*   **Fonctionnalité** : Choix de vidéo, saisie de légende et publication vers Supabase.
*   **Fichiers clés** :
    *   `src/screens/UploadScreen.tsx` : Interface d'upload avec barre de progression de téléversement.

## 5. Fonctionnalité "Live"
*   **Fonctionnalité** : Simulation d'un flux en direct avec chat dynamique.
*   **Fichiers clés** :
    *   `src/screens/LiveScreen.tsx` : Interface Live avec simulation de cœurs flottants et chat.

## 6. Navigation
*   **Fonctionnalité** : Passage entre les différentes sections de l'application.
*   **Fichiers clés** :
    *   `src/navigation/RootNavigation.tsx` : Structure globale de la navigation (Tabs et Stack).

---


---


---

## 🗺️ Carte de Navigation du Code (Pour vos explications)

Voici où pointer le doigt dans votre code quand on vous posera des questions :

### 1. Changer le nom de l'application
*   **Où chercher ?**
    *   `app.json` : Modifiez `displayName`.
    *   `android/app/src/main/res/values/strings.xml` : Modifiez `app_name`.
    *   `android/app/src/main/java/com/tiktokclone/MainActivity.kt` : Modifiez `getMainComponentName`.
*   **Pourquoi ?** "C'est la configuration native qui fait le lien entre le nom affiché sur le téléphone et le composant React racine."

### 2. Fonctionnalité "LIVE"
*   **Le déclencheur** : `src/screens/FeedScreen.tsx` (cherchez `navigation.navigate('Live')` dans le header).
*   **L'interface** : `src/screens/LiveScreen.tsx`.
*   **L'explication** : "C'est une interface dédiée qui utilise `reanimated` pour les animations de cœurs en temps réel et une simulation de chat."

### 3. Upload de Vidéo & "Auto-cut"
*   **L'interface** : `src/screens/UploadScreen.tsx`.
*   **La logique** : Fonction `handleUpload`.
*   **L'explication** : "Nous simulons un traitement 'Auto-cut/Auto-tune' avec une barre de progression réelle. C'est ici que le fichier est envoyé vers le bucket Supabase Storage."

### 4. La barre de navigation et le bouton "Plus"
*   **Le router** : `src/navigation/RootNavigation.tsx` (cherchez `MainTabs`).
*   **Le style du bouton** : Composant `PlusIconWrapper`.
*   **L'explication** : "Nous avons une structure de TabNavigator qui vérifie dynamiquement si l'utilisateur est connecté avant de l'autoriser à poster une vidéo."


