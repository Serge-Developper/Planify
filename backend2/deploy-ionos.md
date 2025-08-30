# Guide de Déploiement IONOS Plesk - Backend Planify

## 🎯 Objectif
Redéployer le backend pour corriger l'erreur 404 de l'endpoint `/api/coins/spin-status`

## 📁 Fichiers à déployer

### Fichiers essentiels (obligatoires)
- `app.js` - Configuration principale du serveur
- `package.json` - Dépendances Node.js
- `routes/coins-simple.js` - **CRITIQUE** - Contient l'endpoint spin-status
- `models/User.js` - Modèle utilisateur
- `middlewares/auth.js` - Middleware d'authentification

### Fichiers optionnels
- `routes/users.js` - Gestion des utilisateurs
- `routes/events.js` - Gestion des événements
- `routes/contact.js` - Formulaire de contact
- `uploads/` - Dossier des avatars (si existant)

## 🚀 Étapes de déploiement

### Option 1: Via le panneau de contrôle IONOS Plesk

1. **Connectez-vous** à votre panneau de contrôle IONOS
2. **Allez dans "Fichiers"** ou "File Manager"
3. **Naviguez** vers le dossier de votre backend API
4. **Uploadez** les fichiers listés ci-dessus
5. **Redémarrez** l'application Node.js

### Option 2: Via FTP/SFTP

1. **Utilisez un client FTP** (FileZilla, WinSCP, etc.)
2. **Connectez-vous** à votre serveur IONOS
3. **Naviguez** vers le dossier API
4. **Uploadez** tous les fichiers du dossier `backend2/`

## ✅ Vérification après déploiement

### Test 1: Route de base
```
GET https://api.planifymmi.fr/
```
**Réponse attendue :** `API Planifyvrai2 en ligne`

### Test 2: Endpoint spin-status (avec token)
```
GET https://api.planifymmi.fr/api/coins/spin-status
Headers:
Authorization: Bearer YOUR_JWT_TOKEN
```
**Réponse attendue :**
```json
{
  "success": true,
  "canSpin": true,
  "lastSpinDate": null
}
```

## 🔧 En cas de problème

### Si l'endpoint retourne encore 404
1. Vérifiez que le fichier `routes/coins-simple.js` a bien été uploadé
2. Redémarrez l'application Node.js dans Plesk
3. Vérifiez les logs d'erreur dans Plesk

### Si l'application ne démarre pas
1. Vérifiez que `package.json` est présent
2. Vérifiez que toutes les dépendances sont installées
3. Consultez les logs d'erreur dans Plesk

## 📞 Support

Si le problème persiste après le redéploiement, vérifiez :
- Les logs d'erreur dans le panneau de contrôle IONOS
- La configuration Node.js dans Plesk
- Les permissions des fichiers uploadés 