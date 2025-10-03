import Registration from './Registration.vue';
import { mount, VueWrapper } from '@vue/test-utils';

const dispatchSpy = jest.fn().mockReturnValue(Promise.resolve([]));

jest.mock('vuex', () => ({ useStore: () => ({ dispatch: dispatchSpy }) }));

describe('page: Registration', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    wrapper = mount(Registration, {
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/exists': jest.fn().mockReturnValue(true),
              'i18n/t':      (t: string) => t,
            },
          },
          $route:  { hash: 'online' },
          $router: {
            currentRoute: { _value: { name: 'online' } },
            replace:      jest.fn()
          },
        },
        stubs: {
          LabeledInput: true,
          AsyncButton:  true,
          FileSelector: true
        }
      }
    });
  });

  it('should render', () => {
    expect(wrapper).toBeDefined();
  });

  describe('given no data', () => {
    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toStrictEqual(true);
    });

    it('should allow new online request given a registration code', async() => {
      wrapper.vm.registrationCode = 'whatever';
      await wrapper.vm.$nextTick();
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toStrictEqual(false);
    });

    it('should allow to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.isDisabled()).toStrictEqual(false);
    });

    it('should allow to download registration request', () => {
      const registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]');

      expect(registerOfflineDownload.isDisabled()).toStrictEqual(false);
    });

    it('should allow new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.isDisabled()).toStrictEqual(false);
    });

    it('should not allow deregistration', () => {
      const deregisterButtonOnline = wrapper.find('[data-testid="registration-deregister-cta"]');

      expect(deregisterButtonOnline.isDisabled()).toBe(true);
    });
  });

  describe('given registration', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered';
    });

    it('should display registration URL', () => {
      const registrationLink = wrapper.find('[data-testid="registration-link"]');

      expect(registrationLink).toBeDefined();
    });

    it('should not display online registration button', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toBe(true);
    });

    it('should prevent to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.isDisabled()).toStrictEqual(true);
    });

    it('should prevent to download registration request', () => {
      const registerOfflineDownload = wrapper.find('[data-testid="registration-offline-download"]');

      expect(registerOfflineDownload.isDisabled()).toStrictEqual(true);
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.isDisabled()).toStrictEqual(true);
    });

    it('should allow to deregister', () => {
      const deregisterButtonOnline = wrapper.find('[data-testid="registration-deregister-cta"]');

      expect(deregisterButtonOnline.isDisabled()).toBe(false);
    });

    it('should not allow offline registration', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.isDisabled()).toBe(true);
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toStrictEqual(true);
    });
  });

  describe('while registering online', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-online';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toStrictEqual(true);
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.isDisabled()).toStrictEqual(true);
    });

    it('should not allow deregistration', () => {
      const deregisterButton = wrapper.find('[data-testid="registration-deregister-cta"]');

      expect(deregisterButton.isDisabled()).toBe(true);
    });
  });

  describe('while registering offline', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registering-offline';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toStrictEqual(true);
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.isDisabled()).toStrictEqual(true);
    });

    it('should not allow deregistration', () => {
      const deregisterButton = wrapper.find('[data-testid="registration-deregister-cta"]');

      expect(deregisterButton.isDisabled()).toBe(true);
    });
  });

  describe('while registered', () => {
    beforeEach(() => {
      wrapper.vm.registrationStatus = 'registered';
    });

    it('should prevent new online request', () => {
      const registerOnlineButton = wrapper.find('[data-testid="registration-online-cta"]');

      expect(registerOnlineButton.isDisabled()).toStrictEqual(true);
    });

    it('should prevent to type the registration code', () => {
      const registerOnlineInput = wrapper.find('[data-testid="registration-code-input"]');

      expect(registerOnlineInput.isDisabled()).toStrictEqual(true);
    });

    it('should prevent new offline request', () => {
      const registerOfflineButton = wrapper.find('[data-testid="registration-offline-cta"]');

      expect(registerOfflineButton.isDisabled()).toStrictEqual(true);
    });
  });
});
