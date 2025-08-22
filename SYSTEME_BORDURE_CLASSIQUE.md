# 🎨 Système de Bordure Classique - Planify

## 📋 **Vue d'ensemble**

Le système de "Bordure Classique" permet aux utilisateurs de personnaliser la bordure de leur avatar avec différentes couleurs et dégradés. C'est un item spécial qui fonctionne différemment des autres items de la boutique.

## 🎯 **Fonctionnalités principales**

### **1. Item "Bordure Classique"**
- **ID :** 0
- **Nom :** "Bordure Classique"
- **Prix :** 0 (gratuit pour tous)
- **Type :** `border`
- **Bordure par défaut :** `3px solid #000000` (noir)

### **2. Boutique Hebdomadaire**
- **Couleurs unies :** 44 couleurs différentes (IDs 100-143)
- **Dégradés :** 25 dégradés différents (IDs 200-224)
- **Prix :** 30-80 coins selon la complexité

### **3. Personnalisation**
- Sélection des couleurs débloquées dans la collection
- Sauvegarde automatique dans localStorage
- Application immédiate sur l'avatar

## 🎨 **Couleurs disponibles**

### **Couleurs unies (30-50 coins)**
- **Basiques :** Noir, Blanc, Gris clair, Gris foncé
- **Primaires :** Rouge, Bleu, Vert, Jaune, Violet, Orange, Rose, Cyan, Marron
- **Spéciales :** Vert citron, Bleu marine, Or, Argent, Rouge foncé, Teal, etc.
- **Claires :** Rose clair, Orange clair, Rouge clair, Marron clair, etc.

### **Dégradés (80 coins)**
- **Rouge-Bleu :** `linear-gradient(to bottom right, #FF0000, #8A2BE2, #0000FF)`
- **Vert-Cyan :** `linear-gradient(to bottom right, #00FF00, #00FFFF)`
- **Cyan-Violet :** `linear-gradient(to right, #00FFFF, #8A2BE2)`
- **Jaune-Orange :** `linear-gradient(to bottom right, #FFFF00, #FF4500)`
- **Violet-Vert :** `linear-gradient(to bottom right, #8A2BE2, #32CD32)`
- **Et 20 autres dégradés...**

## 🔧 **Implémentation technique**

### **Frontend (Vue.js)**

#### **ShopPopup.vue**
```javascript
// Item "Bordure Classique" dans la collection
{
  id: 0,
  name: 'Bordure Classique',
  price: 0,
  img: null,
  type: 'border',
  defaultBorder: '3px solid #000000'
}

// Couleurs de bordure dans la boutique hebdomadaire
{ id: 100, name: 'Bordure Noire', price: 30, type: 'border-color', borderStyle: '3px solid #000000' }
{ id: 200, name: 'Dégradé Rouge-Bleu', price: 80, type: 'border-gradient', borderGradient: 'linear-gradient(...)' }
```

#### **Navbar.vue**
```javascript
// Style de bordure dynamique
const avatarBorderStyle = computed(() => {
  const selectedBorderColor = localStorage.getItem('selectedBorderColor')
  // Logique pour appliquer la bordure sélectionnée
})
```

### **Backend (Node.js)**

#### **Modèle User**
```javascript
purchasedItems: [{
  itemId: { type: Number, required: true },
  itemName: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
  equipped: { type: Boolean, default: false }
}]
```

#### **Route d'inscription**
```javascript
// Ajout automatique de l'item "Bordure Classique"
user.purchasedItems.push({
  itemId: 0,
  itemName: 'Bordure Classique',
  purchaseDate: new Date(),
  equipped: false
});
```

## 🚀 **Utilisation**

### **Pour les utilisateurs :**

1. **Accès automatique :** L'item "Bordure Classique" est automatiquement disponible
2. **Achat de couleurs :** Dans la boutique hebdomadaire, acheter les couleurs souhaitées
3. **Personnalisation :** Dans la collection, sélectionner une couleur débloquée
4. **Application :** La bordure s'applique immédiatement à l'avatar

### **Pour les développeurs :**

1. **Ajout de nouvelles couleurs :** Modifier `allWeeklyItems` dans `ShopPopup.vue`
2. **Modification des prix :** Ajuster les prix dans le tableau des items
3. **Ajout de dégradés :** Créer de nouveaux dégradés CSS

## 📁 **Fichiers modifiés**

### **Frontend**
- `frontend/src/components/ShopPopup.vue` - Boutique et collection
- `frontend/src/components/Navbar.vue` - Application de la bordure

### **Backend**
- `backend2/routes/users.js` - Ajout automatique aux nouveaux utilisateurs
- `backend2/add-border-classic-to-users.js` - Script pour les utilisateurs existants

## 🎨 **Styles CSS**

```css
/* Prévisualisation des bordures */
.border-preview {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #fff;
}

/* Sélecteur de couleur */
.border-color-selector select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}
```

## 🔄 **Synchronisation**

- **localStorage :** Sauvegarde de la couleur sélectionnée
- **Base de données :** Sauvegarde des items achetés
- **Temps réel :** Application immédiate des changements

## 🎯 **Prochaines améliorations possibles**

1. **Animations :** Bordures animées
2. **Effets spéciaux :** Bordures avec motifs
3. **Personnalisation avancée :** Épaisseur et style de bordure
4. **Collections :** Thèmes de couleurs prédéfinis
5. **Statistiques :** Couleurs les plus populaires

---

*Système développé pour Planify - Personnalisation d'avatars avec bordures colorées* 