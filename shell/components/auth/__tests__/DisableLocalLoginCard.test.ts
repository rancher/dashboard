import { mount } from '@vue/test-utils';
import DisableLocalLoginCard from '@shell/components/auth/DisableLocalLoginCard.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

const createWrapper = (props = {}) => mount(DisableLocalLoginCard, { props: { value: false, ...props } });

const isChecked = (wrapper: any) => (wrapper.find('input[role="switch"]').element as HTMLInputElement).checked;

/**
 * The card resyncs the switch a tick after it moves, so the parent's answer - if
 * it has one - has to land in between.
 */
const flipSwitch = async(wrapper: any, respond?: () => Promise<unknown>) => {
  await wrapper.find('input[role="switch"]').trigger('input');

  await respond?.();

  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();
};

describe('component: DisableLocalLoginCard', () => {
  it.each([true, false])('should say what the setting does while it is %s', (value) => {
    const wrapper = createWrapper({ value });

    expect(wrapper.find('.disable-local-login__title').text()).toBe('%authConfig.list.disableLocal.label%');
    expect(wrapper.find('.disable-local-login__description').text()).toBe('%authConfig.list.disableLocal.description%');
  });

  // Losing every external provider while this is on locks everyone out, and that
  // stays worth saying for as long as it is on - not just as it is turned on.
  it('should warn about the risk while local login is off', () => {
    const wrapper = createWrapper({ value: true });

    expect(wrapper.find('[data-testid="auth-config-disable-local-risk"]').text()).toBe('%authConfig.list.disableLocal.risk%');
  });

  it('should not warn while local login is still available', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="auth-config-disable-local-risk"]').exists()).toBe(false);
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

  // ToggleSwitch tracks its own checked state, so a switch the parent declines to
  // move - the confirmation was cancelled, the save was rejected - would otherwise
  // sit there showing a value the flag was never put into.
  it('should put the switch back when the parent declines the change', async() => {
    const wrapper = createWrapper();

    await flipSwitch(wrapper);

    expect(isChecked(wrapper)).toBe(false);
  });

  it('should leave the switch flipped when the parent accepts the change', async() => {
    const wrapper = createWrapper();

    await flipSwitch(wrapper, () => wrapper.setProps({ value: true }));

    expect(isChecked(wrapper)).toBe(true);
  });

  // The flag can be locked by the server, or out of reach for this user.
  it('should lock the switch when the flag cannot be written', () => {
    const wrapper = createWrapper({ disabled: true });

    expect(wrapper.findComponent(ToggleSwitch).props('disabled')).toBe(true);
  });
});
