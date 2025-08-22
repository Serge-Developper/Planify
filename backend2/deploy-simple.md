# Guide de Déploiement IONOS Plesk - Backend

## Problème identifié
L'endpoint `/api/coins/spin-status` retourne une erreur 404, ce qui indique que le backend déployé n'est pas à jour.

## Solution : Redéployer le backend

### 1. Préparation des fichiers
```bash
# Dans le dossier backend2
npm install
```

### 2. Déploiement sur IONOS Plesk

#### Option A: Via FTP/SFTP
1. Connectez-vous à votre serveur IONOS via FTP
2. Naviguez vers le dossier du backend (probablement `/httpdocs/api/` ou `/api/`)
3. Uploadez tous les fichiers du dossier `backend2/` :
   - `app.js`
   - `package.json`
   - `routes/coins-simple.js` (contient l'endpoint spin-status)
   - `models/User.js`
   - `middlewares/auth.js`
   - `node_modules/` (ou laissez Plesk installer les dépendances)

#### Option B: Via Git (si configuré)
```bash
git add .
git commit -m "Fix: Ajout endpoint spin-status"
git push origin main
```

### 3. Redémarrage du serveur
Dans Plesk :
1. Allez dans "Node.js"
2. Cliquez sur "Restart" pour votre application
3. Vérifiez les logs pour s'assurer qu'il n'y a pas d'erreurs

### 4. Vérification
Testez l'endpoint après déploiement :
```bash
curl https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr/api/coins/spin-status
```

## Fichiers critiques à vérifier
- ✅ `routes/coins-simple.js` - Contient l'endpoint `/spin-status`
- ✅ `app.js` - Configure les routes `/api/coins`
- ✅ `package.json` - Dépendances
- ✅ `.env` - Variables d'environnement (MONGO_URI, JWT_SECRET)

## Si le problème persiste
1. Vérifiez les logs dans Plesk
2. Testez avec Postman
3. Vérifiez que MongoDB Atlas est accessible
4. Vérifiez les variables d'environnement dans Plesk 