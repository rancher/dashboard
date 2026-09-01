import { shallowMount } from '@vue/test-utils';
import VersionManagement from '@pkg/imported/components/VersionManagement.vue';
import { _EDIT, _CREATE } from '@shell/config/query-params';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t': (text: string) => {
        return `${ text }`;
      },
    },
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

describe('version management component', () => {
  it.each([
    [{
      oldValue: 'system-default', globalSetting: true, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.create.default' }],
    [{
      oldValue: 'system-default', globalSetting: true, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.create.nonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: true, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.create.nonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.create.default' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.create.nonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.create.nonDefault' }]
  ])('on import of a new cluster, should display correct warning depending on the selection', (config, expected) => {
    const wrapper = shallowMount(VersionManagement, {
      ...requiredSetup(),
      propsData: {
        ...config, isLocal: true, mode: _CREATE
      }
    });

    const banner = wrapper.find('[data-testid="version-management-banner"]');

    expect(banner.exists()).toBe(expected.shouldExist);

    expect(wrapper.vm.versionManagementInfo).toBe(expected.value);
  });

  it.each([
    [{
      oldValue: 'system-default', globalSetting: true, value: 'system-default'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'system-default', globalSetting: true, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: true, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'system-default'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'true', globalSetting: true, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'true', globalSetting: true, value: 'true'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'true', globalSetting: true, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different' }],
    [{
      oldValue: 'true', globalSetting: false, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'true', globalSetting: false, value: 'true'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'true', globalSetting: false, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different' }],
    [{
      oldValue: 'false', globalSetting: true, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'false', globalSetting: true, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different' }],
    [{
      oldValue: 'false', globalSetting: true, value: 'false'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'false', globalSetting: false, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'false', globalSetting: false, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.different' }],
    [{
      oldValue: 'false', globalSetting: false, value: 'false'
    }, { shouldExist: false, value: '' }],
  ])('on edit of imported, should display correct warning depending on the selection', (config, expected) => {
    const wrapper = shallowMount(VersionManagement, {
      ...requiredSetup(),
      propsData: {
        ...config, isLocal: false, mode: _EDIT
      }
    });

    const banner = wrapper.find('[data-testid="version-management-banner"]');

    expect(banner.exists()).toBe(expected.shouldExist);

    expect(wrapper.vm.versionManagementInfo).toBe(expected.value);
  });

  it.each([
    [{
      oldValue: 'system-default', globalSetting: true, value: 'system-default'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'system-default', globalSetting: true, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: true, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'system-default'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'true'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'system-default', globalSetting: false, value: 'false'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.defaultToNonDefault' }],
    [{
      oldValue: 'true', globalSetting: true, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'true', globalSetting: true, value: 'true'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'true', globalSetting: true, value: 'false'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'true', globalSetting: false, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'true', globalSetting: false, value: 'true'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'true', globalSetting: false, value: 'false'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'false', globalSetting: true, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'false', globalSetting: true, value: 'true'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'false', globalSetting: true, value: 'false'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'false', globalSetting: false, value: 'system-default'
    }, { shouldExist: true, value: 'imported.basics.versionManagement.banner.edit.nonDefaultToDefault' }],
    [{
      oldValue: 'false', globalSetting: false, value: 'true'
    }, { shouldExist: false, value: '' }],
    [{
      oldValue: 'false', globalSetting: false, value: 'false'
    }, { shouldExist: false, value: '' }],
  ])('on edit of local, should display correct warning depending on the selection', (config, expected) => {
    const wrapper = shallowMount(VersionManagement, {
      ...requiredSetup(),
      propsData: {
        ...config, isLocal: true, mode: _EDIT
      }
    });

    const banner = wrapper.find('[data-testid="version-management-banner"]');

    expect(banner.exists()).toBe(expected.shouldExist);

    expect(wrapper.vm.versionManagementInfo).toBe(expected.value);
  });
});
