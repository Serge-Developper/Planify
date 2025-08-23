import { defineStore } from 'pinia';
import { secureApiCall } from '@/api';

// Import des images
import oreilleschat from '@/assets/img/oreilleschat.gif';
import clowncheveux from '@/assets/img/clowncheveux.gif';
import cash from '@/assets/img/cash.gif';
import target from '@/assets/img/target.gif';
import roi from '@/assets/img/roi.gif';
import matrix from '@/assets/img/matrix.gif';
import angelwings from '@/assets/img/angelwings.gif';
import laracroft from '@/assets/img/laracroft.gif';
import star from '@/assets/img/star.gif';
import cadre from '@/assets/img/cadre.gif';
import love from '@/assets/img/love.gif';
import moustache from '@/assets/img/moustache.gif';
import vinyle from '@/assets/img/vinyle.gif';
import advisory from '@/assets/img/advisory.gif';
import spacestars from '@/assets/img/spacestars.gif';
import bras from '@/assets/img/bras.png';
import flash from '@/assets/img/flash.gif';
import chat from '@/assets/img/chat.gif';
import dvd from '@/assets/img/dvd.png';
import mlglunette from '@/assets/img/mlglunette.gif';
import nokia from '@/assets/img/nokia.gif';
import jojo from '@/assets/img/tobecontinued.png';
import galaxie from '@/assets/img/Galaxie.png';
import coeur from '@/assets/img/Coeur.png';
import alphaImg from '@/assets/img/Alpha.png';
import adminPlanify from '@/assets/img/Admin Planify.png';

export interface PurchasedItem {
  itemId: number;
  itemName: string;
  purchaseDate: Date;
  equipped: boolean;
  adminMessage?: string; // Message optionnel de l'admin lors de l'attribution
}

export interface BorderColor {
  id: string;
  name: string;
  color: string;
  gradient?: string;
  unlocked: boolean;
}

// Fonction pour déterminer le type d'affichage d'un item
function getItemDisplayType(itemId: number): string {
  switch (itemId) {
    case 0: return 'classic-border'; // Bordure classique
    case 1: return 'cat-ears'; // Oreillettes de chat
    case 2: return 'clown'; // Clown
    case 3: return 'cash'; // Cash
    case 4: return 'target'; // Cible
    case 6: return 'roi'; // Roi
    case 7: return 'matrix'; // Matrix
    case 8: return 'angel'; // Ange
    case 9: return 'tomb-raider'; // Tomb Raider
    case 10: return 'etoiles'; // Étoiles (overlay dédié côté UI)
    case 11: return 'royal-frame'; // Cadre royale
    case 12: return 'rainbow'; // Rose
    case 13: return 'gentleman'; // Gentleman
    case 14: return 'vinyle'; // Vinyle
    case 15: return 'advisory'; // Advisory
    case 16: return 'espace'; // Espace
    case 17: return 'absolute-cinema'; // Absolute Cinema
    case 18: return 'flash'; // Flash
    case 19: return 'miaou'; // Miaou
    case 20: return 'dvd'; // DVD
    case 21: return 'lunettes-pixel'; // Lunettes pixel
    case 22: return 'nokia'; // 2000
    case 24: return 'jojo'; // Jojo (overlay dédié)
    case 23: return 'discord'; // Discord (3 styles via variante)
    case 25: return 'generic'; // Galaxie (utilise le gabarit Discord côté UI)
    case 26: return 'coeur'; // Coeur (overlay dédié côté UI)
    case 27: return 'alpha'; // Alpha (overlay dédié)
    case 28: return 'admin-planify'; // Admin Planify (overlay dédié)
    default: return 'generic';
  }
}

