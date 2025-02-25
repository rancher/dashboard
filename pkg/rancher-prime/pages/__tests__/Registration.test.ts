import Registration from 'pages/Registration.vue';
import { shallowMount, VueWrapper } from '@vue/test-utils';

describe('page: Registration', () => {
  let wrapper: VueWrapper<any>;
  let registerOnlineButton: HTMLElement;
  let registerOnlineInput: HTMLElement;
  let registerOfflineButton: HTMLElement;
  let registerOfflineDownload: HTMLElement;
  let deregisterButtonOnline: HTMLElement;
  let expirationOnline: HTMLElement;
  let deregisterButtonOffline: HTMLElement;
  let expirationOffline: HTMLElement;

  beforeEach(() => {
    wrapper = shallowMount(Registration);
    registerOnlineButton = wrapper.find('[data-testid="register-online-cta"]').element as HTMLElement;
    registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]').element as HTMLElement;
    registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]').element as HTMLElement;
    registerOfflineButton = wrapper.find('[data-testid="register-offline-cta"]').element as HTMLElement;
    expirationOnline = wrapper.find('[data-testid="expiration-status-online"]').element as HTMLElement;
    deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]').element as HTMLElement;
    expirationOffline = wrapper.find('[data-testid="expiration-status-offline"]').element as HTMLElement;
    deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]').element as HTMLElement;
  });

  it('should render', () => {
    expect(wrapper).toBeDefined();
  });

  describe('given no data', () => {
    it('should prevent new online request given no registration code', () => {
      expect(registerOnlineButton.disabled).toBe(true);
    });

    it('should allow new online request', () => {
      expect(registerOnlineButton.disabled).toBe(false);
    });

    it('should allow to type the registration code', () => {
      expect(registerOnlineInput.disabled).toBe(false);
    });

    it('should allow to download registration request', () => {
      expect(registerOfflineDownload.disabled).toBe(false);
    });

    it('should allow new offline request', () => {
      expect(registerOfflineButton.disabled).toBe(false);
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
      expect(registerOnlineInput.disabled).toBe(true);
    });

    it('should prevent to download registration request', () => {
      expect(registerOfflineDownload.disabled).toBe(true);
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.disabled).toBe(true);
    });

    it('should display the expiration status', () => {
      expect(expirationOnline).toBeDefined();
    });
  });

  describe('given registration offline', () => {
    it('should not display registration button', () => {
      expect(registerOfflineButton).not.toBeDefined();
    });

    it('should prevent to type the registration code', () => {
      expect(registerOnlineInput.disabled).toBe(true);
    });

    it('should prevent new online request', () => {
      expect(registerOnlineButton.disabled).toBe(true);
    });

    it('should prevent to download registration request', () => {
      expect(registerOfflineDownload.disabled).toBe(true);
    });

    it('should prevent new online request', () => {
      expect(registerOnlineButton.disabled).toBe(true);
    });

    it('should display the expiration status', () => {
      expect(expirationOffline).toBeDefined();
    });
  });

  describe('while registering online', () => {
    it('should prevent new online request', () => {
      expect(registerOnlineButton.disabled).toBe(true);
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.disabled).toBe(true);
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
      expect(registerOnlineButton.disabled).toBe(true);
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.disabled).toBe(true);
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
      expect(registerOnlineButton.disabled).toBe(true);
    });

    it('should prevent to type the registration code', () => {
      expect(registerOnlineInput.disabled).toBe(true);
    });

    it('should prevent new offline request', () => {
      expect(registerOfflineButton.disabled).toBe(true);
    });

    it('should prevent new online de-registration request', () => {
      expect(deregisterButtonOnline.disabled).toBe(true);
    });

    it('should prevent new offline de-registration request', () => {
      expect(deregisterButtonOffline.disabled).toBe(true);
    });
  });
});
