import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressBar from '../src/components/ProgressBar.vue';

describe('ProgressBar.vue', () => {
  it('renders correctly with default 0% progress', () => {
    const wrapper = mount(ProgressBar, {
      props: { progress: 0 }
    });
    expect(wrapper.text()).toContain('0%');
    const fill = wrapper.find('.progress-fill');
    expect(fill.attributes('style')).toContain('width: 0%');
  });

  it('renders correctly with 75% progress', () => {
    const wrapper = mount(ProgressBar, {
      props: { progress: 75 }
    });
    expect(wrapper.text()).toContain('75%');
    const fill = wrapper.find('.progress-fill');
    expect(fill.attributes('style')).toContain('width: 75%');
  });

  it('clamps or displays 100% when fully completed', () => {
    const wrapper = mount(ProgressBar, {
      props: { progress: 100 }
    });
    expect(wrapper.text()).toContain('100%');
    const fill = wrapper.find('.progress-fill');
    expect(fill.attributes('style')).toContain('width: 100%');
  });
});
