# 🧪 PLAN COMPLET DE TESTS FONCTIONNELS - PLANIFY

## 📋 **INTRODUCTION**
Ce document contient tous les tests à effectuer pour valider le bon fonctionnement du site Planify. Les tests sont organisés par pages et fonctionnalités.

---

## 🏠 **PAGE D'ACCUEIL (HomeView.vue)**

### **Navigation et Interface**
- [ ] **Test 1.1** : La page d'accueil se charge-t-elle correctement ?
- [ ] **Test 1.2** : La navbar est-elle visible et fonctionnelle ?
- [ ] **Test 1.3** : Le footer est-il présent en bas de page ?
- [ ] **Test 1.4** : Les liens de navigation fonctionnent-ils (Accueil, Devoirs, À propos, Contact) ?
- [ ] **Test 1.5** : Le logo Planify s'affiche-t-il correctement ?

### **Responsive Design**
- [ ] **Test 1.6** : La page s'adapte-t-elle aux écrans mobiles (< 768px) ?
- [ ] **Test 1.7** : La page s'adapte-t-elle aux tablettes (768px - 1024px) ?
- [ ] **Test 1.8** : La page s'adapte-t-elle aux écrans desktop (> 1024px) ?
- [ ] **Test 1.9** : Le menu burger mobile s'affiche-t-il sur mobile ?
- [ ] **Test 1.10** : Le menu burger s'ouvre-t-il et se ferme-t-il correctement ?

### **Contenu Principal**
- [ ] **Test 1.11** : Le titre principal "Planify" est-il visible ?
- [ ] **Test 1.12** : Les sous-titres et descriptions sont-ils lisibles ?
- [ ] **Test 1.13** : Les images et icônes s'affichent-elles correctement ?
- [ ] **Test 1.14** : Les animations CSS fonctionnent-elles (si présentes) ?

---

## 🔐 **SYSTÈME D'AUTHENTIFICATION**

### **Connexion**
- [ ] **Test 2.1** : Le bouton "Se connecter" dans la navbar ouvre-t-il la popup de connexion ?
- [ ] **Test 2.2** : La popup de connexion s'affiche-t-elle correctement ?
- [ ] **Test 2.3** : Les champs email et mot de passe sont-ils présents ?
- [ ] **Test 2.4** : Le bouton "Se connecter" dans la popup fonctionne-t-il ?
- [ ] **Test 2.5** : La connexion avec des identifiants valides fonctionne-t-elle ?
- [ ] **Test 2.6** : La connexion avec des identifiants invalides affiche-t-elle une erreur ?
- [ ] **Test 2.7** : Le token d'authentification est-il sauvegardé dans le localStorage ?
- [ ] **Test 2.8** : Après connexion, l'utilisateur voit-il son avatar et nom dans la navbar ?

### **Déconnexion**
- [ ] **Test 2.9** : Le bouton "Se déconnecter" est-il visible pour un utilisateur connecté ?
- [ ] **Test 2.10** : La déconnexion supprime-t-elle le token du localStorage ?
- [ ] **Test 2.11** : Après déconnexion, l'utilisateur revient-il à l'état non connecté ?

### **Mot de passe oublié**
- [ ] **Test 2.12** : Le lien "Mot de passe oublié" est-il présent ?
- [ ] **Test 2.13** : La popup de mot de passe oublié s'ouvre-t-elle ?
- [ ] **Test 2.14** : L'envoi d'un email de réinitialisation fonctionne-t-il ?
- [ ] **Test 2.15** : Les questions secrètes fonctionnent-elles pour la récupération ?

### **Questions secrètes**
- [ ] **Test 2.16** : La configuration des questions secrètes fonctionne-t-elle ?
- [ ] **Test 2.17** : Les réponses aux questions secrètes sont-elles vérifiées correctement ?

---

## 🎰 **ROUE DE LA FORTUNE (Fortune Wheel)**

