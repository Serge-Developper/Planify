# Test Postman - Endpoint spin-status

## Test à effectuer dans Postman

### 1. Configuration de la requête
- **Méthode:** GET
- **URL:** `https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr/api/coins/spin-status`

### 2. Headers requis
```
Authorization: Bearer eyJhbGciOiJIUzI1NilsInR5cCl6lkp... (votre token JWT)
Content-Type: application/json
```

### 3. Réponse attendue (si l'endpoint fonctionne)
```json
{
  "success": true,
  "canSpin": true,
  "lastSpinDate": null
}
```

### 4. Si vous obtenez encore une erreur 404
Cela confirmerait que l'endpoint `/spin-status` n'est pas déployé sur le serveur.

## Solution : Redéployer le fichier coins-simple.js

Le fichier `backend2/routes/coins-simple.js` contient l'endpoint `/spin-status` à la ligne 218.
Il faut redéployer ce fichier sur IONOS Plesk.

### Étapes de redéploiement :
1. Connectez-vous à votre panneau de contrôle IONOS Plesk
2. Allez dans "Fichiers" ou "File Manager"
3. Naviguez vers le dossier de votre backend API
4. Uploadez le fichier `routes/coins-simple.js`
5. Redémarrez l'application Node.js si nécessaire 