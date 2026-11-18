import { mount } from '@vue/test-utils';
import DisableAuthProviderDialog from '@shell/dialog/DisableAuthProviderDialog.vue';
import { Checkbox } from '@components/Form/Checkbox';

jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn(() => ({
    activate:   jest.fn(),
    deactivate: jest.fn(),
  })),
}));

const createWrapper = (props = {}) => mount(DisableAuthProviderDialog, {
  props: {
    name: 'okta-corp', modal: { show: true, onClose: jest.fn() }, ...props
  },
  global: { provide: { store: {} }, stubs: { teleport: true } },
});

const title = (wrapper: any) => wrapper.find('[data-testid="rc-modal-title"]');
const confirmButton = (wrapper: any) => wrapper.find('[data-testid="disable-auth-provider-confirm-button"]');
const cancelButton = (wrapper: any) => wrapper.find('[data-testid="rc-modal-cancel"]');
const onClose = (wrapper: any) => wrapper.props('modal').onClose;

describe('component: DisableAuthProviderDialog', () => {
  it('should name the provider being disabled', () => {
    const wrapper = createWrapper();

    expect(title(wrapper).text()).toBe('%authConfig.disable.title%');
  });

  it('should fall back to a generic title when the provider has no name', () => {
    const wrapper = createWrapper({ name: '' });

    expect(title(wrapper).text()).toBe('%authConfig.disable.titleGeneric%');
  });

  it('should render nothing until it is told to show', () => {
    const wrapper = createWrapper({ modal: { show: false, onClose: jest.fn() } });

    expect(title(wrapper).exists()).toBe(false);
  });

  // The whole point of the dialog: disabling deletes everything stored for the
  // provider, so it must not be reachable in one click.
  it('should hold the confirm button until the warning is acknowledged', async() => {
    const wrapper = createWrapper();

    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined();

    await wrapper.findComponent(Checkbox).vm.$emit('update:value', true);

    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('should not run the callback while unacknowledged', async() => {
    const disableCb = jest.fn();
    const wrapper = createWrapper({ disableCb });

    await confirmButton(wrapper).trigger('click');

    expect(disableCb).not.toHaveBeenCalled();
    expect(onClose(wrapper)).not.toHaveBeenCalled();
  });

  it('should run the callback once acknowledged and confirmed', async() => {
    const disableCb = jest.fn();
    const wrapper = createWrapper({ disableCb });

    await wrapper.findComponent(Checkbox).vm.$emit('update:value', true);
    await confirmButton(wrapper).trigger('click');

    expect(disableCb).toHaveBeenCalledWith();
    expect(onClose(wrapper)).toHaveBeenCalledTimes(1);
  });

  it('should close without disabling when cancelled', async() => {
    const disableCb = jest.fn();
    const wrapper = createWrapper({ disableCb });

    await cancelButton(wrapper).trigger('click');

    expect(disableCb).not.toHaveBeenCalled();
    expect(onClose(wrapper)).toHaveBeenCalledTimes(1);
  });

  // The confirming action is destructive, so it must not read as an ordinary
  // primary button.
  it('should present the confirm action as destructive', () => {
    const wrapper = createWrapper();

    expect(confirmButton(wrapper).classes()).toContain('disable-auth-provider__confirm');
  });
});
