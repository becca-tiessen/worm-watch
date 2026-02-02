<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStats } from '../utils/api'
import { INTENSITY_LEVELS } from '../utils/intensityLevels'

const props = defineProps({
  reports: {
    type: Array,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  isFirstYear: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['zoomTo'])

const stats = ref({
  total_reports_this_week: 0,
  total_active_reports: 0,
  last_season_total_reports: null,
  last_season_peak_intensity: null
});

onMounted(async () => {
  try {
    stats.value = await getStats();
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
});

// Derive the worst hotspot from the reports we already have.
// Group by a rounded grid cell (~500m), sum intensity per cell, pick the highest.
const worstHotspot = computed(() => {
  if (!props.reports || props.reports.length === 0) return null;

  const grid = {};
  props.reports.forEach(r => {
    // Round to 2 decimal places – ~1km grid cells
    const key = `${r.lat.toFixed(2)},${r.lng.toFixed(2)}`;
    grid[key] = (grid[key] || 0) + r.intensity;
  });

  let worstKey = null, worstScore = 0;
  for (const [key, score] of Object.entries(grid)) {
    if (score > worstScore) { worstScore = score; worstKey = key; }
  }

  if (!worstKey) return null;
  const [lat, lng] = worstKey.split(',').map(Number);
  // Find the highest single-report intensity in that cell for the label
  const highestInCell = props.reports
    .filter(r => r.lat.toFixed(2) === lat.toFixed(2) && r.lng.toFixed(2) === lng.toFixed(2))
    .reduce((max, r) => Math.max(max, r.intensity), 0);
  const levelInfo = INTENSITY_LEVELS.find(l => l.level === highestInCell);

  return { lat, lng, score: worstScore, label: levelInfo?.label || 'Unknown' };
});

// Days until May 1 – used in the off-season countdown
const daysUntilSeason = computed(() => {
  const now = new Date();
  let nextMay = new Date(now.getFullYear(), 4, 1); // May 1 this year (month is 0-indexed)
  if (now >= nextMay) nextMay = new Date(now.getFullYear() + 1, 4, 1); // already past May, use next year
  return Math.ceil((nextMay - now) / (1000 * 60 * 60 * 24));
});

// Label for last season's peak intensity
const lastSeasonPeakLabel = computed(() => {
  if (!stats.value?.last_season_peak_intensity) return null;
  const level = INTENSITY_LEVELS.find(l => l.level === stats.value.last_season_peak_intensity);
  return level ? `${level.emoji} ${level.label}` : null;
});

function handleZoomTo() {
  if (worstHotspot.value) {
    emit('zoomTo', worstHotspot.value);
  }
}
</script>

<template>
  <div class="stats-panel">

    <!-- ─── OFF-SEASON VIEW ─── -->
    <!-- Shown when it's not May–July. Branches on first year vs has retrospective data. -->
    <template v-if="status === 'DORMANT'">

      <!-- FIRST YEAR: no previous season to look back on -->
      <template v-if="isFirstYear">
        <h4>🛡️ Worm Watch</h4>
        <p class="offseason-message">
          This is Worm Watch's first season. The worms are sleeping – but when they wake up in May, we'll need your help keeping the map up to date.
        </p>
        <div class="stat-row">
          <span class="stat-number">{{ daysUntilSeason }}</span>
          <span class="stat-label">days until season opens</span>
        </div>
      </template>

      <!-- RETURNING YEAR: show last season's retrospective -->
      <template v-else>
        <h4>🗺️ Last Season's Report</h4>
        <div class="stat-row">
          <span class="stat-number">{{ stats.last_season_total_reports }}</span>
          <span class="stat-label">total sightings last season</span>
        </div>
        <div v-if="lastSeasonPeakLabel" class="stat-row">
          <span class="stat-label">Peak intensity reached</span>
          <span class="stat-number">{{ lastSeasonPeakLabel }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-number">{{ daysUntilSeason }}</span>
          <span class="stat-label">days until next season</span>
        </div>
      </template>
    </template>

    <!-- ─── IN-SEASON VIEW ─── -->
    <!-- Shown during WATCH and ACTIVE states (May–July) -->
    <template v-else>
      <h4>🗺️ Worm Watch – This Week</h4>

      <div class="stat-row">
        <span class="stat-number">{{ stats.total_reports_this_week }}</span>
        <span class="stat-label">reports this week</span>
      </div>

      <div class="stat-row">
        <span class="stat-number">{{ stats.total_active_reports }}</span>
        <span class="stat-label">active sightings on the map</span>
      </div>

      <!-- Worst hotspot – only show if there are reports -->
      <div v-if="worstHotspot" class="stat-row hotspot">
        <span class="stat-label">Worst area right now</span>
        <span class="stat-number">{{ worstHotspot.label }}</span>
        <!-- Clicking this centres the map on the hotspot -->
        <button class="zoom-to-btn" @click="handleZoomTo">
          Show on map →
        </button>
      </div>

      <!-- Gentle nudge when reports are low -->
      <p v-if="stats.total_reports_this_week < 5" class="nudge">
        Help keep the map up to date – tap anywhere to report a sighting.
      </p>
    </template>

  </div>
</template>

<style scoped>
.stats-panel {
  position: fixed;
  top: 64px;  /* 48px banner + 16px gap */
  right: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  max-width: 300px;
  z-index: 1000;
}

h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.offseason-message {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.stat-row {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #4CAF50;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hotspot {
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.zoom-to-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.zoom-to-btn:hover {
  background: #1976D2;
}

.nudge {
  margin: 1rem 0 0 0;
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 3px solid #ffc107;
  color: #856404;
  font-size: 0.85rem;
  line-height: 1.4;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .stats-panel {
    top: auto;
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>
