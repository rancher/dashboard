import Secret from '@shell/edit/workload/storage/secret.vue';
import KeyToPath from '@shell/edit/workload/storage/KeyToPath.vue';
import { shallowMount } from '@vue/test-utils';

describe('component: Secret', () => {
  it('should return null for for sourceData computed prop, if type is not secret or configmap', () => {
    const localThis = {
      type:  'emptyDir',
      value: {}
    };

    expect(Secret.computed.sourceData.call(localThis)).toBeNull();
  });

  it('should return the correct secret data for sourceData computed prop', () => {
    const name = 'test-secretName';
    const secret = { metadata: { name } };
    const localThis1 = {
      type:    'secret',
      value:   { secret: { secretName: name } },
      secrets: [secret]
    };

    const localThis2 = {
      type:    'secret',
      value:   { secret: { secretName: 'test' } },
      secrets: [secret]
    };

    expect(Secret.computed.sourceData.call(localThis1)).toBe(secret);

    expect(Secret.computed.sourceData.call(localThis2)).toBeUndefined();
  });
  it('should return the correct configMap data for sourceData computed prop', () => {
    const name = 'test-secretName';
    const configMap = { metadata: { name } };
    const localThis1 = {
      type:       'configMap',
      value:      { configMap: { name } },
      configMaps: [configMap]
    };

    const localThis2 = {
      type:       'configMap',
      value:      { configMap: { name: test } },
      configMaps: [configMap]
    };

    expect(Secret.computed.sourceData.call(localThis1)).toBe(configMap);

    expect(Secret.computed.sourceData.call(localThis2)).toBeUndefined();
  });

  it('should contain KeyToPath component if sourceData has value', () => {
    const name = 'test-secretName';
    const secret = { metadata: { name } };
    const wrapper = shallowMount(Secret, {
      propsData: {
        value:   { secret: { secretName: name } },
        secrets: [secret]
      }
    });

    expect(wrapper.findComponent(KeyToPath).exists()).toBe(true);
  });

  it('should not contain KeyToPath component if sourceData has no value', () => {
    const name = 'test-secretName';
    const secret = { metadata: { name } };

    const wrapper2 = shallowMount(Secret, {
      propsData: {
        value:   { secret: { secretName: 'test' } },
        secrets: [secret]
      }
    });

    expect(wrapper2.findComponent(KeyToPath).exists()).toBe(false);
  });
});
