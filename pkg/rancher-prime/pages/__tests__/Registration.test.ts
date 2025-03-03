import Registration from '../Registration.vue';
import { DOMWrapper, shallowMount, VueWrapper } from '@vue/test-utils';

// Mock for useI18n
jest.mock('vuex', () => ({
  useStore: () => {
    jest.fn();
  }
}));

describe('page: Registration', () => {
  let wrapper: VueWrapper<any>;
  let registerOnlineButton: DOMWrapper<Element>;
  let registerOnlineInput: DOMWrapper<Element>;
  let registerOfflineButton: DOMWrapper<Element>;
  let registerOfflineDownload: DOMWrapper<Element>;
  let deregisterButtonOnline: DOMWrapper<Element>;
  let expirationOnline: DOMWrapper<Element>;
  let deregisterButtonOffline: DOMWrapper<Element>;
  let expirationOffline: DOMWrapper<Element>;

  beforeEach(() => {
    wrapper = shallowMount(Registration, { global: { stubs: { Card: { template: '<div><slot name="body"></slot></div>' } } } });
    registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');
    registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');
    registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]');
    registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');
    expirationOnline = wrapper.find('[data-testid="expiration-status-online"]');
    deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');
    expirationOffline = wrapper.find('[data-testid="expiration-status-offline"]');
    deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');
  });

  it('should render', () => {
    expect(wrapper).toBeDefined();
  });

  describe('given no data', () => {
    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should allow new online request given a registration code', async() => {
      wrapper.vm.registrationCode = 'whatever';
      await wrapper.vm.$nextTick();
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('false');
    });

    it('should allow to type the registration code', () => {
      expect(registerOnlineInput.attributes().disabled).toStrictEqual('false');
    });

    it('should allow to download registration request', () => {
      expect(registerOfflineDownload.attributes().disabled).toStrictEqual('false');
    });

    it('should allow new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('false');
    });

    it('should not display deregistration button online', () => {
      expect(deregisterButtonOnline.exists()).toBe(false);
    });

    it('should not display deregistration button offline', () => {
      expect(deregisterButtonOffline.exists()).toBe(false);
    });
  });

  describe('given registration online', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered-online';
    });

    it('should not display online registration button', () => {
      expect(registerOnlineButton.exists()).toBe(false);
    });

    it('should prevent to type the registration code', () => {
      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent to download registration request', () => {
      expect(registerOfflineDownload.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should display the expiration status', () => {
      expect(expirationOnline.element).toBeDefined();
    });

    it('should display deregistration button online', () => {
      expect(deregisterButtonOnline.exists()).toBe(true);
    });
  });

  describe('given registration offline', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered-offline';
    });

    it('should not display offline registration button', () => {
      expect(registerOfflineButton.exists()).toBe(false);
    });

    it('should prevent to type the registration code', () => {
      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent to download registration request', () => {
      expect(registerOfflineDownload.attributes().disabled).toStrictEqual('true');
    });

    it('should display the expiration status', () => {
      expect(expirationOffline.element).toBeDefined();
    });

    it('should display deregistration button offline', () => {
      expect(deregisterButtonOffline.exists()).toBe(true);
    });
  });

  describe('while registering online', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-online';
    });

    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should not display deregistration button online', () => {
      expect(deregisterButtonOnline.exists()).toBe(false);
    });

    it('should not display deregistration button offline', () => {
      expect(deregisterButtonOffline.exists()).toBe(false);
    });
  });

  describe('while registering offline', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-offline';
    });

    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should not display deregistration button online', () => {
      expect(deregisterButtonOnline.exists()).toBe(false);
    });

    it('should not display deregistration button offline', () => {
      expect(deregisterButtonOffline.exists()).toBe(false);
    });
  });

  describe('while deregistering', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-online';
    });

    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent to type the registration code', () => {
      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new online de-registration request', () => {
      expect(deregisterButtonOnline.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline de-registration request', () => {
      expect(deregisterButtonOffline.attributes().disabled).toStrictEqual('true');
    });
  });

  describe('while using the form,', () => {
    it.each([
      [registerOnlineButton, 'registering-online'],
      [registerOfflineButton, 'registering-offline'],
      [deregisterButtonOnline, 'deregistering-online'],
      [deregisterButtonOffline, 'deregistering-offline']
    ])('pressing %p should set status %p', async(cta, status) => {
      await cta.trigger('click');

      expect(wrapper.vm.registrationStatus).toStrictEqual(status);
    });
  });
});
