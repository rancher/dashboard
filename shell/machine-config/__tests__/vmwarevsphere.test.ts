import { mount, shallowMount } from '@vue/test-utils';
import vmwarevsphere from '@shell/machine-config/vmwarevsphere.vue';
import { DEFAULT_VALUES, SENTINEL } from '@shell/machine-config/vmwarevsphere-config';

describe('component: vmwarevsphere', () => {
  const defaultGetters = { 'i18n/t': jest.fn().mockImplementation((key: string) => key) };
  const poolId = 'poolId';
  const baseSetup = {
    propsData: {
      poolId,
      credentialId: 'credentialId',
      disabled:     false,
      provider:     'vmwarevsphere'
    },
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      { getters: defaultGetters },
      },
      stubs: { CodeMirror: true },
    }
  };
  const defaultCreateSetup = {
    ...baseSetup,
    propsData: {
      ...baseSetup.propsData,
      mode:           'create',
      poolCreateMode: true,
      value:          { initted: false },
    }
  };
  const defaultEditSetup = {
    ...baseSetup,
    propsData: {
      ...baseSetup.propsData,
      mode:           'edit',
      poolCreateMode: false,
      value:          { initted: false },
    }
  };
  const editModeWithPoolInCreateModeSetup = {
    ...defaultEditSetup,
    propsData: {
      ...defaultEditSetup.propsData,
      poolCreateMode: true
    }
  };

  describe('default values', () => {
    const testCases = [
      defaultCreateSetup,
      editModeWithPoolInCreateModeSetup
    ];

    it.each(testCases)('should mount successfully with correct default values', (setup) => {
      const wrapper = mount(vmwarevsphere, setup);

      const dataCenterElement = wrapper.find(`[data-testid="datacenter"]`).element;
      const resourcePoolElement = wrapper.find(`[data-testid="resourcePool"]`).element;
      const storageTypeElement = wrapper.find(`[data-testid="storageType"]`).element;
      const dataStoreElement = wrapper.find(`[data-testid="dataStore"]`).element;
      const folderElement = wrapper.find(`[data-testid="folder"]`).element;
      const hostElement = wrapper.find(`[data-testid="host"]`).element;
      const gracefulShutdownTimeoutElement = wrapper.find(`[data-testid="gracefulShutdownTimeout"]`).element;

      expect(dataCenterElement).toBeDefined();
      expect(resourcePoolElement).toBeDefined();
      expect(storageTypeElement).toBeDefined();
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
  });

  describe('mapPathOptionsToContent', () => {
    const testCases = [
      [['/Datacenter'], [{ label: '/Datacenter', value: '/Datacenter' }]],
      [['Datacenter'], [{ label: 'Datacenter', value: 'Datacenter' }]],
      [['/Datacenter/vm/datastore'], [{ label: '/Datacenter/vm/datastore', value: '/Datacenter/vm/datastore' }]],
    ];

    it.each(testCases)('should generate label/value object without manipultion', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(wrapper.vm.mapPathOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapHostOptionsToContent', () => {
    const hostPlaceholder = {
      label: '%cluster.machineConfig.vsphere.hostOptions.any%',
      value: SENTINEL
    };
    const testCases = [
      [[''], [hostPlaceholder]],
      [['host'], [{ label: 'host', value: 'host' }]],
    ];

    it.each(testCases)('should generate label/value object for host options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

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
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(wrapper.vm.mapFolderOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapCustomAttributesToContent', () => {
    const testCases = [
      [[{ name: 'name', key: 'key' }], [{ label: 'name', value: 'key' }]],
      [[{ name: 'name', key: 111 }], [{ label: 'name', value: '111' }]],
    ];

    it.each(testCases)('should generate label/value object for custom attributes options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

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
      const expectedResult = [{
        ...tag, label: `${ tag.category } / ${ tag.name }`, value: tag.id
      }];
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(wrapper.vm.mapTagsToContent([tag])).toStrictEqual(expectedResult);
    });
  });

  describe('resetValueIfNecessary', () => {
    const hostsystemOptions = ['', '/Datacenter/host/Cluster/111.11.11.1'];
    const folderOptions = ['', '/Datacenter/vm', '/Datacenter/vm/sub-folder'];
    const contentLibraryOptions = ['', 'some-content-library'];
    const networkOptions = ['', 'some-network'];
    const tagOptions = ['', 'some-tag'];

    it('should add errors to validationError collection when values are NOT in the options', () => {
      const setup = {
        ...defaultEditSetup,
        propsData: {
          ...defaultEditSetup.propsData,
          value: {
            ...defaultEditSetup.propsData.value,
            hostsystem:      'something that is not included in the options',
            folder:          'same as above',
            constentLibrary: 'same as above'
          }
        }
      };

      const wrapper = mount(vmwarevsphere, setup);

      const hostsystemContent = wrapper.vm.mapHostOptionsToContent(hostsystemOptions);
      const folderContent = wrapper.vm.mapHostOptionsToContent(folderOptions);
      const contentLibraryContent = wrapper.vm.mapPathOptionsToContent(contentLibraryOptions);

      wrapper.vm.resetValueIfNecessary('hostsystem', hostsystemContent, hostsystemOptions);
      wrapper.vm.resetValueIfNecessary('folder', folderContent, folderOptions);
      wrapper.vm.resetValueIfNecessary('contentLibrary', contentLibraryContent, contentLibraryOptions);

      expect(wrapper.vm.$data.validationErrors[poolId]).toContain('hostsystem');
      expect(wrapper.vm.$data.validationErrors[poolId]).toContain('folder');
      expect(wrapper.vm.$data.validationErrors[poolId]).toContain('contentLibrary');
    });

    describe('hostsystem, folder, contentLibrary, network and tag', () => {
      const testCases = [null, ''];

      it.each(testCases)('should NOT be added to validationError collection if they are null or ""', (data) => {
        const setup = {
          ...defaultEditSetup,
          propsData: {
            ...defaultEditSetup.propsData,
            value: {
              ...defaultEditSetup.propsData.value,
              hostsystem:     data,
              folder:         data,
              contentLibrary: data,
              network:        [data],
              tag:            [data]
            }
          }
        };

        const wrapper = mount(vmwarevsphere, setup);

        const hostsystemContent = wrapper.vm.mapHostOptionsToContent(hostsystemOptions);
        const folderContent = wrapper.vm.mapHostOptionsToContent(folderOptions);
        const contentLibraryContent = wrapper.vm.mapPathOptionsToContent(contentLibraryOptions);
        const networkContent = wrapper.vm.mapPathOptionsToContent(networkOptions);
        const tagContent = wrapper.vm.mapPathOptionsToContent(tagOptions);

        wrapper.vm.resetValueIfNecessary('hostsystem', hostsystemContent, hostsystemOptions);
        wrapper.vm.resetValueIfNecessary('folder', folderContent, folderOptions);
        wrapper.vm.resetValueIfNecessary('contentLibrary', contentLibraryContent, contentLibraryOptions);
        wrapper.vm.resetValueIfNecessary('network', networkContent, networkOptions, true);
        wrapper.vm.resetValueIfNecessary('tag', tagContent, tagOptions, true);

        expect(wrapper.vm.$data.validationErrors[poolId]).toBeUndefined();
      });
    });
  });

  describe('network name backwards compatibility', () => {
    it('should NOT update the current network value to use MOID instead of name', async() => {
      const legacyName = 'legacy_name';
      const legacyValue = 'legacy_value';
      const networkLabel = 'network_label';

      const wrapper = shallowMount(vmwarevsphere, {
        ...defaultEditSetup,
        propsData: {
          ...defaultEditSetup.propsData,
          value: {
            ...defaultEditSetup.propsData.value,
            network: [legacyName]
          }
        },
        computed: {
          networks: () => [
            {
              name: legacyName, label: networkLabel, value: legacyValue
            },
            {
              name: 'name1', label: 'label1', value: 'value1'
            },
            {
              name: 'name2', label: 'label2', value: 'value2'
            },
            {
              name: 'name3', label: 'label3', value: 'value3'
            },
            {
              name: 'name4', label: 'label4', value: 'value4'
            },
          ]
        }
      });

      await wrapper.vm.loadNetworks();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.value.network).toStrictEqual([legacyName]);
    });
  });

  describe('storage type toggling', () => {
    it('should toggle storage type to datastore-cluster and clear datastore value', async() => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      wrapper.vm.value.datastore = 'some-datastore';
      await wrapper.setData({ storageType: 'datastore-cluster' });

      expect(wrapper.vm.storageType).toBe('datastore-cluster');
      expect(wrapper.vm.value.datastore).toBe('');
    });

    it('should toggle storage type to datastore and clear datastoreCluster value', async() => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      // Initialize with datastore-cluster selected
      await wrapper.setData({ storageType: 'datastore-cluster' });
      wrapper.vm.value.datastoreCluster = 'some-cluster';

      // Switch back to datastore
      await wrapper.setData({ storageType: 'datastore' });

      expect(wrapper.vm.storageType).toBe('datastore');
      expect(wrapper.vm.value.datastoreCluster).toBe('');
    });

    it('should initialize storage type to datastore-cluster if value has datastoreCluster set', () => {
      const setup = {
        ...defaultEditSetup,
        propsData: {
          ...defaultEditSetup.propsData,
          value: {
            ...defaultEditSetup.propsData.value,
            datastoreCluster: 'existing-cluster',
            datastore:        ''
          }
        }
      };
      const wrapper = mount(vmwarevsphere, setup);

      expect(wrapper.vm.storageType).toBe('datastore-cluster');
    });

    it('should correctly toggle the visibility of datastore and datastore cluster selects', async() => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);
      const dataStoreContainer = wrapper.find('[data-testid="dataStore"]');

      // Default state: datastore
      let select = dataStoreContainer.findComponent({ name: 'LabeledSelect' });

      expect(select.exists()).toBe(true);
      expect(select.props('label')).toBe('%cluster.machineConfig.vsphere.scheduling.dataStore%');

      // Toggle to datastore-cluster
      await wrapper.setData({ storageType: 'datastore-cluster' });

      select = dataStoreContainer.findComponent({ name: 'LabeledSelect' });

      expect(select.exists()).toBe(true);
      expect(select.props('label')).toBe('%cluster.machineConfig.vsphere.scheduling.dataStoreCluster%');
    });
  });
});
