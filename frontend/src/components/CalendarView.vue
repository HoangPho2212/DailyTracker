<template>
  <div class="calendar-container">
    <!-- Header: Month, Year, and Controls -->
    <div class="calendar-header">
      <div class="month-nav-group">
        <button
          type="button"
          class="month-nav-btn prev-month-btn"
          @click="changeMonth(-1)"
          title="Tháng trước"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span class="calendar-month-title">
          Tháng {{ currentMonth + 1 }}, {{ currentYear }}
        </span>
        <button
          type="button"
          class="month-nav-btn next-month-btn"
          @click="changeMonth(1)"
          title="Tháng sau"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <button
        type="button"
        class="today-btn"
        :class="{ active: isViewingToday }"
        @click="goToToday"
      >
        Hôm nay
      </button>
    </div>

    <!-- Weekday row (Handwritten CSS Grid 7 columns) -->
    <div class="weekdays-grid">
      <div
        v-for="day in weekDays"
        :key="day"
        class="weekday-cell"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar days grid (Handwritten CSS Grid 7 columns) -->
    <div class="days-grid">
      <button
        v-for="day in calendarDays"
        :key="day.date"
        type="button"
        class="day-cell"
        :class="{
          'is-current-month': day.isCurrentMonth,
          'other-month': !day.isCurrentMonth,
          'is-selected': day.isSelected,
          'is-today': day.isToday
        }"
        :data-date="day.date"
        @click="selectDate(day)"
      >
        <span class="day-number">{{ day.dayNumber }}</span>
        <span v-if="day.isToday" class="today-indicator"></span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CalendarView',
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue', 'date-change'],
  data() {
    let year, month;
    if (this.modelValue && /^\d{4}-\d{2}-\d{2}$/.test(this.modelValue)) {
      const parts = this.modelValue.split('-').map(Number);
      year = parts[0];
      month = parts[1] - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    return {
      currentYear: year,
      currentMonth: month,
      weekDays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    };
  },
  computed: {
    todayString() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    isViewingToday() {
      return this.modelValue === this.todayString;
    },
    calendarDays() {
      const days = [];
      const year = this.currentYear;
      const month = this.currentMonth;

      // First day of current month
      const firstDay = new Date(year, month, 1);
      // Last day of current month
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      // Day of week for 1st day (0 = Sunday, 1 = Monday, ... 6 = Saturday)
      // Normalize to Monday = 0, Sunday = 6
      const startDayIndex = (firstDay.getDay() + 6) % 7;

      // Last day of previous month
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      const prevMonthYear = month === 0 ? year - 1 : year;
      const prevMonthNum = month === 0 ? 12 : month;

      // Add trailing days from previous month
      for (let i = startDayIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        const mStr = String(prevMonthNum).padStart(2, '0');
        const dStr = String(dayNum).padStart(2, '0');
        const dateStr = `${prevMonthYear}-${mStr}-${dStr}`;
        days.push({
          date: dateStr,
          dayNumber: dayNum,
          isCurrentMonth: false,
          isToday: dateStr === this.todayString,
          isSelected: dateStr === this.modelValue
        });
      }

      // Add days of current month
      for (let d = 1; d <= daysInMonth; d++) {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const dateStr = `${year}-${mStr}-${dStr}`;
        days.push({
          date: dateStr,
          dayNumber: d,
          isCurrentMonth: true,
          isToday: dateStr === this.todayString,
          isSelected: dateStr === this.modelValue
        });
      }

      // Calculate total rows needed (minimum 35, or 42 if month spans 6 weeks)
      const totalCellsNeeded = days.length <= 35 ? 35 : 42;
      const remainingCells = totalCellsNeeded - days.length;

      const nextMonthYear = month === 11 ? year + 1 : year;
      const nextMonthNum = month === 11 ? 1 : month + 2;

      for (let d = 1; d <= remainingCells; d++) {
        const mStr = String(nextMonthNum).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const dateStr = `${nextMonthYear}-${mStr}-${dStr}`;
        days.push({
          date: dateStr,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: dateStr === this.todayString,
          isSelected: dateStr === this.modelValue
        });
      }

      return days;
    }
  },
  watch: {
    modelValue(newVal) {
      if (newVal && /^\d{4}-\d{2}-\d{2}$/.test(newVal)) {
        const [y, m] = newVal.split('-').map(Number);
        this.currentYear = y;
        this.currentMonth = m - 1;
      }
    }
  },
  methods: {
    changeMonth(offset) {
      const target = new Date(this.currentYear, this.currentMonth + offset, 1);
      this.currentYear = target.getFullYear();
      this.currentMonth = target.getMonth();
    },
    selectDate(day) {
      if (!day.isCurrentMonth) {
        const [y, m] = day.date.split('-').map(Number);
        this.currentYear = y;
        this.currentMonth = m - 1;
      }
      this.$emit('update:modelValue', day.date);
      this.$emit('date-change', day.date);
    },
    goToToday() {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth();
      this.$emit('update:modelValue', this.todayString);
      this.$emit('date-change', this.todayString);
    }
  }
};
</script>

