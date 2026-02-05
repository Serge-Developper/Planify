const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { verifyToken } = require('../middlewares/auth')
const Faction = require('../models/Faction')

function getParisYMD(date = new Date()) {
  try {
    const d = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  } catch { return new Date().toISOString().slice(0,10) }
}
function addDaysYmd(ymd, days) {
  try {
    const [y,m,d] = String(ymd).split('-').map(n => Number(n))
    const dt = new Date(Date.UTC(y, m-1, d))
    dt.setUTCDate(dt.getUTCDate() + Number(days||0))
    const yy = dt.getUTCFullYear(), mm = String(dt.getUTCMonth()+1).padStart(2,'0'), dd = String(dt.getUTCDate()).padStart(2,'0')
    return `${yy}-${mm}-${dd}`
  } catch { return ymd }
}

const POOL = [
  { id: 'wheel-1', title: 'Tourner la roue de la fortune 1 fois', reward: 10, actions: 1, durationDays: 1 },
  { id: 'wheel-2', title: 'Tourner la roue de la fortune 2 fois', reward: 20, actions: 2, durationDays: 1 },
  { id: 'devoirs', title: 'Consulter les devoirs', reward: 10, actions: 1, durationDays: 1 },
  { id: 'task-info-1', title: 'Cliquer sur “Plus d’infos” sur une tâche', reward: 10, actions: 1, durationDays: 1 },
  { id: 'tasks-archives', title: 'Consulter les archives des tâches', reward: 10, actions: 1, durationDays: 1 },
  { id: 'tab-exams-open', title: 'Ouvrir l’onglet “Examens”', reward: 10, actions: 1, durationDays: 1 },
  { id: 'tab-retards-open', title: 'Ouvrir l’onglet “Retards”', reward: 10, actions: 1, durationDays: 1 },
  { id: 'visit-shop', title: 'Visiter la boutique Planify', reward: 10, actions: 1, durationDays: 1 },
  { id: 'leaderboard-profile', title: 'Consulter le profil d’une personne aléatoire dans le leaderboard', reward: 10, actions: 1, durationDays: 1 },
  { id: 'connect', title: 'Se connecter à Planify', reward: 10, actions: 1, durationDays: 1 },
]

function pickReplacement(excludeIds = []) {
  const excluded = new Set((excludeIds||[]).map(String))
  const candidates = POOL.filter(p => !excluded.has(String(p.id)))
  const idx = Math.floor(Math.random() * candidates.length)
  return { ...candidates[idx] }
}

async function ensureDailyQuestsForUser(user) {
  const today = getParisYMD()
  const meta = user.dailyQuestsMeta || {}
  const needsReset = meta.lastResetYmd !== today
  let invalidCount = !Array.isArray(user.dailyQuests) || user.dailyQuests.length !== 3
  if (needsReset || invalidCount) {
    const ids = []
    const q1 = pickReplacement(ids); ids.push(q1.id)
    const q2 = pickReplacement(ids); ids.push(q2.id)
    const q3 = pickReplacement(ids);
    user.dailyQuests = [q1,q2,q3].map(q => ({ ...q, done: false, createdYmd: today, expiresYmd: addDaysYmd(today, Number(q.durationDays||1)) }))
    user.dailyQuestsMeta = { lastResetYmd: today, bonusAwardedYmd: null, rerollUsed: false, targetLeaderboardName: user.username || '' }
    await user.save()
  }
}

function safeUserId(req) {
  try { return req.user.id || req.user._id } catch { return null }
}

function awardAchievement(user, id) {
  user.achievementsCompleted = Array.isArray(user.achievementsCompleted) ? user.achievementsCompleted : []
  if (!user.achievementsCompleted.includes(id)) user.achievementsCompleted.push(id)
}

