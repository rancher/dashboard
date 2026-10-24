import { mount } from '@vue/test-utils';
import DisableLocalLoginDialog from '@shell/dialog/DisableLocalLoginDialog.vue';
import { Checkbox } from '@components/Form/Checkbox';

const createWrapper = (props = {}) => mount(DisableLocalLoginDialog, {
  props:    { modal: { show: true, onClose: jest.fn() }, ...props },
  attachTo: document.body,
  global:   { stubs: { teleport: true } },
});

const confirmButton = (wrapper: any) => wrapper.find('[data-testid="disable-local-login-confirm-button"]');
const cancelButton = (wrapper: any) => wrapper.find('[data-testid="rc-modal-cancel"]');
const onClose = (wrapper: any) => wrapper.props('modal').onClose;

describe('component: DisableLocalLoginDialog', () => {
  it('should render nothing until it is told to show', () => {
    const wrapper = createWrapper({ modal: { show: false, onClose: jest.fn() } });

    expect(wrapper.find('[data-testid="rc-modal-title"]').exists()).toBe(false);
  });

  it('should ask about the setting being turned on', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="rc-modal-title"]').text()).toBe('%authConfig.disableLocal.title%');
  });

  // Local accounts surviving, and the way back, are the two things an admin needs
  // before they can judge the change.
  it('should spell out what changes and how to undo it', () => {
    const paragraphs = createWrapper().findAll('.disable-local-login-dialog__body > p').map((p) => p.text());

    expect(paragraphs).toStrictEqual(['%authConfig.disableLocal.effect%', '%authConfig.disableLocal.recovery%']);
  });

  it('should warn that external providers become the only way in', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.disable-local-login-dialog__warning').text()).toContain('%authConfig.disableLocal.soleRoute%');
  });

  // The whole point of the dialog: the flag can lock every administrator out, so
  // it must not be reachable in one click.
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
    expect(onClose(wrapper)).toHaveBeenCalledWith();
  });

  it('should close without disabling when cancelled', async() => {
    const disableCb = jest.fn();
    const wrapper = createWrapper({ disableCb });

    await wrapper.findComponent(Checkbox).vm.$emit('update:value', true);
    await cancelButton(wrapper).trigger('click');

    expect(disableCb).not.toHaveBeenCalled();
    expect(onClose(wrapper)).toHaveBeenCalledWith();
  });

  // The dialog is opened from a page that already has its own, so the prefix has
  // to be able to come from the caller.
  it('should take its test id prefix from the caller', () => {
    const wrapper = createWrapper({ componentTestid: 'somewhere-else' });

    expect(wrapper.find('[data-testid="somewhere-else-confirm-button"]').exists()).toBe(true);
  });
});