export const useCoinsStore = defineStore('coins', {
  state: () => ({
    balance: 0,
    purchasedItems: [] as PurchasedItem[],
    equippedItemId: null as number | null,
    loading: false,
    lastSpinDate: null as Date | null,
    canSpinToday: true,
    borderColors: [] as BorderColor[],
    selectedBorderColor: 'default' as string,
    // Variante visuelle pour l'item Discord (0: discordon, 1: nepasderange, 2: derange)
    discordVariantIndex: 0 as number,
    // Variante visuelle pour l'item Jojo (0: sans texte, 1: avec jojotext.gif)
    jojoVariantIndex: 0 as number,
    // Positionnement/tailles pour l'aperçu Jojo dans l'onglet Collection
    jojoImgPos: { top: 50, left: 87, width: 90 } as { top: number; left: number; width: number },
    jojoTextPos: { top: -5, left: 10, width: 72 } as { top: number; left: number; width: number }
  }),

  getters: {
    hasItem: (state) => (itemId: number) => {
      return state.purchasedItems.some(item => item.itemId === itemId);
    },

    // Vérifier si une couleur de bordure est débloquée
    hasBorderColor: (state) => (colorId: string) => {
      const color = state.borderColors.find(c => c.id === colorId);
      return color ? color.unlocked : false;
    },
    
    isItemEquipped: (state) => (itemId: number) => {
      return state.equippedItemId === itemId;
    },
    
    equippedItem: (state) => {
      const equippedItem = state.purchasedItems.find(item => item.itemId === state.equippedItemId);
      if (!equippedItem) return null;
      
      // Mapper avec les données du shop pour avoir accès à l'image
      const shopItems = [
        { id: 0, name: 'Bordure classique', img: '' }, // Pas d'image pour la bordure classique
        { id: 1, name: 'Oreillettes de chat', img: oreilleschat },
        { id: 2, name: 'Clown', img: clowncheveux },
        { id: 3, name: 'Cash', img: cash },
        { id: 4, name: 'Cible', img: target },
        { id: 6, name: 'Roi', img: roi },
        { id: 7, name: 'Matrix', img: matrix },
        { id: 8, name: 'Ange', img: angelwings },
        { id: 9, name: 'Tomb Raider', img: laracroft },
        { id: 10, name: 'Étoiles', img: star },
        { id: 11, name: 'Cadre royale', img: cadre },
        { id: 12, name: 'Roses', img: love },
        { id: 13, name: 'Gentleman', img: moustache },
        { id: 14, name: 'Vinyle', img: vinyle },
        { id: 15, name: 'Advisory', img: advisory },
        { id: 16, name: 'Espace', img: spacestars },
        { id: 17, name: 'Absolute Cinema', img: bras },
        { id: 18, name: 'Flash', img: flash },
        { id: 19, name: 'Miaou', img: chat },
        { id: 20, name: 'DVD', img: dvd },
        { id: 21, name: 'Lunettes pixel', img: mlglunette },
        { id: 22, name: '2000', img: nokia },
        { id: 24, name: 'Jojo', img: jojo },
        { id: 25, name: 'Galaxie', img: galaxie },
        { id: 26, name: 'Coeur', img: coeur },
        { id: 27, name: 'Alpha', img: alphaImg },
        { id: 28, name: 'Admin Planify', img: adminPlanify }
      ];
      
      const shopItem = shopItems.find(shopItem => shopItem.id === equippedItem.itemId);
      
      return {
        ...equippedItem,
        img: shopItem?.img || '',
        displayType: getItemDisplayType(equippedItem.itemId)
      };
    },

    // Getter pour la bordure actuelle
    currentBorder: (state) => {
      if (state.equippedItemId === 0) { // Si la bordure classique est équipée
        const baseId = (state.selectedBorderColor || 'default').split('|')[0]
        const selectedColor = state.borderColors.find(color => color.id === baseId);
        return selectedColor || { id: 'default', name: 'Noir', color: '#000000', unlocked: true };
      }
      return null;
    },

    // Getter pour les couleurs de bordure débloquées
    unlockedBorderColors: (state) => {
      return state.borderColors.filter(color => color.unlocked);
    },

    // Getter pour extraire l'ID de couleur de bordure depuis un item weekly
    getBorderColorIdFromItem: (state) => (item: any) => {
      if (item && item.type === 'border-color' && item.colorId) {
        return item.colorId;
      }
      return null;
    },

    // Getter pour obtenir l'index de variante dynamique d'un item
    getDynamicItemVariant: (state) => (itemId: number) => {
      // Pour Discord (itemId 23), retourner l'index de variante stocké
      if (itemId === 23) {
        return state.discordVariantIndex || 0;
      }
      // Pour Jojo (itemId 24), retourner l'index de variante stocké
      if (itemId === 24) {
        return state.jojoVariantIndex || 0;
      }
      // Pour les autres items, retourner 0 par défaut (première variante)
      return 0;
    }
  },

  actions: {
    // Helper: construit un colorId avec les suffixes de variantes (Discord et Jojo)
    // Format: "<base>|dv=<0-2>|jv=<0-1>"
    buildColorIdWithDiscordVariant(baseColorId?: string) {
      const base = baseColorId ? baseColorId.split('|')[0] : (this.selectedBorderColor || 'default').split('|')[0]
      const dv = typeof this.discordVariantIndex === 'number' ? this.discordVariantIndex : 0
      const jv = typeof this.jojoVariantIndex === 'number' ? this.jojoVariantIndex : 0
      return `${base}|dv=${dv}|jv=${jv}`
    },

    // Helper: applique selectedBorderColor depuis backend en extrayant les variantes Discord/Jojo
    applySelectedBorderColorFromBackend(colorIdFromApi?: string) {
      const raw = colorIdFromApi || this.selectedBorderColor || 'default'
      const parts = String(raw).split('|')
      const base = parts[0] || 'default'
      const dvPart = parts.find(p => p.startsWith('dv='))
      if (dvPart) {
        const val = Number(dvPart.split('=')[1])
        this.discordVariantIndex = [0,1,2].includes(val) ? val : 0
      }
      const jvPart = parts.find(p => p.startsWith('jv='))
      if (jvPart) {
        const val = Number(jvPart.split('=')[1])
        this.jojoVariantIndex = [0,1].includes(val) ? val : 0
      }
      this.selectedBorderColor = base
    },
    // Charger le solde de coins
    async loadBalance() {
      try {
        this.loading = true;
        // Délai pour éviter les erreurs 429
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await secureApiCall('/coins/user-coins');
        this.balance = response.coins || 0;
      } catch (error) {
        console.error('Erreur chargement solde:', error);
        this.balance = 0;
      } finally {
        this.loading = false;
      }
    },

    // Charger l'état du spin depuis la base de données
    async loadSpinStatus() {
      try {
        this.loading = true;
        const response = await secureApiCall('/coins/spin-status');
        
        if (response.success) {
          this.canSpinToday = response.canSpin;
          this.lastSpinDate = response.lastSpinDate ? new Date(response.lastSpinDate) : null;
        } else {
          console.error('Erreur chargement statut spin:', response.message);
          this.canSpinToday = true; // Par défaut, permettre le spin
        }
      } catch (error) {
        console.error('Erreur chargement statut spin:', error);
        // En cas d'erreur, ne pas permettre le spin pour éviter les abus
        this.canSpinToday = false;
        this.lastSpinDate = null;
      } finally {
        this.loading = false;
      }
    },

    // Charger l'inventaire
    async loadInventory() {
      try {
        this.loading = true;
        // Délai pour éviter les erreurs 429
        await new Promise(resolve => setTimeout(resolve, 200));
        const response = await secureApiCall('/coins/inventory');
        this.purchasedItems = response.purchasedItems || [];
        // S'assurer que l'item Bordure Classique est présent côté front
        if (!this.purchasedItems.some(it => it.itemId === 0)) {
          this.purchasedItems.push({ itemId: 0, itemName: 'Bordure Classique', purchaseDate: new Date(), equipped: false });
        }
        this.equippedItemId = response.equippedItemId;
        // Pas de lecture locale; on synchronise depuis equippedItemId et le pseudo-item pour Discord
        // Charger couleur de bordure et extraire la variante Discord si encodée
        if (response.selectedBorderColor) {
          this.applySelectedBorderColorFromBackend(response.selectedBorderColor)
        }
        // S'assurer que la palette est initialisée avant synchronisation
        if (!this.borderColors || this.borderColors.length === 0) {
          this.initializeBorderColors();
        }
        // Débloquer les couleurs données via l'admin à partir de l'inventaire
        this.syncUnlockedBorderColorsFromInventory();
      } catch (error) {
        console.error('Erreur chargement inventaire:', error);
        this.purchasedItems = [];
        this.equippedItemId = null;
      } finally {
        this.loading = false;
      }
    },

    // Acheter un item
    async purchaseItem(item: { id: number; name: string; price: number; type?: string }) {
      try {
        this.loading = true;
        const response = await secureApiCall('/coins/purchase', {
          method: 'POST',
          body: JSON.stringify({
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            type: item.type
          })
        });

        if (response.success) {
          this.balance = response.newCoins;
          
          // Si c'est une couleur de bordure, la débloquer
          if (item.type === 'border-color' || item.type === 'border-gradient') {
            const colorId = this.getBorderColorIdFromItem(item);
            if (colorId) {
              this.unlockBorderColor(colorId);
              // Ajuste immédiatement l'état UI pour passer de "Acheter" à "Équiper"
              // en ajoutant l'item au pseudo-inventaire si nécessaire
              if (!this.purchasedItems.find(pi => pi.itemId === item.id)) {
                this.purchasedItems.push({ itemId: item.id, itemName: item.name, purchaseDate: new Date(), equipped: false } as any);
              }
            }
          } else {
            // Sinon, ajouter l'item normalement
            this.purchasedItems.push(response.purchasedItem);
          }
          
          return { success: true, message: response.message };
        } else {
          return { success: false, message: response.message };
        }
      } catch (error) {
        console.error('Erreur achat:', error);
        return { success: false, message: 'Erreur lors de l\'achat' };
      } finally {
        this.loading = false;
      }
    },

    // Fonction pour obtenir l'ID de couleur de bordure à partir d'un item
    getBorderColorIdFromItem(item: { id: number; name: string; type?: string }) {
      // Mapper les IDs d'items vers les IDs de couleurs (que l'item provienne d'un achat ou d'un don admin)
        const colorMapping: { [key: number]: string } = {
          100: 'red',
          101: 'blue', 
          102: 'green',
          103: 'yellow',
          104: 'purple',
          105: 'orange',
          106: 'pink',
          107: 'cyan',
          108: 'gold',
          109: 'silver',
          133: 'bronze',
          // Variantes dégradées personnalisées
          134: 'gradient-mint',
          135: 'gradient-sunset',
          136: 'gradient-duo',
          137: 'gradient-red-fade',
          138: 'gradient-green-fade',
          139: 'gradient-blue-fade',
          140: 'gradient-yellow-fade',
          141: 'gradient-cyan-fade',
          142: 'gradient-magenta-fade',
          143: 'gradient-instagram',
          110: 'rainbow',
          111: 'fire',
          112: 'ice',
          113: 'sunset',
          114: 'ocean',
          115: 'forest',
          116: 'desert',
          117: 'galaxy',
          118: 'aurora',
          119: 'volcano',
          120: 'crystal',
          121: 'midnight',
          122: 'dawn',
          123: 'dusk',
          124: 'storm',
                  125: 'spring',
        126: 'summer',
        127: 'autumn',
        128: 'winter',
        129: 'magenta',
        130: 'lime-green',
        131: 'royal-blue',
        132: 'white',
        // Dégradés ajoutés (IDs 200-231)
        200: 'g200', 201: 'g201', 202: 'g202', 203: 'g203', 204: 'g204', 205: 'g205',
        206: 'g206', 207: 'g207', 208: 'g208', 209: 'g209', 210: 'g210', 211: 'g211',
        212: 'g212', 213: 'g213', 214: 'g214', 215: 'g215', 216: 'g216', 217: 'g217',
        218: 'g218', 219: 'g219', 220: 'g220', 221: 'g221', 222: 'g222', 223: 'g223',
        224: 'g224', 225: 'g225', 226: 'g226', 227: 'g227', 228: 'g228', 229: 'g229',
        230: 'g230', 231: 'g231'
        };
      // Si le type est explicitement une couleur/gradient ou si l'id est dans le mapping, renvoyer l'id couleur
      if (item.type === 'border-color' || item.type === 'border-gradient' || colorMapping[item.id]) {
        return colorMapping[item.id];
      }
      return null;
    },

    // Débloquer côté front les couleurs présentes dans purchasedItems (utiles pour les dons admin)
    syncUnlockedBorderColorsFromInventory() {
      if (!Array.isArray(this.purchasedItems)) return;
      for (const invItem of this.purchasedItems) {
        const colorId = this.getBorderColorIdFromItem({ id: invItem.itemId, name: invItem.itemName });
        if (colorId) {
          this.unlockBorderColor(colorId);
        }
      }
    },

    // Équiper/Déséquiper un item
    async equipItem(itemId: number) {
      try {
        this.loading = true;
        
        console.log('🔧 Tentative d\'équipement/déséquipement pour itemId:', itemId);
        console.log('🔧 Item actuellement équipé:', this.equippedItemId);
        
        // Si l'item est déjà équipé, le déséquiper
        if (this.equippedItemId === itemId) {
          console.log('🔧 Déséquipement de l\'item:', itemId);
          const response = await secureApiCall('/coins/unequip', {
            method: 'POST'
          });

          console.log('🔧 Réponse déséquipement:', response);

          if (response.success) {
            // Mettre à jour l'état local
            this.purchasedItems.forEach(item => {
              item.equipped = false;
            });
            this.equippedItemId = null;
            
            console.log('🔧 État local mis à jour - equippedItemId:', this.equippedItemId);
            
            return { success: true, message: response.message, action: 'unequipped' };
          } else {
            return { success: false, message: response.message };
          }
        } else {
          // Sinon, équiper l'item
          console.log('🔧 Équipement de l\'item:', itemId);
          const response = await secureApiCall('/coins/equip', {
            method: 'POST',
            body: JSON.stringify({ itemId })
          });

          console.log('🔧 Réponse équipement:', response);

          if (response.success) {
            // Mettre à jour l'état local
            this.purchasedItems.forEach(item => {
              item.equipped = item.itemId === itemId;
            });
            this.equippedItemId = itemId;
            
            console.log('🔧 État local mis à jour - equippedItemId:', this.equippedItemId);
            
            return { success: true, message: response.message, action: 'equipped' };
          } else {
            return { success: false, message: response.message };
          }
        }
      } catch (error) {
        console.error('Erreur équipement/déséquipement:', error);
        return { success: false, message: 'Erreur lors de l\'équipement/déséquipement' };
      } finally {
        this.loading = false;
      }
    },

    // Déséquiper un item
    async unequipItem() {
      try {
        this.loading = true;
        const response = await secureApiCall('/coins/unequip', {
          method: 'POST'
        });

        if (response.success) {
          // Mettre à jour l'état local
          this.purchasedItems.forEach(item => {
            item.equipped = false;
          });
          this.equippedItemId = null;
          return { success: true, message: response.message };
        } else {
          return { success: false, message: response.message };
        }
      } catch (error) {
        console.error('Erreur déséquipement:', error);
        return { success: false, message: 'Erreur lors du déséquipement' };
      } finally {
        this.loading = false;
      }
    },

    // Tourner la roue de la fortune
    async spinWheel() {
      try {
        this.loading = true;
        const response = await secureApiCall('/coins', {
          method: 'POST',
          body: JSON.stringify({
            action: 'spin-wheel'
          })
        });

        if (response.success) {
          this.balance = response.newCoins;
          // Recharger le statut depuis le serveur pour avoir les bonnes informations
          await this.loadSpinStatus();
          return { 
            success: true, 
            coinsWon: response.coinsWon,
            message: response.message,
            rewardName: response.rewardName
          };
        } else {
          // Si le spin a échoué, recharger l'état depuis la base de données
          await this.loadSpinStatus();
          return { success: false, message: response.message };
        }
      } catch (error) {
        console.error('Erreur roulette:', error);
        return { success: false, message: 'Erreur lors du spin' };
      } finally {
        this.loading = false;
      }
    },

    // Tourner la roue de la fortune sans mettre à jour le solde immédiatement
    async spinWheelWithoutUpdate() {
      try {
        this.loading = true;
        const response = await secureApiCall('/coins', {
          method: 'POST',
          body: JSON.stringify({
            action: 'spin-wheel'
          })
        });

        if (response.success) {
          // Ne pas mettre à jour le solde immédiatement, seulement le statut
          await this.loadSpinStatus();
          return { 
            success: true, 
            coinsWon: response.coinsWon,
            message: response.message,
            rewardName: response.rewardName
          };
        } else {
          // Si le spin a échoué, recharger l'état depuis la base de données
          await this.loadSpinStatus();
          return { success: false, message: response.message };
        }
      } catch (error) {
        console.error('Erreur roulette:', error);
        return { success: false, message: 'Erreur lors du spin' };
      } finally {
        this.loading = false;
      }
    },

    // Initialiser le store
    async initialize() {
      // Réinitialiser le store avant de charger les nouvelles données
      this.reset();
      // Charger séquentiellement pour éviter les erreurs 429
      this.initializeBorderColors();
      await this.loadBalance();
      await this.loadSpinStatus();
      await this.loadInventory();
    },

    // Initialiser les couleurs de bordures
    initializeBorderColors() {
      // Palette étendue des variantes (unies + quelques dégradés)
      this.borderColors = [
        { id: 'default', name: 'Noir', color: '#000000', unlocked: true },
        { id: 'red', name: 'Rouge', color: '#FF0000', unlocked: false },
        { id: 'green', name: 'Vert', color: '#00FF00', unlocked: false },
        { id: 'blue', name: 'Bleu', color: '#0066FF', unlocked: false },
        { id: 'yellow', name: 'Jaune', color: '#FFFF00', unlocked: false },
        { id: 'cyan', name: 'Cyan', color: '#00FFFF', unlocked: false },
        { id: 'magenta', name: 'Magenta', color: '#FF00FF', unlocked: false },
        { id: 'orange', name: 'Orange', color: '#FF8800', unlocked: false },
        { id: 'pink', name: 'Rose', color: '#FF2F72', unlocked: false },
        { id: 'purple', name: 'Violet', color: '#7A1FFF', unlocked: false },
        { id: 'white', name: 'Blanc', color: '#FFFFFF', unlocked: false },
        { id: 'lime-green', name: 'Vert Lime', color: '#00FF80', unlocked: false },
        // Bleu Royal = couleur unique (bleu canard/bleu/vert)
        { id: 'royal-blue', name: 'Bleu Royal', color: '#0FA3B1', unlocked: false },
        { id: 'gold', name: 'Or', color: '#FFD700', unlocked: false },
        { id: 'silver', name: 'Argent', color: '#C0C0C0', unlocked: false },
        { id: 'bronze', name: 'Bronze', color: '#CD7F32', unlocked: false },
        // Variantes supplémentaires (couleurs unies)
        { id: 'rainbow', name: 'Arc-en-ciel', gradient: 'linear-gradient(90deg, #ff0000, #ffa500, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff)', color: '#ffffff', unlocked: false },
        { id: 'fire', name: 'Feu', color: '#FF4D00', unlocked: false },
        { id: 'ice', name: 'Glace', color: '#A7E8FF', unlocked: false },
        // { id: 'sunset', name: 'Coucher de soleil', color: '#FF7A00', unlocked: false },
        { id: 'ocean', name: 'Océan', color: '#0077BE', unlocked: false },
        { id: 'forest', name: 'Forêt', color: '#228B22', unlocked: false },
        { id: 'desert', name: 'Désert', color: '#C2B280', unlocked: false },
        { id: 'galaxy', name: 'Galaxie', gradient: 'linear-gradient(90deg,#0d0b2d,#3f0b6d,#0b4a6d)', color: '#3f0b6d', unlocked: false },
        { id: 'aurora', name: 'Aurore', gradient: 'linear-gradient(90deg,#26ffb2,#00c1ff,#7a1fff)', color: '#26ffb2', unlocked: false },
        { id: 'volcano', name: 'Volcan', color: '#8B0000', unlocked: false },
        { id: 'crystal', name: 'Cristal', color: '#9AD9FF', unlocked: false },
        { id: 'dawn', name: 'Aube', color: '#FFDAB9', unlocked: false },
        { id: 'dusk', name: 'Crépuscule', color: '#5B4B8A', unlocked: false },
        { id: 'storm', name: 'Tempête', color: '#708090', unlocked: false },
        { id: 'spring', name: 'Printemps', color: '#7CFC00', unlocked: false },
        { id: 'summer', name: 'Été', color: '#F4C430', unlocked: false },
        { id: 'autumn', name: 'Automne', color: '#D2691E', unlocked: false },
        { id: 'winter', name: 'Hiver', color: '#ADD8E6', unlocked: false },
        // Dégradés inspirés des visuels fournis
        { id: 'gradient-instagram', name: 'Néon', color: '#FF0000', gradient: 'linear-gradient(45deg,#FF0000,#7A1FFF,#0066FF)', unlocked: false },
        { id: 'gradient-mint', name: 'Menthe polaire', color: '#00FF80', gradient: 'linear-gradient(45deg,#00FF80,#00FFFF,#7A1FFF)', unlocked: false },
        { id: 'gradient-sunset', name: 'Crépuscule doré', color: '#FF7A00', gradient: 'linear-gradient(45deg,#FFFF00,#FFA500,#FF0000)', unlocked: false },
        { id: 'gradient-duo', name: 'Azur Mandarine', color: '#FF7A00', gradient: 'linear-gradient(45deg,#00A2FF,#FF7A00)', unlocked: false },
        { id: 'gradient-red-fade', name: 'Brume rouge', color: '#FF0000', gradient: 'linear-gradient(180deg, #FF0000, rgba(255,0,0,0))', unlocked: false },
        { id: 'gradient-green-fade', name: 'Brume verte', color: '#00FF00', gradient: 'linear-gradient(180deg, #00FF00, rgba(0,255,0,0))', unlocked: false },
        { id: 'gradient-blue-fade', name: 'Brume bleue', color: '#0066FF', gradient: 'linear-gradient(180deg, #0066FF, rgba(0,102,255,0))', unlocked: false },
        { id: 'gradient-yellow-fade', name: 'Aube', color: '#FFFF00', gradient: 'linear-gradient(180deg, #FFFF00, rgba(255,255,0,0))', unlocked: false },
        { id: 'gradient-cyan-fade', name: 'Lagune', color: '#00FFFF', gradient: 'linear-gradient(180deg, #00FFFF, rgba(0,255,255,0))', unlocked: false },
        { id: 'gradient-magenta-fade', name: 'Orchidée', color: '#FF00FF', gradient: 'linear-gradient(180deg, #FF00FF, rgba(255,0,255,0))', unlocked: false }
        ,
        // Dégradés fournis (diagonale haut-gauche -> bas-droite)
        { id: 'g200', name: 'Neige', color: '#424240', gradient: 'linear-gradient(135deg,#ffffff,#424240)', unlocked: false },
        { id: 'g201', name: 'Gris Urbain', color: '#cbcbcb', gradient: 'linear-gradient(135deg,#1d1d1b,#cbcbcb)', unlocked: false },
        { id: 'g202', name: 'Néon Tricolore', color: '#0460fb', gradient: 'linear-gradient(135deg,#fc0103,#763589,#0460fb)', unlocked: false },
        { id: 'g203', name: 'Néon Menthe', color: '#00fffa', gradient: 'linear-gradient(135deg,#00ff06,#00fffa)', unlocked: false },
        { id: 'g204', name: 'Nébuleuse', color: '#9304ff', gradient: 'linear-gradient(135deg,#03faff,#4982ff,#9304ff)', unlocked: false },
        { id: 'g205', name: 'Soleil', color: '#ff7a00', gradient: 'linear-gradient(135deg,#fffa00,#ff7a00,#ff7a00)', unlocked: false },
        { id: 'g206', name: 'Violet Profond', color: '#9205fa', gradient: 'linear-gradient(135deg,#9205fa,#9205fa,#9205fa)', unlocked: false },
        { id: 'g207', name: 'Magenta Royal', color: '#9700ff', gradient: 'linear-gradient(135deg,#fd00ed,#c900f6,#9700ff)', unlocked: false },
        { id: 'g208', name: 'Aurore Boréale', color: '#fa05ed', gradient: 'linear-gradient(135deg,#05faff,#807ff6,#fa05ed)', unlocked: false },
        { id: 'g209', name: 'Tropical', color: '#ff7602', gradient: 'linear-gradient(135deg,#ff035a,#ff422a,#ff7602)', unlocked: false },
        { id: 'g210', name: 'Jardin d’été', color: '#fa7c03', gradient: 'linear-gradient(135deg,#06fc9f,#81bb51,#fa7c03)', unlocked: false },
        { id: 'g211', name: 'Crépuscule', color: '#f97806', gradient: 'linear-gradient(135deg,#0663f9,#826e7d,#f97806)', unlocked: false },
        { id: 'g212', name: 'Rouge Pastel', color: '#fffafa', gradient: 'linear-gradient(135deg,#ff0505,#fffafa)', unlocked: false },
        { id: 'g213', name: 'Vert Pastel', color: '#fafffa', gradient: 'linear-gradient(135deg,#06ff06,#fafffa)', unlocked: false },
        // Bleu Profond = dégradé bleu/blanc
        { id: 'g214', name: 'Bleu Profond', color: '#0666ff', gradient: 'linear-gradient(135deg,#0666ff,#ffffff)', unlocked: false },
        { id: 'g215', name: 'Jaune Pastel', color: '#fffff9', gradient: 'linear-gradient(135deg,#ffff05,#fffff9)', unlocked: false },
        { id: 'g216', name: 'Cyan Pastel', color: '#f6ffff', gradient: 'linear-gradient(135deg,#08ffff,#f6ffff)', unlocked: false },
        { id: 'g217', name: 'Rose Pastel', color: '#fff9ff', gradient: 'linear-gradient(135deg,#ff05ed,#fff9ff)', unlocked: false },
        { id: 'g218', name: 'Violet Pastel', color: '#fdfbff', gradient: 'linear-gradient(135deg,#9706ff,#fdfbff)', unlocked: false },
        { id: 'g219', name: 'Fuchsia Pastel', color: '#fffbfd', gradient: 'linear-gradient(135deg,#ff0660,#fffbfd)', unlocked: false },
        { id: 'g220', name: 'Orange Pastel', color: '#fffcfa', gradient: 'linear-gradient(135deg,#ff7c06,#fffcfa)', unlocked: false },
        { id: 'g221', name: 'Menthe Pastel', color: '#f8fffc', gradient: 'linear-gradient(135deg,#05ffa5,#f8fffc)', unlocked: false },
        { id: 'g222', name: 'Lave', color: '#030000', gradient: 'linear-gradient(135deg,#fa0000,#030000)', unlocked: false },
        { id: 'g223', name: 'Jungle Nocturne', color: '#000400', gradient: 'linear-gradient(135deg,#00f800,#000400)', unlocked: false },
        { id: 'g224', name: 'Océan Nuit', color: '#000205', gradient: 'linear-gradient(135deg,#005ff8,#000205)', unlocked: false },
        { id: 'g225', name: 'Soleil Éteint', color: '#030300', gradient: 'linear-gradient(135deg,#f8f800,#030300)', unlocked: false },
        { id: 'g226', name: 'Glacier Nuit', color: '#000505', gradient: 'linear-gradient(135deg,#00f9f9,#000505)', unlocked: false },
        { id: 'g227', name: 'Fuchsia Nuit', color: '#050004', gradient: 'linear-gradient(135deg,#f900e7,#050004)', unlocked: false },
        { id: 'g228', name: 'Galaxie Nuit', color: '#030005', gradient: 'linear-gradient(135deg,#9200f9,#030005)', unlocked: false },
        { id: 'g229', name: 'Rose Nuit', color: '#060002', gradient: 'linear-gradient(135deg,#f9005a,#060002)', unlocked: false },
        { id: 'g230', name: 'Ambre Nuit', color: '#060002', gradient: 'linear-gradient(135deg,#f77500,#060002)', unlocked: false },
        { id: 'g231', name: 'Émeraude Nuit', color: '#1c231f', gradient: 'linear-gradient(135deg,#01f9a0,#1c231f)', unlocked: false }
      ];
    },

    // Débloquer une couleur de bordure
    unlockBorderColor(colorId: string) {
      const color = this.borderColors.find(c => c.id === colorId);
      if (color) {
        color.unlocked = true;
      }
    },

    // Changer la couleur de bordure sélectionnée
    async selectBorderColor(colorId: string) {
      const color = this.borderColors.find(c => c.id === colorId);
      if (!color || !color.unlocked) return;
      // Optimistic update
      const previous = this.selectedBorderColor;
      this.selectedBorderColor = colorId;
      try {
        const response = await secureApiCall('/coins/border-color', {
          method: 'POST',
          body: JSON.stringify({ colorId: this.buildColorIdWithDiscordVariant(colorId) })
        });
        if (!response.success) {
          this.selectedBorderColor = previous;
        }
      } catch (e) {
        this.selectedBorderColor = previous;
      }
    },

    // Réinitialiser le store
    reset() {
      this.balance = 0;
      this.purchasedItems = [];
      this.equippedItemId = null;
      this.loading = false;
      this.lastSpinDate = null;
      this.canSpinToday = true;
      this.borderColors = [];
      this.selectedBorderColor = 'default';
      this.discordVariantIndex = 0;
      this.jojoVariantIndex = 0;
      this.jojoImgPos = { top: 50, left: 87, width: 90 };
      this.jojoTextPos = { top: -5, left: 10, width: 72 };
    },

    // Détecter les nouveaux items avec des messages admin
    getNewItemsWithMessages(): PurchasedItem[] {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes
      
      return this.purchasedItems.filter(item => 
        item.adminMessage && 
        new Date(item.purchaseDate) > fiveMinutesAgo
      );
    },

    // Marquer un item comme vu (optionnel, pour éviter de re-afficher la popup)
    markItemAsSeen(itemId: number) {
      const item = this.purchasedItems.find(item => item.itemId === itemId);
      if (item && item.adminMessage) {
        // Optionnel: on pourrait ajouter un champ seen pour éviter de re-afficher
        // item.seen = true;
      }
    },

    // Définir la variante Discord utilisée dans l'UI
    async setDiscordVariantIndex(index: number) {
      if (typeof index === 'number' && index >= 0 && index <= 2) {
        this.discordVariantIndex = index
        // Persister via le même endpoint que les couleurs (encodage dans selectedBorderColor)
        try {
          await secureApiCall('/coins/border-color', {
            method: 'POST',
            body: JSON.stringify({ colorId: this.buildColorIdWithDiscordVariant() })
          })
        } catch {}
      }
    },

    // Définir la variante Jojo utilisée dans l'UI (0: sans texte, 1: avec texte) et la persister
    async setJojoVariantIndex(index: number) {
      if (typeof index === 'number' && (index === 0 || index === 1)) {
        this.jojoVariantIndex = index
        try {
          await secureApiCall('/coins/border-color', {
            method: 'POST',
            body: JSON.stringify({ colorId: this.buildColorIdWithDiscordVariant() })
          })
        } catch {}
      }
    },

    setJojoImgPos(pos: { top?: number; left?: number; width?: number }) {
      this.jojoImgPos = { ...this.jojoImgPos, ...pos }
    },
    setJojoTextPos(pos: { top?: number; left?: number; width?: number }) {
      this.jojoTextPos = { ...this.jojoTextPos, ...pos }
    }
  }
}); 