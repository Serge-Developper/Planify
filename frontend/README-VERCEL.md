# Guide de déploiement Vercel - Planify

## 🚀 Déploiement sur Vercel

### Prérequis
- Compte GitHub/GitLab/Bitbucket avec votre projet
- Compte Vercel (gratuit)

### Étapes de déploiement

1. **Pousser votre code sur Git :**
   ```bash
   git add .
   git commit -m "Préparation déploiement Vercel"
   git push origin main
   ```

2. **Connecter à Vercel :**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Add New..." → "Project"
   - Importez votre dépôt Git
   - Configurez :
     - **Framework Preset :** Vite
     - **Root Directory :** `frontend`
     - **Build Command :** `npm run build`
     - **Output Directory :** `dist`

3. **Variables d'environnement à configurer dans Vercel :**
   - `MONGODB_URI` : Votre URI MongoDB Atlas
   - `JWT_SECRET` : Votre clé secrète JWT
   - `VITE_API_URL` : `/api`
   - `NODE_ENV` : `production`
   - `ALLOWED_ORIGINS` : L'URL de votre app Vercel

4. **Déployer :**
   - Cliquez sur "Deploy"
   - Attendez la fin du build
   - Votre site sera accessible à : `https://your-project-name.vercel.app`

### Structure du projet
```
frontend/
├── src/           # Code Vue.js
├── api/           # API Vercel Functions
│   ├── index.js   # Point d'entrée API
│   ├── routes/    # Routes Express
│   ├── models/    # Modèles MongoDB
│   └── middlewares/ # Middlewares
├── vercel.json    # Configuration Vercel
└── package.json   # Dépendances frontend
```

### Routes API disponibles
- `/api/users` - Gestion des utilisateurs
- `/api/items` - Gestion des items
- `/api/events` - Gestion des événements
- `/api/coins` - Système de monnaie
- `/api/contact` - Contact
- `/api/health` - Test de santé

### Avantages Vercel
- ✅ Déploiement automatique
- ✅ CDN global
- ✅ HTTPS automatique
- ✅ Fonctions serverless
- ✅ Monitoring intégré
- ✅ Gratuit pour projets personnels
