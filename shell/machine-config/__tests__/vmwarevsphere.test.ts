import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import vmwarevsphere from '@shell/machine-config/vmwarevsphere.vue';
import { DEFAULT_VALUES, SENTINEL } from '@shell/machine-config/vmwarevsphere-config';

type LabelValue = { label: string, value: string };

/** vSphere returns option lists as paths, some of which come back empty or absent. */
type PathOption = string | null | undefined;

type CustomAttribute = { name: string, key: string | number };

type Tag = { id: string, name: string, category: string };

/**
 * `vmwarevsphere.vue` is a plain-JS SFC built on the untyped `create-edit-view`
 * mixin, so `vue-tsc` cannot infer its `methods` block and every member of
 * `wrapper.vm` resolves to `never` (which then reports as "not callable").
 *
 * Describe just the surface these tests drive so the calls below are checked
 * against a real signature. Remove this once the component is converted to
 * `<script lang="ts"> defineComponent`.
 */
interface VSphereInstance {
  value: Record<string, unknown>;
  storageType: string;
  validationErrors: Record<string, string[] | undefined>;
  dataCentersResults: LabelValue[] | null;
  dataStoresResults: LabelValue[] | null;
  libraryTemplatesResults: LabelValue[] | null;
  mapPathOptionsToContent(pathOptions: PathOption[]): LabelValue[];
  mapHostOptionsToContent(hostOptions: PathOption[]): LabelValue[];
  mapFolderOptionsToContent(folderOptions: PathOption[]): LabelValue[];
  mapCustomAttributesToContent(customAttributes: CustomAttribute[]): LabelValue[];
  mapTagsToContent(tags: Tag[]): (Tag & LabelValue)[];
  resetValueIfNecessary(key: string, content: LabelValue[], options: PathOption[], isArray?: boolean): void;
  manageErrors(action: string, key: string): void;
  loadDataCenters(): Promise<void>;
  loadDataStores(): Promise<void>;
  loadLibraryTemplates(): Promise<void>;
  loadNetworks(): Promise<void>;
}

