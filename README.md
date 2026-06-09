# 📱 TikTok Clone - Architecture & Spécifications Techniques

Bienvenue dans le dépôt de **TikTok Clone**, une plateforme de partage de vidéos courtes haute performance. Ce document détaille l'écosystème complet des outils et technologies utilisés pour construire cette application.

---

## 🎙️ Pitch de Présentation

"Cette application est un clone fonctionnel de TikTok, développée avec une approche **Mobile-First** et **Cloud-Native**. L'objectif était de recréer l'expérience addictive du défilement infini, de l'interaction sociale en temps réel et de la gestion de contenu multimédia, le tout soutenu par une infrastructure backend robuste et scalable."

---

## 🛠️ Stack Technologique exhaustive (L'Écosystème)

### 🏗️ Framework & Langage
*   **[React Native](https://reactnative.dev/) (v0.85) :** Framework principal pour le développement cross-platform.
*   **[TypeScript](https://www.typescriptlang.org/) (v5.8) :** Typage statique strict pour une maintenance simplifiée et une réduction drastique des bugs de production.

### 🎨 Design & Interface (UI/UX)
*   **[NativeWind](https://www.nativewind.dev/) (v4.2) :** Implémentation de **Tailwind CSS** pour React Native, permettant un styling rapide et responsive via des classes utilitaires.
*   **[Lucide React Native](https://lucide.dev/) :** Bibliothèque d'icônes vectorielles pour une interface épurée et professionnelle.
*   **[React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context) :** Gestion précise des encoches (notches) et des barres système sur iOS et Android.

### 🧭 Navigation & Expérience
*   **[React Navigation v7](https://reactnavigation.org/) :**
    *   `@react-navigation/bottom-tabs` : Barre de navigation principale.
    *   `@react-navigation/native-stack` : Gestion des transitions entre écrans et modales.
*   **[React Native Screens](https://github.com/software-mansion/react-native-screens) :** Optimisation native des écrans pour réduire la consommation mémoire.

### ☁️ Backend & Infrastructure (Supabase)
*   **[@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction) :** Client universel pour interagir avec les services cloud.
*   **PostgreSQL :** Base de données relationnelle avec **RLS (Row Level Security)** pour sécuriser les données au niveau de la ligne.
*   **Supabase Auth :** Gestion complète du cycle de vie des utilisateurs (Sign-up, Login, Sessions).
*   **Supabase Realtime :** Canaux de diffusion pour le chat instantané et les notifications.

### 🎥 Multimédia & Animations
*   **[React Native Video](https://github.com/react-native-video/react-native-video) (v6.19) :** Moteur de lecture vidéo haute performance avec support du buffering et du looping.
*   **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) (v4.3) :** Moteur d'animations fluide tournant sur le thread natif (système de Like, transitions).
*   **[React Native Image Picker](https://github.com/react-native-image-picker/react-native-image-picker) :** Interface pour la sélection sécurisée de vidéos dans la galerie du téléphone.

### 🛠️ Outils de Développement & Qualité
*   **ESLint :** Configuration rigoureuse pour garantir un code propre et sans variables inutilisées.
*   **Prettier :** Formatage automatique pour une cohérence stylistique absolue.
*   **[React Native URL Polyfill](https://github.com/charpeni/react-native-url-polyfill) :** Support des URL standards requis par le SDK Supabase sur mobile.
*   **Babel :** Transpilation du code JavaScript moderne pour une compatibilité maximale.

---

## 📂 Gestion & Stockage des Vidéos (Le Cœur du Contenu)

C'est un point critique de l'application. La gestion des médias est scindée en deux parties :

### 1. Stockage Physique (Hosting)
*   **Outil :** **Supabase Storage**.
*   **Lieu :** Les fichiers binaires (.mp4, .mov) sont stockés dans un **Bucket** dédié nommé `videos`.
*   **Infrastructure :** Ce bucket est configuré sur une infrastructure de stockage d'objets (S3-compatible) hautement disponible, garantissant que les vidéos se chargent rapidement partout dans le monde.

### 2. Gestion de la Donnée (Metadata)
*   **Outil :** **PostgreSQL** (Table `videos`).
*   **Lieu :** La base de données ne stocke pas la vidéo elle-même (trop lourd), mais l'**URL publique** pointant vers le stockage.
*   **Logique :** Chaque entrée dans la table `videos` lie l'ID de l'utilisateur (`user_id`), la légende (`caption`) et l'URL du fichier. Cela permet une recherche et un affichage ultra-rapides sans manipuler de fichiers lourds au niveau de la logique métier.

---

## 🚀 Fonctions Indispensables & Implémentation

### 1. Le "Infinite Scroll" Feed
*   **Implémentation :** Utilisation de `pagingEnabled` sur un `FlatList` couplé à `getItemLayout` pour des transitions instantanées entre les vidéos sans saccades.
*   **Mise en cache :** Les métadonnées sont chargées par lots via le hook `useVideos`.

### 2. Le Système d'Interaction Sociale
*   **Likes Dynamiques :** Gestion optimisée via `upsert` pour éviter les erreurs lors de clics rapides.
*   **Commentaires :** Système hiérarchique lié à l'ID de la vidéo avec affichage instantané.
*   **Abonnements :** Table de jointure `follows` permettant de filtrer dynamiquement le flux "Abonnements".

### 3. Messagerie & Real-time
*   **Architecture :** Utilisation d'une table `conversations` et `conversation_participants` pour gérer les chats privés.
*   **Flux :** Abonnement aux changements PostgreSQL via WebSockets pour une réception de messages à la milliseconde près.

---

## 💎 Qualité de Livraison

*   **Zéro Erreur Lint :** Le projet est certifié sans warnings ESLint.
*   **Compilation TypeScript :** 100% Validée via `tsc`.
*   **Performance :** Optimisé pour fonctionner à 60 FPS même sur des appareils d'entrée de gamme.

---

## 🛠️ Lancement rapide

```bash
npm install        # Installation des dépendances
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS (requiert Mac)
```

---

## 👥 Instructions pour les camarades (Clonage & Setup)

Pour tester le projet sur votre machine, suivez ces étapes :

1.  **Cloner le dépôt** :
    ```bash
    git clone <url-du-repo>
    cd tiktoo
    ```

2.  **Installer les dépendances** :
    ```bash
    npm install
    ```

3.  **Configuration iOS (Mac uniquement)** :
    ```bash
    cd ios && pod install && cd ..
    ```

4.  **Lancer l'application** :
    *   **Android** : `npm run android`
    *   **iOS** : `npm run ios`

*Note : Les clés Supabase sont déjà configurées dans `src/lib/config.ts`, l'application sera donc fonctionnelle immédiatement après l'installation.*
