import { mount, Wrapper } from '@vue/test-utils';
import { clone } from '@shell/utils/object';
import { _EDIT } from '@shell/config/query-params';
import { PROV_CLUSTER } from '@shell/edit/provisioning.cattle.io.cluster/__tests__/utils/cluster';
import RegistryConfigs from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs.vue';

const VALID_BASE64_CERT = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t';
const VALID_PEM_TEXT = '-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJA';

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
      ['source is base64', VALID_BASE64_CERT, '-----BEGIN CERTIFICATE-----'],
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

      value.spec.rkeConfig.registries.configs = { foo: { caBundle: VALID_BASE64_CERT } };

      mountOptions.propsData.value = value;

      wrapper = mount(
        RegistryConfigs,
        mountOptions
      );

      const registry = wrapper.findComponent('[data-testid^="registry-caBundle"]');

      registry.vm.$emit('update:value', VALID_PEM_TEXT);
      wrapper.vm.update();

      expect(wrapper.emitted('updateConfigs')[0][0]['foo']['caBundle']).toBe('LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJrVENCK3dJSkE=');
    });

    it('should keep base64 value as-is on save', async() => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = { foo: { caBundle: VALID_BASE64_CERT } };

      mountOptions.propsData.value = value;

      wrapper = mount(
        RegistryConfigs,
        mountOptions
      );

      const registry = wrapper.findComponent('[data-testid^="registry-caBundle"]');

      registry.vm.$emit('update:value', VALID_BASE64_CERT);
      wrapper.vm.update();

      expect(wrapper.emitted('updateConfigs')[0][0]['foo']['caBundle']).toBe(VALID_BASE64_CERT);
    });
  });

  describe('cA Cert Bundle validation', () => {
    it('should pass validation for valid base64 value', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      const rule = wrapper.vm.caBundleRules[0];

      expect(rule(VALID_BASE64_CERT)).toBeUndefined();
    });

    it('should pass validation for PEM text', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {};
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      const rule = wrapper.vm.caBundleRules[0];

      expect(rule(VALID_PEM_TEXT)).toBeUndefined();
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

    it('should report allCaBundlesValid as true when all entries have valid caBundles', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {
        'reg1.example.com': { caBundle: VALID_BASE64_CERT },
        'reg2.example.com': { caBundle: VALID_BASE64_CERT },
      };
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      expect(wrapper.vm.allCaBundlesValid).toBe(true);
    });

    it('should report allCaBundlesValid as false when any entry has an invalid caBundle', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {
        'reg1.example.com': { caBundle: VALID_BASE64_CERT },
        'reg2.example.com': { caBundle: 'not-valid!' },
      };
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      expect(wrapper.vm.allCaBundlesValid).toBe(false);
    });

    it('should update validation when an invalid entry is removed', () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.registries.configs = {
        'reg1.example.com': { caBundle: VALID_BASE64_CERT },
        'reg2.example.com': { caBundle: 'not-valid!' },
      };
      mountOptions.propsData.value = value;

      wrapper = mount(RegistryConfigs, mountOptions);

      expect(wrapper.vm.allCaBundlesValid).toBe(false);

      wrapper.vm.entries.splice(1, 1);

      expect(wrapper.vm.allCaBundlesValid).toBe(true);
    });
  });
});
