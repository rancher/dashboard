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
      mocks: { $store: { getters: { 'i18n/t': jest.fn((key: string) => key) } } }
    }
  };

  describe('key CA Cert Bundle', () => {
    it.each([
      ['source is base64', 'Zm9vYmFy', 'foobar'],
      ['source is plain text', 'foobar', 'foobar'],
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

    it('should base64 encode plain PEM text on save', async() => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = { foo: { caBundle: 'Zm9vYmFy' } };

      mountOptions.propsData.value = value;

      wrapper = mount(
        RegistryConfigs,
        mountOptions
      );

      const registry = wrapper.findComponent('[data-testid^="registry-caBundle"]');

      registry.vm.$emit('update:value', '-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJA');
      wrapper.vm.update();

      expect(wrapper.emitted('updateConfigs')[0][0]['foo']['caBundle']).toBe('LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJrVENCK3dJSkE=');
    });

    it('should keep base64 value as-is on save', async() => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = { foo: { caBundle: 'Zm9vYmFy' } };

      mountOptions.propsData.value = value;

      wrapper = mount(
        RegistryConfigs,
        mountOptions
      );

      const registry = wrapper.findComponent('[data-testid^="registry-caBundle"]');

      registry.vm.$emit('update:value', 'c3NoIGtleQ==');
      wrapper.vm.update();

      expect(wrapper.emitted('updateConfigs')[0][0]['foo']['caBundle']).toBe('c3NoIGtleQ==');
    });
  });

  describe('cA Cert Bundle validation', () => {
    it('should pass validation for valid base64 value', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      const rule = wrapper.vm.caBundleRules[0];

      expect(rule('Zm9vYmFy')).toBeUndefined();
    });

    it('should pass validation for PEM text', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      const rule = wrapper.vm.caBundleRules[0];

      expect(rule('-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJA')).toBeUndefined();
    });

    it('should pass validation for empty value', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      const rule = wrapper.vm.caBundleRules[0];

      expect(rule('')).toBeUndefined();
      expect(rule(null)).toBeUndefined();
      expect(rule(undefined)).toBeUndefined();
    });

    it('should fail validation for invalid value', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      const rule = wrapper.vm.caBundleRules[0];

      expect(rule('not-valid-base64!')).toContain('registryConfig.caBundle.validationError');
    });

    it('should emit validation-changed with false when caBundle is invalid', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      wrapper.vm.onCaBundleValidation(0, false);

      const emitted = wrapper.emitted('validation-changed');

      expect(emitted[emitted.length - 1]).toStrictEqual([false]);
    });

    it('should emit validation-changed with true when all caBundles are valid', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      wrapper.vm.onCaBundleValidation(0, true);
      wrapper.vm.onCaBundleValidation(1, true);

      const emitted = wrapper.emitted('validation-changed');

      expect(emitted[emitted.length - 1]).toStrictEqual([true]);
    });

    it('should emit validation-changed with false when any caBundle is invalid', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      wrapper.vm.onCaBundleValidation(0, true);
      wrapper.vm.onCaBundleValidation(1, false);

      const emitted = wrapper.emitted('validation-changed');

      expect(emitted[emitted.length - 1]).toStrictEqual([false]);
    });
  });
});
