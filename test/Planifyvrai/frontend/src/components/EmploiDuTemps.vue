<template>
  <div>
    <ListeDevoirs :events="filteredEvents" @refresh-events="reloadEvents" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import ListeDevoirs from './ListeDevoirs.vue'

const events = ref([]);
const user = ref(null);

onMounted(async () => {
  if (localStorage.getItem('user')) {
    user.value = JSON.parse(localStorage.getItem('user'));
  }
  try {
    const res = await axios.get('/api/events');
    if (Array.isArray(res.data)) {
      events.value = res.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    }
  } catch (e) {
    events.value = [];
  }
});

const filteredEvents = computed(() => {
  return events.value;
});

async function reloadEvents() {
  try {
    const res = await axios.get('/api/events');
    if (Array.isArray(res.data)) {
      events.value = res.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    }
  } catch (e) {
    events.value = [];
  }
}
</script>
 