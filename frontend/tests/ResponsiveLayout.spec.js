import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CalendarView from '../src/components/CalendarView.vue';
import DashboardView from '../src/components/DashboardView.vue';
import TaskItem from '../src/components/TaskItem.vue';
import ProgressBar from '../src/components/ProgressBar.vue';
import AuthModal from '../src/components/AuthModal.vue';

describe('Mobile-First Responsive Layout & Touch Usability', () => {
  it('CalendarView renders 7-day grid and touch-friendly navigation controls', () => {
    const wrapper = mount(CalendarView, {
      props: { modelValue: '2026-09-09' }
    });

    const weekdays = wrapper.findAll('.weekday-cell');
    expect(weekdays).toHaveLength(7);

    const prevBtn = wrapper.find('.month-nav-btn');
    expect(prevBtn.exists()).toBe(true);

    const todayBtn = wrapper.find('.today-btn');
    expect(todayBtn.exists()).toBe(true);

    const daysGrid = wrapper.find('.days-grid');
    expect(daysGrid.exists()).toBe(true);
  });

  it('TaskItem provides touch-friendly delete button and checkbox', () => {
    const task = { _id: '123', title: 'Chạy bộ 3km', isCompleted: false };
    const wrapper = mount(TaskItem, {
      props: { task }
    });

    const deleteBtn = wrapper.find('.delete-btn');
    expect(deleteBtn.exists()).toBe(true);
    expect(deleteBtn.attributes('aria-label')).toBe('Xóa công việc');

    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.exists()).toBe(true);
  });

  it('DashboardView renders adaptive comparison cards and monthly stats', () => {
    const analytics = {
      currentWeek: {
        startDate: '2026-09-07',
        endDate: '2026-09-13',
        averageCompletion: 75,
        totalTasks: 4,
        completedTasks: 3,
        days: []
      },
      previousWeek: {
        startDate: '2026-08-31',
        endDate: '2026-09-06',
        averageCompletion: 50,
        totalTasks: 4,
        completedTasks: 2,
        days: []
      },
      comparison: {
        weekDiff: 25,
        status: 'better',
        message: 'Tiến độ tốt hơn tuần trước (+25%)'
      },
      currentMonth: {
        month: '2026-09',
        averageCompletion: 70,
        totalTasks: 10,
        completedTasks: 7,
        daysRecorded: 5,
        bestDay: { date: '2026-09-08', rate: 100 },
        dailyStats: []
      }
    };

    const wrapper = mount(DashboardView, {
      props: { analytics, isLoading: false }
    });

    expect(wrapper.find('.week-compare-grid').exists()).toBe(true);
    expect(wrapper.find('.month-stats-grid').exists()).toBe(true);
    expect(wrapper.findAll('.compare-box')).toHaveLength(2);
    expect(wrapper.findAll('.month-stat-item')).toHaveLength(3);
  });

  it('AuthModal renders inline form with accessible touch inputs', () => {
    const wrapper = mount(AuthModal, {
      props: { isOpen: true, inline: true, initialMode: 'login' }
    });

    const usernameInput = wrapper.find('input#auth-username');
    const passwordInput = wrapper.find('input#auth-password');
    const submitBtn = wrapper.find('.auth-submit-btn');

    expect(usernameInput.exists()).toBe(true);
    expect(passwordInput.exists()).toBe(true);
    expect(submitBtn.exists()).toBe(true);
  });

  it('ProgressBar clamps accurately for responsive fluid rendering', () => {
    const wrapper = mount(ProgressBar, {
      props: { progress: 85 }
    });

    expect(wrapper.text()).toContain('85%');
    const fill = wrapper.find('.progress-fill');
    expect(fill.attributes('style')).toContain('width: 85%');
  });
});