### **Affichage et Interface**
- [ ] **Test 3.1** : Le bouton de la roue de la fortune est-il visible dans la navbar ?
- [ ] **Test 3.2** : Le clic sur le bouton ouvre-t-il la modal de la roue ?
- [ ] **Test 3.3** : La modal de la roue s'affiche-t-elle correctement ?
- [ ] **Test 3.4** : Le titre "Roue de la Fortune" est-il visible ?
- [ ] **Test 3.5** : Le texte "Tous les weekends la roue est x2 !" est-il affiché ?
- [ ] **Test 3.6** : La roue elle-même s'affiche-t-elle avec tous ses segments ?

### **Fonctionnement du Spin**
- [ ] **Test 3.7** : Le bouton "Tourner" est-il présent et cliquable ?
- [ ] **Test 3.8** : La roue tourne-t-elle quand on clique sur "Tourner" ?
- [ ] **Test 3.9** : L'animation de rotation fonctionne-t-elle correctement ?
- [ ] **Test 3.10** : La roue s'arrête-t-elle sur un segment aléatoire ?
- [ ] **Test 3.11** : Le résultat du spin s'affiche-t-il correctement ?

### **Bonus Weekend (x2)**
- [ ] **Test 3.12** : Le badge "WEEKEND BONUS x2 !" s'affiche-t-il les weekends ?
- [ ] **Test 3.13** : Les récompenses sont-elles doublées les samedis et dimanches ?
- [ ] **Test 3.14** : Le message "🎉 WEEKEND BONUS x2 !" apparaît-il les weekends ?
- [ ] **Test 3.15** : Les segments de la roue affichent-ils les valeurs x2 les weekends ?

### **Limitations et Cooldown**
- [ ] **Test 3.16** : Un seul spin par jour est-il autorisé ?
- [ ] **Test 3.17** : Le bouton "Tourner" est-il désactivé après un spin ?
- [ ] **Test 3.18** : Le message "Vous avez déjà tourné aujourd'hui" apparaît-il ?
- [ ] **Test 3.19** : Le compteur de temps restant fonctionne-t-il ?

### **Récompenses et Coins**
- [ ] **Test 3.20** : Les coins gagnés sont-ils ajoutés au solde de l'utilisateur ?
- [ ] **Test 3.21** : Le nouveau solde s'affiche-t-il immédiatement ?
- [ ] **Test 3.22** : Les différents segments donnent-ils les bonnes récompenses ?
- [ ] **Test 3.23** : Le segment "Perdu" donne-t-il bien 0 coins ?

---

## 🛒 **BOUTIQUE (ShopPopup.vue)**

### **Ouverture et Navigation**
- [ ] **Test 4.1** : Le bouton "Boutique" dans la navbar ouvre-t-il la popup ?
- [ ] **Test 4.2** : La popup de la boutique s'affiche-t-elle correctement ?
- [ ] **Test 4.3** : Les onglets "Collection" et "Leaderboard" sont-ils présents ?
- [ ] **Test 4.4** : La navigation entre les onglets fonctionne-t-elle ?

### **Onglet Collection**
- [ ] **Test 4.5** : Tous les 22 items sont-ils affichés dans la collection ?
- [ ] **Test 4.6** : Les images des items s'affichent-elles correctement ?
- [ ] **Test 4.7** : Les noms des items sont-ils lisibles ?
- [ ] **Test 4.8** : Les prix des items sont-ils affichés correctement ?
- [ ] **Test 4.9** : Les prix sont-ils à jour selon la liste fournie ?

### **Achat d'Items**
- [ ] **Test 4.10** : Le bouton "Acheter" est-il présent pour les items non possédés ?
- [ ] **Test 4.11** : Le bouton "Acheter" est-il désactivé si l'utilisateur n'a pas assez de coins ?
- [ ] **Test 4.12** : L'achat d'un item fonctionne-t-il avec suffisamment de coins ?
- [ ] **Test 4.13** : Le solde de coins diminue-t-il après un achat ?
- [ ] **Test 4.14** : L'item acheté apparaît-il dans l'inventaire ?
- [ ] **Test 4.15** : Un message de confirmation s'affiche-t-il après l'achat ?

