# 🎉 Système Weekend Bonus x2 - Planify

## 📋 Vue d'ensemble

Le système Weekend Bonus x2 double automatiquement toutes les récompenses de la roue de la fortune pendant les weekends (samedi et dimanche). Ce système encourage les utilisateurs à jouer plus activement pendant les weekends.

## 🎯 Fonctionnalités

### ✅ Détection automatique du weekend
- **Samedi** (jour 6) : Bonus actif
- **Dimanche** (jour 0) : Bonus actif
- **Lundi à Vendredi** (jours 1-5) : Bonus inactif

### ✅ Récompenses doublées
- **10 coins** → **20 coins**
- **20 coins** → **40 coins**
- **30 coins** → **60 coins**
- **50 coins** → **100 coins**
- **70 coins** → **140 coins**
- **100 coins** → **200 coins**
- **Perdu** → **Perdu** (inchangé)

### ✅ Interface utilisateur
- Badge animé "🎉 WEEKEND BONUS x2 !"
- Segments de la roue adaptés visuellement
- Messages personnalisés
- Animation CSS avec dégradé coloré

## 🔧 Implémentation technique

### Backend (Node.js/Express)

#### Fichiers modifiés :
- `backend2/routes/coins-simple.js`
- `frontend/backend2/routes/coins-simple.js`

#### Logique de weekend bonus :
```javascript
// Vérifier si c'est le weekend
const dayOfWeek = now.getDay();
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

// Doubler les récompenses pendant les weekends
let finalCoins = reward.coins;
if (isWeekend && reward.coins > 0) {
  finalCoins = reward.coins * 2;
}
```

#### Réponse API enrichie :
```javascript
{
  success: true,
  coinsWon: finalCoins,
  newCoins: user.coins,
  rewardName: reward.name,
  isWeekendBonus: isWeekendBonus,
  originalCoins: reward.coins,
  message: message
}
```

### Frontend (Vue.js)

#### Fichiers modifiés :
- `frontend/src/components/Navbar.vue`

#### Détection du weekend :
```javascript
const isWeekend = computed(() => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
});
```

#### Segments adaptatifs :
```javascript
const wheelSegments = computed(() => {
  if (isWeekend.value) {
    return baseSegments.map(segment => {
      if (segment.label === 'Perdu') return segment;
      const coins = parseInt(segment.label.match(/\d+/)?.[0] || '0');
      return { ...segment, label: `${coins * 2} coins` };
    });
  }
  return baseSegments;
});
```

#### Style CSS animé :
```css
.weekend-bonus {
  background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4ecdc4);
  background-size: 400% 400%;
  animation: weekendGradient 2s ease-in-out infinite;
}
```

## 🧪 Tests

### Scripts de test disponibles :
- `backend2/test-weekend-bonus.js` - Test backend
- `frontend/test-weekend-bonus.js` - Test frontend

### Exécution des tests :
```bash
# Test backend
cd backend2
node test-weekend-bonus.js

# Test frontend
cd frontend
node test-weekend-bonus.js
```

## 📊 Comportement attendu

### En semaine (Lundi-Vendredi) :
- ✅ Récompenses normales
- ❌ Pas de badge weekend
- ❌ Pas d'animation spéciale
- ✅ Messages standards

### En weekend (Samedi-Dimanche) :
- ✅ Récompenses doublées
- ✅ Badge "🎉 WEEKEND BONUS x2 !"
- ✅ Animation CSS active
- ✅ Messages personnalisés
- ✅ Segments visuellement adaptés

## 🔄 Workflow utilisateur

1. **L'utilisateur ouvre la roue de la fortune**
2. **Le système détecte automatiquement si c'est le weekend**
3. **Si c'est le weekend :**
   - Badge animé affiché
   - Segments montrent les valeurs doublées
   - Messages adaptés
4. **L'utilisateur tourne la roue**
5. **Le backend applique le bonus x2**
6. **L'utilisateur reçoit sa récompense doublée**

## 🎨 Interface utilisateur

### Indicateur visuel :
- **Badge animé** avec dégradé coloré
- **Animation continue** pendant 2 secondes
- **Couleurs** : Rouge, Jaune, Vert, Cyan
- **Position** : À côté du titre de la roue

### Messages personnalisés :
- **Weekend** : "🎉 WEEKEND BONUS x2 ! Félicitations ! Vous avez gagné X coins !"
- **Semaine** : "🎉 Félicitations ! Vous avez gagné X coins !"
- **Perdu** : "😔 Dommage, vous n'avez rien gagné cette fois-ci !"

## 🚀 Déploiement

### Prérequis :
- Backend Node.js opérationnel
- Frontend Vue.js compilé
- Base de données MongoDB connectée

### Vérification post-déploiement :
1. Tester en semaine (récompenses normales)
2. Tester en weekend (récompenses doublées)
3. Vérifier l'affichage du badge
4. Contrôler les messages
5. Valider les animations CSS

## 📈 Impact attendu

### Objectifs :
- ✅ Augmentation de l'engagement weekend
- ✅ Récompense des utilisateurs actifs
- ✅ Expérience utilisateur améliorée
- ✅ Différenciation weekend/semaine

### Métriques à surveiller :
- Nombre de spins en weekend vs semaine
- Satisfaction utilisateur
- Taux de rétention weekend
- Utilisation des coins gagnés

## 🔧 Maintenance

### Points de contrôle réguliers :
- ✅ Détection correcte des weekends
- ✅ Calculs de récompenses
- ✅ Affichage des interfaces
- ✅ Performance des animations

### Logs à surveiller :
- Erreurs de calcul de bonus
- Problèmes d'affichage
- Anomalies de récompenses

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Auteur** : Assistant IA  
**Statut** : ✅ Implémenté et testé 