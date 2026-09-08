import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskItem from '../src/components/TaskItem.vue';

describe('TaskItem.vue', () => {
  const mockTask = {
    _id: 'task-1',
    title: 'Exercise for 30 minutes',
    isCompleted: false
  };

  it('renders task title and unchecked status', () => {
    const wrapper = mount(TaskItem, {
      props: { task: mockTask }
    });

    expect(wrapper.text()).toContain('Exercise for 30 minutes');
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(false);
    expect(wrapper.classes()).not.toContain('task-completed');
  });

  it('emits toggle event when checkbox changes', async () => {
    const wrapper = mount(TaskItem, {
      props: { task: mockTask }
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);

    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')[0]).toEqual([mockTask, true]);
  });

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(TaskItem, {
      props: { task: mockTask }
    });

    const deleteBtn = wrapper.find('.delete-btn');
    await deleteBtn.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')[0]).toEqual(['task-1']);
  });

  it('renders completed styles when isCompleted is true', () => {
    const wrapper = mount(TaskItem, {
      props: {
        task: { ...mockTask, isCompleted: true }
      }
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(true);
    expect(wrapper.classes()).toContain('task-completed');
  });
});