### **Équipement d'Items**
- [ ] **Test 4.16** : Le bouton "Équiper" apparaît-il pour les items possédés ?
- [ ] **Test 4.17** : L'équipement d'un item fonctionne-t-il ?
- [ ] **Test 4.18** : Le bouton change-t-il en "Déséquiper" après équipement ?
- [ ] **Test 4.19** : Le déséquipement fonctionne-t-il ?
- [ ] **Test 4.20** : Un seul item peut-il être équipé à la fois ?

### **Affichage des Items Possédés**
- [ ] **Test 4.21** : Les items possédés sont-ils visuellement différents ?
- [ ] **Test 4.22** : Les items équipés sont-ils clairement identifiés ?
- [ ] **Test 4.23** : Le prix disparaît-il pour les items possédés ?

### **Onglet Leaderboard**
- [ ] **Test 4.24** : Le leaderboard s'affiche-t-il correctement ?
- [ ] **Test 4.25** : Les utilisateurs sont-ils triés par nombre de coins ?
- [ ] **Test 4.26** : Les avatars des utilisateurs s'affichent-ils ?
- [ ] **Test 4.27** : Les items équipés sont-ils visibles sur les avatars ?
- [ ] **Test 4.28** : L'effet Matrix s'affiche-t-il correctement sur les avatars ?

### **Responsive Boutique**
- [ ] **Test 4.29** : La boutique s'adapte-t-elle aux écrans mobiles ?
- [ ] **Test 4.30** : Les items sont-ils bien alignés sur mobile ?
- [ ] **Test 4.31** : Les boutons restent-ils cliquables sur mobile ?

---

## 🎭 **EFFETS VISUELS DES ITEMS**

### **Effet Matrix**
- [ ] **Test 5.1** : L'effet Matrix s'affiche-t-il dans la navbar quand équipé ?
- [ ] **Test 5.2** : L'effet Matrix s'affiche-t-il dans le menu burger mobile ?
- [ ] **Test 5.3** : L'effet Matrix s'affiche-t-il dans le leaderboard ?
- [ ] **Test 5.4** : Les caractères Matrix tombent-ils correctement ?
- [ ] **Test 5.5** : L'effet est-il positionné correctement sur l'avatar ?

### **Autres Effets Visuels**
- [ ] **Test 5.6** : Les oreilles de chat s'affichent-elles correctement ?
- [ ] **Test 5.7** : L'effet clown (nez rouge) fonctionne-t-il ?
- [ ] **Test 5.8** : Les ailes d'ange s'affichent-elles ?
- [ ] **Test 5.9** : L'effet Tomb Raider fonctionne-t-il ?
- [ ] **Test 5.10** : Tous les autres effets visuels s'affichent-ils ?

### **Responsive des Effets**
- [ ] **Test 5.11** : Les effets s'adaptent-ils aux différentes tailles d'écran ?
- [ ] **Test 5.12** : Les effets restent-ils visibles sur mobile ?

---

## 📚 **PAGE DEVOIRS (EmploiDuTemps.vue)**

### **Navigation et Affichage**
- [ ] **Test 6.1** : Le lien "Devoirs" mène-t-il à la bonne page ?
- [ ] **Test 6.2** : La page de devoirs se charge-t-elle correctement ?
- [ ] **Test 6.3** : Le titre "Devoirs" est-il visible ?
- [ ] **Test 6.4** : La grille des devoirs s'affiche-t-elle ?

### **Fonctionnalités des Devoirs**
- [ ] **Test 6.5** : L'ajout d'un nouveau devoir fonctionne-t-il ?
- [ ] **Test 6.6** : La modification d'un devoir existant fonctionne-t-il ?
- [ ] **Test 6.7** : La suppression d'un devoir fonctionne-t-il ?
- [ ] **Test 6.8** : Les devoirs sont-ils sauvegardés en base de données ?
- [ ] **Test 6.9** : Les devoirs se rechargent-ils après actualisation de la page ?

