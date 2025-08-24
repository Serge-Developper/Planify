<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">Ajouter un événement</h3>
      <form @submit.prevent="submitForm">
        <div class="mb-2">
          <label>Matière</label>
          <input v-model="form.subject" class="border p-2 w-full" required />
        </div>
        <div class="mb-2">
          <label>Date</label>
          <input type="date" v-model="form.date" class="border p-2 w-full" required />
        </div>
        <div class="mb-2">
          <label>Type</label>
          <select v-model="form.type" class="border p-2 w-full" required>
            <option value="exam">Examen</option>
            <option value="devoir">Devoir</option>
          </select>
        </div>
        <div class="mb-2">
          <label>Groupe</label>
          <select v-model="form.group" class="border p-2 w-full" required>
            <option>A</option>
            <option>A'</option>
            <option>A"</option>
            <option>B</option>
            <option>B'</option>
            <option>B""</option>
          </select>
        </div>
        <div class="mb-2">
          <label>Année</label>
          <select v-model="form.year" class="border p-2 w-full" required>
            <option :value="1">1ère année</option>
            <option :value="2">2ème année</option>
            <option :value="3">3ème année</option>
          </select>
        </div>
        <div class="mb-2" v-if="form.type === 'exam'">
          <label>Salle</label>
          <input v-model="form.room" class="border p-2 w-full" />
        </div>
        <div class="mb-2" v-if="form.type === 'exam'">
          <label>Heure de début</label>
          <input v-model="form.startHour" class="border p-2 w-full" placeholder="08h00" />
        </div>
        <div class="mb-2" v-if="form.type === 'exam'">
          <label>Heure de fin</label>
          <input v-model="form.endHour" class="border p-2 w-full" placeholder="10h00" />
        </div>
        <div class="mb-2" v-if="form.type === 'devoir'">
          <label>Heure de rendu</label>
          <input v-model="form.dueHour" class="border p-2 w-full" placeholder="17h00" />
        </div>
        <div class="flex justify-end mt-4">
          <button type="button" class="mr-2 px-4 py-2" @click="$emit('close')">Annuler</button>
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Ajouter</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// import axios from 'axios';

const emit = defineEmits(['close', 'event-added']);

const form = ref({
  subject: '',
  date: '',
  type: 'exam',
  group: 'A',
  year: 1,
  room: '',
  startHour: '',
  endHour: '',
  dueHour: ''
});

async function submitForm() {
  alert('Fonctionnalité désactivée (backend en reconstruction)');
}
</script> 