<style scoped>
.calendar-container {
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 22px;
  padding: 1.5rem;
  margin-bottom: 1.75rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.month-nav-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.calendar-month-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  min-width: 145px;
  text-align: center;
  letter-spacing: -0.01em;
}

.month-nav-btn {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #334155;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.06);
  transition: all 0.2s ease;
}

.month-nav-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.12);
}

.month-nav-btn:active {
  transform: translateY(0);
}

.today-btn {
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #334155;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.06);
  transition: all 0.2s ease;
}

.today-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  transform: translateY(-1px);
}

.today-btn.active {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.95), rgba(124, 58, 237, 0.95));
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

/* Handwritten CSS Grid layout */
.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  text-align: center;
  margin-bottom: 0.75rem;
}

.weekday-cell {
  font-size: 0.8rem;
  font-weight: 800;
  color: #475569;
  padding: 0.35rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #1e293b;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 700;
  position: relative;
  box-shadow: 0 2px 6px rgba(31, 38, 135, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.day-cell:hover:not(.is-selected) {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(99, 102, 241, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(99, 102, 241, 0.2);
}

.day-cell.other-month {
  color: #94a3b8;
  box-shadow: none;
  background: transparent;
  border-color: transparent;
  opacity: 0.45;
}

.day-cell.other-month:hover:not(.is-selected) {
  background: rgba(255, 255, 255, 0.3);
  opacity: 0.75;
}

.day-cell.is-today:not(.is-selected) {
  border: 2px solid #4f46e5;
  color: #4f46e5;
  font-weight: 900;
}

.today-indicator {
  position: absolute;
  bottom: 5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #4f46e5;
}

.day-cell.is-selected {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  color: #ffffff !important;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45) !important;
}

.day-cell.is-selected .today-indicator {
  background-color: #ffffff;
}

@media (max-width: 640px) {
  .calendar-container {
    padding: 0.85rem 0.65rem;
    border-radius: 18px;
    margin-bottom: 1.25rem;
  }

  .calendar-header {
    margin-bottom: 0.85rem;
  }

  .calendar-month-title {
    font-size: 0.95rem;
    min-width: 110px;
  }

  .month-nav-btn {
    width: 32px;
    height: 32px;
    font-size: 1.1rem;
    border-radius: 8px;
  }

  .today-btn {
    padding: 0.35rem 0.65rem;
    font-size: 0.78rem;
    border-radius: 8px;
  }

  .weekdays-grid {
    gap: 4px;
    margin-bottom: 0.5rem;
  }

  .weekday-cell {
    font-size: 0.72rem;
    padding: 0.2rem 0;
  }

  .days-grid {
    gap: 4px;
  }

  .day-cell {
    border-radius: 8px;
    font-size: 0.88rem;
    min-height: 36px;
  }

  .today-indicator {
    bottom: 3px;
    width: 4px;
    height: 4px;
  }
}

@media (max-width: 380px) {
  .calendar-container {
    padding: 0.65rem 0.45rem;
  }

  .month-nav-group {
    gap: 0.35rem;
  }

  .calendar-month-title {
    font-size: 0.88rem;
    min-width: 95px;
  }

  .days-grid,
  .weekdays-grid {
    gap: 3px;
  }

  .day-cell {
    font-size: 0.82rem;
    min-height: 32px;
    border-radius: 6px;
  }
}
</style>
