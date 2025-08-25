<template>
  <div>
    <ListeDevoirs 
      v-if="events.length > 0 || !loading" 
      :events="events" 
      @refresh-events="loadEvents"
    />
    <div v-else-if="loading" class="loading">
      Chargement des devoirs...
    </div>
    <div v-else class="no-events">
      Aucun devoir trouvé
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ListeDevoirs from '@/components/ListeDevoirs.vue'
import { API_URL, secureApiCall } from '@/api'
import { useAuthStore } from '@/stores/auth'

const events = ref([])
const loading = ref(true)
const authStore = useAuthStore()

const loadEvents = async () => {
  try {
    loading.value = true
    // Utiliser l'appel sécurisé qui injecte le token
    const res = await secureApiCall('/events')
    const raw = Array.isArray(res) ? res : (Array.isArray(res?.events) ? res.events : [])
    const userId = authStore.user?.id || authStore.user?._id

    // Normaliser pour ListeDevoirs (champs FR)
    events.value = raw.map(e => {
      const titre = e.titre ?? e.title ?? ''
      const matiere = e.matiere ?? e.subject ?? ''
      const date = e.date ?? (e.dueDate ? new Date(e.dueDate).toISOString().slice(0,10) : '')
      const heure = e.heure ?? ''
      let type = (e.type ?? '').toLowerCase()
      if (type === 'exam') type = 'examen'
      if (!type) type = 'devoir'
      const checked = Array.isArray(e.checkedBy) ? e.checkedBy.includes(userId) : !!e.isCompleted
      const archived = Array.isArray(e.archivedBy) ? e.archivedBy.includes(userId) : false
      return {
        _id: e._id,
        titre,
        matiere,
        date,
        heure,
        type,
        groupe: e.groupe ?? 'Promo',
        year: e.year ?? '',
        description: e.description ?? '',
        checked,
        archived,
      }
    })
  } catch (error) {
    console.error('Erreur lors du chargement des events:', error)
    events.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.loading, .no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2em;
  color: #666;
}
</style>