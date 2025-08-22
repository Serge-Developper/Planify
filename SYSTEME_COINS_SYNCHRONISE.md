# Système de Planify Coins Synchronisé

## 🎯 Objectif
Synchroniser le système de Planify Coins avec les comptes utilisateurs pour que chaque utilisateur ait ses propres coins gagnés via la roulette, et que les achats dans la boutique déduisent automatiquement les coins du compte connecté.

## 🔧 Fonctionnalités Implémentées

### Backend (Node.js/Express)

#### 1. **Modèle User mis à jour** (`backend2/models/User.js`)
- ✅ `purchasedItems[]` : Liste des items achetés par l'utilisateur
- ✅ `equippedItemId` : ID de l'item actuellement équipé
- ✅ `coins` : Solde de Planify Coins (existant)
- ✅ `lastSpinDate` : Date du dernier spin (existant)

#### 2. **Routes API étendues** (`backend2/routes/coins-simple.js`)
- ✅ `GET /api/coins/user-coins` : Récupérer le solde
- ✅ `GET /api/coins/inventory` : Récupérer l'inventaire des items
- ✅ `POST /api/coins/purchase` : Acheter un item
- ✅ `POST /api/coins/equip` : Équiper un item
- ✅ `POST /api/coins/unequip` : Déséquiper un item
- ✅ `POST /api/coins/spin-wheel` : Tourner la roulette (existant)

### Frontend (Vue.js/Pinia)

#### 3. **Store Pinia pour les coins** (`frontend/src/stores/coins.ts`)
- ✅ Gestion centralisée de l'état des coins
- ✅ Synchronisation avec l'API
- ✅ Gestion de l'inventaire et des équipements
- ✅ Actions pour achats, équipements, roulette

#### 4. **Composants mis à jour**
- ✅ **Navbar.vue** : Utilise le store pour afficher le solde et gérer les équipements
- ✅ **ShopPopup.vue** : Achats synchronisés avec le compte utilisateur
- ✅ **CustomFortuneWheel.vue** : Roulette connectée au store

## 🚀 Installation et Configuration

### 1. **Migration de la base de données**
```bash
cd backend2
node migrate-coins.js
```

### 2. **Redémarrage du serveur**
```bash
cd backend2
npm start
```

### 3. **Redémarrage du frontend**
```bash
cd frontend
npm run dev
```

## 📋 Workflow Utilisateur

### **Connexion**
1. L'utilisateur se connecte
2. Le store se charge automatiquement avec :
   - Solde de coins
   - Inventaire des items achetés
   - Item équipé actuellement

### **Roulette de la Fortune**
1. L'utilisateur clique sur la roulette
2. Le système vérifie s'il peut tourner (1 fois par jour)
3. Si oui, l'API détermine la récompense
4. Les coins sont ajoutés au compte utilisateur
5. L'animation s'affiche avec le résultat

### **Achat dans la Boutique**
1. L'utilisateur sélectionne un item
2. Le système vérifie :
   - Si l'utilisateur a assez de coins
   - Si l'item n'est pas déjà acheté
3. Si tout est OK :
   - Les coins sont déduits du compte
   - L'item est ajouté à l'inventaire
   - Le solde est mis à jour en temps réel

### **Équipement d'Items**
1. L'utilisateur clique sur "Équiper" pour un item acheté
2. L'item précédemment équipé est déséquipé
3. Le nouvel item est équipé
4. L'interface se met à jour pour afficher l'item équipé

## 🔒 Sécurité

- ✅ Authentification requise pour toutes les routes coins
- ✅ Validation côté serveur des achats
- ✅ Vérification des fonds avant achat
- ✅ Protection contre les achats multiples du même item
- ✅ Logs des transactions

## 📊 Données Stockées

### **Utilisateur**
```javascript
{
  username: "john_doe",
  coins: 1250,
  lastSpinDate: "2024-01-15T10:30:00Z",
  purchasedItems: [
    {
      itemId: 1,
      itemName: "Oreillettes de chat",
      purchaseDate: "2024-01-10T14:20:00Z",
      equipped: false
    },
    {
      itemId: 2,
      itemName: "Clown",
      purchaseDate: "2024-01-12T09:15:00Z",
      equipped: true
    }
  ],
  equippedItemId: 2
}
```

## 🎮 Items Disponibles

| ID | Nom | Prix | Description |
|----|-----|------|-------------|
| 1 | Oreillettes de chat | 50 | Oreillettes de chat animées |
| 2 | Clown | 80 | Perruque et nez de clown |
| 3 | Cash | 60 | Animation d'argent |
| 4 | 8-Bit | 70 | Effet pixelisé |
| 5 | Cible | 100 | Animation de cible |
| 6 | Roi | 90 | Couronne royale |
| 7 | Matrix | 110 | Effet Matrix |
| 8 | Ange | 120 | Ailes d'ange |
| 9 | Tomb Raider | 130 | Lara Croft |
| 10 | Étoiles | 85 | Animation d'étoiles |
| 11 | Cadre royale | 95 | Cadre doré |
| 12 | Rose | 105 | Animation de rose |
| 13 | Gentleman | 115 | Moustache et chapeau |
| 14 | Vinyle | 135 | Disque vinyle |
| 15 | Advisory | 145 | Animation advisory |
| 16 | Espace | 155 | Animation spatiale |
| 17 | Absolute Cinema | 120 | Bras de cinéma |
| 18 | Flash | 125 | Flash de caméra |
| 19 | Miaou | 130 | Chat et patte |
| 20 | DVD | 135 | Logo DVD |
| 21 | Lunettes pixel | 140 | Lunettes pixelisées |
| 22 | 2000 | 145 | Nokia + Clippy + Daft Punk |

## 🔄 Synchronisation en Temps Réel

- ✅ Le solde se met à jour automatiquement après chaque action
- ✅ L'inventaire se synchronise entre tous les composants
- ✅ Les équipements sont persistants entre les sessions
- ✅ La roulette respecte la limite d'une fois par jour

## 🐛 Dépannage

### **Problème : Les coins ne se chargent pas**
- Vérifier que l'utilisateur est connecté
- Vérifier les logs du serveur
- Vérifier la connexion à MongoDB

### **Problème : Achat impossible**
- Vérifier le solde de l'utilisateur
- Vérifier que l'item n'est pas déjà acheté
- Vérifier les logs d'erreur

### **Problème : Roulette bloquée**
- Vérifier la date du dernier spin
- Vérifier que l'utilisateur n'a pas déjà tourné aujourd'hui

## 📈 Évolutions Futures

- [ ] Historique des transactions
- [ ] Notifications push pour les gains
- [ ] Système de cadeaux entre utilisateurs
- [ ] Items saisonniers/événementiels
- [ ] Statistiques d'utilisation
- [ ] Système de niveaux basé sur les coins 