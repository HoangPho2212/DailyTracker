<template>
  <main class="card">
    <header class="app-header">
      <h1 class="app-title">
        <span>📅</span> Daily Tracker
      </h1>
      <p class="app-subtitle">Theo dõi thói quen & quản lý tiến độ từng ngày</p>
    </header>

    <!-- Navigation Tabs: Tracker vs Dashboard -->
    <nav class="view-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'tracker' }"
        @click="activeTab = 'tracker'"
      >
        📅 Theo dõi ngày
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'dashboard' }"
        @click="switchTab('dashboard')"
      >
        📊 Báo cáo & Thống kê
      </button>
    </nav>

    <!-- Error Alert banner -->
    <div v-if="errorMessage" class="alert-box alert-error">
      {{ errorMessage }}
    </div>

    <!-- TAB 1: DAILY TRACKER -->
    <section v-if="activeTab === 'tracker'" class="tracker-section">
      <!-- Date selector (CSS Grid Calendar) -->
      <CalendarView
        :model-value="selectedDate"
        @update:model-value="onDateChange"
        @date-change="onDateChange"
      />

      <!-- Selected Date Banner -->
      <div class="selected-date-header">
        <span class="selected-date-icon">📌</span>
        <span>Công việc ngày: <strong>{{ formattedSelectedDate }}</strong></span>
      </div>

      <!-- Dynamic Progress Bar -->
      <ProgressBar :progress="progress" />

      <!-- Task Creation Form -->
      <form @submit.prevent="addTask" class="task-form">
        <input
          v-model="newTaskTitle"
          type="text"
          placeholder="Thêm thói quen hoặc công việc mới..."
          class="task-input"
          :disabled="isLoading"
        />
        <button
          type="submit"
          class="btn-primary"
          :disabled="isLoading || !newTaskTitle.trim()"
        >
          <span>+</span> Thêm
        </button>
      </form>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-indicator">
        Đang tải dữ liệu...
      </div>

      <!-- Task List -->
      <div v-else class="task-list-section">
        <div v-if="tasks.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <p>Chưa có công việc nào trong ngày này.</p>
          <p class="empty-hint">Hãy thêm công việc đầu tiên ở trên!</p>
        </div>

        <div v-else class="task-items-wrapper">
          <TaskItem
            v-for="task in tasks"
            :key="task._id"
            :task="task"
            @toggle="toggleTask"
            @delete="deleteTask"
          />
        </div>
      </div>
    </section>

    <!-- TAB 2: REVIEW & ANALYTICS DASHBOARD -->
    <section v-else-if="activeTab === 'dashboard'" class="dashboard-section">
      <DashboardView
        :analytics="analyticsData"
        :is-loading="isAnalyticsLoading"
        @navigate-week="navigateDashboardWeek"
      />
    </section>
  </main>
</template>

<script>
import apiService from './services/api';
import CalendarView from './components/CalendarView.vue';
import ProgressBar from './components/ProgressBar.vue';
import TaskItem from './components/TaskItem.vue';
import DashboardView from './components/DashboardView.vue';

export default {
  name: 'App',
  components: {
    CalendarView,
    ProgressBar,
    TaskItem,
    DashboardView
  },
  data() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;

    return {
      activeTab: 'tracker',
      selectedDate: today,
      tasks: [],
      newTaskTitle: '',
      isLoading: false,
      errorMessage: null,
      dashboardDate: today,
      analyticsData: null,
      isAnalyticsLoading: false
    };
  },
  computed: {
    progress() {
      if (!this.tasks || this.tasks.length === 0) return 0;
      const completed = this.tasks.filter((t) => t.isCompleted).length;
      return Math.round((completed / this.tasks.length) * 100);
    },
    formattedSelectedDate() {
      if (!this.selectedDate) return '';
      try {
        const [y, m, d] = this.selectedDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return this.selectedDate;
      }
    }
  },
  mounted() {
    this.fetchTasks();
  },
  methods: {
    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'dashboard') {
        this.fetchAnalytics();
      }
    },

    async fetchTasks() {
      this.isLoading = true;
      this.errorMessage = null;
      try {
        const data = await apiService.getDay(this.selectedDate);
        this.tasks = data && data.tasks ? data.tasks : [];
      } catch (err) {
        this.errorMessage = 'Không thể tải danh sách công việc. Vui lòng kiểm tra server backend.';
        console.error('Fetch error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAnalytics() {
      this.isAnalyticsLoading = true;
      this.errorMessage = null;
      try {
        const data = await apiService.getAnalyticsSummary(this.dashboardDate);
        this.analyticsData = data;
      } catch (err) {
        this.errorMessage = 'Không thể tải dữ liệu thống kê: ' + (err.message || 'Lỗi kết nối');
        console.error('Analytics error:', err);
      } finally {
        this.isAnalyticsLoading = false;
      }
    },

    navigateDashboardWeek(offsetDays) {
      const [y, m, d] = this.dashboardDate.split('-').map(Number);
      const target = new Date(y, m - 1, d);
      target.setDate(target.getDate() + offsetDays);

      const targetY = target.getFullYear();
      const targetM = String(target.getMonth() + 1).padStart(2, '0');
      const targetD = String(target.getDate()).padStart(2, '0');
      this.dashboardDate = `${targetY}-${targetM}-${targetD}`;
      this.fetchAnalytics();
    },

    onDateChange(newDate) {
      if (this.selectedDate !== newDate) {
        this.selectedDate = newDate;
        this.fetchTasks();
      }
    },

    async addTask() {
      const trimmed = this.newTaskTitle.trim();
      if (!trimmed) return;

      this.errorMessage = null;
      try {
        const dayData = await apiService.addTask(this.selectedDate, trimmed);
        this.tasks = dayData.tasks || [];
        this.newTaskTitle = '';
        if (this.analyticsData) this.fetchAnalytics();
      } catch (err) {
        this.errorMessage = 'Không thể thêm công việc: ' + (err.message || 'Lỗi server');
        console.error('Add task error:', err);
      }
    },

    async toggleTask(task, newStatus) {
      this.errorMessage = null;
      const previousStatus = task.isCompleted;
      task.isCompleted = newStatus;

      try {
        const dayData = await apiService.updateTask(this.selectedDate, task._id, {
          isCompleted: newStatus
        });
        this.tasks = dayData.tasks || [];
        if (this.analyticsData) this.fetchAnalytics();
      } catch (err) {
        task.isCompleted = previousStatus;
        this.errorMessage = 'Không thể cập nhật trạng thái: ' + (err.message || 'Lỗi server');
        console.error('Toggle error:', err);
      }
    },

    async deleteTask(taskId) {
      this.errorMessage = null;
      try {
        const dayData = await apiService.deleteTask(this.selectedDate, taskId);
        this.tasks = dayData.tasks || [];
        if (this.analyticsData) this.fetchAnalytics();
      } catch (err) {
        this.errorMessage = 'Không thể xóa công việc: ' + (err.message || 'Lỗi server');
        console.error('Delete error:', err);
      }
    }
  }
};
</script>

<style scoped>
.view-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 1.75rem;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.06);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.tab-btn:hover:not(.active) {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.4);
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #4f46e5;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.2);
}

.selected-date-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1.1rem;
  border-radius: 14px;
  font-size: 0.95rem;
  color: #1e293b;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.05);
  border-left: 4px solid #4f46e5;
}

.selected-date-icon {
  font-size: 1.15rem;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 0.35rem;
  color: #64748b;
  font-weight: 500;
}

.task-items-wrapper {
  margin-top: 1.25rem;
}
</style>
