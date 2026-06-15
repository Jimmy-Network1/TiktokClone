# SETUP.md - Guide de démarrage du projet G4 🚀

Ce document décrit la procédure standard pour installer et lancer le projet **G4**. Si vous rencontrez des problèmes de compilation, suivez scrupuleusement ces étapes.

## 1. Prérequis Système
- **Node.js** : Version `>= 22.11.0` (Recommandé : utiliser `nvm`)
- **JDK** : Java 17
- **Android Studio** : SDK Android 34 ou 35
- **Watchman** : `brew install watchman` (sur macOS)

## 2. Installation
Pour installer le projet, exécutez simplement :

```bash
npm install
```

Si vous êtes sur iOS, installez les pods :
```bash
cd ios && pod install && cd ..
```

## 3. Lancement
1. **Lancer le serveur Metro** (dans un premier terminal) :
   ```bash
   npm start
   ```

2. **Lancer sur Android** (dans un second terminal) :
   ```bash
   npm run android
   ```

## 4. Résolution de problèmes
- **Erreur de compilation Gradle** :
  Assurez-vous d'avoir ouvert le dossier `android` dans Android Studio pour que les dépendances natives soient bien téléchargées.
- **Cache persistant** :
  Si une erreur étrange persiste, lancez :
  ```bash
  rm -rf node_modules
  npm install
  npx react-native start --reset-cache
  ```
- **"G4 has not been registered"** :
  Cela signifie que le bundle JS ne correspond pas au binaire natif. Fermez tout, recompilez l'application native : `npm run android`.
