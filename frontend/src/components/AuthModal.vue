<template>
  <div v-if="isOpen" :class="inline ? 'auth-inline-container' : 'auth-modal-overlay'">
    <div class="glass-card auth-card" :class="{ 'auth-card-inline': inline }">
      <div class="auth-header">
        <div class="auth-icon-badge">✨</div>
        <h2 class="auth-title">Daily Tracker</h2>
        <p class="auth-subtitle">
          {{ mode === 'login' ? 'Đăng nhập vào không gian cá nhân của bạn' : 'Đăng ký tài khoản mới' }}
        </p>
      </div>

      <!-- Mode Tabs -->
      <div class="auth-tabs">
        <button
          type="button"
          class="auth-tab-btn"
          :class="{ active: mode === 'login' }"
          @click="setMode('login')"
        >
          Đăng nhập
        </button>
        <button
          type="button"
          class="auth-tab-btn"
          :class="{ active: mode === 'register' }"
          @click="setMode('register')"
        >
          Đăng ký
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="auth-error-alert">
        <span class="error-icon">⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="auth-username">Tên đăng nhập</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              id="auth-username"
              v-model="username"
              type="text"
              class="glass-input"
              placeholder="Ví dụ: hoangpho2212"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-password">Mật khẩu</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="auth-password"
              v-model="password"
              type="password"
              class="glass-input"
              placeholder="Ít nhất 6 ký tự"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <div v-if="mode === 'register'" class="register-hint">
          💡 <strong>Mẹo:</strong> Tài khoản đầu tiên đăng ký sẽ tự động kết nối và bảo lưu dữ liệu mẫu hiện có.
        </div>

        <button
          type="submit"
          class="glass-btn primary-btn auth-submit-btn"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner">⏳ Đang xử lý...</span>
          <span v-else>
            {{ mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản & Bắt đầu' }}
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  },
  initialMode: {
    type: String,
    default: 'login'
  },
  error: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'close']);

const mode = ref(props.initialMode || 'login');
const username = ref('');
const password = ref('');
const localError = ref('');

watch(() => props.initialMode, (newVal) => {
  if (newVal) mode.value = newVal;
});

watch(() => props.error, (newVal) => {
  localError.value = newVal || '';
});

const errorMessage = computed(() => {
  return localError.value || props.error;
});

const setMode = (newMode) => {
  mode.value = newMode;
  localError.value = '';
};

const handleSubmit = () => {
  localError.value = '';

  const cleanUsername = username.value.trim();
  if (cleanUsername.length < 3) {
    localError.value = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    return;
  }

  if (password.value.length < 6) {
    localError.value = 'Mật khẩu phải có ít nhất 6 ký tự';
    return;
  }

  emit('submit', {
    mode: mode.value,
    username: cleanUsername,
    password: password.value
  });
};
</script>

<style scoped>
.auth-inline-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 0;
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 2.25rem 2rem;
  border-radius: 1.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.auth-card-inline {
  max-width: 100%;
  box-shadow: 0 12px 32px rgba(31, 38, 135, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.88);
}

.auth-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.auth-icon-badge {
  font-size: 2.2rem;
  width: 60px;
  height: 60px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.2));
  border-radius: 50%;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.auth-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.35rem 0;
}

.auth-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.auth-tabs {
  display: flex;
  background: rgba(226, 232, 240, 0.6);
  border-radius: 1rem;
  padding: 0.3rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.auth-tab-btn {
  flex: 1;
  padding: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
}

.auth-tab-btn.active {
  background: #ffffff;
  color: #4f46e5;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.auth-error-alert {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(254, 226, 226, 0.9);
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  font-size: 0.88rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.input-wrapper .glass-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.6rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(203, 213, 225, 0.8);
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  color: #0f172a;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.input-wrapper .glass-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: #ffffff;
}

.register-hint {
  font-size: 0.82rem;
  color: #475569;
  background: rgba(241, 245, 249, 0.8);
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  border-left: 3px solid #6366f1;
  line-height: 1.4;
}

.auth-submit-btn {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 0.85rem;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.4);
  transition: all 0.25s ease;
}

.auth-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -4px rgba(79, 70, 229, 0.5);
}

.auth-submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
