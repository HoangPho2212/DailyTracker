import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthModal from '../src/components/AuthModal.vue';

describe('AuthModal.vue (JayContract & Glassmorphism)', () => {
  it('renders correctly when open', () => {
    const wrapper = mount(AuthModal, {
      props: { isOpen: true, initialMode: 'login' }
    });

    expect(wrapper.find('.auth-modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.auth-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Đăng nhập');
  });

  it('does not render when isOpen is false', () => {
    const wrapper = mount(AuthModal, {
      props: { isOpen: false }
    });

    expect(wrapper.find('.auth-modal-overlay').exists()).toBe(false);
  });

  it('toggles between Login and Register tabs', async () => {
    const wrapper = mount(AuthModal, {
      props: { isOpen: true, initialMode: 'login' }
    });

    const tabs = wrapper.findAll('.auth-tab-btn');
    expect(tabs[0].classes()).toContain('active');

    // Click register tab
    await tabs[1].trigger('click');
    expect(wrapper.text()).toContain('Đăng ký tài khoản mới');
    expect(tabs[1].classes()).toContain('active');
  });

  it('validates input and emits submit event with credentials', async () => {
    const wrapper = mount(AuthModal, {
      props: { isOpen: true, initialMode: 'login' }
    });

    const usernameInput = wrapper.find('input[type="text"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const form = wrapper.find('form');

    await usernameInput.setValue('testuser');
    await passwordInput.setValue('secret123');
    await form.trigger('submit.prevent');

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      mode: 'login',
      username: 'testuser',
      password: 'secret123'
    });
  });

  it('displays error message when error prop is provided', () => {
    const wrapper = mount(AuthModal, {
      props: {
        isOpen: true,
        error: 'Tên đăng nhập hoặc mật khẩu không chính xác'
      }
    });

    expect(wrapper.find('.auth-error-alert').exists()).toBe(true);
    expect(wrapper.find('.auth-error-alert').text()).toContain('Tên đăng nhập hoặc mật khẩu không chính xác');
  });

  it('renders inline centered panel without modal overlay when inline prop is true', () => {
    const wrapper = mount(AuthModal, {
      props: {
        isOpen: true,
        inline: true,
        initialMode: 'login'
      }
    });

    expect(wrapper.find('.auth-modal-overlay').exists()).toBe(false);
    expect(wrapper.find('.auth-inline-container').exists()).toBe(true);
    expect(wrapper.find('.auth-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Đăng nhập');
  });
});
