# Planify MMI — Monorepo (Frontend Vue 3 + Backend Node/Express + MongoDB)

Planify est une application web d’organisation scolaire pour les étudiants MMI. Elle permet de gérer les devoirs et examens, accomplir des quêtes et obtenir des récompenses, acheter des items dans une boutique, suivre les performances via un leaderboard, rejoindre des factions et recevoir des notifications PWA.

---

## Sommaire
- [Présentation](#présentation)
- [Architecture](#architecture)
- [Technologies utilisées](#technologies-utilisées)
- [Fonctionnalités](#fonctionnalités)
- [Public cible](#public-cible)
- [Objectif](#objectif)
- [Aperçu API](#aperçu-api-principaux-endpoints)
- [Notifications PWA](#notifications-pwa)
- [Sécurité](#sécurité)
- [Licence](#licence)
- [Contact](#contact)

---

## Présentation

Planify est conçu pour aider les étudiants MMI à organiser leur vie scolaire et à rendre les tâches quotidiennes plus motivantes grâce à un système ludique.  

L'application combine un frontend moderne et interactif avec un backend sécurisé et performant pour offrir une expérience complète.

---

## Architecture

Le projet est un **monorepo** contenant à la fois le frontend et le backend.

### Frontend
- Dossier : `frontend-dev/`
- Stack : Vue 3 + TypeScript + Vite
- Gestion d’état : Pinia
- Routing : Vue Router
- Interface responsive Desktop & Mobile
- PWA : Service Worker pour notifications et “Ajouter à l’écran d’accueil”

### Backend
- Dossier principal : `backend2/backend2/`
- Stack : Node.js + Express
- Base de données : MongoDB via Mongoose
- Authentification : JWT
- Upload fichiers : Multer
- API REST sécurisée pour toutes les fonctionnalités

### Backups (non prioritaires)
- `backendVERSIONDEVELOPEMENTBACKUP/`
- `backendVRAIVERSIONDEVELOPPEMENT/`

### Arborescence (extrait)

Planify/
├─ frontend-dev/
│ ├─ src/
│ │ ├─ components/
│ │ ├─ pages/
│ │ ├─ stores/ # Pinia
│ │ └─ assets/
├─ backend2/
│ ├─ backend2/
│ │ ├─ controllers/
│ │ ├─ models/
│ │ ├─ routes/
│ │ └─ utils/
├─ README.md
└─ package.json


---

## Technologies utilisées

**Frontend :**
- Vue 3 + TypeScript
- Vite
- Pinia
- Vue Router
- Tailwind CSS (ou autre CSS framework si applicable)
- PWA (Service Worker)

**Backend :**
- Node.js + Express
- MongoDB + Mongoose
- JWT pour l’authentification
- Multer pour l’upload de fichiers
- Helmet et rate limiting pour la sécurité

---

## Fonctionnalités

- Gestion des devoirs et examens
- Quêtes journalières ou répétables
- Boutique de cosmétiques et items
- Leaderboard pour suivre la progression des étudiants
- Factions pour favoriser l’esprit d’équipe
- Notifications PWA pour rester informé en temps réel
- Authentification sécurisée avec JWT
- Upload d’avatars et fichiers (images, musique)
- Interface responsive Desktop & Mobile

---

## Public cible

- Étudiants MMI souhaitant organiser leur emploi du temps et suivre leurs progrès
- Professeurs souhaitant proposer des quêtes et suivre les performances
- Toute communauté scolaire désirant un système de gamification et de suivi ludique

---

## Objectif

- Centraliser la gestion des devoirs et activités dans une seule application
- Motiver les étudiants via un système de récompenses et de progression
- Faciliter la communication via notifications et factions

---

## Aperçu API (principaux endpoints)

- `POST /auth/register` — Inscription
- `POST /auth/login` — Connexion
- `GET /users/:id` — Récupérer profil utilisateur
- `POST /quests` — Ajouter une quête
- `GET /quests` — Récupérer toutes les quêtes
- `POST /shop/buy` — Acheter un item
- `GET /leaderboard` — Voir le classement
- `POST /factions/join` — Rejoindre une faction

---

## Notifications PWA

- Notifications push pour informer des nouvelles quêtes, récompenses ou messages.
- Service worker pour gérer l’affichage même lorsque l’application n’est pas ouverte.
- Option “Ajouter à l’écran d’accueil” pour un accès rapide.

---

## Sécurité

- Authentification JWT
- Rate limiting pour limiter les requêtes
- Helmet pour sécuriser les headers HTTP
- Validation des entrées utilisateurs

---

## Licence

MIT License — voir fichier `LICENSE` pour plus de détails.

---

## Contact

- Nom : Serge  
- Email : [tovmassian.serge@gmail.com]  
- GitHub : [https://github.com/Serge-Developper]
