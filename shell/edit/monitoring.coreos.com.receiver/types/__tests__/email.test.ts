import { mount } from '@vue/test-utils';
import Email from '@shell/edit/monitoring.coreos.com.receiver/types/email.vue';

describe('page: Routes and Receivers', () => {
  it('email should have host and port fields', () => {
    const wrapper = mount(Email, {
      propsData: {
        mode:  'create',
        value: {}
      },
      mocks: {
        t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
        $store: {
          getters: {
            'i18n/t':      jest.fn(),
            'i18n/exists': jest.fn()
          }
        }
      },
    });

    const host = wrapper.find('[data-testid="input-email-host"]');
    const port = wrapper.find('[data-testid="input-email-port"]');

    expect(host.exists()).toBe(true);
    expect(port.exists()).toBe(true);
  });
  it('email host and posrt field should have value to a valid integer', () => {
    const wrapper = mount(Email, {
      propsData: {
        mode:  'create',
        value: {}
      },
      mocks: {
        t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
        $store: {
          getters: {
            'i18n/t':      jest.fn(),
            'i18n/exists': jest.fn()
          }
        }
      },
    });

    const host = wrapper.find('[data-testid="input-email-host"]');
    const port = wrapper.find('[data-testid="input-email-port"]');

    host.setValue('10.2.300.3');
    port.setValue('8080');

    expect(host.element.value).toStrictEqual('10.2.300.3');
    expect(port.element.value).toStrictEqual('8080');
  });
});
