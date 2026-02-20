const mongoose = require('mongoose');

/** 
 * Retourne la valeur par défaut de leaderboardEnabled en fonction du rôle.
 * @this {{ role?: string }} 
 */
function leaderboardEnabledDefault() {
  return this && this.role !== 'prof'
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  groupe: { type: String, enum: ['A', "A'", 'A"', 'B', "B'", 'B"', 'Promo'], default: null },
  year: { type: String, default: null },
  // Spécialité MMI de l'utilisateur (devweb, creation, gestion)
  specialite: { type: String, default: '' },
  department: { type: String, enum: ['MMI','TC','INFO','INFOCOM','GEA'], default: 'MMI' },
  avatar: { type: String, default: null }, // Chemin vers l'image de profil

  // Ajout: versionnage de l'avatar pour bust de cache
  avatarVersion: { type: Number, default: 0 },

  // Ajout: paramètres de recadrage “non destructif”
  // xPercent/yPercent: 0..100 (centre du cadrage), scale: 1..3
  avatarCrop: {
    xPercent: { type: Number, default: 50 },
    yPercent: { type: Number, default: 50 },
    scale: { type: Number, default: 1 },
  },
  coins: { type: Number, default: 0 }, // PlanifyCoins
  leaderboardCoins: { type: Number, default: 0 }, // Total des coins gagnés (affiché dans le leaderboard, n'est jamais décrémenté)
  completedTasks: { type: Number, default: 0 }, // Nombre de tâches complétées
  validations: { type: Number, default: 0 }, // Nombre de validations
  lastSpinDate: { type: Date, default: null }, // Date du dernier spin
  lossStreak: { type: Number, default: 0 }, // Pertes consécutives (protection roue)
  wheelNotifyLastYmd: { type: String, default: null },

  // Note publique (visible par tous)
  publicNote: { type: String, default: '' },
  theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'light' },

  // Préférence d'apparition dans le leaderboard
  leaderboardEnabled: { type: Boolean, default: leaderboardEnabledDefault },
  proposalBlocked: { type: Boolean, default: false },

  purchasedItems: {
      type: [
          {
              itemId: { type: Number, required: true },
              itemName: { type: String, required: true },
              purchaseDate: { type: Date, default: Date.now },
              equipped: { type: Boolean, default: false },
              adminMessage: { type: String, default: null },
              adminGiftRead: { type: Boolean, default: false },
              colorId: { type: String, default: null }
          }
      ],
      default: [],
  },
  equippedItemId: { type: Number, default: null, required: false }, // ID de l'item actuellement équipé
  selectedBorderColor: { type: String, default: null },
  favorites: { type: [Number], default: [] },
  faction: { type: String, enum: ['Bagnat','Fermier'], default: null },
  factionCoins: { type: Number, default: 0 },

  // Musique du profil
  musicTitle: { type: String, default: null },
  musicSrc: { type: String, default: null },
  musicStartSeconds: { type: Number, default: null },
  musicDurationSeconds: { type: Number, default: null },

  // Persistance des variantes d'items dynamiques (ex: Discord/Jojo)
   dynamicItemVariants: { type: Map, of: Number, default: {} },
  mutedProposers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  suggestEditorState: { type: Object, default: {} },

  pushPreferences: {
    enabled: { type: Boolean, default: false },
    wheel: { type: Boolean, default: false },
    homework: { type: Boolean, default: false },
    exam: { type: Boolean, default: false },
    shop: { type: Boolean, default: false }
  },

  pushSubscriptions: [{
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
  }],

  dailyQuests: {
    type: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        reward: { type: Number, default: 0 },
        actions: { type: Number, default: 1 },
        done: { type: Boolean, default: false },
        createdYmd: { type: String, default: null },
        durationDays: { type: Number, default: 1 },
        expiresYmd: { type: String, default: null }
      }
    ],
    default: []
  },
  dailyQuestsMeta: {
    lastResetYmd: { type: String, default: null },
    bonusAwardedYmd: { type: String, default: null },
    rerollUsed: { type: Boolean, default: false },
    rerollIndex: { type: Number, default: -1 },
    targetLeaderboardName: { type: String, default: '' }
  },

  repeatable: {
    tasks10: { type: Number, default: 0 },
    tasks25: { type: Number, default: 0 },
    tasks50: { type: Number, default: 0 },
    wheel10: { type: Number, default: 0 },
    wheel25: { type: Number, default: 0 },
    wheel50: { type: Number, default: 0 },
    daily10: { type: Number, default: 0 },
    daily25: { type: Number, default: 0 },
    daily50: { type: Number, default: 0 }
  },

  achievementsCompleted: { type: [String], default: [] },
  achievements: {
    dailyCompleted: { type: Number, default: 0 },
    wheelSpinTotal: { type: Number, default: 0 },
    wheelLossTotal: { type: Number, default: 0 },
    wheelWeekendSpinsYmd: { type: String, default: null },
    wheelWeekendSpinsCount: { type: Number, default: 0 },
    wheelWeekendLossYmd: { type: String, default: null },
    wheelWeekendLossCount: { type: Number, default: 0 },
    proposalsCount: { type: Number, default: 0 },
    repeatCompleted: { type: Number, default: 0 }
  },

  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
});

module.exports = mongoose.model('User', userSchema);