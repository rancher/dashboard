import { mount } from '@vue/test-utils';
import DrainOptions from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions.vue';

// Payload of the component's `update:value` event. Left as an open record rather than
// restating the drain options: the `toStrictEqual` in each test below is the real check,
// and spelling the fields out here would mean maintaining the same shape twice in one file.
type DrainOptionsValue = Record<string, unknown>;

describe('drain options', () => {
  it('should update an empty value with default drain options', () => {
    const wrapper = mount(
      DrainOptions,
      {
        props:  { value: { }, mode: 'create' },
        global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } },

      });

    const emitted = wrapper.emitted('update:value') as [DrainOptionsValue][];

    expect(emitted[0][0]).toStrictEqual({
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

    const emitted = wrapper.emitted('update:value') as [DrainOptionsValue][];

    expect(emitted[0][0]).toStrictEqual({
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
