import { mount } from '@vue/test-utils';
import vmwarevsphere, { DEFAULT_VALUES, SENTINEL } from '@shell/machine-config/vmwarevsphere.vue';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('component: vmwarevsphere', () => {
  const defaultGetters = { 'i18n/t': jest.fn().mockImplementation((key: string) => key) };
  const defaultSetup = {
    propsData: {
      poolId:       'poolId',
      credentialId: 'credentialId',
      disabled:     false,
      mode:         'create',
      value:        { initted: false },
      provider:     'vmwarevsphere'
    },
    mocks: {
      $fetchState: { pending: false },
      $store:      { getters: defaultGetters },
    },
    stubs:      { CodeMirror: true },
    directives: { cleanHtmlDirective }
  };

  it('should mount successfully with correct default values', () => {
    const wrapper = mount(vmwarevsphere, defaultSetup);

    const dataCenterElement = wrapper.find(`[data-testid="datacenter"]`).element;
    const resourcePoolElement = wrapper.find(`[data-testid="resourcePool"]`).element;
    const dataStoreElement = wrapper.find(`[data-testid="dataStore"]`).element;
    const folderElement = wrapper.find(`[data-testid="folder"]`).element;
    const hostElement = wrapper.find(`[data-testid="host"]`).element;
    const gracefulShutdownTimeoutElement = wrapper.find(`[data-testid="gracefulShutdownTimeout"]`).element;

    expect(dataCenterElement).toBeDefined();
    expect(resourcePoolElement).toBeDefined();
    expect(dataStoreElement).toBeDefined();
    expect(folderElement).toBeDefined();
    expect(hostElement).toBeDefined();
    expect(gracefulShutdownTimeoutElement).toBeDefined();

    const {
      cpuCount: defaultCpuCount,
      diskSize: defaultDiskSize,
      memorySize: defaultMemorySize,
      hostsystem: defaultHostsystem,
      cloudConfig: defaultCloudConfig,
      gracefulShutdownTimeout: defaultGracefulShutdownTimeout,
      cfgparam: defaultCfgparam,
      os: defaultOs
    } = DEFAULT_VALUES;

    const {
      cpuCount,
      diskSize,
      memorySize,
      hostsystem,
      cloudConfig,
      gracefulShutdownTimeout,
      cfgparam,
      os
    } = wrapper.vm.$options.propsData.value;

    expect(cpuCount).toStrictEqual(defaultCpuCount);
    expect(diskSize).toStrictEqual(defaultDiskSize);
    expect(memorySize).toStrictEqual(defaultMemorySize);
    expect(hostsystem).toStrictEqual(defaultHostsystem);
    expect(cloudConfig).toStrictEqual(defaultCloudConfig);
    expect(gracefulShutdownTimeout).toStrictEqual(defaultGracefulShutdownTimeout);
    expect(cfgparam).toStrictEqual(defaultCfgparam);
    expect(os).toStrictEqual(defaultOs);
  });

  describe('mapPathOptionsToContent', () => {
    const testCases = [
      [['/Datacenter'], [{ label: '/Datacenter', value: '/Datacenter' }]],
      [['Datacenter'], [{ label: 'Datacenter', value: 'Datacenter' }]],
      [['/Datacenter/vm/datastore'], [{ label: '/Datacenter/vm/datastore', value: '/Datacenter/vm/datastore' }]],
    ];

    it.each(testCases)('should generate label/value object without manipultion', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultSetup);

      expect(wrapper.vm.mapPathOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapHostOptionsToContent', () => {
    const hostPlaceholder = {
      label: 'cluster.machineConfig.vsphere.hostOptions.any',
      value: SENTINEL
    };
    const testCases = [
      [[''], [hostPlaceholder]],
      [['host'], [{ label: 'host', value: 'host' }]],
    ];

    it.each(testCases)('should generate label/value object for host options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultSetup);

      expect(wrapper.vm.mapHostOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapFolderOptionsToContent', () => {
    const folderPlaceholder = {
      label: '\u00A0',
      value: ''
    };
    const testCases = [
      [[undefined], [folderPlaceholder]],
      [[null], [folderPlaceholder]],
      [[''], [folderPlaceholder]],
      [['folder'], [{ label: 'folder', value: 'folder' }]],
    ];

    it.each(testCases)('should generate label/value object for folder options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultSetup);

      expect(wrapper.vm.mapFolderOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapCustomAttributesToContent', () => {
    const testCases = [
      [[{ name: 'name', key: 'key' }], [{ label: 'name', value: 'key' }]],
      [[{ name: 'name', key: 111 }], [{ label: 'name', value: '111' }]],
    ];

    it.each(testCases)('should generate label/value object for custom attributes options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultSetup);

      expect(wrapper.vm.mapCustomAttributesToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapTagsToContent', () => {
    it('should generate label/value object for tag options properly', () => {
      const tag = {
        id:       'tag_id',
        name:     'tag_name',
        category: 'tag_category',
      };
      const expectedReslut = [{
        ...tag, label: `${ tag.category } / ${ tag.name }`, value: tag.id
      }];
      const wrapper = mount(vmwarevsphere, defaultSetup);

      expect(wrapper.vm.mapTagsToContent([tag])).toStrictEqual(expectedReslut);
    });
  });
});
