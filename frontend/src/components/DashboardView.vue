<template>
  <div class="dashboard-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-indicator">
      Đang phân tích dữ liệu thống kê...
    </div>

    <!-- Data Loaded -->
    <div v-else-if="analytics" class="dashboard-content">
      <!-- Week Navigation Controls -->
      <div class="week-nav-bar">
        <button
          type="button"
          class="nav-week-btn prev-week-btn"
          @click="$emit('navigate-week', -7)"
          title="Tuần trước"
        >
          ‹ Tuần trước
        </button>

        <div class="week-range-label">
          📅 {{ formattedWeekRange }}
        </div>

        <button
          type="button"
          class="nav-week-btn next-week-btn"
          @click="$emit('navigate-week', 7)"
          title="Tuần sau"
        >
          Tuần sau ›
        </button>
      </div>

      <!-- Week-over-Week Comparison Banner -->
      <div class="comparison-card" :class="`comparison-${analytics.comparison.status}`">
        <div class="comparison-header">
          <span
            class="comparison-badge"
            :class="`status-${analytics.comparison.status}`"
          >
            {{ comparisonSign }}{{ analytics.comparison.weekDiff }}%
          </span>
          <h3 class="comparison-title">{{ comparisonTitle }}</h3>
        </div>
        <p class="comparison-message">{{ analytics.comparison.message }}</p>

        <!-- Two-column Comparison Grid -->
        <div class="week-compare-grid">
          <div class="compare-box current-box">
            <span class="compare-label">Tuần này</span>
            <div class="compare-rate">{{ analytics.currentWeek.averageCompletion }}%</div>
            <div class="compare-sub">
              {{ analytics.currentWeek.completedTasks }}/{{ analytics.currentWeek.totalTasks }} việc hoàn thành
            </div>
          </div>

          <div class="compare-box previous-box">
            <span class="compare-label">Tuần trước</span>
            <div class="compare-rate">{{ analytics.previousWeek.averageCompletion }}%</div>
            <div class="compare-sub">
              {{ analytics.previousWeek.completedTasks }}/{{ analytics.previousWeek.totalTasks }} việc hoàn thành
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Progress in Current Week -->
      <div class="section-card daily-breakdown-card">
        <h4 class="section-title">📊 Tiến độ từng ngày trong tuần</h4>
        <div class="daily-stats-list">
          <div
            v-for="day in analytics.currentWeek.days"
            :key="day.date"
            class="daily-stat-row"
          >
            <div class="day-meta">
              <span class="day-dow">{{ day.dayOfWeek }}</span>
              <span class="day-date">{{ formatDateShort(day.date) }}</span>
            </div>

            <div class="stat-bar-track">
              <div
                class="stat-bar-fill"
                :style="{ width: `${day.rate}%` }"
                :class="{ 'full-rate': day.rate === 100, 'zero-rate': day.rate === 0 }"
              ></div>
            </div>

            <div class="day-numbers">
              <span class="day-percent">{{ day.rate }}%</span>
              <span class="day-count">({{ day.completed }}/{{ day.total }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Summary Overview -->
      <div class="section-card month-summary-card">
        <h4 class="section-title">
          🗓️ Tổng quan tháng {{ formattedMonthDisplay }}
        </h4>
        <div class="month-stats-grid">
          <div class="month-stat-item">
            <div class="month-stat-val text-primary">{{ analytics.currentMonth.averageCompletion }}%</div>
            <div class="month-stat-label">Hoàn thành TB</div>
          </div>

          <div class="month-stat-item">
            <div class="month-stat-val text-success">{{ analytics.currentMonth.completedTasks }} / {{ analytics.currentMonth.totalTasks }}</div>
            <div class="month-stat-label">Tổng việc đã xong</div>
          </div>

          <div class="month-stat-item">
            <div class="month-stat-val text-accent">{{ bestDayText }}</div>
            <div class="month-stat-label">Ngày tốt nhất</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardView',
  props: {
    analytics: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['navigate-week'],
  computed: {
    comparisonSign() {
      if (!this.analytics || !this.analytics.comparison) return '';
      return this.analytics.comparison.weekDiff > 0 ? '+' : '';
    },
    comparisonTitle() {
      if (!this.analytics) return '';
      switch (this.analytics.comparison.status) {
        case 'better':
          return 'Tiến bộ vượt trội!';
        case 'lower':
          return 'Cần thêm nỗ lực!';
        default:
          return 'Duy trì ổn định!';
      }
    },
    formattedWeekRange() {
      if (!this.analytics || !this.analytics.currentWeek) return '';
      const start = this.formatDateShort(this.analytics.currentWeek.startDate);
      const end = this.formatDateShort(this.analytics.currentWeek.endDate);
      return `${start} - ${end}`;
    },
    formattedMonthDisplay() {
      if (!this.analytics || !this.analytics.currentMonth) return '';
      const [y, m] = this.analytics.currentMonth.month.split('-');
      return `${m}/${y}`;
    },
    bestDayText() {
      if (!this.analytics || !this.analytics.currentMonth || !this.analytics.currentMonth.bestDay) {
        return 'Chưa có';
      }
      const b = this.analytics.currentMonth.bestDay;
      return `${this.formatDateShort(b.date)} (${b.rate}%)`;
    }
  },
  methods: {
    formatDateShort(dateStr) {
      if (!dateStr) return '';
      const [, m, d] = dateStr.split('-');
      return `${d}/${m}`;
    }
  }
};
</script>

<style scoped>
.dashboard-view {
  margin-top: 1.25rem;
}

.week-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.06);
}

