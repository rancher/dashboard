import { mount } from '@vue/test-utils';
import Email from '@shell/edit/monitoring.coreos.com.receiver/types/email.vue';

describe('page: Routes and Receivers', () => {
  it('email should have host and port fields', () => {
    const wrapper = mount(Email, {
      propsData: {
        mode:  'create',
        value: {}
      },
    });

    const host = wrapper.find('[data-testid="input-email-host"]');
    const port = wrapper.find('[data-testid="input-email-port"]');

    expect(host.exists()).toBe(true);
    expect(port.exists()).toBe(true);
  });
});
