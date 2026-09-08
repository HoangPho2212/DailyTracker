import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardView from '../src/components/DashboardView.vue';

describe('DashboardView.vue (Review & Analytics Dashboard)', () => {
  const mockAnalyticsData = {
    currentWeek: {
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      averageCompletion: 75,
      totalTasks: 8,
      completedTasks: 6,
      days: [
        { date: '2026-09-07', dayOfWeek: 'T2', total: 4, completed: 3, rate: 75 },
        { date: '2026-09-08', dayOfWeek: 'T3', total: 4, completed: 3, rate: 75 },
        { date: '2026-09-09', dayOfWeek: 'T4', total: 0, completed: 0, rate: 0 },
        { date: '2026-09-10', dayOfWeek: 'T5', total: 0, completed: 0, rate: 0 },
        { date: '2026-09-11', dayOfWeek: 'T6', total: 0, completed: 0, rate: 0 },
        { date: '2026-09-12', dayOfWeek: 'T7', total: 0, completed: 0, rate: 0 },
        { date: '2026-09-13', dayOfWeek: 'CN', total: 0, completed: 0, rate: 0 }
      ]
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
      message: 'Tuyệt vời! Tuần này bạn hoàn thành tốt hơn tuần trước (+25%).'
    },
    currentMonth: {
      month: '2026-09',
      averageCompletion: 67,
      totalTasks: 12,
      completedTasks: 8,
      daysRecorded: 4,
      bestDay: { date: '2026-09-07', rate: 75 },
      dailyStats: []
    }
  };

  it('renders week-over-week comparison with "better" status and message', () => {
    const wrapper = mount(DashboardView, {
      props: { analytics: mockAnalyticsData, isLoading: false }
    });

    expect(wrapper.text()).toContain('Tuyệt vời! Tuần này bạn hoàn thành tốt hơn tuần trước (+25%).');
    const badge = wrapper.find('.comparison-badge.status-better');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toContain('+25%');
  });

  it('renders daily progress bars for the 7 days of the current week', () => {
    const wrapper = mount(DashboardView, {
      props: { analytics: mockAnalyticsData, isLoading: false }
    });

    const dayRows = wrapper.findAll('.daily-stat-row');
    expect(dayRows.length).toBe(7);

    // Check Monday shows 75%
    const monRow = dayRows[0];
    expect(monRow.text()).toContain('T2');
    expect(monRow.text()).toContain('75%');
    expect(monRow.text()).toContain('3/4');
  });

  it('renders monthly summary statistics card', () => {
    const wrapper = mount(DashboardView, {
      props: { analytics: mockAnalyticsData, isLoading: false }
    });

    const monthCard = wrapper.find('.month-summary-card');
    expect(monthCard.exists()).toBe(true);
    expect(monthCard.text()).toContain('67%');
    expect(monthCard.text()).toContain('12');
  });

  it('emits week navigation events when clicking previous or next week buttons', async () => {
    const wrapper = mount(DashboardView, {
      props: { analytics: mockAnalyticsData, isLoading: false }
    });

    const prevWeekBtn = wrapper.find('.prev-week-btn');
    await prevWeekBtn.trigger('click');
    expect(wrapper.emitted('navigate-week')).toBeTruthy();
    expect(wrapper.emitted('navigate-week')[0]).toEqual([-7]);

    const nextWeekBtn = wrapper.find('.next-week-btn');
    await nextWeekBtn.trigger('click');
    expect(wrapper.emitted('navigate-week')[1]).toEqual([7]);
  });
});
