<script setup>
import { ref } from 'vue'
import Map from './components/Map.vue'
import SeasonBanner from './components/SeasonBanner.vue'
import StatsPanel from './components/StatsPanel.vue'
import ReportForm from './components/ReportForm.vue'
import { useReports } from './composables/useReports'
import { useSeasonStatus } from './composables/useSeasonStatus'

const { reports, fetchReports } = useReports()

// Create a ref for stats that will be populated by StatsPanel
// We pass it to useSeasonStatus so it can determine isFirstYear
const stats = ref({})

const { status, isFirstYear } = useSeasonStatus(reports, stats)

// Report form state
const showForm = ref(false)
const reportCoords = ref(null)
const formOpenedFrom = ref(null)    // 'map' or 'fab'

// Map ref for calling zoomTo method
const mapRef = ref(null)

function openReportForm(coords = null) {
  reportCoords.value = coords
  formOpenedFrom.value = 'fab'
  showForm.value = true
}

// This fires when user clicks the map
function handleMapClick(coords) {
  if (showForm.value) {
    // Form is open — update its coords (covers both "pick on map" and the old click-to-open flow)
    reportCoords.value = coords
  } else {
    // Form is closed — open it with the clicked coords (the original behaviour)
    reportCoords.value = coords
    formOpenedFrom.value = 'map'
    showForm.value = true
  }
}

// This fires when the form wants the user to click the map
function handleRequestMapClick() {
  // Nothing else needed here — the form already shows its own "click the map" prompt.
  // The next mapClick will update reportCoords, which the form watches via its props.
}

function handleReportSubmitted() {
  // Refresh reports to show the new one on the map
  fetchReports()
}

function handleCloseForm() {
  showForm.value = false
  reportCoords.value = null
}

function handleZoomTo(hotspot) {
  if (mapRef.value) {
    mapRef.value.zoomTo(hotspot.lat, hotspot.lng)
  }
}
</script>

<template>
  <div id="app">
    <SeasonBanner :status="status" />

    <Map
      ref="mapRef"
      :reports="reports"
      @mapClick="handleMapClick"
    />

    <StatsPanel
      :reports="reports"
      :status="status"
      :isFirstYear="isFirstYear"
      @zoomTo="handleZoomTo"
    />

    <ReportForm
      v-if="showForm"
      :coords="reportCoords"
      :opened-from="formOpenedFrom"
      @submitted="handleReportSubmitted"
      @close="handleCloseForm"
      @requestMapClick="handleRequestMapClick"
    />

    <!-- Floating action button to open the form without clicking the map first -->
    <button v-if="!showForm" class="fab-report" @click="openReportForm()">
      🐛 Report
    </button>
  </div>
</template>

<style>
/* Global styles will be in App.css */

.fab-report {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
  padding: 14px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 28px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: background 0.2s, transform 0.1s;
  animation: fab-pulse 1.5s ease 1s 2;   /* starts after 1s delay, runs twice */
}

.fab-report:hover {
  background: #45a049;
}

.fab-report:active {
  transform: scale(0.95);
}

@keyframes fab-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  50%      { transform: scale(1.12); box-shadow: 0 6px 20px rgba(76,175,80,0.5); }
}
</style>
