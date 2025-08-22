<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { API_URL } from '@/api';
import checkIcon from '@/assets/check.svg';
import errorIcon from '@/assets/error.svg';

const form = ref({
  name: '',
  phone: '',
  email_from: '',
  Promo: '',
  subject: '',
  Description: ''
});

const submitting = ref(false);

// Modale personnalisée
const modal = ref({
  show: false,
  success: true,
  message: '',
});

function closeModal() {
  modal.value.show = false;
}

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const response = await axios.post(`${API_URL}/contact`, form.value);
    if (response.data.success) {
      modal.value = {
        show: true,
        success: true,
        message: 'Votre message a bien été envoyé !',
      };
      form.value = { name: '', phone: '', email_from: '', Promo: '', subject: '', Description: '' };
    } else {
      modal.value = {
        show: true,
        success: false,
        message: "Une erreur s'est produite : " + response.data.message,
      };
    }
  } catch (error) {
    console.error('Erreur lors de la soumission du formulaire:', error);
    modal.value = {
      show: true,
      success: false,
      message: 'Une erreur réseau est survenue. Veuillez réessayer.',
    };
  } finally {
    submitting.value = false;
    setTimeout(() => { modal.value.show = false; }, 3500);
  }
};
</script>

<template>
  <main class="contact-main">
    <!-- Section Parallax Titre -->
    <section class="about-hero">
      <div class="about-hero-bg"></div>
      <div class="about-hero-content">
        <h1 class="about-title">Contactez-nous</h1>
      </div>
    </section>

    <!-- Formulaire et Infos de contact -->
    <section class="contact-content">
      <div class="contact-container">
        <div class="contact-grid">
          <!-- Colonne Formulaire -->
          <div class="contact-form-column">
            <p class="contact-lead">Nous ferons de notre mieux pour vous répondre dans les plus brefs délais.</p>
            <form @submit.prevent="handleSubmit">
              <div class="form-row">
                <div class="form-group">
                  <label for="contact1">Nom *</label>
                  <input id="contact1" type="text" v-model="form.name" required>
                </div>
                <div class="form-group">
                  <label for="contact2">Numéro de téléphone *</label>
                  <input id="contact2" type="tel" v-model="form.phone" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="contact3">E-mail *</label>
                  <input id="contact3" type="email" v-model="form.email_from" required>
                </div>
                <div class="form-group">
                  <label for="promo">Promo *</label>
                  <input id="promo" type="text" v-model="form.Promo" required>
                  <small>(Ex: Deuxième année, MMI, Création numérique)</small>
                </div>
              </div>
              <div class="form-group">
                <label for="contact5">Sujet *</label>
                <input id="contact5" type="text" v-model="form.subject" required>
              </div>
              <div class="form-group">
                <label for="description">Description *</label>
                <textarea id="description" v-model="form.Description" required rows="6"></textarea>
              </div>
              <div class="form-submit">
                <button type="submit" class="btn-submit" :disabled="submitting">
                  {{ submitting ? 'Envoi en cours...' : 'Soumettre' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Colonne Infos -->
          <div class="contact-info-column">
            <h5>Contactez Planify,</h5>
            <ul class="contact-info-list">
              <li>
                <img src="@/assets/localisation.svg" alt="Localisation" class="contact-icon">
                <div>
                  <span>IUT Nancy-Charlemagne</span>
                  <p>2 ter Bd Charlemagne, 54000 Nancy</p>
                </div>
              </li>
              <li>
                <img src="@/assets/email.svg" alt="Email" class="contact-icon">
                <span>planifymmi@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Modale de feedback -->
    <div v-if="modal.show" class="contact-modal-overlay">
      <div class="contact-modal" :class="modal.success ? 'success' : 'error'">
        <button class="modal-close" @click="closeModal">×</button>
        <img :src="modal.success ? checkIcon : errorIcon" alt="status icon" class="modal-icon" />
        <div class="modal-message">{{ modal.message }}</div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.contact-main {
  background: #fff;
  color: #222;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
}

/* Hero Section (copied from AboutView.vue) */
.about-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.about-hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('@/assets/iutscaled.jpg');
  background-size: cover;
  background-position: center;
  filter: brightness(0.7);
  z-index: 0;
}
.about-hero-content {
  position: relative;
  z-index: 1;
  padding-top: 48px;
  padding-bottom: 32px;
  text-align: left;
  width: 100%;
  max-width: 1200px;
  padding-left: 24px;
  padding-right: 24px;
  box-sizing: border-box;
}
.about-title {
  color: #fff;
  font-size: 3.2em;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
  text-shadow: 2px 2px 8px #0008;
  text-align: left;
  margin: 0;
}

@media (min-width: 320px) and (max-width: 768px) {
  .about-title {
    font-size: 2.2em;
  }
}

/* Content Section */
.contact-content {
  padding: 64px 0;
}
.contact-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.contact-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 64px;
}

/* Form */
.contact-form-column .contact-lead {
  font-size: 1.2em;
  color: #555;
  margin-bottom: 24px;
}
.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}
.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.form-group label {
  margin-bottom: 8px;
  font-size: 1.2em;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1em;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
  box-sizing: border-box;
}
.form-group small {
  font-size: 1em;
  color: #777;
  margin-top: 4px;
}
.form-submit {
  text-align: right;
  margin-top: 24px;
}
.btn-submit {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: #6EFF78;
  color: #000;
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s;
}
.btn-submit:hover {
  background-color: #58e461;
}
.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Info Column */
.contact-info-column h5 {
  font-size: 1.5em;
  margin-bottom: 24px;
}
.contact-info-list {
  list-style: none;
  padding: 0;
}
.contact-info-list li {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.contact-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  flex-shrink: 0;
}
.contact-info-list p {
  margin: 4px 0 0 0;
  color: #555;
}

@media (max-width: 992px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
    margin-bottom: 0;
  }
  .form-group {
    margin-bottom: 24px;
  }
}

.contact-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.contact-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 32px #0002;
  padding: 32px 32px 24px 32px;
  min-width: 280px;
  max-width: 90vw;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: popin 0.2s;
}
.contact-modal.success {
  border: 2px solid #41ec55;
}
.contact-modal.error {
  border: 2px solid #eb0000;
}
.modal-icon {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
}
.modal-message {
  font-size: 1.2em;
  color: #222;
  margin-bottom: 8px;
}
.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.6em;
  color: #888;
  cursor: pointer;
}
@keyframes popin {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style> 