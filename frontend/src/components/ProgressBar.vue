<template>
  <div class="progress-container">
    <div class="progress-header">
      <span class="progress-label">Tiến độ hôm nay</span>
      <span class="progress-percent">{{ progress }}%</span>
    </div>
    <div class="progress-wrapper">
      <div
        class="progress-fill"
        :style="{ width: `${clampedProgress}%` }"
        :class="{ 'completed-bar': clampedProgress === 100 }"
      >
        {{ clampedProgress }}%
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgressBar',
  props: {
    progress: {
      type: Number,
      required: true,
      default: 0
    }
  },
  computed: {
    clampedProgress() {
      if (isNaN(this.progress)) return 0;
      return Math.min(Math.max(Math.round(this.progress), 0), 100);
    }
  }
};
</script>

<style scoped>
.progress-container {
  margin: 1.75rem 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.progress-percent {
  color: #4f46e5;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.08);
  font-size: 0.85rem;
  font-weight: 800;
}

.progress-wrapper {
  width: 100%;
  height: 28px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(31, 38, 135, 0.06);
  padding: 3px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%);
  color: #ffffff;
  text-align: center;
  font-weight: 800;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  border-radius: 999px;
  box-shadow: 0 3px 12px rgba(79, 70, 229, 0.4);
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill.completed-bar {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4);
}
</style>
