import { shallowMount } from '@vue/test-utils';
import RcS3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/RcS3Config.vue';
import { NORMAN } from '@shell/config/types';

// shared.ts requires provider images, which aren't available to jest
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({ RETENTION_DEFAULT: 5 }));

// RcContentGroup's default shallow-mount stub doesn't render its default slot, which would hide the content under test
const RcContentGroupStub = {
  name:     'RcContentGroup',
  template: '<div v-bind="$attrs"><slot /></div>',
};

describe('component: RcS3Config', () => {
  const defaultProps = {
    mode:                'create',
    namespace:           'test-ns',
    registerBeforeHook:  jest.fn(),
    localRetentionCount: 5,
    value:               {}
  };

  const createWrapper = (props: Record<string, unknown> = {}, cloudCredential: object | null = null) => {
    const byId = jest.fn(() => cloudCredential);

    return shallowMount(RcS3Config, {
      props: {
        ...defaultProps,
        ...props
      },
      global: {
        mocks: {
          $store: { getters: { 'rancher/byId': byId, 'i18n/t': (key: string) => key } },
          t:      (key: string) => key,
        },
        stubs: { RcContentGroup: RcContentGroupStub }
      }
    });
  };

  describe('state', () => {
    it('should initialize config with default values', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.config).toStrictEqual({
        bucket:              '',
        cloudCredentialName: null,
        endpoint:            '',
        endpointCA:          '',
        folder:              '',
        region:              '',
        skipSSLVerify:       false,
        retention:           null,
      });
    });

    it('should initialize config with the provided value', () => {
      const wrapper = createWrapper({
        value: {
          bucket: 'test', region: 'us-east-1', retention: 2
        }
      });

      expect(wrapper.vm.config.bucket).toStrictEqual('test');
      expect(wrapper.vm.config.region).toStrictEqual('us-east-1');
      expect(wrapper.vm.config.retention).toStrictEqual(2);
    });

    it('should emit a copy of the config on update', () => {
      const wrapper = createWrapper({ value: { bucket: 'test' } });

      wrapper.vm.update();

      const emitted = wrapper.emitted('update:value')?.[0]?.[0];

      expect(emitted).toStrictEqual(wrapper.vm.config);
      expect(emitted).not.toBe(wrapper.vm.config);
    });

    it('should read the cloud credential defaults from the selected credential', () => {
      const decodedData = { defaultBucket: 'cred-bucket' };
      const wrapper = createWrapper({ value: { cloudCredentialName: 'cattle-global-data:cc-1' } }, { decodedData });

      expect(wrapper.vm.ccData).toStrictEqual(decodedData);
      expect(wrapper.vm.$store.getters['rancher/byId']).toHaveBeenCalledWith(NORMAN.CLOUD_CREDENTIAL, 'cattle-global-data:cc-1');
    });
  });

  describe('retention', () => {
    it('should use localRetentionCount as the local count', () => {
      const wrapper = createWrapper({ localRetentionCount: 3 });

      expect(wrapper.vm.localCountToUse).toStrictEqual(3);
    });

    it.each([null, undefined])('should use the default retention when localRetentionCount is %p', (localRetentionCount) => {
      const wrapper = createWrapper({ localRetentionCount });

      expect(wrapper.vm.localCountToUse).toStrictEqual(5);
    });

    it.each([
      ['create', { retention: 2 }, false],
      ['edit', { retention: 5 }, false],
      ['edit', { retention: 2 }, true],
    ])('should set differentRetention in %s mode with %p to %p', (mode, value, expected) => {
      const wrapper = createWrapper({ mode, value });

      expect(wrapper.vm.differentRetention).toStrictEqual(expected);
    });

    it('should follow localRetentionCount when the retention is not different', async() => {
      const wrapper = createWrapper({ localRetentionCount: 5 });

      await wrapper.setProps({ localRetentionCount: 10 });

      expect(wrapper.vm.config.retention).toStrictEqual(10);
      expect(wrapper.emitted('update:value')?.[0]?.[0]).toStrictEqual(expect.objectContaining({ retention: 10 }));
    });

    it('should show the retention input only when the retention is different', async() => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent({ name: 'UnitInput' }).exists()).toBe(false);

      await wrapper.setData({ differentRetention: true });

      expect(wrapper.findComponent({ name: 'UnitInput' }).exists()).toBe(true);
    });
  });

  describe('validation', () => {
    const CREDENTIAL = 'cattle-global-data:cc-1';

    it.each([
      ['a bucket is set', { bucket: 'my-bucket' }, {}, true],
      ['no bucket is set, but the credential provides a default bucket', { cloudCredentialName: CREDENTIAL }, { defaultBucket: 'cred-bucket' }, true],
      ['no bucket is set, and the credential has no default bucket', { cloudCredentialName: CREDENTIAL }, {}, false],
      ['no bucket or credential is set', {}, {}, false],
    ])('should be valid (%s): %p', (_, value, decodedData, valid) => {
      const wrapper = createWrapper({ mode: 'edit', value }, { decodedData });

      expect(wrapper.vm.fvFormIsValid).toBe(valid);
    });

    it('should report the bucket error only when there is no bucket and no credential default bucket', () => {
      const withDefault = createWrapper({ value: { cloudCredentialName: CREDENTIAL } }, { decodedData: { defaultBucket: 'cred-bucket' } });
      const withoutDefault = createWrapper({ value: { cloudCredentialName: CREDENTIAL } }, { decodedData: {} });

      expect(withDefault.vm.fvGetPathErrors(['bucket'])).toStrictEqual([]);
      expect(withoutDefault.vm.fvGetPathErrors(['bucket'])).toStrictEqual(['validation.required']);
    });

    it.each([
      [{ bucket: 'my-bucket' }, {}, true],
      [{ cloudCredentialName: CREDENTIAL }, { defaultBucket: 'cred-bucket' }, true],
      [{}, {}, false],
    ])('should emit its validity as soon as it is created, for %p', (value, decodedData, valid) => {
      const wrapper = createWrapper({ value }, { decodedData });

      expect(wrapper.emitted('validationChanged')?.[0]).toStrictEqual([valid]);
    });
  });

  describe('layout', () => {
    it('should stack its content with RcContentGroup instead of margin classes', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(RcContentGroupStub).element).toBe(wrapper.element);
      expect(wrapper.html()).not.toMatch(/\bm[tb]-\d+\b/);
    });

    it.each([
      [false, true],
      [true, false],
    ])('should show the skip SSL verify group when the credential defaultSkipSSLVerify is %p: %p', (defaultSkipSSLVerify, visible) => {
      const wrapper = createWrapper({ value: { cloudCredentialName: 'cattle-global-data:cc-1' } }, { decodedData: { defaultSkipSSLVerify } });

      expect(wrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(visible);
    });
  });
});
