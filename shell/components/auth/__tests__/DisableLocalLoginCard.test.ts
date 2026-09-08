import { mount } from '@vue/test-utils';
import DisableLocalLoginCard from '@shell/components/auth/DisableLocalLoginCard.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

const createWrapper = (props = {}) => mount(DisableLocalLoginCard, { props: { value: false, ...props } });

describe('component: DisableLocalLoginCard', () => {
  it('should spell out what turning the switch on costs', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.disable-local-login__title').text()).toBe('%authConfig.list.disableLocal.label%');
    expect(wrapper.find('.disable-local-login__description').text()).toBe('%authConfig.list.disableLocal.descriptionOff%');
  });

  // Once local login is off, the warning is spent - what matters is the way back.
  it('should explain how to undo it once it is on', () => {
    const wrapper = createWrapper({ value: true });

    expect(wrapper.find('.disable-local-login__description').text()).toBe('%authConfig.list.disableLocal.descriptionOn%');
  });

  // The title is rendered beside the description, so the switch keeps it only as
  // its accessible name.
  it('should name the switch after the setting', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(ToggleSwitch).props('onLabel')).toBe('%authConfig.list.disableLocal.label%');
    expect(wrapper.find('input[role="switch"]').attributes('aria-label')).toBe('%authConfig.list.disableLocal.label%');
  });

  it.each([true, false])('should reflect the flag being %s', (value) => {
    const wrapper = createWrapper({ value });

    expect(wrapper.findComponent(ToggleSwitch).props('value')).toBe(value);
  });

  it('should raise the new value rather than applying it itself', () => {
    const wrapper = createWrapper();

    wrapper.findComponent(ToggleSwitch).vm.$emit('update:value', true);

    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([true]);
  });

  // The flag can be locked by the server, or out of reach for this user.
  it('should lock the switch when the flag cannot be written', () => {
    const wrapper = createWrapper({ disabled: true });

    expect(wrapper.findComponent(ToggleSwitch).props('disabled')).toBe(true);
  });
});
