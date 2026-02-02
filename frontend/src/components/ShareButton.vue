<script setup>
import { ref } from 'vue'
import { INTENSITY_LEVELS } from '../utils/intensityLevels'

const props = defineProps({
  intensity: {
    type: Number,
    required: true
  },
  coords: {
    type: Object,
    required: true
  }
})

const copied = ref(false)

function getShareText() {
  const level = INTENSITY_LEVELS.find(l => l.level === props.intensity);
  const appUrl = import.meta.env.VITE_APP_URL || 'https://wormwatch.winnipeg.ca';
  return `${level.emoji} I just reported a "${level.label}" sighting on Worm Watch. Check the map before you head out: ${appUrl}`;
}

async function handleShare() {
  await navigator.clipboard.writeText(getShareText());
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>

<template>
  <button class="share-btn" @click="handleShare">
    <span v-if="!copied">📤 Share this sighting</span>
    <span v-else>✓ Copied to clipboard!</span>
  </button>
</template>

<style scoped>
.share-btn {
  width: 100%;
  padding: 1rem;
  border: 2px solid #2196F3;
  background: white;
  color: #2196F3;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.share-btn:hover {
  background: #2196F3;
  color: white;
}
</style>
