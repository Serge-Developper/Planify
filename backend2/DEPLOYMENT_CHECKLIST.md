# ✅ Checklist de Déploiement IONOS Plesk

## 🎯 Objectif
Corriger l'erreur 404 de l'endpoint `/api/coins/spin-status`

## 📋 Fichiers à déployer (par ordre de priorité)

### 🔴 CRITIQUE - Fichiers essentiels
- [ ] `app.js` - Configuration principale
- [ ] `package.json` - Dépendances
- [ ] `routes/coins-simple.js` - **CRITIQUE** - Contient l'endpoint spin-status
- [ ] `models/User.js` - Modèle utilisateur
- [ ] `middlewares/auth.js` - Authentification

### 🟡 IMPORTANT - Fichiers secondaires
- [ ] `routes/users.js` - Gestion utilisateurs
- [ ] `routes/events.js` - Gestion événements
- [ ] `routes/contact.js` - Formulaire contact
- [ ] `uploads/` - Dossier avatars (si existant)

## 🚀 Étapes de déploiement

### 1. Préparation
- [ ] Connectez-vous au panneau de contrôle IONOS Plesk
- [ ] Allez dans "Fichiers" ou "File Manager"
- [ ] Naviguez vers le dossier de votre backend API

### 2. Upload des fichiers
- [ ] Uploadez `app.js`
- [ ] Uploadez `package.json`
- [ ] Uploadez le dossier `routes/` complet
- [ ] Uploadez le dossier `models/` complet
- [ ] Uploadez le dossier `middlewares/` complet
- [ ] Uploadez le dossier `uploads/` (si existant)

### 3. Redémarrage
- [ ] Redémarrez l'application Node.js dans Plesk
- [ ] Vérifiez que l'application démarre sans erreur

## ✅ Tests après déploiement

### Test 1: Route de base
```
GET https://api.planifymmi.fr/
```
**Attendu :** `API Planifyvrai2 en ligne`

### Test 2: Endpoint spin-status
```
GET https://api.planifymmi.fr/api/coins/spin-status
Headers: Authorization: Bearer YOUR_TOKEN
```
**Attendu :**
```json
{
  "success": true,
  "canSpin": true,
  "lastSpinDate": null
}
```

### Test 3: Endpoint user-coins (vérification)
```
GET https://api.planifymmi.fr/api/coins/user-coins
Headers: Authorization: Bearer YOUR_TOKEN
```
**Attendu :** `{"coins": 21}` (ou autre valeur)

## 🔧 En cas de problème

### Si l'endpoint retourne encore 404
1. Vérifiez que `routes/coins-simple.js` a bien été uploadé
2. Redémarrez l'application Node.js
3. Vérifiez les logs d'erreur dans Plesk

### Si l'application ne démarre pas
1. Vérifiez que `package.json` est présent
2. Vérifiez les logs d'erreur dans Plesk
3. Vérifiez les permissions des fichiers

## 📞 Support
- Consultez les logs d'erreur dans le panneau de contrôle IONOS
- Vérifiez la configuration Node.js dans Plesk
- Testez avec Postman après chaque modification 