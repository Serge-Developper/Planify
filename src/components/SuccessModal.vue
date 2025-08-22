<template>
  <div v-if="show" class="success-modal-overlay">
    <div class="success-modal">
      <img src="@/assets/check.svg" alt="Succès" class="success-icon" />
      <div class="success-message">{{ message }}</div>
      <button class="success-ok" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
const props = defineProps({
  show: Boolean,
  message: String
});

watch(() => props.show, (v) => {
  try { document.body.style.overflow = v ? 'hidden' : '' } catch (e) {}
})
onMounted(() => { if (props.show) { try { document.body.style.overflow = 'hidden' } catch (e) {} }})
onUnmounted(() => { try { document.body.style.overflow = '' } catch (e) {} })
</script>

<style>
.success-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 24px #0003;
  padding: 36px 32px 28px 32px;
  min-width: 280px;
  max-width: 90vw;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  position: relative;
  border: 2px solid #41ec55;
}
.success-icon {
  width: 54px;
  height: 54px;
  margin-bottom: 18px;
}
.success-message {
  font-size: 1.2em;
  margin-bottom: 18px;
  color: #16a34a;
}
.success-ok {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 32px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background 0.2s;
}
.success-ok:hover {
  background: #4f46e5;
}
</style> 