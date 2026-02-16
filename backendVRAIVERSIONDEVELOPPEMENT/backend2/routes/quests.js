const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { verifyToken } = require('../middlewares/auth')
const Faction = require('../models/Faction')
const Event = require('../models/Event')
const Subject = require('../models/Subject')
const StaticSubjectRule = require('../models/StaticSubjectRule')

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
function normalizeYear(year) {
  if (!year) return ''
  let y = String(year).replace(/\s+/g, '').toUpperCase()
  if (y === 'BUT1' || y === '1') return '1'
  if (y === 'BUT2' || y === '2') return '2'
  if (y === 'BUT3' || y === '3') return '3'
  return y
}
function isWeekendParis(date = new Date()) {
  try {
    const d = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
    const day = d.getDay()
    return day === 0 || day === 6
  } catch { return false }
}
function canSpinToday(user) {
  try {
    if (!user || !user.lastSpinDate) return true
    return getParisYMD(user.lastSpinDate) !== getParisYMD()
  } catch { return true }
}
async function userHasTodoDevoirs(user) {
  try {
    if (!user) return false
    const userId = user._id
    const role = user.role
    const year = user.year
    const groupe = user.groupe
    const specialite = user.specialite
    const normalizedYear = normalizeYear(year)
    const normalizedGroupe = (groupe || '').toUpperCase()

    let query = {}
    if (role !== 'admin' && role !== 'prof') {
      const possibleYears = [normalizedYear]
      if (normalizedYear === '1') possibleYears.push('BUT1', 'BUT 1', 1)
      if (normalizedYear === '2') possibleYears.push('BUT2', 'BUT 2', 2)
      if (normalizedYear === '3') possibleYears.push('BUT3', 'BUT 3', 3)
      query = {
        $and: [
          { year: { $in: possibleYears } },
          {
            $or: [
              { groupe: { $regex: `^${normalizedGroupe}$`, $options: 'i' } },
              { groupe: 'Promo' },
              { groupes: { $in: [groupe, 'Promo'] } }
            ]
          },
          ...(specialite ? [{ $or: [ { specialite: { $in: [null, ''] } }, { specialite } ] }] : [])
        ]
      }
    }

    let candidateEvents = await Event.find({
      type: 'devoir',
      ...(role === 'admin' || role === 'prof' ? {} : query),
      $or: [
        { deletedBy: { $exists: false } },
        { deletedBy: { $size: 0 } },
        { deletedBy: { $nin: [userId] } }
      ]
    }).lean()

    if (!Array.isArray(candidateEvents) || candidateEvents.length === 0) return false

    if (role !== 'admin' && role !== 'prof') {
      try {
        const rules = await StaticSubjectRule.find({}).lean()
        const rulesByName = new Map(rules.map(r => [String(r.subjectName).toLowerCase(), r]))
        const subjects = await Subject.find({}).lean()
        const dynByName = new Map(subjects.map(s => [String(s.name).toLowerCase(), s]))

        candidateEvents = candidateEvents.filter(ev => {
          const matiereKey = String(ev.matiere || '').toLowerCase()
          const dyn = dynByName.get(matiereKey)
          const rule = rulesByName.get(matiereKey)
          function passesRule(r) {
            if (!r) return true
            const years = Array.isArray(r.yearsAllowed) ? r.yearsAllowed : []
            if (years.length && !years.includes(year)) return false
            const allowedGroups = Array.isArray(r.groupsAllowed) ? r.groupsAllowed : []
            const gNorm = (groupe || '').toString()
            if (allowedGroups.length && !(allowedGroups.includes('Promo') || allowedGroups.includes(gNorm))) return false
            const specs = Array.isArray(r.specialitesAllowed) ? r.specialitesAllowed : []
            if (specs.length) {
              if (!specialite) return false
              if (!specs.includes(specialite)) return false
            }
            return true
          }
          const dynOk = passesRule(dyn)
          const statOk = passesRule(rule)
          return dynOk && statOk
        })
      } catch {}
    }

    for (const ev of candidateEvents) {
      const archived = Array.isArray(ev.archivedBy) && ev.archivedBy.map(id => String(id)).includes(String(userId))
      const checked = Array.isArray(ev.checkedBy) && ev.checkedBy.map(id => String(id)).includes(String(userId))
      if (!archived && !checked) return true
    }
    return false
  } catch {
    return false
  }
}
function poolForUser(user, flags = {}) {
  const weekend = isWeekendParis()
  const canSpin = canSpinToday(user)
  const hasTodoDevoirs = typeof flags.hasTodoDevoirs === 'boolean' ? flags.hasTodoDevoirs : true
  return POOL.filter(p => {
    if (p.id === 'wheel-weekend') return weekend && canSpin
    if (p.id === 'wheel-1') return canSpin
    if (p.id === 'task-info-1') return hasTodoDevoirs
    return true
  })
}

