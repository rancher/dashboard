import Certificate from '@shell/components/ThanosCatalog/Certificate.vue';
import { mount } from '@vue/test-utils';

describe('global monitorning Certificate', () => {
  it('should display default inputs when disabled tls', () => {
    const wrapper = mount(Certificate, { propsData: { value: { thanos: { tls: {} } } } });

    const inputWraps = wrapper.findAll('[data-testid^=input-config-]');

    expect(inputWraps).toHaveLength(1);
  });

  it('should display inputs when enabled tls', () => {
    const wrapper = mount(Certificate, { propsData: { value: { thanos: { tls: { enabled: true } } } } });

    const inputWraps = wrapper.findAll('[data-testid^=input-config-]');

    expect(inputWraps).toHaveLength(4);
  });
});
