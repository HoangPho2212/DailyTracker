<template>
  <main class="card" :class="{ 'card-auth': !currentUser }">
    <header class="app-header">
      <div v-if="currentUser" class="header-top-row">
        <div class="user-session-badge">
          <span class="user-avatar-icon">👤</span>
          <span class="user-name">{{ currentUser.username }}</span>
          <button type="button" class="btn-logout" @click="handleLogout" title="Đăng xuất">
            Đăng xuất
          </button>
        </div>
      </div>

      <h1 class="app-title">
        <span>📅</span> Daily Tracker
      </h1>
      <p class="app-subtitle">Theo dõi thói quen & quản lý tiến độ từng ngày</p>
    </header>

    <!-- CASE 1: NOT AUTHENTICATED -> Regis/Login panel directly in the middle of the webapp -->
    <div v-if="!currentUser" class="auth-centered-view">
      <AuthModal
        :is-open="true"
        :inline="true"
        :initial-mode="authModalMode"
        :error="authError"
        :loading="isAuthLoading"
        @submit="handleAuthSubmit"
      />
    </div>

    <!-- CASE 2: AUTHENTICATED -> Full Daily Tracker and Analytics Dashboard -->
    <template v-else>
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
    </template>
  </main>
</template>

<script>
import apiService from './services/api';
import CalendarView from './components/CalendarView.vue';
import ProgressBar from './components/ProgressBar.vue';
import TaskItem from './components/TaskItem.vue';
import DashboardView from './components/DashboardView.vue';
import AuthModal from './components/AuthModal.vue';

export default {
  name: 'App',
  components: {
    CalendarView,
    ProgressBar,
    TaskItem,
    DashboardView,
    AuthModal
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
      isAnalyticsLoading: false,

      // Authentication State
      currentUser: apiService.getCurrentUser(),
      isAuthModalOpen: !apiService.getToken(),
      authModalMode: 'login',
      authError: '',
      isAuthLoading: false
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
    window.addEventListener('auth:unauthorized', this.onUnauthorized);
    if (this.currentUser && apiService.getToken()) {
      this.verifySessionAndFetch();
    } else {
      this.isAuthModalOpen = true;
    }
  },
  beforeUnmount() {
    window.removeEventListener('auth:unauthorized', this.onUnauthorized);
  },
  methods: {
    onUnauthorized() {
      this.currentUser = null;
      this.tasks = [];
      this.analyticsData = null;
      this.isAuthModalOpen = true;
      this.authError = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    },

    openAuthModal(mode = 'login') {
      this.authModalMode = mode;
      this.authError = '';
      this.isAuthModalOpen = true;
    },

    async verifySessionAndFetch() {
      try {
        const user = await apiService.getMe();
        this.currentUser = user;
        localStorage.setItem('dailytracker_user', JSON.stringify(user));
        this.fetchTasks();
      } catch {
        this.onUnauthorized();
      }
    },

    async handleAuthSubmit({ mode, username, password }) {
      this.isAuthLoading = true;
      this.authError = '';
      try {
        let result;
        if (mode === 'register') {
          result = await apiService.register(username, password);
        } else {
          result = await apiService.login(username, password);
        }
        this.currentUser = result.user;
        this.isAuthModalOpen = false;
        this.fetchTasks();
        if (this.activeTab === 'dashboard') {
          this.fetchAnalytics();
        }
      } catch (err) {
        this.authError = err.message || 'Xác thực không thành công';
      } finally {
        this.isAuthLoading = false;
      }
    },

    handleLogout() {
      apiService.logout();
      this.currentUser = null;
      this.tasks = [];
      this.analyticsData = null;
      this.authModalMode = 'login';
      this.authError = '';
      this.isAuthModalOpen = true;
    },
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

.header-top-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.65rem;
}

.user-session-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.05);
}

.user-avatar-icon {
  font-size: 0.95rem;
}

.user-name {
  color: #4338ca;
  font-weight: 700;
}

.btn-logout {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-login-trigger {
  background: transparent;
  border: none;
  color: #4f46e5;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-login-trigger:hover {
  background: rgba(79, 70, 229, 0.1);
}

.auth-centered-view {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 1rem 0 0.5rem;
}

.card-auth {
  max-width: 520px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

@media (max-width: 640px) {
  .view-tabs {
    padding: 4px;
    margin-bottom: 1.25rem;
    border-radius: 14px;
  }

  .tab-btn {
    padding: 0.55rem 0.5rem;
    font-size: 0.85rem;
    border-radius: 10px;
    min-height: 42px;
  }

  .selected-date-header {
    padding: 0.6rem 0.75rem;
    font-size: 0.82rem;
    border-radius: 12px;
    margin-bottom: 0.85rem;
  }

  .selected-date-icon {
    font-size: 1rem;
  }

  .header-top-row {
    margin-bottom: 0.4rem;
  }

  .user-session-badge {
    padding: 0.25rem 0.65rem;
    font-size: 0.8rem;
  }

  .btn-logout {
    font-size: 0.76rem;
    padding: 0.15rem 0.35rem;
  }
}

@media (max-width: 380px) {
  .tab-btn {
    font-size: 0.78rem;
    padding: 0.45rem 0.35rem;
  }

  .selected-date-header {
    font-size: 0.78rem;
  }
}
</style>
