import { mount } from '@vue/test-utils';
import DrainOptions from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions';

describe('drain options', () => {
  it('should update an empty value with default drain options', () => {
    const wrapper = mount(
      DrainOptions,
      {
        props:  { value: { }, mode: 'create' },
        global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } },

      });

    expect(wrapper.emitted('update:value')?.[0]?.[0]).toStrictEqual({
      deleteEmptyDirData:              true,
      disableEviction:                 false,
      enabled:                         false,
      force:                           false,
      gracePeriod:                     -1,
      ignoreDaemonSets:                true,
      skipWaitForDeleteTimeoutSeconds: 0,
      timeout:                         120,
    });
  });

  it('should not overwrite existing drain option values', () => {
    const upgradeStrategy = {
      deleteEmptyDirData: false,
      disableEviction:    false,
      enabled:            false,
      force:              true,
      ignoreDaemonSets:   false,
      timeout:            90,
    };
    const wrapper = mount(
      DrainOptions,
      {
        props:  { value: upgradeStrategy, mode: 'create' },
        global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } },

      });

    expect(wrapper.emitted('update:value')?.[0]?.[0]).toStrictEqual({
      deleteEmptyDirData:              false,
      disableEviction:                 false,
      enabled:                         false,
      force:                           true,
      gracePeriod:                     -1,
      ignoreDaemonSets:                false,
      skipWaitForDeleteTimeoutSeconds: 0,
      timeout:                         90,
    });
  });
});
