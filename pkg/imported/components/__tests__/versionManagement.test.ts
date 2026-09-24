import { shallowMount, mount } from '@vue/test-utils';
import VersionManagement from '@pkg/imported/components/VersionManagement.vue';
import { _EDIT, _CREATE } from '@shell/config/query-params';
import { SECTION_TYPE } from '@components/RcSection';

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
      },
      stubs: {
        RcSection: {
          name:     'RcSection',
          props:    ['title', 'mode', 'type', 'expandable'],
          template: '<div class="rc-section"><slot name="title" /><slot></slot></div>'
        }
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

  describe('rcSection styling', () => {
    const baseProps = {
      oldValue: 'system-default', globalSetting: true, value: 'system-default', mode: _CREATE
    };

    it('should render the fields inside an RcSection with the default title and the secondary type', () => {
      const wrapper = shallowMount(VersionManagement, { ...requiredSetup(), propsData: baseProps });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.exists()).toBe(true);
      expect(section.props('title')).toBe('imported.basics.versionManagement.title');
      expect(section.props('type')).toBe(SECTION_TYPE.SECONDARY);
    });

    it('should use a caller-provided title over the default', () => {
      const wrapper = shallowMount(VersionManagement, {
        ...requiredSetup(),
        propsData: { ...baseProps, title: 'Custom Title' }
      });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('title')).toBe('Custom Title');
    });

    it('should render the radio group and banner inside the RcSection', () => {
      const wrapper = mount(VersionManagement, {
        ...requiredSetup(),
        propsData: baseProps
      });

      expect(wrapper.find('[data-testid="imported-version-management-radio"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="version-management-banner"]').exists()).toBe(true);
    });
  });
});