const POOL = [
  { id: 'wheel-1', title: 'Tourner la roue de la fortune 1 fois', reward: 10, actions: 1, durationDays: 1 },
  { id: 'wheel-weekend', title: 'Tourner la roue de la fortune durant le week-end', reward: 10, actions: 1, durationDays: 1 },
  { id: 'devoirs', title: 'Consulter les devoirs', reward: 10, actions: 1, durationDays: 1 },
  { id: 'task-info-1', title: 'Cliquer sur “Plus d’infos” sur une tâche', reward: 10, actions: 1, durationDays: 1 },
  { id: 'tasks-archives', title: 'Consulter les archives des tâches', reward: 10, actions: 1, durationDays: 1 },
  { id: 'tab-exams-open', title: 'Ouvrir l’onglet “Examens”', reward: 10, actions: 1, durationDays: 1 },
  { id: 'tab-retards-open', title: 'Ouvrir l’onglet “Retards”', reward: 10, actions: 1, durationDays: 1 },
  { id: 'visit-shop', title: 'Visiter la boutique Planify', reward: 10, actions: 1, durationDays: 1 },
  { id: 'leaderboard-profile', title: 'Consulter le profil d’une personne aléatoire dans le leaderboard', reward: 10, actions: 1, durationDays: 1 },
  { id: 'connect', title: 'Se connecter à Planify', reward: 10, actions: 1, durationDays: 1 },
]

function pickReplacement(excludeIds = [], user, flags = {}) {
  const excluded = new Set((excludeIds||[]).map(String))
  const pool = poolForUser(user, flags)
  let candidates = pool.filter(p => !excluded.has(String(p.id)))
  if (!candidates.length) {
    candidates = POOL.filter(p => !excluded.has(String(p.id)))
  }
  if (!candidates.length) candidates = POOL.slice()
  const idx = Math.floor(Math.random() * candidates.length)
  return { ...candidates[idx] }
}

async function ensureDailyQuestsForUser(user, flags = {}) {
  const today = getParisYMD()
  const meta = user.dailyQuestsMeta || {}
  const needsReset = meta.lastResetYmd !== today
  const invalidCount = !Array.isArray(user.dailyQuests) || user.dailyQuests.length !== 3
  if (needsReset || invalidCount) {
    const ids = []
    const q1 = pickReplacement(ids, user, flags); ids.push(q1.id)
    const q2 = pickReplacement(ids, user, flags); ids.push(q2.id)
    const q3 = pickReplacement(ids, user, flags)
    user.dailyQuests = [q1, q2, q3].map(q => ({ ...q, done: false, createdYmd: today, expiresYmd: addDaysYmd(today, Number(q.durationDays||1)) }))
    user.dailyQuestsMeta = { lastResetYmd: today, bonusAwardedYmd: null, rerollUsed: false, rerollIndex: -1, targetLeaderboardName: '' }
    const hasLeaderboardQuest = user.dailyQuests.some(q => q && q.id === 'leaderboard-profile')
    if (hasLeaderboardQuest) {
      try {
        const candidates = await User.find({ leaderboardEnabled: true, _id: { $ne: user._id } }).select('username name').limit(500)
        if (Array.isArray(candidates) && candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)]
          const name = (pick && (pick.username || pick.name)) || ''
          user.dailyQuestsMeta.targetLeaderboardName = name
        }
      } catch {}
    }
    await user.save()
  }
}

