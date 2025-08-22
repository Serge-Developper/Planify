# Test Postman - Route spin-status

## 1. Test de la route existante
D'abord, testons une route qui fonctionne pour vérifier que l'API est accessible :

**GET** `https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr/api/coins/user-coins`

**Headers :**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## 2. Test de la route spin-status
**GET** `https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr/api/coins/spin-status`

**Headers :**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## 3. Vérification des routes disponibles
Testons aussi :
- `GET /api/coins/inventory`
- `POST /api/coins/spin-wheel`

## Résultats attendus

### Si la route user-coins fonctionne mais pas spin-status :
❌ **Le backend n'est pas à jour** - Il faut déployer le nouveau code

### Si aucune route ne fonctionne :
❌ **Problème de serveur** - Vérifier Plesk

### Si toutes les routes fonctionnent :
✅ **Le backend est à jour** - Problème ailleurs

## Token JWT
Pour obtenir un token valide, connectez-vous sur le site et récupérez le token depuis :
- LocalStorage > `auth_token`
- Ou cookies > `token` 