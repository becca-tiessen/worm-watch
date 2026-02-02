<script setup>
const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['DORMANT', 'WATCH', 'ACTIVE'].includes(value)
  }
})

const bannerConfig = {
  DORMANT: {
    message: "🛡️ All clear. Winnipeg is worm-free. For now.",
    class: 'dormant'
  },
  WATCH: {
    message: "👀 Season's open. Stay sharp – they could show up any day.",
    class: 'watch'
  },
  ACTIVE: {
    message: "⚠️ Worms are out there. Check the map before you head out.",
    class: 'active'
  }
}
</script>

<template>
  <div class="season-banner" :class="bannerConfig[status].class">
    {{ bannerConfig[status].message }}
  </div>
</template>

<style scoped>
.season-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dormant {
  background: #e3f2fd;
  color: #1565c0;
  border-bottom: 2px solid #90caf9;
}

.watch {
  background: #fff3cd;
  color: #856404;
  border-bottom: 2px solid #ffc107;
}

.active {
  background: #ffccbc;
  color: #d84315;
  border-bottom: 2px solid #ff5722;
}

@media (max-width: 768px) {
  .season-banner {
    font-size: 0.9rem;
    padding: 0.75rem;
  }
}
</style>
