<template>
  <div class="task-item" :class="{ 'task-completed': task.isCompleted }">
    <label class="checkbox-container">
      <input
        type="checkbox"
        :checked="task.isCompleted"
        @change="handleCheckboxChange"
      />
      <span class="custom-checkmark"></span>
    </label>

    <span class="task-title">{{ task.title }}</span>

    <button
      class="delete-btn"
      @click="handleDelete"
      title="Xóa công việc"
      aria-label="Xóa công việc"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  emits: ['toggle', 'delete'],
  methods: {
    handleCheckboxChange(e) {
      this.$emit('toggle', this.task, e.target.checked);
    },
    handleDelete() {
      this.$emit('delete', this.task._id);
    }
  }
};
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1.2rem;
  margin-bottom: 0.85rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.07);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.78);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(31, 38, 135, 0.12);
  border-color: rgba(255, 255, 255, 0.95);
}

.task-completed {
  background: rgba(255, 255, 255, 0.38);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.04);
}

.task-completed .task-title {
  text-decoration: line-through;
  color: #94a3b8;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.checkbox-container input[type="checkbox"] {
  width: 21px;
  height: 21px;
  cursor: pointer;
  accent-color: #4f46e5;
  border-radius: 6px;
}

.task-title {
  flex: 1;
  font-size: 0.98rem;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
  transition: color 0.2s ease;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(254, 226, 226, 0.85);
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.delete-btn:active {
  transform: translateY(0);
}
</style>
