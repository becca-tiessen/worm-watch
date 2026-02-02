<script setup>
import { ref, watch, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet.heat'
import { toHeatmapPoints } from '../utils/heatmapUtils'

const props = defineProps({
  reports: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['mapClick'])

const mapContainer = ref(null)
let map = null
let heatLayer = null

// Hint visibility — starts true, fades out after 5 seconds
const showHint = ref(true)
const showOutOfBoundsToast = ref(false)

onMounted(() => {
  // Winnipeg bounding box — same values the backend uses for validation.
  // maxBounds locks panning so the user can't scroll away from the city.
  // minZoom 10 is roughly "greater Winnipeg visible" — any more zoomed out and
  // you're looking at Manitoba.
  const WINNIPEG_BOUNDS = L.latLngBounds(
    [49.75, -97.35],   // southwest corner
    [50.05, -96.95]    // northeast corner
  );

  map = L.map(mapContainer.value, {
    maxBounds: WINNIPEG_BOUNDS,
    maxBoundsViscosity: 1.0,   // 1.0 = hard wall, can't pan past it at all
    minZoom: 10,
    maxZoom: 16,
  }).setView([49.8994, -97.1353], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;

    // Same bounding box as the backend — reject clicks outside Winnipeg
    if (lat < 49.75 || lat > 50.05 || lng < -97.35 || lng > -96.95) {
      showOutOfBoundsToast.value = true;
      setTimeout(() => { showOutOfBoundsToast.value = false; }, 2500);
      return;   // don't emit, don't open the form
    }

    emit('mapClick', { lat, lng });
    showHint.value = false;
  });

  // Auto-dismiss after 5 seconds
  setTimeout(() => { showHint.value = false; }, 5000);
});

watch(() => props.reports, (newReports) => {
  if (!map) return;
  if (heatLayer) map.removeLayer(heatLayer);

  if (newReports.length > 0) {
    heatLayer = L.heatLayer(toHeatmapPoints(newReports), {
      radius: 60,
      blur: 15,
      maxZoom: 18,
      minOpacity: 0.5,
      gradient: {
        '0.0': '#3388ff',
        '0.4': '#ffcc00',
        '0.7': '#ff6600',
        '1.0': '#ff0000',
      },
    }).addTo(map);
  }
}, { deep: true });

// Expose method to parent for zooming to a location
defineExpose({
  zoomTo(lat, lng, zoom = 14) {
    if (map) {
      map.setView([lat, lng], zoom);
    }
  }
});
</script>

<template>
  <div id="map" ref="mapContainer" class="map-container">
    <!-- Tap hint — floats over the map, fades out automatically -->
    <div v-if="showHint" class="map-hint">
      🐛 Tap anywhere to report a sighting
    </div>

    <!-- Out-of-bounds toast — briefly appears if user clicks outside Winnipeg -->
    <div v-if="showOutOfBoundsToast" class="map-toast">
      That's outside Winnipeg — tap somewhere on the city
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
  cursor: crosshair;
}

.map-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;           /* don't block map clicks */
  animation: hint-fade 5s ease forwards;
}

@keyframes hint-fade {
  0%, 70% { opacity: 1; }
  100%    { opacity: 0; }
}

.map-toast {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  background: rgba(200, 50, 50, 0.85);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  animation: toast-in-out 2.5s ease forwards;
}

@keyframes toast-in-out {
  0%   { opacity: 0; transform: translateX(-50%) translateY(8px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(8px); }
}
</style>
