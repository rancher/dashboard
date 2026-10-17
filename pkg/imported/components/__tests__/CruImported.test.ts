import { SECTION_TYPE } from '@components/RcSection';
import { shallowMount } from '@vue/test-utils';
import CruImported from '@pkg/imported/components/CruImported.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT, OPERATION_ANNOTATIONS } from '@shell/config/labels-annotations';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { DAY_2_OPS_DEFAULT } from '@pkg/imported/util/shared';
import { SETTING } from '@shell/config/settings';
import { IMPORTED_DAY_2_OPS } from '@shell/config/features';

// The etcd snapshot form's S3Config imports provisioning shared.ts, which requires provider images that aren't available to jest
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({ RETENTION_DEFAULT: 5 }));

describe('cruImported component', () => {
  const defaultSetup = {
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':               (key: string) => key,
            'features/get':         () => false,
            'prefs/get':            () => [],
            currentStore:           () => 'rancher',
            'rancher/schemaFor':    jest.fn(),
            'management/schemaFor': jest.fn(),
          },
          dispatch: jest.fn().mockResolvedValue({}),
        },
        $route:      { query: {} },
        $fetchState: { pending: false }
      },
      stubs: {
        CruResource:             { template: '<div><slot></slot></div>' },
        RcSection:               { template: '<div><slot></slot></div>' },
        Banner:                  true,
        ClusterMembershipEditor: true,
        RcLabelsAndAnnotations:  true,
        Basics:                  true,
        RcACE:                   true,
        Checkbox:                true,
        SchedulingCustomization: true,
        RcKeyValue:              true,
        NameNsDescription:       true,
        Loading:                 true,
        'router-link':           true
      }
    },
    data: () => ({
      normanCluster: {
        name:                     '',
        annotations:              { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' },
        importedConfig:           { privateRegistryURL: null },
        localClusterAuthEndpoint: {}
      }
    })
  };

  // `CruImported.vue` is a plain JS SFC, so the `normanCluster` type vue-tsc infers from its
  // `data()` default has no `annotations` - they are seeded by the `data` override above.
  const normanAnnotations = (wrapper: { vm: { normanCluster: object } }): Record<string, string> => {
    return (wrapper.vm.normanCluster as { annotations: Record<string, string> }).annotations;
  };

  describe('networking tab visibility', () => {
    it('should show the networking tab when not in create mode, not RKE1, and not local', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(true);
    });

    describe('on import', () => {
      // Render translation args, so the global setting states in the banner can be asserted
      const t = (key: string, args?: Record<string, string>) => (args ? `${ key } ${ JSON.stringify(args) }` : key);

      const createImportWrapper = ({
        isLocal = false, dayTwoOpsFlagEnabled = true, versionManagementGlobalSetting = true, dayTwoOpsGlobalSetting = false
      } = {}) => shallowMount(CruImported, {
        ...defaultSetup,
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              getters: { ...defaultSetup.global.mocks.$store.getters, 'i18n/t': t }
            }
          }
        },
        props: {
          mode:  _CREATE,
          value: { isRke1: false, isLocal }
        },
        data: () => ({
          dayTwoOpsFlagEnabled, versionManagementGlobalSetting, dayTwoOpsGlobalSetting
        } as any),
      });

      it('should hide the version management and Day 2 Operations sections', () => {
        const wrapper = createImportWrapper();

        expect(wrapper.findComponent({ name: 'Basics' }).exists()).toBe(false);
        expect(wrapper.find('[data-testid="day-two-ops-accordion"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="etcd-config"]').exists()).toBe(false);
      });

      it.each([
        [true, false, 'imported.configureAfterImport.enabled', 'imported.configureAfterImport.disabled'],
        [false, true, 'imported.configureAfterImport.disabled', 'imported.configureAfterImport.enabled'],
      ])('should say how the global settings will set version management (%p) and Day 2 Operations (%p)', (versionManagementGlobalSetting, dayTwoOpsGlobalSetting, versionManagement, dayTwoOps) => {
        const wrapper = createImportWrapper({ versionManagementGlobalSetting, dayTwoOpsGlobalSetting });

        expect(wrapper.find('[data-testid="configure-after-import-banner"]').exists()).toBe(true);
        expect(wrapper.vm.configureAfterImportMessage).toBe(`imported.configureAfterImport.versionManagementAndDayTwoOps ${ JSON.stringify({ versionManagement, dayTwoOps }) }`);
      });

      it.each([
        [true, 'imported.configureAfterImport.enabled'],
        [false, 'imported.configureAfterImport.disabled'],
      ])('should only say the state once when both global settings are %p', (enabled, state) => {
        const wrapper = createImportWrapper({ versionManagementGlobalSetting: enabled, dayTwoOpsGlobalSetting: enabled });

        expect(wrapper.vm.configureAfterImportMessage).toBe(`imported.configureAfterImport.versionManagementAndDayTwoOpsSame ${ JSON.stringify({ state }) }`);
      });

      it.each([
        ['the day 2 ops feature is disabled', { dayTwoOpsFlagEnabled: false }],
      ])('should only mention version management when %s', (_, opts) => {
        const wrapper = createImportWrapper({ ...opts, versionManagementGlobalSetting: false });

        expect(wrapper.vm.configureAfterImportMessage).toBe(`imported.configureAfterImport.versionManagement ${ JSON.stringify({ versionManagement: 'imported.configureAfterImport.disabled' }) }`);
      });
    });

    describe('configure after import banner on edit', () => {
      const createEditWrapper = ({ isRke1 = false, isLocal = false, rke2Config = null as object | null } = {}) => shallowMount(CruImported, {
        ...defaultSetup,
        props: {
          mode:  _EDIT,
          value: {
            id: 'cluster-id', isRke1, isLocal, metadata: { namespace: 'fleet-default' }
          }
        },
        data: () => ({
          normanCluster: { ...defaultSetup.data().normanCluster, ...(rke2Config ? { rke2Config } : {}) },
          config:        rke2Config,
        } as any),
      });

      it('should show the banner while the cluster has no rke2Config/k3sConfig yet', () => {
        const wrapper = createEditWrapper();

        expect(wrapper.find('[data-testid="configure-after-import-banner"]').exists()).toBe(true);
        expect(wrapper.vm.configureAfterImportMessage).not.toBe('');
      });

      it('should not show the banner once the cluster has a rke2Config/k3sConfig', () => {
        const wrapper = createEditWrapper({ rke2Config: { kubernetesVersion: 'v1.33.5' } });

        expect(wrapper.find('[data-testid="configure-after-import-banner"]').exists()).toBe(false);
        expect(wrapper.vm.configureAfterImportMessage).toBe('');
      });

      it('should not show the banner for the local cluster, which has already been imported', () => {
        const wrapper = createEditWrapper({ isLocal: true });

        expect(wrapper.find('[data-testid="configure-after-import-banner"]').exists()).toBe(false);
        expect(wrapper.vm.configureAfterImportMessage).toBe('');
      });

      it('should still show version management for the local cluster without a rke2Config/k3sConfig (e.g. embedded K3s)', () => {
        const wrapper = createEditWrapper({ isLocal: true });

        expect(wrapper.vm.showVersionManagement).toBe(true);
        expect(wrapper.vm.showDayTwoOps).toBe(false);
      });

      it('should not show the banner for RKE1 clusters, which never get a rke2Config/k3sConfig', () => {
        const wrapper = createEditWrapper({ isRke1: true });

        expect(wrapper.find('[data-testid="configure-after-import-banner"]').exists()).toBe(false);
        expect(wrapper.vm.configureAfterImportMessage).toBe('');
      });
    });

    it('should hide the networking tab in create mode', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _CREATE,
          value: {
            isRke1:  false,
            isLocal: false,
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });

    it('should show the networking tab when not in create mode, not RKE1, is local, and enableNetworkPolicySupported is true', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             false,
            isRke2:            false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(true);
    });

    it('should hide the networking tab when not in create mode, not RKE1, is local, and enableNetworkPolicySupported is false', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             true,
            isRke2:            false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });

    it('should hide the networking tab for local RKE2 clusters detected via mgmt status provider', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             false,
            isRke2:            false,
            mgmt:              { status: { provider: 'rke2' } },
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });
    it('should hide the networking tab for local special RKE2 clusters detected via mgmt status provider', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             false,
            isRke2:            false,
            mgmt:              { status: { provider: 'rke2.windows' } },
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });
    it('should hide the networking tab for local K3s clusters', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             true,
            isRke2:            false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });

    it('should not display the RcACE component if cluster is local', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const ace = wrapper.findComponent({ name: 'RcACE' });

      expect(ace.exists()).toBe(false);
    });
    it('should display the RcACE component if cluster is not local', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const ace = wrapper.findComponent({ name: 'RcACE' });

      expect(ace.exists()).toBe(true);
    });
  });

  describe('day two ops', () => {
    it('should return default day two ops value when annotation is not set', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      delete normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED];

      expect(wrapper.vm.dayTwoOps).toBe(DAY_2_OPS_DEFAULT);
    });

    it('should return annotation value when day two ops annotation is set', () => {
      // The annotation is seeded via the `data` mount option (rather than mutated on `wrapper.vm`
      // post-mount) because `CruImported` now has a `setup()` (for `useClusterMembership`), and
      // `@vue/test-utils` routes `wrapper.vm.<dataProp>` reads/writes for setup()-bearing
      // components through a non-reactive fallback (see `createVMProxy` in
      // `@vue/test-utils/dist/vue-test-utils.cjs.js`), so a post-mount mutation via `wrapper.vm`
      // would never trigger the `dayTwoOps` computed to recompute.
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup,
        data: () => ({
          normanCluster: {
            ...defaultSetup.data().normanCluster,
            annotations: {
              ...defaultSetup.data().normanCluster.annotations,
              [OPERATION_ANNOTATIONS.ENABLED]: 'true'
            }
          }
        })
      });

      expect(wrapper.vm.dayTwoOps).toBe('true');
    });

    it('should set day two ops annotation', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      wrapper.vm.dayTwoOps = 'false';

      expect(normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED]).toBe('false');
    });

    it('should initialize day two ops settings from feature and global setting', async() => {
      const dispatch = jest.fn().mockResolvedValue({ enabled: true });
      const byId = jest.fn().mockReturnValue({ value: 'true' });
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              dispatch,
              getters: {
                ...defaultSetup.global.mocks.$store.getters,
                'management/byId': byId,
              }
            }
          }
        },
      });

      normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED] = 'true';

      await wrapper.vm.initDayTwoOps();

      expect(dispatch).toHaveBeenCalledWith('management/find', {
        type: MANAGEMENT.FEATURE,
        id:   IMPORTED_DAY_2_OPS
      });
      expect(byId).toHaveBeenCalledWith(MANAGEMENT.SETTING, SETTING.IMPORTED_CLUSTER_DAY2_OPS_DEFAULT);
      expect(wrapper.vm.dayTwoOpsFlagEnabled).toBe(true);
      expect(wrapper.vm.dayTwoOpsGlobalSetting).toBe(true);
      expect(wrapper.vm.dayTwoOpsOld).toBe('true');
    });

    it('should set day two ops feature flag to false when feature lookup fails', async() => {
      const dispatch = jest.fn().mockRejectedValue(new Error('not found'));
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              dispatch,
              getters: {
                ...defaultSetup.global.mocks.$store.getters,
                'management/byId': () => ({ value: 'false' }),
              }
            }
          }
        },
      });

      await wrapper.vm.initDayTwoOps();

      expect(wrapper.vm.dayTwoOpsFlagEnabled).toBe(false);
      expect(wrapper.vm.dayTwoOpsGlobalSetting).toBe(false);
      expect(wrapper.vm.dayTwoOpsOld).toBe(DAY_2_OPS_DEFAULT);
    });
  });

  describe('etcd snapshot config', () => {
    const ETCD = {
      disableSnapshots: false, snapshotScheduleCron: '0 */5 * * *', snapshotRetention: 5, s3: null
    };

    const CruResourceStub = {
      name:     'CruResource',
      props:    ['validationPassed'],
      template: '<div><slot></slot></div>',
    };

    const RcSectionStub = {
      name:     'RcSection',
      props:    ['title', 'type', 'mode', 'expandable', 'expanded'],
      template: '<div><slot></slot></div>',
    };

    const createWrapper = ({
      configKey = 'rke2Config', etcd = { ...ETCD } as object | null, isLocal = false, dayTwoOpsFlagEnabled = true, hasConfig = true, s3Backup = false, cloudCredentials = {},
      dayTwoOps = 'true', dayTwoOpsGlobalSetting = false, clusterHasEtcdConfig = true
    }: {
      configKey?: 'rke2Config' | 'k3sConfig', etcd?: object | null, isLocal?: boolean, dayTwoOpsFlagEnabled?: boolean, hasConfig?: boolean, s3Backup?: boolean,
      cloudCredentials?: Record<string, object>, dayTwoOps?: string, dayTwoOpsGlobalSetting?: boolean, clusterHasEtcdConfig?: boolean
    } = {}) => {
      const config = hasConfig ? { kubernetesVersion: 'v1.33.5', ...(etcd ? { etcd } : {}) } : null;
      const defaultNormanCluster = defaultSetup.data().normanCluster;
      const normanCluster = {
        ...defaultNormanCluster,
        annotations: { ...defaultNormanCluster.annotations, [OPERATION_ANNOTATIONS.ENABLED]: dayTwoOps },
        ...(config ? { [configKey]: config } : {}),
        save:        jest.fn(),
      };

      return shallowMount(CruImported, {
        ...defaultSetup,
        props: {
          mode:  _EDIT,
          value: {
            id: 'c-abc', isRke1: false, isLocal, metadata: { namespace: 'fleet-default' }
          }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              getters: {
                ...defaultSetup.global.mocks.$store.getters,
                'rancher/byId': (_type: string, id: string) => (cloudCredentials[id] ? { decodedData: cloudCredentials[id] } : undefined),
              }
            }
          },
          stubs: {
            ...defaultSetup.global.stubs,
            CruResource:    CruResourceStub,
            RcSection:      RcSectionStub,
            RcContentGroup: { name: 'RcContentGroup', template: '<div><slot></slot></div>' },
          }
        },
        // `config` must be the same object as normanCluster.<rke2|k3s>Config, as set up in fetch()
        data: () => ({
          normanCluster, config, dayTwoOpsFlagEnabled, s3Backup, dayTwoOpsGlobalSetting, clusterHasEtcdConfig
        } as any),
      });
    };

    const etcdForm = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findComponent({ name: 'RcEtcdSnapshotConfig' });

    describe('version management section', () => {
      const versionManagementSection = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findAllComponents(RcSectionStub).find((s) => s.findComponent({ name: 'Basics' }).exists() && s.props('type') === SECTION_TYPE.PRIMARY);

      it('should render Basics in a primary section titled Version Management', () => {
        const wrapper = createWrapper();
        const section = versionManagementSection(wrapper);

        expect(section?.props('title')).toBe('imported.basics.versionManagement.title');
        expect(section?.props('expanded')).toBe(true);
      });

      it('should hide the version management section when the cluster has no rke2Config/k3sConfig, even with the version management annotation', () => {
        const wrapper = createWrapper({ hasConfig: false });

        expect((wrapper.vm.normanCluster as any).annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT]).toBe('system-default');
        expect(wrapper.findComponent({ name: 'Basics' }).exists()).toBe(false);
      });
    });

    describe('day 2 operations section', () => {
      const dayTwoOpsSection = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findAllComponents(RcSectionStub).find((s) => s.attributes('data-testid') === 'day-two-ops-accordion');

      it('should render Day 2 Operations as its own expanded primary section', () => {
        const wrapper = createWrapper();
        const section = dayTwoOpsSection(wrapper);

        expect(section?.props('type')).toBe(SECTION_TYPE.PRIMARY);
        expect(section?.props('title')).toBe('imported.basics.dayTwoOpsEnabled.title');
        expect(section?.props('expanded')).toBe(true);
        expect(section?.findComponent({ name: 'DayTwoOps' }).exists()).toBe(true);
      });

      it('should render etcd as an untitled content group inside the Day 2 Operations section, not as its own section', () => {
        const wrapper = createWrapper();
        const section = dayTwoOpsSection(wrapper);

        expect(section?.find('[data-testid="etcd-config"]').findComponent({ name: 'RcEtcdSnapshotConfig' }).exists()).toBe(true);
        expect(section?.findAllComponents(RcSectionStub)).toHaveLength(0);
      });

      it('should hide the Day 2 Operations section when the cluster has no rke2Config/k3sConfig', () => {
        const wrapper = createWrapper({ hasConfig: false });

        expect(wrapper.find('[data-testid="day-two-ops-accordion"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="etcd-config"]').exists()).toBe(false);
      });

      it.each([
        ['an RKE1 cluster', { isRke1: true }],
        ['import', { mode: _CREATE }],
      ])('should hide both sections for %s, which have no rke2Config/k3sConfig', (_, value) => {
        const wrapper = shallowMount(CruImported, {
          ...defaultSetup,
          props: {
            mode:  _EDIT,
            ...('mode' in value ? { mode: value.mode } : {}),
            value: {
              id: 'c-abc', isRke1: false, isLocal: false, metadata: { namespace: 'fleet-default' }, ...value
            }
          },
          data: () => ({ dayTwoOpsFlagEnabled: true } as any),
        });

        expect(wrapper.findComponent({ name: 'Basics' }).exists()).toBe(false);
        expect(wrapper.find('[data-testid="day-two-ops-accordion"]').exists()).toBe(false);
      });

      it.each([
        ['the day 2 ops feature is disabled', { dayTwoOpsFlagEnabled: false }],
        ['the cluster is local', { isLocal: true }],
      ])('should hide the Day 2 Operations section when %s', (_, opts) => {
        const wrapper = createWrapper(opts);

        expect(wrapper.find('[data-testid="day-two-ops-accordion"]').exists()).toBe(false);
      });

      it('should update dayTwoOps when the Day 2 Operations setting changes', async() => {
        const wrapper = createWrapper();

        wrapper.findComponent({ name: 'DayTwoOps' }).vm.$emit('update:value', 'false');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.dayTwoOps).toBe('false');
      });
    });

    it('should show the etcd section for an imported RKE2/K3s cluster when the day 2 ops feature is enabled', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="etcd-config"]').exists()).toBe(true);
      expect(etcdForm(wrapper).props('value')).toStrictEqual(ETCD);
      expect(etcdForm(wrapper).props('namespace')).toBe('fleet-default');
      expect(etcdForm(wrapper).props('mode')).toBe(_EDIT);
    });

    it.each([
      ['the day 2 ops feature is disabled', { dayTwoOpsFlagEnabled: false }],
      ['the cluster is local', { isLocal: true }],
      ['the cluster has no rke2Config/k3sConfig', { hasConfig: false }],
    ])('should hide the etcd section when %s', (_, opts) => {
      const wrapper = createWrapper(opts);

      expect(wrapper.find('[data-testid="etcd-config"]').exists()).toBe(false);
      expect(etcdForm(wrapper).exists()).toBe(false);
    });

    it.each([
      ['rke2Config' as const],
      ['k3sConfig' as const],
    ])('should write etcd changes to normanCluster.%s.etcd and save them', async(configKey) => {
      const wrapper = createWrapper({ configKey });
      const normanCluster = wrapper.vm.normanCluster as any;
      const neu = { ...ETCD, snapshotScheduleCron: '0 1 * * *' };

      etcdForm(wrapper).vm.$emit('update:value', neu);
      await wrapper.vm.actuallySave();

      expect(normanCluster[configKey].etcd).toStrictEqual(neu);
      expect(normanCluster.save).toHaveBeenCalledWith({ replace: false });
    });

    it('should create the etcd config when the cluster had none', () => {
      const wrapper = createWrapper({ etcd: null });
      const normanCluster = wrapper.vm.normanCluster as any;

      expect(etcdForm(wrapper).props('value')).toBeNull();

      etcdForm(wrapper).vm.$emit('update:value', { snapshotRetention: 3 });

      expect(normanCluster.rke2Config.etcd).toStrictEqual({ snapshotRetention: 3 });
      expect(normanCluster.rke2Config.kubernetesVersion).toBe('v1.33.5');
    });

    it('should track the s3 backup toggle', async() => {
      const wrapper = createWrapper();

      etcdForm(wrapper).vm.$emit('s3-backup-changed', true);
      await wrapper.vm.$nextTick();

      expect(etcdForm(wrapper).props('s3Backup')).toBe(true);
    });

    it('should block saving while the etcd config is invalid', async() => {
      const wrapper = createWrapper();
      const cruResource = wrapper.findComponent(CruResourceStub);

      etcdForm(wrapper).vm.$emit('validation-changed', false);
      await wrapper.vm.$nextTick();
      expect(cruResource.props('validationPassed')).toBe(false);

      etcdForm(wrapper).vm.$emit('validation-changed', true);
      await wrapper.vm.$nextTick();
      expect(cruResource.props('validationPassed')).toBe(true);
    });

    it('should ignore the etcd validation state when the etcd section is hidden', async() => {
      const wrapper = createWrapper({ dayTwoOpsFlagEnabled: false });

      await wrapper.setData({ etcdConfigValid: false });

      expect(wrapper.findComponent(CruResourceStub).props('validationPassed')).toBe(true);
    });

    it.each([
      ['an s3 bucket is configured', { ...ETCD, s3: { bucket: 'my-bucket' } }, true],
      ['the s3 config has no bucket, as the cloud credential provides a default bucket', { ...ETCD, s3: { cloudCredentialName: 'cattle-global-data:cc-1' } }, true],
      ['no s3 config is set', ETCD, false],
      ['the s3 config is missing', { ...ETCD, s3: undefined }, false],
    ])('should initialise the s3 backup toggle on fetch when %s', async(_, etcd, expected) => {
      const liveNormanCluster = { rke2Config: { etcd }, annotations: { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' } };
      const dispatch = jest.fn((action: string) => Promise.resolve(action === 'rancher/clone' ? liveNormanCluster : {}));
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        props: {
          mode:  _EDIT,
          value: {
            id: 'c-abc', isRke1: true, isLocal: true, findNormanCluster: jest.fn().mockResolvedValue(liveNormanCluster)
          }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: { ...defaultSetup.global.mocks.$store, dispatch }
          }
        },
      });

      await (CruImported as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.s3Backup).toBe(expected);
    });

    describe('when day 2 ops are disabled for the cluster', () => {
      type DayTwoOpsOpts = { dayTwoOps: string, dayTwoOpsGlobalSetting?: boolean };

      const DISABLED_CASES: [string, DayTwoOpsOpts][] = [
        ['disabled for the cluster', { dayTwoOps: 'false', dayTwoOpsGlobalSetting: true }],
        ['left to a disabled global default', { dayTwoOps: DAY_2_OPS_DEFAULT, dayTwoOpsGlobalSetting: false }],
      ];
      const VISIBILITY_CASES: [string, DayTwoOpsOpts, boolean][] = [
        ['enabled for the cluster', { dayTwoOps: 'true' }, true],
        ['left to an enabled global default', { dayTwoOps: DAY_2_OPS_DEFAULT, dayTwoOpsGlobalSetting: true }, true],
        ...DISABLED_CASES.map(([name, opts]): [string, DayTwoOpsOpts, boolean] => [name, opts, false]),
      ];

      it.each(VISIBILITY_CASES)('should only show the etcd and s3 config when day 2 ops are %s', (_, opts, enabled) => {
        const wrapper = createWrapper(opts);

        expect(wrapper.vm.dayTwoOpsEnabled).toBe(enabled);
        expect(wrapper.find('[data-testid="etcd-config"]').exists()).toBe(enabled);
        expect(etcdForm(wrapper).exists()).toBe(enabled);
        // the day 2 ops setting itself is still shown, so they can be enabled
        expect(wrapper.findComponent({ name: 'DayTwoOps' }).exists()).toBe(true);
      });

      it.each(DISABLED_CASES)('should unset the etcd config on save when day 2 ops are %s', async(_, opts) => {
        const wrapper = createWrapper({
          ...opts, etcd: { ...ETCD, s3: { bucket: 'my-bucket' } }, s3Backup: true
        });
        const normanCluster = wrapper.vm.normanCluster as any;

        await wrapper.vm.actuallySave();

        expect('etcd' in normanCluster.rke2Config).toBe(false);
        expect(normanCluster.rke2Config.kubernetesVersion).toBe('v1.33.5');
        expect(normanCluster.save).toHaveBeenCalledWith({ replace: true });
      });

      it('should keep the etcd config, and not replace, on save when day 2 ops are enabled', async() => {
        const wrapper = createWrapper({ dayTwoOps: 'true' });
        const normanCluster = wrapper.vm.normanCluster as any;

        await wrapper.vm.actuallySave();

        expect(normanCluster.rke2Config.etcd).toStrictEqual(ETCD);
        expect(normanCluster.save).toHaveBeenCalledWith({ replace: false });
      });

      it('should drop the etcd config without a replace on save, when the cluster had no etcd config', async() => {
        const wrapper = createWrapper({ dayTwoOps: 'false', clusterHasEtcdConfig: false });
        const normanCluster = wrapper.vm.normanCluster as any;

        await wrapper.vm.actuallySave();

        expect('etcd' in normanCluster.rke2Config).toBe(false);
        expect(normanCluster.save).toHaveBeenCalledWith({ replace: false });
      });

      it('should not replace on save when day 2 ops are disabled and there is no etcd config to unset', async() => {
        const wrapper = createWrapper({ dayTwoOps: 'false', etcd: null });
        const normanCluster = wrapper.vm.normanCluster as any;

        await wrapper.vm.actuallySave();

        expect(normanCluster.save).toHaveBeenCalledWith({ replace: false });
      });

      it('should not block saving an invalid etcd or s3 config, as it is hidden and unset', () => {
        const wrapper = createWrapper({
          dayTwoOps: 'false', etcd: { ...ETCD, s3: {} }, s3Backup: true
        });

        expect(wrapper.vm.s3ConfigValid).toBe(true);
        expect(wrapper.findComponent(CruResourceStub).props('validationPassed')).toBe(true);
      });
    });

    describe('s3 config validation, while RcS3Config may not be rendered (collapsed sections)', () => {
      const CREDENTIAL = 'cattle-global-data:cc-1';
      const withS3 = (s3: object) => ({ ...ETCD, s3 });

      it.each([
        ['a bucket is set', withS3({ bucket: 'my-bucket' }), {}, true],
        ['no bucket is set, but the credential provides a default bucket', withS3({ cloudCredentialName: CREDENTIAL }), { [CREDENTIAL]: { defaultBucket: 'cred-bucket' } }, true],
        ['no bucket is set, and the credential has no default bucket', withS3({ cloudCredentialName: CREDENTIAL }), { [CREDENTIAL]: {} }, false],
        ['no bucket is set, and the credential is not loaded', withS3({ cloudCredentialName: CREDENTIAL }), {}, false],
        ['the s3 config is empty', withS3({}), {}, false],
        ['the endpoint is invalid', withS3({ bucket: 'my-bucket', endpoint: 'https://s3.example.com' }), {}, false],
        ['the endpoint is valid', withS3({ bucket: 'my-bucket', endpoint: 's3.example.com' }), {}, true],
      ])('should validate the s3 config when %s', (_, etcd, cloudCredentials, valid) => {
        const wrapper = createWrapper({
          etcd, s3Backup: true, cloudCredentials
        });

        expect(wrapper.vm.s3ConfigValid).toBe(valid);
        expect(wrapper.findComponent(CruResourceStub).props('validationPassed')).toBe(valid);
      });

      it('should block saving an invalid s3 config even though the etcd config last reported as valid', () => {
        const wrapper = createWrapper({ etcd: withS3({}), s3Backup: true });

        expect(wrapper.vm.etcdConfigValid).toBe(true);
        expect(wrapper.findComponent(CruResourceStub).props('validationPassed')).toBe(false);
      });

      it.each([
        ['s3 backups are disabled', { etcd: withS3({}), s3Backup: false }],
        ['day 2 ops are not shown', {
          etcd: withS3({}), s3Backup: true, dayTwoOpsFlagEnabled: false
        }],
      ])('should not validate the s3 config when %s', (_, opts) => {
        const wrapper = createWrapper(opts);

        expect(wrapper.vm.s3ConfigValid).toBe(true);
      });
    });

    describe('etcd config on fetch', () => {
      const fetchWith = async(etcd: object | undefined) => {
        const liveNormanCluster = { rke2Config: { kubernetesVersion: 'v1.33.5', ...(etcd ? { etcd } : {}) }, annotations: { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' } };
        const dispatch = jest.fn((action: string) => Promise.resolve(action === 'rancher/clone' ? liveNormanCluster : {}));
        const wrapper = shallowMount(CruImported, {
          ...defaultSetup,
          props: {
            mode:  _EDIT,
            value: {
              id: 'c-abc', isRke1: true, isLocal: true, findNormanCluster: jest.fn().mockResolvedValue(liveNormanCluster)
            }
          },
          global: {
            ...defaultSetup.global,
            mocks: {
              ...defaultSetup.global.mocks,
              $store: { ...defaultSetup.global.mocks.$store, dispatch }
            }
          },
        });

        await (CruImported as any).fetch.call(wrapper.vm);

        return wrapper;
      };

      it.each([
        ['has no etcd config', undefined],
        ['has an empty etcd config', {}],
        ['has an etcd config with only zero values', {
          disableSnapshots: false, snapshotRetention: 0, snapshotScheduleCron: '', s3: null
        }],
      ])('should leave the etcd config unset, so the cluster keeps its own settings, when the cluster %s', async(_, etcd) => {
        const wrapper = await fetchWith(etcd);

        expect((wrapper.vm as any).normanCluster.rke2Config.etcd).toStrictEqual(etcd);
        expect(wrapper.vm.clusterHasEtcdConfig).toBe(false);
      });

      it.each([
        ['a schedule', { snapshotScheduleCron: '0 1 * * *' }],
        ['a retention', { snapshotRetention: 3 }],
        ['snapshots disabled', { disableSnapshots: true }],
        ['an s3 config', { s3: { bucket: 'my-bucket' } }],
      ])('should keep the cluster etcd config, and note that it has one, when it has %s', async(_, etcd) => {
        const wrapper = await fetchWith(etcd);

        expect((wrapper.vm as any).config.etcd).toStrictEqual(etcd);
        expect(wrapper.vm.clusterHasEtcdConfig).toBe(true);
      });
    });

    it.each([
      ['has a cloud credential', { bucket: '', cloudCredentialName: 'cattle-global-data:cc-1' }, true],
      ['has no cloud credential', { bucket: 'my-bucket' }, false],
    ])('should load the s3 cloud credential on fetch when the s3 config %s', async(_, s3, loaded) => {
      const liveNormanCluster = { rke2Config: { etcd: { ...ETCD, s3 } }, annotations: { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' } };
      const dispatch = jest.fn((action: string) => Promise.resolve(action === 'rancher/clone' ? liveNormanCluster : {}));
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        props: {
          mode:  _EDIT,
          value: {
            id: 'c-abc', isRke1: true, isLocal: true, findNormanCluster: jest.fn().mockResolvedValue(liveNormanCluster)
          }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: { ...defaultSetup.global.mocks.$store, dispatch }
          }
        },
      });

      dispatch.mockClear();
      await (CruImported as any).fetch.call(wrapper.vm);

      const findCredential = dispatch.mock.calls.find(([action]) => action === 'rancher/find') as unknown[] | undefined;

      expect(findCredential?.[1]).toStrictEqual(loaded ? { type: NORMAN.CLOUD_CREDENTIAL, id: 'cattle-global-data:cc-1' } : undefined);
    });
  });
});
