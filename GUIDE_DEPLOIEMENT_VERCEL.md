# Guide de Déploiement Planify sur Vercel

## 🚀 Migration de Yonos/Plesk vers Vercel

Ce guide vous explique comment migrer votre application Planify de Yonos/Plesk vers Vercel en gardant exactement le même fonctionnement.

## 📋 Prérequis

1. **Compte Vercel** : Créez un compte sur [vercel.com](https://vercel.com)
2. **Variables d'environnement** : Vous avez déjà configuré vos variables sur Vercel
3. **GitHub/GitLab** : Votre code doit être sur un repository Git

## 🔧 Configuration

### 1. Structure du Projet

Votre projet est maintenant organisé comme suit :
```
planify-vercel/
├── api/                    # API Routes Vercel
│   ├── index.js           # Point d'entrée principal
│   ├── users.js           # Routes utilisateurs
│   ├── coins.js           # Routes coins/boutique
│   ├── items.js           # Routes items
│   ├── events.js          # Routes événements
│   ├── contact.js         # Route contact
│   └── package.json       # Dépendances API
├── frontend (7)/frontend/  # Frontend Vue.js
├── vercel.json            # Configuration Vercel
└── package.json           # Package principal
```

### 2. Variables d'Environnement

Assurez-vous que ces variables sont configurées dans votre dashboard Vercel :

```env
MONGODB_URI=mongodb+srv://serge_planify:15yU...@cluster0.mongodb.net/planify
VITE_API_URL=https://planify-snowy.vercel.app/api
ALLOWED_ORIGINS=https://planify-snowy.vercel.app
JWT_SECRET=47313b08ce548d70a55502b72e7441428...
NODE_ENV=production
EMAIL_USER=planifymmi@gmail.com
EMAIL_PASS=mqdghtxxpisutwkz
```

## 🚀 Déploiement

### Étape 1 : Préparation

1. **Installer les dépendances** :
   ```bash
   npm run install-deps
   ```

2. **Tester en local** :
   ```bash
   npm run dev
   ```

### Étape 2 : Déploiement sur Vercel

1. **Connecter votre repository** :
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "New Project"
   - Importez votre repository GitHub/GitLab

2. **Configuration du projet** :
   - **Framework Preset** : `Other`
   - **Root Directory** : `./` (racine du projet)
   - **Build Command** : `npm run vercel-build`
   - **Output Directory** : `frontend (7)/frontend/dist`

3. **Variables d'environnement** :
   - Copiez toutes vos variables depuis votre dashboard Vercel existant

4. **Déployer** :
   - Cliquez sur "Deploy"

### Étape 3 : Configuration des Domaines

1. **Domaine personnalisé** (optionnel) :
   - Dans votre projet Vercel, allez dans "Settings" > "Domains"
   - Ajoutez votre domaine personnalisé

## 🔄 Migration des Données

### Base de Données MongoDB

✅ **Aucune migration nécessaire** - Votre base de données MongoDB reste la même !

### Fichiers Uploadés

Pour les avatars et fichiers uploadés :

1. **Créer le dossier public** :
   ```bash
   mkdir -p public/uploads/avatars
   mkdir -p public/uploads/items
   ```

2. **Migrer les fichiers existants** (si nécessaire) :
   - Copiez vos fichiers depuis l'ancien serveur
   - Placez-les dans les dossiers correspondants

## 🧪 Tests Post-Déploiement

### 1. Test de l'API

Testez vos endpoints avec Postman :

```bash
# Test de base
GET https://planify-snowy.vercel.app/api/

# Test de connexion
POST https://planify-snowy.vercel.app/api/users/login
Content-Type: application/json

{
  "username": "votre_username",
  "password": "votre_password"
}
```

### 2. Test du Frontend

1. Visitez votre URL Vercel
2. Testez la connexion
3. Vérifiez les fonctionnalités :
   - Leaderboard
   - Boutique
   - Roue de la fortune
   - Upload d'avatars

## 🔧 Dépannage

### Erreurs Courantes

1. **Erreur CORS** :
   - Vérifiez `ALLOWED_ORIGINS` dans vos variables d'environnement
   - Assurez-vous que l'URL correspond à votre domaine Vercel

2. **Erreur MongoDB** :
   - Vérifiez `MONGODB_URI`
   - Assurez-vous que l'IP de Vercel est autorisée dans MongoDB Atlas

3. **Erreur de build** :
   - Vérifiez les dépendances dans `frontend (7)/frontend/package.json`
   - Exécutez `npm install` dans le dossier frontend

### Logs Vercel

Pour voir les logs :
1. Dashboard Vercel > Votre projet
2. Onglet "Functions" ou "Deployments"
3. Cliquez sur un déploiement pour voir les logs

## 📈 Avantages de Vercel

✅ **Performance** : CDN global, déploiement automatique  
✅ **Scalabilité** : Serverless functions, auto-scaling  
✅ **Sécurité** : HTTPS automatique, protection DDoS  
✅ **Facilité** : Déploiement en un clic, rollback facile  
✅ **Monitoring** : Analytics intégrés, logs détaillés  

## 🔄 Mises à Jour

Pour les futures mises à jour :

1. **Push sur Git** :
   ```bash
   git add .
   git commit -m "Mise à jour"
   git push
   ```

2. **Déploiement automatique** :
   - Vercel déploie automatiquement à chaque push
   - Pas d'action manuelle nécessaire

## 📞 Support

Si vous rencontrez des problèmes :

1. **Logs Vercel** : Vérifiez les logs dans le dashboard
2. **Variables d'environnement** : Vérifiez la configuration
3. **Base de données** : Testez la connexion MongoDB

---

## ✅ Checklist de Migration

- [ ] Variables d'environnement configurées
- [ ] Dépendances installées
- [ ] Tests locaux réussis
- [ ] Déploiement Vercel réussi
- [ ] Tests post-déploiement réussis
- [ ] Fonctionnalités principales testées
- [ ] Ancien serveur désactivé

**🎉 Félicitations ! Votre migration vers Vercel est terminée !**