router.get('/achievements', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    return res.json({ success: true, achievements: Array.isArray(user.achievementsCompleted) ? user.achievementsCompleted : [] })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    const ach = user.achievements || {}
    return res.json({
      success: true,
      completedTasks: Math.max(0, Number(user.completedTasks || 0)),
      wheelSpinTotal: Math.max(0, Number(ach.wheelSpinTotal || 0)),
      wheelLossTotal: Math.max(0, Number(ach.wheelLossTotal || 0)),
      dailyCompleted: Math.max(0, Number(ach.dailyCompleted || 0)),
      repeatCompleted: Math.max(0, Number(ach.repeatCompleted || 0)),
      proposalsCount: Math.max(0, Number(ach.proposalsCount || 0)),
      wheelWeekendSpinsToday: { ymd: ach.wheelWeekendSpinsYmd || null, count: Math.max(0, Number(ach.wheelWeekendSpinsCount || 0)) },
      wheelWeekendLossToday: { ymd: ach.wheelWeekendLossYmd || null, count: Math.max(0, Number(ach.wheelWeekendLossCount || 0)) },
      faction: user.faction || null
    })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

function incAndAward(user, key, threshold, amount) {
  user.repeatable = user.repeatable || {}
  user.repeatable[key] = Math.max(0, Number(user.repeatable[key] || 0)) + 1
  if (user.repeatable[key] >= threshold) {
    user.repeatable[key] -= threshold
    user.coins = (user.coins || 0) + amount
  }
}

router.get('/repeatable', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    const r = user.repeatable || {}
    const defs = [
      { id: 'tasks-10', key: 'tasks10', threshold: 10, reward: 50 },
      { id: 'tasks-25', key: 'tasks25', threshold: 25, reward: 120 },
      { id: 'tasks-50', key: 'tasks50', threshold: 50, reward: 300 },
      { id: 'wheel-10', key: 'wheel10', threshold: 10, reward: 100 },
      { id: 'wheel-25', key: 'wheel25', threshold: 25, reward: 250 },
      { id: 'wheel-50', key: 'wheel50', threshold: 50, reward: 500 },
      { id: 'daily-10', key: 'daily10', threshold: 10, reward: 50 },
      { id: 'daily-25', key: 'daily25', threshold: 25, reward: 150 },
      { id: 'daily-50', key: 'daily50', threshold: 50, reward: 300 }
    ]
    const list = defs.map(d => ({ id: d.id, progress: Math.min(100, Math.round(((Math.max(0, Number(r[d.key]||0))) / d.threshold) * 100)), reward: d.reward }))
    return res.json({ success: true, repeatable: list })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.get('/daily', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    await ensureDailyQuestsForUser(user)
    let list = Array.isArray(user.dailyQuests) ? user.dailyQuests : []
    const idx = list.findIndex(q => q && q.id === 'task-info-3')
    if (idx !== -1) {
      const currentIds = list.map((q,i)=> i===idx ? null : q.id).filter(Boolean)
      const replacement = pickReplacement(currentIds)
      user.dailyQuests[idx] = { ...replacement, done: false, createdYmd: getParisYMD(), expiresYmd: addDaysYmd(getParisYMD(), Number(replacement.durationDays||1)) }
      await user.save()
      list = user.dailyQuests
    }
    return res.json({ dailyQuests: list, meta: user.dailyQuestsMeta || {} })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.post('/complete', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const { questId } = req.body || {}
    if (!questId) return res.status(400).json({ success: false, message: 'questId manquant' })
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    await ensureDailyQuestsForUser(user)
    const q = (user.dailyQuests||[]).find(x => x.id === String(questId))
    if (!q) return res.status(404).json({ success: false, message: 'Quête introuvable' })
    q.done = true
    user.achievements = user.achievements || {}
    const prev = Math.max(0, Number(user.achievements.dailyCompleted || 0))
    if (prev === 0) awardAchievement(user, 'ach-first-quest')
    user.achievements.dailyCompleted = prev + 1
    if (user.achievements.dailyCompleted >= 5) awardAchievement(user, 'daily-complete-5')
    if (user.achievements.dailyCompleted >= 15) awardAchievement(user, 'daily-complete-15')
    if (user.achievements.dailyCompleted >= 30) awardAchievement(user, 'daily-complete-30')
    if (user.achievements.dailyCompleted >= 50) awardAchievement(user, 'daily-complete-50')
    incAndAward(user, 'daily10', 10, 50)
    incAndAward(user, 'daily25', 25, 150)
    incAndAward(user, 'daily50', 50, 300)
    await user.save()
    return res.json({ success: true })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.post('/bonus', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const DAILY_BASE_BONUS = 50
    const REDUCED_BONUS = 25
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    await ensureDailyQuestsForUser(user)
    const today = getParisYMD()
    const meta = user.dailyQuestsMeta || {}
    const amount = meta.rerollUsed ? REDUCED_BONUS : DAILY_BASE_BONUS
    const list = Array.isArray(user.dailyQuests) ? user.dailyQuests : []
    const doneCount = list.filter(q => !!q.done).length
    const allDone = list.length === 3 && doneCount === 3
    if (!allDone) return res.status(400).json({ success: false, reason: 'not_all_done', doneCount, rerollUsed: !!meta.rerollUsed })

    if (meta.bonusAwardedYmd === today) return res.json({ success: true, message: 'Bonus déjà attribué', coins: user.coins, awarded: false })
    user.coins = (user.coins || 0) + amount
    user.leaderboardCoins = (user.leaderboardCoins || 0) + amount
    if (user.faction) {
      user.factionCoins = (user.factionCoins || 0) + amount
      await Faction.updateOne({ name: user.faction }, { $inc: { totalCoins: amount } }, { upsert: true })
    }
    user.dailyQuestsMeta.bonusAwardedYmd = today
    if (!meta.rerollUsed) awardAchievement(user, 'daily-no-reroll')
    await user.save()
    return res.json({ success: true, amount, coins: user.coins })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.post('/reroll', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req)
    const { index } = req.body || {}
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    await ensureDailyQuestsForUser(user)
    const meta = user.dailyQuestsMeta || {}
    const i = Math.max(0, Math.min(2, Number(index)))
    const list = Array.isArray(user.dailyQuests) ? user.dailyQuests : []
    const target = list[i]
    if (target && target.done) return res.status(400).json({ success: false, message: 'Quête complétée — re-roll impossible' })
    const currentIds = list.map((q, idx) => idx === i ? null : q.id).filter(Boolean)
    const replacement = pickReplacement(currentIds)
    user.dailyQuests[i] = { ...replacement, done: false, createdYmd: getParisYMD(), expiresYmd: addDaysYmd(getParisYMD(), Number(replacement.durationDays||1)) }
    user.dailyQuestsMeta.rerollUsed = true
    awardAchievement(user, 'reroll-used')
    await user.save()
    return res.json({ success: true, dailyQuests: user.dailyQuests, meta: user.dailyQuestsMeta })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

module.exports = router