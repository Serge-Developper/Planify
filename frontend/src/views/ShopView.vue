<template>
  <div v-if="show" class="shop-overlay" @click.self="$emit('close')">
    <div class="shop-modal">
      <button class="close-btn" @click="$emit('close')">✕</button>
      <h1 class="shop-title">Boutique Planify</h1>
      <div class="coins-balance">
        <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
        <span>{{ userCoins }} Planify Coins</span>
      </div>
      <div class="shop-grid">
        <div v-for="item in shopItems" :key="item.id" class="shop-item">
          <div class="item-img-wrapper">
            <img :src="item.img" :alt="item.name" class="item-img" />
          </div>
          <div class="item-name">{{ item.name }}</div>
          <div class="item-price">
            <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
            {{ item.price }}
          </div>
          <button class="buy-btn" :disabled="userCoins < item.price || boughtItemId === item.id" @click="buyItem(item)">
            {{ boughtItemId === item.id ? 'Acheté !' : 'Acheter' }}
          </button>
        </div>
      </div>
      <transition name="fade">
        <div v-if="showConfirm" class="confirm-message">
          🎉 Bravo ! Tu as acheté {{ boughtItemName }} !
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import pieceP from '@/assets/img/planicoins.png'
import catEars from '@/assets/accounttt.svg' // Utilisé comme placeholder

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['close'])

const userCoins = ref(120) // Mocké, à remplacer par le vrai solde plus tard

const shopItems = [
  {
    id: 1,
    name: 'Oreillettes de chat',
    price: 50,
    img: catEars,
  },
  {
    id: 2,
    name: 'Cadre doré',
    price: 80,
    img: pieceP, // Placeholder
  },
  {
    id: 3,
    name: 'Lunettes pixel',
    price: 60,
    img: pieceP, // Placeholder
  },
  {
    id: 4,
    name: 'Chapeau party',
    price: 70,
    img: pieceP, // Placeholder
  },
  {
    id: 5,
    name: 'Couronne',
    price: 100,
    img: pieceP, // Placeholder
  },
]

const showConfirm = ref(false)
const boughtItemName = ref('')
const boughtItemId = ref(null)

function buyItem(item) {
  if (userCoins.value >= item.price) {
    userCoins.value -= item.price
    boughtItemName.value = item.name
    boughtItemId.value = item.id
    showConfirm.value = true
    setTimeout(() => {
      showConfirm.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shop-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 32px #00ff1230, 0 1.5px 6px #0001;
  padding: 32px 16px 48px 16px;
  max-width: 480px;
  width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: fadeIn 0.2s;
}
.close-btn {
  position: absolute;
  right: 18px;
  top: 18px;
  background: transparent;
  border: none;
  z-index: 10;
}
.close-btn:hover { background: transparent; }
.shop-title {
  text-align: center;
  font-size: 2em;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
  margin-bottom: 12px;
  color: #00c97b;
  letter-spacing: 1px;
}
.coins-balance {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 32px;
  color: #222;
}
.coin-icon {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  vertical-align: middle;
}
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 18px;
  margin-top: 16px;
}
.shop-item {
  background: #000000;
  border-radius: 16px;
  box-shadow: 0 2px 12px #00ff1220;
  padding: 18px 12px 22px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
}
.shop-item:hover {
  box-shadow: 0 6px 24px #00ff1240;
  transform: translateY(-4px) scale(1.03);
}
.item-img-wrapper {
  width: 70px;
  height: 70px;
  background: #000000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 2.5px solid #00c97b;
}
.item-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}
.item-name {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 6px;
  color: #222;
  text-align: center;
}
.item-price {
  display: flex;
  align-items: center;
  font-size: 1em;
  color: #00c97b;
  font-weight: bold;
  margin-bottom: 10px;
}
.buy-btn {
  background: linear-gradient(90deg, #00c97b, #00ff12);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 28px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px #00ff1220;
}
.buy-btn:disabled {
  background: #bbb;
  color: #fff;
  cursor: not-allowed;
  opacity: 0.7;
}
.confirm-message {
  position: fixed;
  left: 50%;
  top: 32px;
  transform: translateX(-50%);
  background: #00c97b;
  color: #fff;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.2em;
  font-weight: bold;
  box-shadow: 0 4px 24px #00ff1240;
  z-index: 1000;
  animation: fadeIn 0.3s;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
@media (max-width: 600px) {
  .shop-modal {
    padding: 8px 2px 24px 2px;
    max-width: 99vw;
  }
  .shop-title {
    font-size: 1.2em;
  }
  .shop-grid {
    gap: 10px;
  }
  .item-img-wrapper {
    width: 80px;
    height: 80px;
  }
  .item-img {
    width: 60px;
    height: 60px;
  }
  .close-btn {
    right: 6px;
    top: 6px;
    
  }
}
</style> 