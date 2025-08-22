# 🔒 Guide de Sécurité - Planifyvrai

## 🚨 **VULNÉRABILITÉS CORRIGÉES**

### ✅ **1. Authentification Sécurisée**
- **Avant** : Mots de passe en clair dans la base de données
- **Après** : Hachage bcrypt avec salt rounds = 12
- **Impact** : Protection contre les fuites de données

### ✅ **2. Validation des Données**
- **Avant** : Aucune validation côté serveur
- **Après** : Validation express-validator sur toutes les routes
- **Impact** : Protection contre les injections et données malveillantes

### ✅ **3. Rate Limiting**
- **Avant** : Aucune limitation des tentatives
- **Après** : 5 tentatives max par 15 minutes pour la connexion
- **Impact** : Protection contre les attaques par force brute

### ✅ **4. Headers de Sécurité**
- **Avant** : Aucun header de sécurité
- **Après** : Helmet.js avec CSP, HSTS, etc.
- **Impact** : Protection contre XSS, clickjacking, etc.

### ✅ **5. JWT Sécurisé**
- **Avant** : Secret faible et pas de validation stricte
- **Après** : Secret fort, validation issuer/audience, gestion d'erreurs
- **Impact** : Protection contre les attaques sur les tokens

## 🔧 **CONFIGURATION REQUISE**

### **1. Variables d'Environnement**
Créez un fichier `.env` dans le dossier `backend2/` :

```env
# Configuration de la base de données
MONGO_URI=mongodb://localhost:27017/planifyvrai

# Clé secrète JWT (GÉNÉRER UNE CLÉ FORTE EN PRODUCTION)
JWT_SECRET=votre-clé-secrète-très-longue-et-complexe-minimum-32-caractères

# Configuration du serveur
PORT=3000

# Configuration de sécurité
NODE_ENV=production
CORS_ORIGIN=https://votre-domaine.com
```

### **2. Migration des Mots de Passe**
Exécutez le script de migration :

```bash
cd backend2
node migrate-passwords.js
```

## 🛡️ **MESURES DE SÉCURITÉ IMPLÉMENTÉES**

### **Backend (Node.js/Express)**
- ✅ Hachage bcrypt des mots de passe
- ✅ Validation des données avec express-validator
- ✅ Rate limiting avec express-rate-limit
- ✅ Headers de sécurité avec Helmet.js
- ✅ JWT sécurisé avec secret fort
- ✅ Gestion d'erreurs centralisée
- ✅ Protection CORS configurée
- ✅ Limitation de taille des requêtes

### **Frontend (Vue.js)**
- ✅ Headers de sécurité pour les requêtes API
- ✅ Gestion automatique des tokens expirés
- ✅ Validation côté client
- ✅ Protection XSS avec Vue.js

### **Base de Données (MongoDB)**
- ✅ Connexion sécurisée avec timeouts
- ✅ Validation des schémas Mongoose
- ✅ Pas d'exposition des mots de passe

## 🔍 **TESTS DE SÉCURITÉ À EFFECTUER**

### **1. Test d'Authentification**
```bash
# Test de connexion avec identifiants valides
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test de rate limiting
# Essayer 6 connexions en 15 minutes
```

### **2. Test de Validation**
```bash
# Test avec données invalides
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}'
```

### **3. Test des Headers de Sécurité**
```bash
curl -I http://localhost:3000/
# Vérifier la présence de : X-Frame-Options, X-Content-Type-Options, etc.
```

## 🚀 **DÉPLOIEMENT SÉCURISÉ**

### **1. Production**
- ✅ Utiliser HTTPS uniquement
- ✅ Configurer un reverse proxy (Nginx)
- ✅ Activer les logs de sécurité
- ✅ Surveiller les tentatives d'intrusion

### **2. Base de Données**
- ✅ Utiliser MongoDB Atlas ou instance sécurisée
- ✅ Activer l'authentification MongoDB
- ✅ Configurer les sauvegardes automatiques
- ✅ Limiter l'accès réseau

### **3. Serveur**
- ✅ Mettre à jour régulièrement les dépendances
- ✅ Configurer un firewall
- ✅ Utiliser des certificats SSL valides
- ✅ Surveiller les logs d'erreurs

## 📋 **CHECKLIST DE SÉCURITÉ**

### **Avant le Déploiement**
- [ ] Variables d'environnement configurées
- [ ] Mots de passe migrés vers bcrypt
- [ ] JWT_SECRET changé en production
- [ ] HTTPS configuré
- [ ] Logs de sécurité activés

### **Après le Déploiement**
- [ ] Tests de sécurité effectués
- [ ] Monitoring configuré
- [ ] Sauvegardes automatisées
- [ ] Plan de réponse aux incidents

## 🔄 **MAINTENANCE SÉCURITÉ**

### **Mensuel**
- [ ] Mise à jour des dépendances
- [ ] Audit des logs de sécurité
- [ ] Vérification des certificats SSL

### **Trimestriel**
- [ ] Test de pénétration
- [ ] Révision des permissions
- [ ] Mise à jour des politiques de sécurité

## 📞 **CONTACT SÉCURITÉ**

En cas de vulnérabilité détectée :
1. Ne pas divulguer publiquement
2. Tester en environnement isolé
3. Corriger rapidement
4. Déployer les corrections

---

**⚠️ IMPORTANT** : Ce guide doit être mis à jour régulièrement avec les nouvelles menaces et bonnes pratiques de sécurité. 