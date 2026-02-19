<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="login">
      <h2>Connexion</h2>
      <input v-model="username" placeholder="Identifiant" />
      <div class="password-input-wrapper">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Mot de passe"
          class="password-input"
        />
        <button
          type="button"
          class="toggle-password-btn"
          @click="showPassword = !showPassword"
          :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
        >
          <img
            :src="showPassword ? eyeOpen : eyeClosed"
            alt="Afficher/masquer le mot de passe"
            class="eye-icon"
          />
        </button>
      </div>
      <label style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" v-model="rememberMe" />
        Rester connecté
      </label>
      <button type="submit">Connexion</button>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { API_URL } from '@/api';
import eyeOpen from '@/assets/eyeopen.svg'
import eyeClosed from '@/assets/eyeclosed.svg'
const showPassword = ref(false)

const username = ref('');
const password = ref('');
const error = ref('');
const rememberMe = ref(true);
const router = useRouter();

async function login() {
  try {
    const res = await axios.post(`${API_URL}/users/login`, {
      username: username.value,
      password: password.value,
      rememberMe: !!rememberMe.value
    });
    // Stockage selon rememberMe
    const storage = rememberMe.value ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(res.data));
    if (res.data.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de connexion';
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}
.login-form {
  background: #fff;
  padding: 32px 40px;
  border-radius: 18px;
  box-shadow: 0 4px 24px #0001;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 320px;
}
.login-form h2 {
  text-align: center;
  margin-bottom: 8px;
  color: #111;
}
.login-form input {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}
.login-form button {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.1rem;
}
.error {
  color: #ef4444;
  text-align: center;
}
.login-form .password-input-wrapper { position: relative; }
.login-form .password-input { padding-right: 42px; }
.login-form .toggle-password-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-form .eye-icon { width: 22px; height: 22px; opacity: 0.8; }
.login-form .toggle-password-btn:hover .eye-icon { opacity: 1; }
</style>