const asVSphere = (wrapper: { vm: unknown }): VSphereInstance => wrapper.vm as VSphereInstance;

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
    const testCases: [PathOption[], LabelValue[]][] = [
      [['/Datacenter'], [{ label: '/Datacenter', value: '/Datacenter' }]],
      [['Datacenter'], [{ label: 'Datacenter', value: 'Datacenter' }]],
      [['/Datacenter/vm/datastore'], [{ label: '/Datacenter/vm/datastore', value: '/Datacenter/vm/datastore' }]],
    ];

    it.each(testCases)('should generate label/value object without manipultion', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(asVSphere(wrapper).mapPathOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapHostOptionsToContent', () => {
    const hostPlaceholder = {
      label: '%cluster.machineConfig.vsphere.hostOptions.any%',
      value: SENTINEL
    };
    const testCases: [PathOption[], LabelValue[]][] = [
      [[''], [hostPlaceholder]],
      [['host'], [{ label: 'host', value: 'host' }]],
    ];

    it.each(testCases)('should generate label/value object for host options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(asVSphere(wrapper).mapHostOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapFolderOptionsToContent', () => {
    const folderPlaceholder = {
      label: '\u00A0',
      value: ''
    };
    const testCases: [PathOption[], LabelValue[]][] = [
      [[undefined], [folderPlaceholder]],
      [[null], [folderPlaceholder]],
      [[''], [folderPlaceholder]],
      [['folder'], [{ label: 'folder', value: 'folder' }]],
    ];

    it.each(testCases)('should generate label/value object for folder options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(asVSphere(wrapper).mapFolderOptionsToContent(rawData)).toStrictEqual(expected);
    });
  });

  describe('mapCustomAttributesToContent', () => {
    const testCases: [CustomAttribute[], LabelValue[]][] = [
      [[{ name: 'name', key: 'key' }], [{ label: 'name', value: 'key' }]],
      [[{ name: 'name', key: 111 }], [{ label: 'name', value: '111' }]],
    ];

    it.each(testCases)('should generate label/value object for custom attributes options properly', (rawData, expected) => {
      const wrapper = mount(vmwarevsphere, defaultCreateSetup);

      expect(asVSphere(wrapper).mapCustomAttributesToContent(rawData)).toStrictEqual(expected);
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

      expect(asVSphere(wrapper).mapTagsToContent([tag])).toStrictEqual(expectedResult);
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
            creationType:   'library',
            hostsystem:     'something that is not included in the options',
            folder:         'same as above',
            contentLibrary: 'same as above'
          }
        }
      };

      const wrapper = mount(vmwarevsphere, setup);
      const vm = asVSphere(wrapper);

      const hostsystemContent = vm.mapHostOptionsToContent(hostsystemOptions);
      const folderContent = vm.mapHostOptionsToContent(folderOptions);
      const contentLibraryContent = vm.mapPathOptionsToContent(contentLibraryOptions);

      vm.resetValueIfNecessary('hostsystem', hostsystemContent, hostsystemOptions);
      vm.resetValueIfNecessary('folder', folderContent, folderOptions);
      vm.resetValueIfNecessary('contentLibrary', contentLibraryContent, contentLibraryOptions);

      expect(vm.validationErrors[poolId]).toContain('hostsystem');
      expect(vm.validationErrors[poolId]).toContain('folder');
      expect(vm.validationErrors[poolId]).toContain('contentLibrary');
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
        const vm = asVSphere(wrapper);

        const hostsystemContent = vm.mapHostOptionsToContent(hostsystemOptions);
        const folderContent = vm.mapHostOptionsToContent(folderOptions);
        const contentLibraryContent = vm.mapPathOptionsToContent(contentLibraryOptions);
        const networkContent = vm.mapPathOptionsToContent(networkOptions);
        const tagContent = vm.mapPathOptionsToContent(tagOptions);

        vm.resetValueIfNecessary('hostsystem', hostsystemContent, hostsystemOptions);
        vm.resetValueIfNecessary('folder', folderContent, folderOptions);
        vm.resetValueIfNecessary('contentLibrary', contentLibraryContent, contentLibraryOptions);
        vm.resetValueIfNecessary('network', networkContent, networkOptions, true);
        vm.resetValueIfNecessary('tag', tagContent, tagOptions, true);

        expect(vm.validationErrors[poolId]).toBeUndefined();
      });
    });

    describe('values relative to the datacenter', () => {
      const datacenters = ['/dc1', '/dc2', '/folder1/dc3'];
      const setupWith = (value: Record<string, unknown>) => {
        const wrapper = mount(vmwarevsphere, {
          ...defaultEditSetup,
          propsData: {
            ...defaultEditSetup.propsData,
            value: { ...defaultEditSetup.propsData.value, ...value }
          }
        });
        const vm = asVSphere(wrapper);

        vm.dataCentersResults = vm.mapPathOptionsToContent(datacenters);

        return vm;
      };
      const toContent = (vm: VSphereInstance, key: string, options: string[]) => {
        return key === 'folder' ? vm.mapFolderOptionsToContent(options) : vm.mapPathOptionsToContent(options);
      };

      const validCases: [string, string, string, string[]][] = [
        ['datastore', 'ds1', 'dc1', ['/dc1/datastore/ds1']],
        ['datastore', 'ds1', '/dc1', ['/dc1/datastore/ds1']],
        ['datastore', 'ds1', 'dc1', ['/dc1/datastore/storage/ds1']],
        ['datastore', 'storage/ds1', 'dc1', ['/dc1/datastore/storage/ds1']],
        ['datastore', 'ds3', 'dc3', ['/folder1/dc3/datastore/ds3']],
        ['datastore', 'ds3', 'folder1/dc3', ['/folder1/dc3/datastore/ds3']],
        ['datastoreCluster', 'dsc1', 'dc1', ['/dc1/datastore/dsc1']],
        ['pool', 'cluster1/Resources', 'dc1', ['/dc1/host/cluster1/Resources']],
        ['hostsystem', 'cluster1/10.0.0.1', 'dc1', ['', '/dc1/host/cluster1/10.0.0.1']],
        ['hostsystem', '10.0.0.1', 'dc1', ['', '/dc1/host/cluster1/10.0.0.1']],
        ['folder', 'folder1', 'dc1', ['', '/dc1/vm', '/dc1/vm/folder1']],
        ['folder', '/folder1/', 'dc1', ['', '/dc1/vm', '/dc1/vm/folder1']],
        ['folder', 'folder1', '/dc1', ['', '/dc1/vm', '/dc1/vm/folder1']],
        ['folder', '/dc1/vm/folder1', '/dc1', ['', '/dc1/vm', '/dc1/vm/folder1']],
        ['cloneFrom', 'template1', 'dc1', ['/dc1/vm/templates/template1']],
      ];

      it.each(validCases)('should accept %p value %p in datacenter %p', (key, value, datacenter, options) => {
        const vm = setupWith({ datacenter, [key]: value });

        vm.resetValueIfNecessary(key, toContent(vm, key, options), options);

        expect(vm.validationErrors[poolId]).toBeUndefined();
      });

      it.each(validCases)('should NOT change the saved %p value %p', (key, value, datacenter, options) => {
        const vm = setupWith({ datacenter, [key]: value });

        vm.resetValueIfNecessary(key, toContent(vm, key, options), options);

        expect(vm.value[key]).toStrictEqual(value);
      });

      it.each(validCases)('should select the option the %p value %p resolves to', (key, value, datacenter, options) => {
        const vm = setupWith({ datacenter, [key]: value });
        const content = toContent(vm, key, options);

        vm.resetValueIfNecessary(key, content, options);

        expect(content.filter((c) => c.value === value)).toHaveLength(1);
      });

      const invalidCases: [string, string, string | undefined, string[]][] = [
        ['datastore', 'missing', 'dc1', ['/dc1/datastore/ds1']],
        ['datastore', '/dc2/datastore/ds1', 'dc1', ['/dc1/datastore/ds1']],
        ['datastore', 'ds1', 'dc1', ['/dc2/datastore/ds1']],
        ['datastore', 'ds1', 'dc1', ['/dc1/datastore/a/ds1', '/dc1/datastore/b/ds1']],
        ['datastore', 'ds1', undefined, ['/dc1/datastore/ds1']],
        ['datastore', 'ds1', 'unknown', ['/dc1/datastore/ds1']],
        ['pool', 'Resources', 'dc1', ['/dc1/host/cluster1/Resources', '/dc1/host/cluster2/Resources']],
        ['folder', '/dc1/vm/folder1', 'dc1', ['', '/dc1/vm', '/dc1/vm/folder1']],
        ['folder', 'dc1/vm/folder1', 'dc1', ['', '/dc1/vm', '/dc1/vm/folder1']],
      ];

      it.each(invalidCases)('should add an error for %p value %p in datacenter %p', (key, value, datacenter, options) => {
        const vm = setupWith({ datacenter, [key]: value });

        vm.resetValueIfNecessary(key, toContent(vm, key, options), options);

        expect(vm.validationErrors[poolId]).toStrictEqual([key]);
      });

      it('should offer folder values the driver can use when the datacenter has no leading slash', () => {
        const vm = setupWith({ datacenter: 'dc1' });

        expect(vm.mapFolderOptionsToContent(['', '/dc1/vm', '/dc1/vm/folder1'])).toStrictEqual([
          { label: '\u00A0', value: '' },
          { label: '/dc1/vm/folder1', value: 'folder1' },
        ]);
      });

      it('should NOT change folder values when the datacenter has a leading slash', () => {
        const vm = setupWith({ datacenter: '/dc1' });

        expect(vm.mapFolderOptionsToContent(['', '/dc1/vm', '/dc1/vm/folder1'])).toStrictEqual([
          { label: '\u00A0', value: '' },
          { label: '/dc1/vm', value: '/dc1/vm' },
          { label: '/dc1/vm/folder1', value: '/dc1/vm/folder1' },
        ]);
      });
    });

    describe('contentLibrary', () => {
      const contentLibraryOptions = ['', 'some-content-library'];

      it.each(['template', 'vm', 'legacy'])('should NOT add an error when the creation method is %p', (creationType) => {
        const wrapper = mount(vmwarevsphere, {
          ...defaultEditSetup,
          propsData: {
            ...defaultEditSetup.propsData,
            value: {
              ...defaultEditSetup.propsData.value, creationType, contentLibrary: 'unknown-library'
            }
          }
        });
        const vm = asVSphere(wrapper);

        vm.resetValueIfNecessary('contentLibrary', vm.mapPathOptionsToContent(contentLibraryOptions), contentLibraryOptions);

        expect(vm.validationErrors[poolId]).toBeUndefined();
      });

      it('should add an error when the creation method is "library"', () => {
        const wrapper = mount(vmwarevsphere, {
          ...defaultEditSetup,
          propsData: {
            ...defaultEditSetup.propsData,
            value: {
              ...defaultEditSetup.propsData.value, creationType: 'library', contentLibrary: 'unknown-library'
            }
          }
        });
        const vm = asVSphere(wrapper);

        vm.resetValueIfNecessary('contentLibrary', vm.mapPathOptionsToContent(contentLibraryOptions), contentLibraryOptions);

        expect(vm.validationErrors[poolId]).toStrictEqual(['contentLibrary']);
      });
    });
  });

  describe('manageErrors', () => {
    it('should remove only the given key from the pool errors', () => {
      const wrapper = mount(vmwarevsphere, defaultEditSetup);
      const vm = asVSphere(wrapper);

      vm.manageErrors('create', 'datastore');
      vm.manageErrors('create', 'folder');
      vm.manageErrors('delete', 'datastore');

      expect(vm.validationErrors[poolId]).toStrictEqual(['folder']);
    });

    it('should NOT add the same key twice', () => {
      const wrapper = mount(vmwarevsphere, defaultEditSetup);
      const vm = asVSphere(wrapper);

      vm.manageErrors('create', 'datastore');
      vm.manageErrors('create', 'datastore');

      expect(vm.validationErrors[poolId]).toStrictEqual(['datastore']);
    });
  });

  describe('datacenter without a leading slash', () => {
    const setupWithStore = (datacenter: string, dispatch: jest.Mock) => ({
      ...defaultEditSetup,
      propsData: {
        ...defaultEditSetup.propsData,
        value: { ...defaultEditSetup.propsData.value, datacenter }
      },
      global: {
        ...defaultEditSetup.global,
        mocks: {
          ...defaultEditSetup.global.mocks,
          $store: { getters: defaultGetters, dispatch }
        }
      }
    });

    const validCases: [string, string[]][] = [
      ['dc1', ['/dc1', '/dc2']],
      ['dc3', ['/dc1', '/folder1/dc3']],
      ['folder1/dc3', ['/dc1', '/folder1/dc3']],
    ];

    it.each(validCases)('should NOT add an error for datacenter %p when the options are %p', async(datacenter, options) => {
      const dispatch = jest.fn().mockResolvedValue({ data: options });
      const vm = asVSphere(mount(vmwarevsphere, setupWithStore(datacenter, dispatch)));

      await vm.loadDataCenters();

      expect(vm.validationErrors[poolId]).toBeUndefined();
    });

    it('should select the datacenter option without changing the saved value', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: ['/dc1', '/folder1/dc3'] });
      const vm = asVSphere(mount(vmwarevsphere, setupWithStore('dc3', dispatch)));

      await vm.loadDataCenters();

      expect(vm.dataCentersResults).toStrictEqual([
        { label: '/dc1', value: '/dc1' },
        { label: '/folder1/dc3', value: 'dc3' },
      ]);
    });

    const invalidCases: [string, string[]][] = [
      ['dc1', ['/dc1', '/folder1/dc1']],
      ['dc3', ['/dc1', '/dc2']],
      ['dc3', ['/dc1', '/folder1/folder2/dc3/other']],
    ];

    it.each(invalidCases)('should add an error for datacenter %p when the options are %p', async(datacenter, options) => {
      const dispatch = jest.fn().mockResolvedValue({ data: options });
      const vm = asVSphere(mount(vmwarevsphere, setupWithStore(datacenter, dispatch)));

      await vm.loadDataCenters();

      expect(vm.validationErrors[poolId]).toStrictEqual(['datacenter']);
    });

    it('should request datacenter resources with the full datacenter path', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: [] });
      const vm = asVSphere(mount(vmwarevsphere, setupWithStore('dc3', dispatch)));

      vm.dataCentersResults = vm.mapPathOptionsToContent(['/dc1', '/folder1/dc3']);
      await vm.loadDataStores();

      expect(dispatch).toHaveBeenCalledWith('management/request', {
        url:                  '/meta/vsphere/data-stores?cloudCredentialId=credentialId&dataCenter=/folder1/dc3',
        redirectUnauthorized: false,
      }, { root: true });
    });

    it('should request datacenter resources with the saved datacenter when it is not found', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: [] });
      const vm = asVSphere(mount(vmwarevsphere, setupWithStore('unknown', dispatch)));

      vm.dataCentersResults = vm.mapPathOptionsToContent(['/dc1']);
      await vm.loadDataStores();

      expect(dispatch).toHaveBeenCalledWith('management/request', {
        url:                  '/meta/vsphere/data-stores?cloudCredentialId=credentialId&dataCenter=unknown',
        redirectUnauthorized: false,
      }, { root: true });
    });
  });

  describe('responses of earlier requests', () => {
    type Resolve = (data: string[]) => void;

    /**
     * Requests for the given resource stay pending until resolved by the test, other requests return no options
     */
    const setupWithPendingRequests = (resource: string, value: Record<string, unknown>) => {
      const pending: Resolve[] = [];
      const dispatch = jest.fn((_action: string, { url }: { url: string }) => {
        if (url.startsWith(`/meta/vsphere/${ resource }?`)) {
          return new Promise((resolve) => pending.push((data) => resolve({ data })));
        }

        return Promise.resolve({ data: [] });
      });
      const wrapper = mount(vmwarevsphere, {
        ...defaultEditSetup,
        propsData: {
          ...defaultEditSetup.propsData,
          value: { ...defaultEditSetup.propsData.value, ...value }
        },
        global: {
          ...defaultEditSetup.global,
          mocks: {
            ...defaultEditSetup.global.mocks,
            $store: { getters: defaultGetters, dispatch }
          }
        }
      });

      return { vm: asVSphere(wrapper), pending };
    };

    it('should NOT replace the options with the response of an earlier request', async() => {
      const { vm, pending } = setupWithPendingRequests('data-stores', { datacenter: '/dc1' });

      await flushPromises();

      const earlier = vm.loadDataStores();
      const later = vm.loadDataStores();
      const [resolveEarlier, resolveLater] = pending.slice(-2);

      resolveLater(['/dc1/datastore/new']);
      await later;
      resolveEarlier(['/dc1/datastore/old']);
      await earlier;

      expect(vm.dataStoresResults).toStrictEqual([{ label: '/dc1/datastore/new', value: '/dc1/datastore/new' }]);
    });

    it('should use the response of the latest request when the responses arrive in order', async() => {
      const { vm, pending } = setupWithPendingRequests('data-stores', { datacenter: '/dc1' });

      await flushPromises();

      const earlier = vm.loadDataStores();
      const later = vm.loadDataStores();
      const [resolveEarlier, resolveLater] = pending.slice(-2);

      resolveEarlier(['/dc1/datastore/old']);
      await earlier;
      resolveLater(['/dc1/datastore/new']);
      await later;

      expect(vm.dataStoresResults).toStrictEqual([{ label: '/dc1/datastore/new', value: '/dc1/datastore/new' }]);
    });

    it('should NOT show the library templates of a content library that is no longer selected', async() => {
      const { vm, pending } = setupWithPendingRequests('library-templates', {
        datacenter: '/dc1', creationType: 'library', contentLibrary: 'library1'
      });

      await flushPromises();

      const earlier = vm.loadLibraryTemplates();
      const resolveEarlier = pending[pending.length - 1];

      vm.value.contentLibrary = '';
      await vm.loadLibraryTemplates();
      resolveEarlier(['template1']);
      await earlier;

      expect(vm.libraryTemplatesResults).toBeNull();
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

      await asVSphere(wrapper).loadNetworks();
      await wrapper.vm.$nextTick();

      expect(asVSphere(wrapper).value.network).toStrictEqual([legacyName]);
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