async function replaceTaskInfoIfNoDevoirs(user, flags = {}) {
  const hasTodoDevoirs = typeof flags.hasTodoDevoirs === 'boolean' ? flags.hasTodoDevoirs : true
  if (hasTodoDevoirs) return false
  const list = Array.isArray(user.dailyQuests) ? user.dailyQuests : []
  const taskInfoIdx = list.findIndex(q => q && q.id === 'task-info-1')
  if (taskInfoIdx === -1) return false
  if (list[taskInfoIdx] && list[taskInfoIdx].done) return false
  const currentIds = list.map((q,i)=> i===taskInfoIdx ? null : q && q.id).filter(Boolean)
  const replacement = pickReplacement(currentIds, user, { hasTodoDevoirs })
  user.dailyQuests[taskInfoIdx] = { ...replacement, done: false, createdYmd: getParisYMD(), expiresYmd: addDaysYmd(getParisYMD(), Number(replacement.durationDays||1)) }
  await user.save()
  return true
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

function incAndAward(user, key, threshold, amount, out, id) {
  user.repeatable = user.repeatable || {}
  user.repeatable[key] = Math.max(0, Number(user.repeatable[key] || 0)) + 1
  if (user.repeatable[key] >= threshold) {
    user.repeatable[key] -= threshold
    if (Array.isArray(out) && id) out.push({ id, reward: amount })
    user.achievements = user.achievements || {}
    user.achievements.repeatCompleted = Math.max(0, Number(user.achievements.repeatCompleted || 0)) + 1
    return amount
  }
  return 0
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
    const hasTodoDevoirs = await userHasTodoDevoirs(user)
    await ensureDailyQuestsForUser(user, { hasTodoDevoirs })
    let list = Array.isArray(user.dailyQuests) ? user.dailyQuests : []
    const wheel2Idx = list.findIndex(q => q && q.id === 'wheel-2')
    if (wheel2Idx !== -1) {
      const currentIds = list.map((q,i)=> i===wheel2Idx ? null : q && q.id).filter(Boolean)
      const replacement = pickReplacement(currentIds, user, { hasTodoDevoirs })
      user.dailyQuests[wheel2Idx] = { ...replacement, done: false, createdYmd: getParisYMD(), expiresYmd: addDaysYmd(getParisYMD(), Number(replacement.durationDays||1)) }
      await user.save()
      list = user.dailyQuests
    }
    const taskInfoReplaced = await replaceTaskInfoIfNoDevoirs(user, { hasTodoDevoirs })
    if (taskInfoReplaced) list = user.dailyQuests
    const idx = list.findIndex(q => q && q.id === 'task-info-3')
    if (idx !== -1) {
      const currentIds = list.map((q,i)=> i===idx ? null : q.id).filter(Boolean)
      const replacement = pickReplacement(currentIds, user, { hasTodoDevoirs })
      user.dailyQuests[idx] = { ...replacement, done: false, createdYmd: getParisYMD(), expiresYmd: addDaysYmd(getParisYMD(), Number(replacement.durationDays||1)) }
      await user.save()
      list = user.dailyQuests
    }
    const meta = user.dailyQuestsMeta || {}
    if (list.some(q => q && q.id === 'leaderboard-profile') && !meta.targetLeaderboardName) {
      try {
        const candidates = await User.find({ leaderboardEnabled: true, _id: { $ne: user._id } }).select('username name').limit(500)
        if (Array.isArray(candidates) && candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)]
          meta.targetLeaderboardName = (pick && (pick.username || pick.name)) || ''
          user.dailyQuestsMeta = meta
          await user.save()
        }
      } catch {}
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
    const hasTodoDevoirs = await userHasTodoDevoirs(user)
    await ensureDailyQuestsForUser(user, { hasTodoDevoirs })
    await replaceTaskInfoIfNoDevoirs(user, { hasTodoDevoirs })
    const q = (user.dailyQuests||[]).find(x => x.id === String(questId))
    if (!q) return res.status(404).json({ success: false, message: 'Quête introuvable' })
    if (q.done) return res.json({ success: true, alreadyDone: true, questReward: 0, repeatableRewards: [], coins: Number(user.coins || 0) })
    q.done = true
    user.achievements = user.achievements || {}
    const prev = Math.max(0, Number(user.achievements.dailyCompleted || 0))
    if (prev === 0) awardAchievement(user, 'ach-first-quest')
    user.achievements.dailyCompleted = prev + 1
    if (user.achievements.dailyCompleted >= 5) awardAchievement(user, 'daily-complete-5')
    if (user.achievements.dailyCompleted >= 15) awardAchievement(user, 'daily-complete-15')
    if (user.achievements.dailyCompleted >= 30) awardAchievement(user, 'daily-complete-30')
    if (user.achievements.dailyCompleted >= 50) awardAchievement(user, 'daily-complete-50')
    const repeatableRewards = []
    let repeatableTotal = 0
    repeatableTotal += incAndAward(user, 'daily10', 10, 50, repeatableRewards, 'daily-10')
    repeatableTotal += incAndAward(user, 'daily25', 25, 150, repeatableRewards, 'daily-25')
    repeatableTotal += incAndAward(user, 'daily50', 50, 300, repeatableRewards, 'daily-50')
    const questReward = Math.max(0, Number(q.reward || 0))
    const totalAward = questReward + repeatableTotal
    if (totalAward > 0) {
      user.coins = (user.coins || 0) + totalAward
      user.leaderboardCoins = (user.leaderboardCoins || 0) + totalAward
      if (user.faction) user.factionCoins = (user.factionCoins || 0) + totalAward
    }
    await user.save()
    if (totalAward > 0 && user.faction) {
      await Faction.updateOne({ name: user.faction }, { $inc: { totalCoins: totalAward } }, { upsert: true })
    }
    return res.json({ success: true, questReward, repeatableRewards, coins: Number(user.coins || 0), totalAward })
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
    const hasTodoDevoirs = await userHasTodoDevoirs(user)
    await ensureDailyQuestsForUser(user, { hasTodoDevoirs })
    await replaceTaskInfoIfNoDevoirs(user, { hasTodoDevoirs })
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
    const hasTodoDevoirs = await userHasTodoDevoirs(user)
    await ensureDailyQuestsForUser(user, { hasTodoDevoirs })
    await replaceTaskInfoIfNoDevoirs(user, { hasTodoDevoirs })
    const meta = user.dailyQuestsMeta || {}
    if (meta.rerollUsed) return res.status(429).json({ success: false, message: 'Re-roll déjà utilisé aujourd’hui', used: true })
    const i = Math.max(0, Math.min(2, Number(index)))
    const list = Array.isArray(user.dailyQuests) ? user.dailyQuests : []
    const target = list[i]
    if (target && target.done) return res.status(400).json({ success: false, message: 'Quête complétée — re-roll impossible' })
    const excludeIds = list.map(q => q && q.id).filter(Boolean)
    const replacement = pickReplacement(excludeIds, user, { hasTodoDevoirs })
    user.dailyQuests[i] = { ...replacement, done: false, createdYmd: getParisYMD(), expiresYmd: addDaysYmd(getParisYMD(), Number(replacement.durationDays||1)) }
    user.dailyQuestsMeta.rerollUsed = true
    user.dailyQuestsMeta.rerollIndex = i
    awardAchievement(user, 'reroll-used')
    try {
      const hasLeaderboardQuest = user.dailyQuests.some(q => q && q.id === 'leaderboard-profile')
      if (hasLeaderboardQuest && !user.dailyQuestsMeta.targetLeaderboardName) {
        const candidates = await User.find({ leaderboardEnabled: true, _id: { $ne: user._id } }).select('username name').limit(500)
        if (Array.isArray(candidates) && candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)]
          user.dailyQuestsMeta.targetLeaderboardName = (pick && (pick.username || pick.name)) || ''
        }
      }
    } catch {}
    await user.save()
    return res.json({ success: true, dailyQuests: user.dailyQuests, meta: user.dailyQuestsMeta })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

module.exports = router