.week-range-label {
  font-weight: 800;
  color: #0f172a;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.nav-week-btn {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  color: #334155;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.05);
  transition: all 0.2s ease;
}

.nav-week-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.1);
}

.nav-week-btn:active {
  transform: translateY(0);
}

/* Comparison Card */
.comparison-card {
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.85);
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
}

.comparison-card.comparison-better {
  border-left: 6px solid #10b981;
}

.comparison-card.comparison-lower {
  border-left: 6px solid #f59e0b;
}

.comparison-card.comparison-equal {
  border-left: 6px solid #4f46e5;
}

.comparison-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.comparison-badge {
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.95rem;
}

.comparison-badge.status-better {
  background: rgba(209, 250, 229, 0.85);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.comparison-badge.status-lower {
  background: rgba(254, 243, 199, 0.85);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.comparison-badge.status-equal {
  background: rgba(224, 231, 255, 0.85);
  color: #3730a3;
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.comparison-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.comparison-message {
  font-size: 0.95rem;
  color: #334155;
  margin-bottom: 1.25rem;
  font-weight: 600;
}

.week-compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.compare-box {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 4px 14px rgba(31, 38, 135, 0.05);
}

.compare-box.current-box {
  background: rgba(238, 242, 255, 0.65);
  border-color: rgba(99, 102, 241, 0.35);
}

.compare-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.compare-rate {
  font-size: 1.85rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0.25rem 0;
}

.current-box .compare-rate {
  color: #4f46e5;
}

.compare-sub {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 600;
}

/* Daily Breakdown Card */
.section-card {
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.25rem;
}

.daily-stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.daily-stat-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.9rem;
}

.day-meta {
  width: 72px;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.day-dow {
  font-weight: 800;
  color: #0f172a;
}

.day-date {
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
}

.stat-bar-track {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 2px;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
  transition: width 0.45s ease;
}

.stat-bar-fill.full-rate {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
}

.stat-bar-fill.zero-rate {
  width: 0 !important;
}

.day-numbers {
  min-width: 85px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
  font-size: 0.85rem;
}

.day-percent {
  font-weight: 800;
  color: #0f172a;
}

.day-count {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Monthly Overview Grid */
.month-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
  text-align: center;
}

.month-stat-item {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 16px;
  padding: 1rem 0.65rem;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
}

.month-stat-val {
  font-size: 1.35rem;
  font-weight: 900;
  margin-bottom: 0.35rem;
}

.text-primary {
  color: #4f46e5;
}

.text-success {
  color: #10b981;
}

.text-accent {
  color: #8b5cf6;
}

.month-stat-label {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 700;
}
</style>
