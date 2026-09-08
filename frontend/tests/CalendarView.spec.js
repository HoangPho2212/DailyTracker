import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CalendarView from '../src/components/CalendarView.vue';

describe('CalendarView.vue (CSS Grid Calendar)', () => {
  const initialDate = '2026-09-08';

  it('renders calendar header, weekday columns, and grid day cells', () => {
    const wrapper = mount(CalendarView, {
      props: { modelValue: initialDate }
    });

    // Check header contains Month and Year
    expect(wrapper.find('.calendar-header').text()).toContain('2026');
    expect(wrapper.find('.calendar-header').text()).toContain('9');

    // Check 7 weekday columns exist
    const weekdays = wrapper.findAll('.weekday-cell');
    expect(weekdays.length).toBe(7);

    // Check day cells exist in CSS Grid
    const dayCells = wrapper.findAll('.day-cell');
    expect(dayCells.length).toBeGreaterThanOrEqual(28);
  });

  it('marks the currently selected date with .is-selected class', () => {
    const wrapper = mount(CalendarView, {
      props: { modelValue: initialDate }
    });

    const selectedCell = wrapper.find('.day-cell.is-selected');
    expect(selectedCell.exists()).toBe(true);
    expect(selectedCell.text()).toBe('8');
    expect(selectedCell.attributes('data-date')).toBe('2026-09-08');
  });

  it('emits update:modelValue and date-change with YYYY-MM-DD when a day cell is clicked', async () => {
    const wrapper = mount(CalendarView, {
      props: { modelValue: initialDate }
    });

    // Find cell for 2026-09-15
    const targetCell = wrapper.findAll('.day-cell').find(
      c => c.attributes('data-date') === '2026-09-15'
    );
    expect(targetCell).toBeDefined();

    await targetCell.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['2026-09-15']);

    expect(wrapper.emitted('date-change')).toBeTruthy();
    expect(wrapper.emitted('date-change')[0]).toEqual(['2026-09-15']);
  });

  it('navigates to next and previous month when header arrows are clicked', async () => {
    const wrapper = mount(CalendarView, {
      props: { modelValue: '2026-09-08' }
    });

    const nextMonthBtn = wrapper.find('.next-month-btn');
    await nextMonthBtn.trigger('click');

    expect(wrapper.find('.calendar-month-title').text()).toContain('10');

    const prevMonthBtn = wrapper.find('.prev-month-btn');
    await prevMonthBtn.trigger('click'); // back to 9
    await prevMonthBtn.trigger('click'); // back to 8

    expect(wrapper.find('.calendar-month-title').text()).toContain('8');
  });

  it('navigates to today and emits today date when clicking "Hôm nay"', async () => {
    const wrapper = mount(CalendarView, {
      props: { modelValue: '2025-01-01' }
    });

    const todayBtn = wrapper.find('.today-btn');
    await todayBtn.trigger('click');

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([todayStr]);
  });
});