### **Responsive Devoirs**
- [ ] **Test 6.10** : La page de devoirs s'adapte-t-elle aux mobiles ?
- [ ] **Test 6.11** : La grille reste-t-elle lisible sur petit écran ?

---

## ℹ️ **PAGE À PROPOS (AboutView.vue)**

### **Contenu et Affichage**
- [ ] **Test 7.1** : Le lien "À propos" mène-t-il à la bonne page ?
- [ ] **Test 7.2** : La page se charge-t-elle correctement ?
- [ ] **Test 7.3** : Le contenu de la page est-il lisible ?
- [ ] **Test 7.4** : Les images et icônes s'affichent-elles ?

### **Responsive À Propos**
- [ ] **Test 7.5** : La page s'adapte-t-elle aux différentes tailles d'écran ?

---

## 📞 **PAGE CONTACT (ContactView.vue)**

### **Formulaire de Contact**
- [ ] **Test 8.1** : Le lien "Contact" mène-t-il à la bonne page ?
- [ ] **Test 8.2** : Le formulaire de contact s'affiche-t-il ?
- [ ] **Test 8.3** : Tous les champs sont-ils présents (nom, email, message) ?
- [ ] **Test 8.4** : L'envoi du formulaire fonctionne-t-il ?
- [ ] **Test 8.5** : Une confirmation d'envoi s'affiche-t-elle ?
- [ ] **Test 8.6** : Les messages d'erreur s'affichent-ils si les champs sont vides ?

### **Responsive Contact**
- [ ] **Test 8.7** : Le formulaire s'adapte-t-il aux mobiles ?

---

## 👨‍💼 **PANNEAU ADMIN (AdminDashboard.vue)**

### **Accès et Sécurité**
- [ ] **Test 9.1** : L'accès à `/admin` est-il protégé ?
- [ ] **Test 9.2** : Un utilisateur non-admin est-il redirigé vers l'accueil ?
- [ ] **Test 9.3** : Seuls les admins peuvent-ils accéder au panneau ?
- [ ] **Test 9.4** : Le panneau admin se charge-t-il pour un admin ?

### **Gestion des Utilisateurs**
- [ ] **Test 9.5** : La liste des utilisateurs s'affiche-t-elle ?
- [ ] **Test 9.6** : Les informations des utilisateurs sont-elles correctes ?
- [ ] **Test 9.7** : La suppression d'un utilisateur fonctionne-t-elle ?
- [ ] **Test 9.8** : La modification du rôle d'un utilisateur fonctionne-t-elle ?
- [ ] **Test 9.9** : La réinitialisation du mot de passe fonctionne-t-elle ?

### **Gestion des Événements**
- [ ] **Test 9.10** : La liste des événements s'affiche-t-elle ?
- [ ] **Test 9.11** : L'ajout d'un événement fonctionne-t-il ?
- [ ] **Test 9.12** : La modification d'un événement fonctionne-t-il ?
- [ ] **Test 9.13** : La suppression d'un événement fonctionne-t-il ?

### **Statistiques**
- [ ] **Test 9.14** : Les statistiques s'affichent-elles correctement ?
- [ ] **Test 9.15** : Les compteurs sont-ils à jour ?

### **Responsive Admin**
- [ ] **Test 9.16** : Le panneau admin s'adapte-t-il aux mobiles ?

---

## 🔧 **BACKEND ET API**

### **Routes d'Authentification**
- [ ] **Test 10.1** : La route `/auth/login` fonctionne-t-elle ?
- [ ] **Test 10.2** : La route `/auth/register` fonctionne-t-elle ?
- [ ] **Test 10.3** : La route `/auth/forgot-password` fonctionne-t-elle ?
- [ ] **Test 10.4** : La route `/auth/reset-password` fonctionne-t-elle ?

