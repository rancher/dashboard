import { mount } from '@vue/test-utils';
import Email from '@shell/edit/monitoring.coreos.com.receiver/types/email.vue';

describe('page: Routes and Receivers', () => {
  it('should have host field with a valid integer value under Email form', () => {
    const wrapper = mount(Email, {
      props: {
        mode:  'create',
        value: {}
      },
      global: {
        mocks: {
          t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
          $store: {
            getters: {
              'i18n/t':      jest.fn(),
              'i18n/exists': jest.fn()
            }
          }
        },
      },
    });

    const host = wrapper.find('[data-testid="input-email-host"]');

    host.setValue('10.2.300.3');

    expect(host.exists()).toBe(true);
    expect(host.element.value).toStrictEqual('10.2.300.3');
  });
  it('should have port field with a valid integer value under Email form', () => {
    const wrapper = mount(Email, {
      props: {
        mode:  'create',
        value: {}
      },
      global: {
        mocks: {
          t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
          $store: {
            getters: {
              'i18n/t':      jest.fn(),
              'i18n/exists': jest.fn()
            }
          }
        },
      },
    });

    const port = wrapper.find('[data-testid="input-email-port"]');

    port.setValue('8080');

    expect(port.exists()).toBe(true);
    expect(port.element.value).toStrictEqual('8080');
  });
});
