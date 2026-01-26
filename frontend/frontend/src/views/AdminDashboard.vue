<template>
  // ... existing code ...
  <!-- Section Factions – Coins (Leaderboard): retirer les 2 inputs "total" -->
  <div class="card">
    <h3>Factions — Coins (Leaderboard)</h3>

    <!-- Supprimer ces deux blocs:
         - Bagnat total
         - Fermier total -->

    <!-- Conserver uniquement les prix éditables -->
    <div class="row">
      <label>Prix Bagnat</label>
      <input v-model.number="factionsPrices.bagnat" type="number" min="0" step="1" />
      <button @click="saveFactionPrice('bagnat')">Sauvegarder</button>
    </div>

    <div class="row">
      <label>Prix Fermier</label>
      <input v-model.number="factionsPrices.fermier" type="number" min="0" step="1" />
      <button @click="saveFactionPrice('fermier')">Sauvegarder</button>
    </div>

    <p class="muted">
      Le classement utilise le “prix” pour afficher les coins des membres.
    </p>
  </div>
  // ... existing code ...
</template>

<script setup>
// ... existing code ...
const factionsPrices = reactive({ bagnat: 1, fermier: 1 });

async function saveFactionPrice(name) {
  // ... existing code ...
  await secureApiCall('/factions/settings', {
    method: 'POST',
    body: { name, leaderboardCoinPrice: factionsPrices[name] },
    cache: 'no-store'
  });
  // ... existing code ...
}
// ... existing code ...
</script>