### **Routes des Coins**
- [ ] **Test 10.5** : La route `/coins/user-coins` retourne-t-elle le bon solde ?
- [ ] **Test 10.6** : La route `/coins/spin-wheel` fonctionne-t-elle ?
- [ ] **Test 10.7** : La route `/coins/spin-status` fonctionne-t-elle ?
- [ ] **Test 10.8** : La route `/coins/purchase` fonctionne-t-elle ?
- [ ] **Test 10.9** : La route `/coins/equip` fonctionne-t-elle ?
- [ ] **Test 10.10** : La route `/coins/unequip` fonctionne-t-elle ?
- [ ] **Test 10.11** : La route `/coins/inventory` fonctionne-t-elle ?

### **Routes des Utilisateurs**
- [ ] **Test 10.12** : La route `/users/profile` fonctionne-t-elle ?
- [ ] **Test 10.13** : La route `/users/update` fonctionne-t-elle ?
- [ ] **Test 10.14** : La route `/users/delete` fonctionne-t-elle ?

### **Routes des Événements**
- [ ] **Test 10.15** : La route `/events` (GET) fonctionne-t-elle ?
- [ ] **Test 10.16** : La route `/events` (POST) fonctionne-t-elle ?
- [ ] **Test 10.17** : La route `/events/:id` (PUT) fonctionne-t-elle ?
- [ ] **Test 10.18** : La route `/events/:id` (DELETE) fonctionne-t-elle ?

### **Sécurité et Middleware**
- [ ] **Test 10.19** : Le middleware d'authentification fonctionne-t-il ?
- [ ] **Test 10.20** : Le middleware de rate limiting fonctionne-t-il ?
- [ ] **Test 10.21** : Les routes protégées sont-elles bien sécurisées ?

### **Base de Données**
- [ ] **Test 10.22** : La connexion à MongoDB fonctionne-t-elle ?
- [ ] **Test 10.23** : Les opérations CRUD fonctionnent-elles ?
- [ ] **Test 10.24** : Les index de la base de données sont-ils corrects ?

---

## 📱 **TESTS RESPONSIVE COMPLETS**

### **Mobile (< 768px)**
- [ ] **Test 11.1** : Toutes les pages s'affichent-elles correctement sur mobile ?
- [ ] **Test 11.2** : Le menu burger fonctionne-t-il sur toutes les pages ?
- [ ] **Test 11.3** : Les popups s'ouvrent-elles correctement sur mobile ?
- [ ] **Test 11.4** : Les formulaires sont-ils utilisables sur mobile ?
- [ ] **Test 11.5** : Les boutons sont-ils assez grands pour être cliqués ?

### **Tablette (768px - 1024px)**
- [ ] **Test 11.6** : L'interface s'adapte-t-elle bien aux tablettes ?
- [ ] **Test 11.7** : Les grilles et layouts restent-ils lisibles ?

### **Desktop (> 1024px)**
- [ ] **Test 11.8** : L'interface utilise-t-elle bien l'espace disponible ?
- [ ] **Test 11.9** : Les animations et effets fonctionnent-ils ?

---

## 🔒 **TESTS DE SÉCURITÉ**

### **Authentification**
- [ ] **Test 12.1** : Les mots de passe sont-ils hashés en base ?
- [ ] **Test 12.2** : Les tokens JWT sont-ils valides ?
- [ ] **Test 12.3** : Les tokens expirent-ils correctement ?
- [ ] **Test 12.4** : La déconnexion invalide-t-elle le token ?

### **Autorisations**
- [ ] **Test 12.5** : Seuls les admins peuvent-ils accéder aux routes admin ?
- [ ] **Test 12.6** : Les utilisateurs ne peuvent-ils pas modifier les données d'autres utilisateurs ?
- [ ] **Test 12.7** : Les routes protégées sont-elles inaccessibles sans token ?

### **Validation des Données**
- [ ] **Test 12.8** : Les entrées utilisateur sont-elles validées ?
- [ ] **Test 12.9** : Les injections SQL sont-elles impossibles ?
- [ ] **Test 12.10** : Les attaques XSS sont-elles bloquées ?

---

## ⚡ **TESTS DE PERFORMANCE**

