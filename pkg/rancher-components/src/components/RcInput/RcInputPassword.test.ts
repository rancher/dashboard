import { h } from 'vue';
import { mount } from '@vue/test-utils';
import RcInputPassword from './RcInputPassword.vue';
import RcFieldGroup from '@components/RcField/RcFieldGroup.vue';

const mountPassword = (props: Record<string, unknown> = {}) => mount(RcInputPassword, { props: { modelValue: 'secret', ...props } });

describe('component: RcInputPassword', () => {
  it('masks the value', () => {
    const wrapper = mountPassword();

    expect(wrapper.find('input').attributes('type')).toStrictEqual('password');
  });

  it('reveals the value from the toggle', async() => {
    const wrapper = mountPassword();

    await wrapper.find('.rc-input-action').trigger('click');

    expect(wrapper.find('input').attributes('type')).toStrictEqual('text');
    expect(wrapper.emitted('update:revealed')).toStrictEqual([[true]]);
  });

  it('reveals the value when revealed is set', () => {
    const wrapper = mountPassword({ revealed: true });

    expect(wrapper.find('input').attributes('type')).toStrictEqual('text');
  });

  it.each([
    [false, 'false', 'show'],
    [true, 'true', 'hide'],
  ])('describes the toggle when revealed is %s', (revealed, pressed, icon) => {
    const wrapper = mountPassword({ revealed });
    const toggle = wrapper.find('.rc-input-action');

    expect(toggle.attributes('aria-label')).toStrictEqual('%component.rcInput.showPassword%');
    expect(toggle.attributes('aria-pressed')).toStrictEqual(pressed);
    expect(toggle.find('.rc-icon').classes()).toContain(`icon-${ icon }`);
  });

  it('keeps a working toggle while disabled so a revealed secret can be masked again', async() => {
    const wrapper = mountPassword({ disabled: true, revealed: true });

    await wrapper.find('.rc-input-action').trigger('click');

    expect(wrapper.find('input').attributes('type')).toStrictEqual('password');
    expect(wrapper.emitted('update:revealed')).toStrictEqual([[false]]);
  });

  it('keeps the toggle inside a disabled RcFieldGroup', () => {
    const wrapper = mount(RcFieldGroup, {
      props: { disabled: true },
      slots: { default: () => h(RcInputPassword, { modelValue: 'secret' }) },
    });

    expect(wrapper.find('.rc-input-action').exists()).toBe(true);
  });

  it('emits the typed value', async() => {
    const wrapper = mountPassword();

    await wrapper.find('input').setValue('new-secret');

    expect(wrapper.emitted('update:modelValue')).toStrictEqual([['new-secret']]);
  });

  describe('view mode', () => {
    it('masks the value', () => {
      const wrapper = mountPassword({ mode: 'view' });

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('••••••••');
    });

    it('reveals the value from the toggle', async() => {
      const wrapper = mountPassword({ mode: 'view' });

      await wrapper.find('.rc-input-action').trigger('click');

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('secret');
    });

    it('shows no toggle without a value', () => {
      const wrapper = mountPassword({ mode: 'view', modelValue: '' });

      expect(wrapper.find('.rc-input-action').exists()).toBe(false);
    });

    it('inherits view mode from an RcFieldGroup', () => {
      const wrapper = mount(RcFieldGroup, {
        props: { mode: 'view' },
        slots: { default: () => h(RcInputPassword, { modelValue: 'secret' }) },
      });

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('••••••••');
    });
  });
});
