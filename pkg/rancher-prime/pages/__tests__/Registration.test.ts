import Registration from '../Registration.vue';
import { DOMWrapper, shallowMount, VueWrapper } from '@vue/test-utils';

jest.mock('vuex', () => ({
  useStore: () => {
    jest.fn();
  }
}));

describe('page: Registration', () => {
  let wrapper: VueWrapper<any >;
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
    it('should prevent new online request given no registration code', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should allow new online request', () => {
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
      expect(deregisterButtonOnline).not.toBeDefined();
    });

    it('should not display deregistration button offline', () => {
      expect(deregisterButtonOffline).not.toBeDefined();
    });
  });

  describe('given registration online', () => {
    it('should not display registration button', () => {
      expect(registerOnlineButton).not.toBeDefined();
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
  });

  describe('given registration offline', () => {
    it('should not display registration button', () => {
      expect(registerOfflineButton).not.toBeDefined();
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

    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should display the expiration status', () => {
      expect(expirationOffline.element).toBeDefined();
    });
  });

  describe('while registering online', () => {
    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should not display deregistration button online', () => {
      expect(deregisterButtonOnline).not.toBeDefined();
    });

    it('should not display deregistration button offline', () => {
      expect(deregisterButtonOffline).not.toBeDefined();
    });
  });

  describe('while registering offline', () => {
    it('should prevent new online request', () => {
      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should not display deregistration button online', () => {
      expect(deregisterButtonOnline).not.toBeDefined();
    });

    it('should not display deregistration button offline', () => {
      expect(deregisterButtonOffline).not.toBeDefined();
    });
  });

  describe('while deregistering', () => {
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
});
