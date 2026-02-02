<script setup>
import { ref, computed, watch } from 'vue'
import { submitReport } from '../utils/api'
import { INTENSITY_LEVELS } from '../utils/intensityLevels'
import { NEIGHBOURHOODS, getNearestNeighbourhood } from '../utils/neighbourhoods'
import { fireConfetti } from '../utils/confetti'
import ShareButton from './ShareButton.vue'

const props = defineProps({
  coords: {
    type: Object,
    required: false,   // no longer required — can open with no location set
    default: null
  },
  openedFrom: {
    type: String,
    default: 'fab'          // 'map' or 'fab'
  }
})

const emit = defineEmits(['submitted', 'close', 'requestMapClick'])

const intensity = ref(null)
const notes = ref('')
const submitted = ref(false)
const submitting = ref(false)
const error = ref(null)

// Location state
// 'gps' | 'neighbourhood' | 'map' | null
const locationMethod = ref(null)
// GPS-derived coords (only set after a successful geolocation call)
const gpsCoords = ref(null)
// Currently selected neighbourhood (the object from NEIGHBOURHOODS, not just the name)
const selectedNeighbourhood = ref(null)
// Whether we're waiting for the user to click the map
const waitingForMapClick = ref(false)
// When true, shows the full picker even in map-click mode
const showFullPicker = ref(false)

// The resolved coordinates — whichever method is active
const resolvedCoords = computed(() => {
  if (locationMethod.value === 'gps' && gpsCoords.value) return gpsCoords.value;
  if (locationMethod.value === 'neighbourhood' && selectedNeighbourhood.value) {
    return { lat: selectedNeighbourhood.value.lat, lng: selectedNeighbourhood.value.lng };
  }
  if (locationMethod.value === 'map' && props.coords) return props.coords;
  // Fallback: if coords were passed in (user clicked map before opening form)
  if (props.coords) return props.coords;
  return null;
});

// The inferred neighbourhood name for the current location, if any.
const inferredNeighbourhood = computed(() => {
  if (!resolvedCoords.value) return null;
  const n = getNearestNeighbourhood(resolvedCoords.value.lat, resolvedCoords.value.lng);
  return n ? n.name : null;
});

// GPS: call the Geolocation API
function useMyLocation() {
  if (!navigator.geolocation) {
    error.value = 'Your browser does not support geolocation.';
    return;
  }
  locationMethod.value = 'gps';
  waitingForMapClick.value = false;
  gpsCoords.value = null; // clear while we fetch
  error.value = null;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      gpsCoords.value = { lat: position.coords.latitude, lng: position.coords.longitude };
    },
    () => {
      error.value = 'Location access was denied. Try another method.';
      locationMethod.value = null;
    }
  );
}

// Neighbourhood: user picks from dropdown
function selectNeighbourhood(event) {
  const name = event.target.value;
  if (!name) return;
  selectedNeighbourhood.value = NEIGHBOURHOODS.find(n => n.name === name) || null;
  locationMethod.value = 'neighbourhood';
  waitingForMapClick.value = false;
}

// Map: tell the parent we need a click
function pickOnMap() {
  locationMethod.value = 'map';
  waitingForMapClick.value = true;
  emit('requestMapClick');
}

// When the parent passes new coords after a map click, stop waiting
watch(() => props.coords, (newCoords) => {
  if (newCoords && waitingForMapClick.value) {
    waitingForMapClick.value = false;
  }
});

