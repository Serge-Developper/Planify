# Guide de Déploiement Planify sur IONOS

## Configuration Backend

### 1. Variables d'environnement (.env)
```env
MONGO_URI=mongodb://localhost:27017/planify
JWT_SECRET=votre_secret_jwt_super_securise
PORT=3000
```

### 2. Configuration CORS
- Le fichier `app.js` est configuré pour laisser Plesk gérer les CORS
- En local, décommentez la ligne `app.use(cors());` pour le développement

### 3. Déploiement sur IONOS
1. Uploadez le dossier `backend2/` dans le sous-domaine `api.planify.tovmassian.but24.mmi-nancy.fr`
2. Configurez Node.js dans Plesk (version 18+)
3. Installez les dépendances : `npm install`
4. Démarrez l'application : `npm start`

## Configuration Frontend

### 1. Variables d'environnement
Créez un fichier `.env.production` :
```env
VITE_API_URL=https://api.planify.tovmassian.but24.mmi-nancy.fr/api
NODE_ENV=production
```

### 2. Build de production
```bash
cd frontend
npm run build
```

### 3. Déploiement sur IONOS
1. Uploadez le contenu du dossier `dist/` dans le sous-domaine `planify.tovmassian.but24.mmi-nancy.fr`
2. Le fichier `.htaccess` est déjà configuré pour le routing SPA

## Structure des sous-domaines

- **Frontend** : `https://planify.tovmassian.but24.mmi-nancy.fr`
- **Backend** : `https://api.planify.tovmassian.but24.mmi-nancy.fr`

## Test de la configuration

### Backend
```bash
curl https://api.planify.tovmassian.but24.mmi-nancy.fr/
# Devrait retourner : "API Planifyvrai2 en ligne"
```

### Frontend
- Ouvrez `https://planify.tovmassian.but24.mmi-nancy.fr`
- Testez la connexion avec les utilisateurs de test
- Vérifiez que les appels API fonctionnent

## Utilisateurs de test
```bash
# Créer les utilisateurs de test
curl -X POST https://api.planify.tovmassian.but24.mmi-nancy.fr/api/users/seed

# Créer les événements de test
curl -X POST https://api.planify.tovmassian.but24.mmi-nancy.fr/api/events/seed
```

## Dépannage

### Erreur CORS
- Vérifiez que le backend est bien sur le sous-domaine `api.`
- Vérifiez la configuration Plesk pour les CORS

### Erreur de connexion MongoDB
- Vérifiez l'URI MongoDB dans les variables d'environnement
- Vérifiez que la base de données est accessible

### Erreur de build frontend
- Vérifiez que `VITE_API_URL` est correctement défini
- Vérifiez que le build se fait sans erreur TypeScript 