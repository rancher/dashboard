import { mount } from '@vue/test-utils';
import DisableLastAuthProviderDialog from '@shell/dialog/DisableLastAuthProviderDialog.vue';

const createWrapper = (props = {}) => mount(DisableLastAuthProviderDialog, { props: { name: 'Okta - Corporate SSO', ...props } });

const confirmButton = (wrapper: any) => wrapper.find('[data-testid="disable-last-auth-provider-confirm-button"]');
const cancelButton = (wrapper: any) => wrapper.find('[data-testid="disable-last-auth-provider-cancel-button"]');

describe('component: DisableLastAuthProviderDialog', () => {
  it('should name the provider it is refusing to disable', () => {
    expect(createWrapper().find('h3').text()).toBe('%authConfig.disableLast.title%');
  });

  it('should fall back to a generic title when the provider has no name', () => {
    expect(createWrapper({ name: '' }).find('h3').text()).toBe('%authConfig.disableLast.titleGeneric%');
  });

  // An admin needs three things: why it is blocked, what to do about it, and that
  // the block is a rule rather than a transient failure.
  it('should explain the lockout, the way out and the rule', () => {
    const paragraphs = createWrapper().findAll('.disable-last-auth-provider__copy').map((p) => p.text());

    expect(paragraphs).toStrictEqual([
      '%authConfig.disableLast.soleProvider%',
      '%authConfig.disableLast.remedy%',
      '%authConfig.disableLast.refusal%',
    ]);
  });

  // This is the whole point of the dialog -- it replaces the confirm-and-proceed
  // one, so there must be no way to disable the provider from it.
  it('should offer no way to disable the provider', () => {
    const wrapper = createWrapper();

    expect(confirmButton(wrapper).text()).toBe('%authConfig.disableLast.confirm%');
    expect(wrapper.find('[data-testid="disable-last-auth-provider-acknowledge"]').exists()).toBe(false);
  });

  it('should switch local login back on when confirmed', async() => {
    const restoreCb = jest.fn().mockResolvedValue(undefined);
    const wrapper = createWrapper({ restoreCb });

    await confirmButton(wrapper).trigger('click');

    expect(restoreCb).toHaveBeenCalledWith();
  });

  // The provider still has to be disabled by hand afterwards, so the dialog gets
  // out of the way once the flag is written.
  it('should close once local login is back on', async() => {
    const wrapper = createWrapper({ restoreCb: jest.fn().mockResolvedValue(undefined) });

    await confirmButton(wrapper).trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should close without touching local login when cancelled', async() => {
    const restoreCb = jest.fn();
    const wrapper = createWrapper({ restoreCb });

    await cancelButton(wrapper).trigger('click');

    expect(restoreCb).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  describe('when the flag cannot be written', () => {
    // Closing on a failure would drop the user back on a list that still shows
    // local login off, with nothing to say the switch did not take.
    it('should stay open and show the failure', async() => {
      const restoreCb = jest.fn().mockRejectedValue(new Error('Forbidden'));
      const wrapper = createWrapper({ restoreCb });

      await confirmButton(wrapper).trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="disable-last-auth-provider-error"]').text()).toContain('Forbidden');
      expect(wrapper.emitted('close')).toBeUndefined();
    });

    it('should announce the failure rather than leaving it to be noticed', async() => {
      const wrapper = createWrapper({ restoreCb: jest.fn().mockRejectedValue(new Error('Forbidden')) });

      await confirmButton(wrapper).trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="disable-last-auth-provider-error"]').attributes('role')).toBe('alert');
    });

    it('should allow a retry after a failure', async() => {
      const restoreCb = jest.fn().mockRejectedValue(new Error('Forbidden'));
      const wrapper = createWrapper({ restoreCb });

      await confirmButton(wrapper).trigger('click');
      await wrapper.vm.$nextTick();
      await confirmButton(wrapper).trigger('click');

      expect(restoreCb).toHaveBeenCalledTimes(2);
    });
  });

  // A locked feature flag cannot be written through the API at all, so offering a
  // button that can only fail would be worse than saying so.
  describe('when local login is locked off', () => {
    it('should not offer to turn local login back on', () => {
      expect(confirmButton(createWrapper({ canRestore: false })).exists()).toBe(false);
    });

    it('should say why, and leave a way out of the dialog', () => {
      const wrapper = createWrapper({ canRestore: false });

      expect(wrapper.find('[data-testid="disable-last-auth-provider-locked"]').text()).toContain('%authConfig.disableLast.locked%');
      expect(cancelButton(wrapper).exists()).toBe(true);
    });

    it('should not show the explanation while local login can be restored', () => {
      expect(createWrapper().find('[data-testid="disable-last-auth-provider-locked"]').exists()).toBe(false);
    });
  });

  // The dialog is opened from pages that already have their own prefix, so it has
  // to be able to come from the caller.
  it('should take its test id prefix from the caller', () => {
    const wrapper = createWrapper({ componentTestid: 'somewhere-else' });

    expect(wrapper.find('[data-testid="somewhere-else-confirm-button"]').exists()).toBe(true);
  });
});
