<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="login">
      <h2>Connexion</h2>
      <input v-model="username" placeholder="Identifiant" />
      <input v-model="password" type="password" placeholder="Mot de passe" />
      <button type="submit">Connexion</button>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

async function login() {
  try {
    const res = await axios.post('/api/users/login', {
      username: username.value,
      password: password.value
    });
    localStorage.setItem('user', JSON.stringify(res.data));
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
</style> 