async function handleSubmit() {
  if (!intensity.value || !resolvedCoords.value) return;

  submitting.value = true;
  error.value = null;

  try {
    await submitReport({
      lat: resolvedCoords.value.lat,
      lng: resolvedCoords.value.lng,
      intensity: intensity.value,
      notes: notes.value,
    });
    submitted.value = true;
    fireConfetti();
    emit('submitted');
  } catch (err) {
    error.value = 'Failed to submit report. Please try again.';
    console.error('Submit error:', err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="report-form-overlay" @click.self="$emit('close')">
    <div class="report-form">
      <button class="close-btn" @click="$emit('close')" aria-label="Close">×</button>

      <h3 v-if="openedFrom === 'map' && inferredNeighbourhood && !showFullPicker">
        What's it like in {{ inferredNeighbourhood }}?
      </h3>
      <h3 v-else>What's it like out there?</h3>

      <template v-if="!submitted">

        <!-- ─── LOCATION: compact confirmation shown when opened from map click ─── -->
        <div v-if="openedFrom === 'map' && resolvedCoords && !showFullPicker" class="location-confirmed">
          <p class="location-confirmed-text">
            📍 <span v-if="inferredNeighbourhood">Reporting in {{ inferredNeighbourhood }}</span><span v-else>Reporting here</span>
            <button type="button" class="change-btn" @click="showFullPicker = true">Change</button>
          </p>
        </div>

        <!-- ─── LOCATION: full picker shown when opened from FAB, or after clicking Change ─── -->
        <div v-else class="location-section">
          <p class="location-label">Where did you see them?</p>

          <div class="location-buttons">
            <button type="button" class="location-btn" @click="useMyLocation">
              📍 Use my location
            </button>
            <button type="button" class="location-btn" @click="pickOnMap">
              🗺️ Pick on map
            </button>
          </div>

          <select class="neighbourhood-select" @change="selectNeighbourhood">
            <option value="">Or pick a neighbourhood...</option>
            <option v-for="n in NEIGHBOURHOODS" :key="n.name" :value="n.name">
              {{ n.name }}
            </option>
          </select>

          <!-- Status line -->
          <p v-if="waitingForMapClick" class="location-status waiting">
            👆 Click anywhere on the map to place your report
          </p>
          <p v-else-if="resolvedCoords" class="location-status set">
            ✓ Location set
            <span v-if="locationMethod === 'neighbourhood' && selectedNeighbourhood">
              — {{ selectedNeighbourhood.name }}
            </span>
          </p>
          <p v-else class="location-status empty">
            Pick a location above to continue
          </p>
        </div>

        <!-- ─── INTENSITY SELECTOR ─── -->
        <div class="intensity-buttons">
          <button
            v-for="item in INTENSITY_LEVELS"
            :key="item.level"
            :class="{ selected: intensity === item.level }"
            @click="intensity = item.level"
            type="button"
          >
            <span class="emoji">{{ item.emoji }}</span>
            <span class="label">{{ item.label }}</span>
          </button>
        </div>

        <p v-if="intensity" class="level-description">
          {{ INTENSITY_LEVELS.find(i => i.level === intensity).description }}
        </p>

        <textarea
          v-model="notes"
          placeholder="Anything else? (optional)"
          maxlength="500"
          rows="3"
        />

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button
          class="submit-btn"
          @click="handleSubmit"
          :disabled="!intensity || !resolvedCoords || submitting"
        >
          {{ submitting ? 'Submitting...' : 'Report Sighting' }}
        </button>
      </template>

      <!-- ─── SUCCESS STATE ─── -->
      <template v-else>
        <p class="success-msg">🎉 Thanks for the report!</p>
        <ShareButton :intensity="intensity" :coords="resolvedCoords" />
        <button class="close-btn-bottom" @click="$emit('close')">Close</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.report-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.report-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
}

h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

/* Location confirmed (compact mode when opened from map click) */
.location-confirmed {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.location-confirmed-text {
  margin: 0;
  font-size: 0.95rem;
  color: #2e7d32;
  background: #e8f5e9;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.change-btn {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.change-btn:hover {
  color: #0d47a1;
}

/* Location picker */
.location-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.location-label {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.location-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.location-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
}

.location-btn:hover {
  border-color: #999;
  background: #f9f9f9;
}

.neighbourhood-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: white;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.neighbourhood-select:focus {
  outline: none;
  border-color: #4CAF50;
}

.location-status {
  margin: 0;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.location-status.set {
  color: #2e7d32;
  background: #e8f5e9;
}

.location-status.waiting {
  color: #e65100;
  background: #fff3e0;
  font-weight: 500;
}

.location-status.empty {
  color: #757575;
  background: #f5f5f5;
}

.intensity-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.intensity-buttons button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.intensity-buttons button:hover {
  border-color: #999;
  background: #f9f9f9;
}

.intensity-buttons button.selected {
  border-color: #4CAF50;
  background: #e8f5e9;
}

.emoji {
  font-size: 1.5rem;
}

.label {
  font-weight: 500;
  color: #333;
}

.level-description {
  margin: 0.5rem 0 1rem 0;
  padding: 0.75rem;
  background: #f0f0f0;
  border-radius: 6px;
  color: #666;
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 1rem;
}

textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.submit-btn,
.close-btn-bottom {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: #4CAF50;
  color: white;
  margin-bottom: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #45a049;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.close-btn-bottom {
  background: #f0f0f0;
  color: #333;
}

.close-btn-bottom:hover {
  background: #e0e0e0;
}

.success-msg {
  font-size: 1.25rem;
  color: #4CAF50;
  text-align: center;
  margin: 1rem 0;
}

.error-msg {
  color: #d32f2f;
  background: #ffebee;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .report-form {
    padding: 1.5rem;
  }

  h3 {
    font-size: 1.25rem;
  }
}
</style>
