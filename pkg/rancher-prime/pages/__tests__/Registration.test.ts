import Registration from '../Registration.vue';
import { shallowMount, VueWrapper } from '@vue/test-utils';

// Mock for useI18n
jest.mock('vuex', () => ({
  useStore: () => {
    jest.fn();
  }
}));

describe('page: Registration', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    wrapper = shallowMount(Registration, { global: { stubs: { Card: { template: '<div><slot name="body"></slot></div>' } } } });
  });

  it('should render', () => {
    expect(wrapper).toBeDefined();
  });

  describe('given no data', () => {
    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should allow new online request given a registration code', async() => {
      wrapper.vm.registrationCode = 'whatever';
      await wrapper.vm.$nextTick();
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.attributes().disabled).toStrictEqual('false');
    });

    it('should allow to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.attributes().disabled).toStrictEqual('false');
    });

    it('should allow to download registration request', () => {
      const registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]');

      expect(registerOfflineDownload.attributes().disabled).toStrictEqual('false');
    });

    it('should allow new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.attributes().disabled).toStrictEqual('false');
    });

    it('should not display deregistration button online', () => {
      const deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');

      expect(deregisterButtonOnline.exists()).toBe(false);
    });

    it('should not display deregistration button offline', () => {
      const deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');

      expect(deregisterButtonOffline.exists()).toBe(false);
    });
  });

  describe('given registration online', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered-online';
    });

    it('should not display online registration button', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.exists()).toBe(false);
    });

    it('should prevent to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent to download registration request', () => {
      const registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]');

      expect(registerOfflineDownload.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should display a successful expiration online status', async() => {
      wrapper.vm.expirationStatus = 'success';
      await wrapper.vm.$nextTick();
      const expirationOnline = wrapper.find('[data-testid="expiration-status-online"]');

      expect(expirationOnline.element).toBeDefined();
    });

    it('should display deregistration button online', () => {
      const deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');

      expect(deregisterButtonOnline.exists()).toBe(true);
    });
  });

  describe('given registration offline', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered-offline';
    });

    it('should not display offline registration button', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.exists()).toBe(false);
    });

    it('should prevent to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent to download registration request', () => {
      const registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]');

      expect(registerOfflineDownload.attributes().disabled).toStrictEqual('true');
    });

    it('should display a successful expiration offline status', async() => {
      wrapper.vm.expirationStatus = 'success';
      await wrapper.vm.$nextTick();
      const expirationOffline = wrapper.find('[data-testid="expiration-status-offline"]');

      expect(expirationOffline.element).toBeDefined();
    });

    it('should display deregistration button offline', () => {
      const deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');

      expect(deregisterButtonOffline.exists()).toBe(true);
    });
  });

  describe('while registering online', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-online';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should not display deregistration button online', () => {
      const deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');

      expect(deregisterButtonOnline.exists()).toBe(false);
    });

    it('should not display deregistration button offline', () => {
      const deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');

      expect(deregisterButtonOffline.exists()).toBe(false);
    });
  });

  describe('while registering offline', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-offline';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should not display deregistration button online', () => {
      const deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');

      expect(deregisterButtonOnline.exists()).toBe(false);
    });

    it('should not display deregistration button offline', () => {
      const deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');

      expect(deregisterButtonOffline.exists()).toBe(false);
    });
  });

  describe('while de-registering a online case', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered-online';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.exists()).toBe(false);
    });

    it('should prevent to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.attributes().disabled).toStrictEqual('true');
    });

    // TODO - #13387: This is component specific, update after implementation
    // it('should prevent new online de-registration request', () => {
    //   const deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');

    //   expect(deregisterButtonOnline.attributes().disabled).toStrictEqual('true');
    // });

    // it('should prevent new offline de-registration request', () => {
    //   const deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');

    //   expect(deregisterButtonOffline.attributes().disabled).toStrictEqual('true');
    // });
  });

  describe('while de-registering a offline case', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered-offline';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.attributes().disabled).toStrictEqual('true');
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.exists()).toBe(false);
    });

    // TODO - #13387: This is component specific, update after implementation
    // it('should prevent new online de-registration request', () => {
    //   const deregisterButtonOnline = wrapper.find('[data-testid="registration-online-deregister-cta"]');

    //   expect(deregisterButtonOnline.attributes().disabled).toStrictEqual('true');
    // });

    // it('should prevent new offline de-registration request', () => {
    //   const deregisterButtonOffline = wrapper.find('[data-testid="registration-offline-deregister-cta"]');

    //   expect(deregisterButtonOffline.attributes().disabled).toStrictEqual('true');
    // });
  });

  // TODO - #13387: Update cases after implementation to identify button outcomes
  describe('while using the form,', () => {
    it.each([
      ['registration-online-cta', 'registering-online'],
      // ['registration-offline-cta', 'registering-offline'], // TBD file upload
      // ['registration-online-deregister-cta', null], // No de-registering status
      // ['registration-offline-deregister-cta', null] // No de-registering status
    ])('pressing %p should set status %p', async(ctaId, status) => {
      const cta = wrapper.find(`[data-testid="${ ctaId }"]`);

      await cta.trigger('click');

      expect(wrapper.vm.registrationStatus).toStrictEqual(status);
    });
  });
});