### **Temps de Chargement**
- [ ] **Test 13.1** : La page d'accueil se charge-t-elle en moins de 3 secondes ?
- [ ] **Test 13.2** : Les images se chargent-elles rapidement ?
- [ ] **Test 13.3** : Les API répondent-elles en moins de 1 seconde ?

### **Optimisations**
- [ ] **Test 13.4** : Les images sont-elles optimisées ?
- [ ] **Test 13.5** : Le code JavaScript est-il minifié en production ?
- [ ] **Test 13.6** : Les ressources CSS sont-elles optimisées ?

---

## 🐛 **TESTS D'ERREURS ET EDGE CASES**

### **Gestion d'Erreurs**
- [ ] **Test 14.1** : Les erreurs 404 sont-elles gérées correctement ?
- [ ] **Test 14.2** : Les erreurs 500 sont-elles gérées correctement ?
- [ ] **Test 14.3** : Les erreurs réseau sont-elles gérées ?
- [ ] **Test 14.4** : Les messages d'erreur sont-ils informatifs ?

### **Edge Cases**
- [ ] **Test 14.5** : Que se passe-t-il si l'utilisateur n'a plus de coins ?
- [ ] **Test 14.6** : Que se passe-t-il si la base de données est indisponible ?
- [ ] **Test 14.7** : Que se passe-t-il si l'utilisateur ferme la popup pendant un spin ?
- [ ] **Test 14.8** : Que se passe-t-il si l'utilisateur clique plusieurs fois sur "Acheter" ?

---

## 🌐 **TESTS DE NAVIGATEURS**

### **Chrome**
- [ ] **Test 15.1** : Le site fonctionne-t-il correctement sur Chrome ?
- [ ] **Test 15.2** : Toutes les fonctionnalités sont-elles disponibles ?

### **Firefox**
- [ ] **Test 15.3** : Le site fonctionne-t-il correctement sur Firefox ?
- [ ] **Test 15.4** : Toutes les fonctionnalités sont-elles disponibles ?

### **Safari**
- [ ] **Test 15.5** : Le site fonctionne-t-il correctement sur Safari ?
- [ ] **Test 15.6** : Toutes les fonctionnalités sont-elles disponibles ?

### **Edge**
- [ ] **Test 15.7** : Le site fonctionne-t-il correctement sur Edge ?
- [ ] **Test 15.8** : Toutes les fonctionnalités sont-elles disponibles ?

---

## 📊 **STATISTIQUES DE TESTS**

**Total des tests : 158 tests**

- **Tests Frontend** : 95 tests
- **Tests Backend** : 25 tests
- **Tests Responsive** : 15 tests
- **Tests Sécurité** : 10 tests
- **Tests Performance** : 6 tests
- **Tests Erreurs** : 8 tests
- **Tests Navigateurs** : 8 tests

---

## ✅ **INSTRUCTIONS DE TEST**

1. **Créer un compte de test** avec des identifiants simples
2. **Tester chaque fonctionnalité** dans l'ordre des sections
3. **Cocher les cases** au fur et à mesure des tests réussis
4. **Noter les bugs** rencontrés avec des détails
5. **Tester sur différents appareils** (mobile, tablette, desktop)
6. **Tester sur différents navigateurs** si possible

---

## 🚨 **PRIORITÉS DE TESTS**

### **Critique (À tester en premier)**
- Authentification (Tests 2.1 - 2.11)
- Roue de la Fortune (Tests 3.1 - 3.23)
- Boutique (Tests 4.1 - 4.31)
- Panneau Admin (Tests 9.1 - 9.16)

### **Important**
- Responsive Design (Tests 11.1 - 11.9)
- Sécurité (Tests 12.1 - 12.10)
- Backend API (Tests 10.1 - 10.24)

### **Secondaire**
- Pages statiques (Tests 6.1 - 8.7)
- Performance (Tests 13.1 - 13.6)
- Navigateurs multiples (Tests 15.1 - 15.8)

---

**🎯 Objectif : Valider que Planify est prêt pour la production !** 