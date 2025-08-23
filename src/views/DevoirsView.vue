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
import { API_URL } from '@/api'
import { useAuthStore } from '@/stores/auth'

const events = ref([])
const loading = ref(true)
const authStore = useAuthStore()

const loadEvents = async () => {
  try {
    loading.value = true
    const token = authStore.user?.token || localStorage.getItem('token')
    
    if (!token) {
      console.error('No token found')
      return
    }

    const response = await axios.get(`${API_URL}/events`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data) {
      // Ajouter les propriétés computed pour chaque event
      events.value = response.data.map(event => ({
        ...event,
        // Ajouter les propriétés que le composant ListeDevoirs attend
        checked: event.checkedBy && event.checkedBy.includes(authStore.user?.id || authStore.user?._id),
        archived: event.archivedBy && event.archivedBy.includes(authStore.user?.id || authStore.user?._id)
      }))
    }
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