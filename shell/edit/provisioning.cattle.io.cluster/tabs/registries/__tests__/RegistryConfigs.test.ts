import { mount, Wrapper } from '@vue/test-utils';
import { clone } from '@shell/utils/object';
import { _EDIT } from '@shell/config/query-params';
import { PROV_CLUSTER } from '@shell/edit/provisioning.cattle.io.cluster/__tests__/utils/cluster';
import RegistryConfigs from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs.vue';

describe('component: RegistryConfigs', () => {
  let wrapper: Wrapper<InstanceType<typeof RegistryConfigs> & { [key: string]: any }>;

  const mountOptions = {
    propsData: {
      value:                     {},
      mode:                      _EDIT,
      clusterRegisterBeforeHook: () => {}
    },
    global: {
      stubs: {
        SelectOrCreateAuthSecret: true,
        SecretSelector:           true,
      },
      mocks: { $store: { getters: { 'i18n/t': jest.fn() } } }
    }
  };

  describe('key CA Cert Bundle', () => {
    it.each([
      ['source is plain text', 'Zm9vYmFy', 'foobar'],
      ['source is base64', 'foobar', 'foobar'],
    ])('should display key, %p', (_, sourceCaBundle, displayedCaBundle) => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = { foo: { caBundle: sourceCaBundle } };

      mountOptions.propsData.value = value;

      wrapper = mount(
        RegistryConfigs,
        mountOptions
      );

      const registry = wrapper.findComponent('[data-testid^="registry-caBundle"]');

      expect(registry.props().value).toBe(displayedCaBundle);
    });

    it('should update key in base64 format', async() => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = { foo: { caBundle: 'Zm9vYmFy' } };

      mountOptions.propsData.value = value;

      wrapper = mount(
        RegistryConfigs,
        mountOptions
      );

      const registry = wrapper.findComponent('[data-testid^="registry-caBundle"]');

      registry.vm.$emit('update:value', 'ssh key');
      wrapper.vm.update();

      expect(wrapper.emitted('updateConfigs')[0][0]['foo']['caBundle']).toBe('c3NoIGtleQ==');
    });
  });
});
