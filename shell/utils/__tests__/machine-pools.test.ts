import jsyaml from 'js-yaml';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { saferDump } from '@shell/utils/create-yaml';
import { toEditorYaml } from '@shell/utils/related-resources/yaml';
import {
  GOOGLE,
  isElementalMachinePool,
  MachinePoolEntry,
  machinePoolStoreFor,
  saveMachineConfigYaml,
  saveMachinePool,
  syncMachineConfigWithLatest,
} from '@shell/utils/machine-pools';

jest.mock('@shell/plugins/dashboard-store/normalize', () => ({ handleConflict: jest.fn() }));

const mockedHandleConflict = handleConflict as jest.Mock;

const CONFIG_TYPE = 'rke-machine-config.cattle.io.amazonec2config';

/**
 * A root store: `management/request` resolves to `latest`, `management/create` to a copy of what it
 * is given
 */
const rootStore = (latest: any = {}) => ({
  dispatch: jest.fn((type: string, payload: any) => Promise.resolve(type === 'management/request' ? latest : { ...payload })),
  getters:  { 'i18n/t': jest.fn((key: string, args: any) => `${ key } ${ JSON.stringify(args) }`) },
});

/** A machine config model, whose `save` resolves to `saved` */
const machineConfig = (data: any = {}, saved: any = { metadata: { name: 'nc-saved' } }) => ({
  type:     CONFIG_TYPE,
  metadata: {},
  ...data,
  save:     jest.fn(() => Promise.resolve(saved)),
});

const poolEntry = (entry: Partial<MachinePoolEntry> = {}): MachinePoolEntry => ({
  pool:   { name: 'pool1', machineConfigRef: { kind: 'Amazonec2Config', name: '' } },
  config: machineConfig(),
  ...entry,
});

describe('utils: machine-pools', () => {
  beforeEach(() => {
    mockedHandleConflict.mockReset();
    mockedHandleConflict.mockResolvedValue(false);
  });

  describe('syncMachineConfigWithLatest', () => {
    it('should do nothing for a machine config that does not exist yet', async() => {
      const store = rootStore();

      await syncMachineConfigWithLatest(machineConfig(), {}, store);

      expect(store.dispatch).toHaveBeenCalledTimes(0);
      expect(mockedHandleConflict).toHaveBeenCalledTimes(0);
    });

    it('should fetch the latest machine config through `management/request`, so the store keeps the one being edited', async() => {
      const store = rootStore();

      await syncMachineConfigWithLatest(machineConfig({ id: 'fleet-default/nc-pool1' }), {}, store);

      expect(store.dispatch).toHaveBeenCalledWith('management/request', { url: `/v1/${ CONFIG_TYPE }s/fleet-default/nc-pool1` });
    });

    it('should merge the changes made on the server since `initialConfig` into the machine config', async() => {
      const latest = { id: 'fleet-default/nc-pool1', instanceType: 't3.large' };
      const initialConfig = { id: 'fleet-default/nc-pool1', instanceType: 't3.medium' };
      const config = machineConfig({ id: 'fleet-default/nc-pool1' });
      const store = rootStore(latest);

      await syncMachineConfigWithLatest(config, initialConfig, store);

      expect(mockedHandleConflict).toHaveBeenCalledWith(initialConfig, config, latest, { dispatch: store.dispatch, getters: store.getters }, 'management');
    });

    it('should merge against an empty machine config when there is no `initialConfig`', async() => {
      const store = rootStore();

      await syncMachineConfigWithLatest(machineConfig({ id: 'fleet-default/nc-pool1' }), undefined, store);

      expect(store.dispatch).toHaveBeenCalledWith('management/create', {});
      expect(mockedHandleConflict.mock.calls[0][0]).toStrictEqual({});
    });

    it('should throw the conflicts when the server and the machine config changed the same field', async() => {
      mockedHandleConflict.mockResolvedValue(['Conflicting field: instanceType']);

      await expect(syncMachineConfigWithLatest(machineConfig({ id: 'fleet-default/nc-pool1' }), {}, rootStore())).rejects.toThrow('Conflicting field: instanceType');
    });
  });

  describe('saveMachinePool', () => {
    const options = (extra: any = {}) => ({
      store: rootStore(), clusterName: 'demo', ...extra
    });

    it.each([
      ['  Worker Pool ', 'worker-pool'],
      ['--edge--', 'edge'],
      ['', 'pool'],
      [undefined, 'pool'],
    ])('should normalize the pool name %p to %p', async(name, expected) => {
      const entry = poolEntry({ pool: { name, machineConfigRef: { name: '' } } });

      await saveMachinePool(entry, options());

      expect(entry.pool.name).toBe(expected);
    });

    describe('a machine config that does not exist yet', () => {
      it('should save it with a generated name prefixed by the cluster and pool names', async() => {
        const entry = poolEntry({ create: true });
        const config = entry.config;

        await saveMachinePool(entry, options());

        expect(config.metadata.generateName).toBe('nc-demo-pool1-');
        expect(config.save).toHaveBeenCalledWith();
      });

      it('should limit the generated name prefix to 50 characters, in lower case', async() => {
        const entry = poolEntry({ create: true });
        const config = entry.config;
        const clusterName = 'A'.repeat(60);

        await saveMachinePool(entry, options({ clusterName }));

        expect(config.metadata.generateName).toBe(`nc-${ 'a'.repeat(50) }-`);
      });

      it('should keep a name the machine config already has', async() => {
        const entry = poolEntry({ create: true, config: machineConfig({ metadata: { name: 'chosen' } }) });
        const config = entry.config;

        await saveMachinePool(entry, options());

        expect(config.metadata).toStrictEqual({ name: 'chosen' });
      });

      it('should point the pool at the saved machine config and mark the entry as existing', async() => {
        const saved = { metadata: { name: 'nc-demo-pool1-x7k2p' } };
        const entry = poolEntry({ create: true, config: machineConfig({}, saved) });

        await saveMachinePool(entry, options());

        expect(entry.config).toBe(saved);
        expect(entry.pool.machineConfigRef.name).toBe('nc-demo-pool1-x7k2p');
        expect(entry.create).toBe(false);
        expect(entry.update).toBe(true);
      });
    });

    it('should save a machine config that exists, and keep the saved copy', async() => {
      const saved = { metadata: { name: 'nc-existing' } };
      const entry = poolEntry({ update: true, config: machineConfig({ metadata: { name: 'nc-existing' } }, saved) });
      const config = entry.config;

      await saveMachinePool(entry, options());

      expect(config.save).toHaveBeenCalledWith();
      expect(entry.config).toBe(saved);
    });

    it('should not save a machine config that is neither new nor existing', async() => {
      const entry = poolEntry();

      await saveMachinePool(entry, options());

      expect(entry.config.save).toHaveBeenCalledTimes(0);
    });

    it('should merge the changes made on the server before saving, and save nothing when they conflict', async() => {
      mockedHandleConflict.mockResolvedValue(['Conflicting field: instanceType']);

      const entry = poolEntry({ update: true, config: machineConfig({ id: 'fleet-default/nc-existing' }) });
      const config = entry.config;

      await expect(saveMachinePool(entry, options({ initialConfig: { id: 'fleet-default/nc-existing' } }))).rejects.toThrow('Conflicting field: instanceType');
      expect(config.save).toHaveBeenCalledTimes(0);
    });

    describe('google firewall rule prefixes', () => {
      it('should set the prefixes the google form asks for, from the cluster and pool names', async() => {
        const entry = poolEntry({ update: true, config: machineConfig({ setInternalFirewallRulePrefix: true, setExternalFirewallRulePrefix: true }) });
        const config = entry.config;

        await saveMachinePool(entry, options({ provider: GOOGLE }));

        expect(config.internalFirewallRulePrefix).toBe('demo');
        expect(config.externalFirewallRulePrefix).toBe('demo-pool1');
      });

      it('should remove the prefixes the google form does not ask for', async() => {
        const entry = poolEntry({ update: true, config: machineConfig({ internalFirewallRulePrefix: 'old', externalFirewallRulePrefix: 'old-pool1' }) });
        const config = entry.config;

        await saveMachinePool(entry, options({ provider: GOOGLE }));

        expect(config).not.toHaveProperty('internalFirewallRulePrefix');
        expect(config).not.toHaveProperty('externalFirewallRulePrefix');
      });

      it('should remove the checkboxes of the google form, which are not fields of the machine config', async() => {
        const entry = poolEntry({ update: true, config: machineConfig({ setInternalFirewallRulePrefix: false, setExternalFirewallRulePrefix: true }) });
        const config = entry.config;

        await saveMachinePool(entry, options({ provider: GOOGLE }));

        expect(config).not.toHaveProperty('setInternalFirewallRulePrefix');
        expect(config).not.toHaveProperty('setExternalFirewallRulePrefix');
      });

      it('should leave the prefixes of a machine config of another provider as they are', async() => {
        const entry = poolEntry({ update: true, config: machineConfig({ internalFirewallRulePrefix: 'kept', setInternalFirewallRulePrefix: false }) });
        const config = entry.config;

        await saveMachinePool(entry, options());

        expect(config.internalFirewallRulePrefix).toBe('kept');
        expect(config.setInternalFirewallRulePrefix).toBe(false);
      });
    });

    describe('elemental clusters', () => {
      it('should give the pool a hostname prefix from the cluster and pool names', async() => {
        const entry = poolEntry();

        await saveMachinePool(entry, options({ isElementalCluster: true }));

        expect(entry.pool.hostnamePrefix).toBe('demo-pool1-');
      });

      it('should keep a hostname prefix the pool already has', async() => {
        const entry = poolEntry({
          pool: {
            name: 'pool1', hostnamePrefix: 'custom-', machineConfigRef: { name: '' }
          }
        });

        await saveMachinePool(entry, options({ isElementalCluster: true }));

        expect(entry.pool.hostnamePrefix).toBe('custom-');
      });

      it('should not give the pool of another cluster a hostname prefix', async() => {
        const entry = poolEntry();

        await saveMachinePool(entry, options());

        expect(entry.pool).not.toHaveProperty('hostnamePrefix');
      });
    });
  });

  describe('machinePoolStoreFor', () => {
    it('should send every dispatch to the root of the store of the resource', async() => {
      const resource = { $dispatch: jest.fn(() => Promise.resolve('done')), $rootGetters: { root: true } };
      const store = machinePoolStoreFor(resource);

      expect(await store.dispatch('management/find', { id: 'a' }, { force: true })).toBe('done');
      expect(resource.$dispatch).toHaveBeenCalledWith('management/find', { id: 'a' }, { force: true, root: true });
    });

    it('should use the root getters of the resource', () => {
      const resource = { $dispatch: jest.fn(), $rootGetters: { root: true } };

      expect(machinePoolStoreFor(resource).getters).toBe(resource.$rootGetters);
    });
  });

  describe('isElementalMachinePool', () => {
    it.each([
      [{ machineConfigRef: { kind: 'MachineInventorySelectorTemplate' } }, true],
      [{ machineConfigRef: { kind: 'Amazonec2Config' } }, false],
      [{}, false],
      [undefined, false],
    ])('should read the pool %p as %p', (pool, expected) => {
      expect(isElementalMachinePool(pool)).toBe(expected);
    });
  });

  describe('saveMachineConfigYaml', () => {
    const CLUSTER_ID = 'provisioning.cattle.io.cluster:fleet-default/demo';
    const CONFIG_ID = `${ CONFIG_TYPE }:fleet-default/nc-pool1`;

    const configData = {
      type: CONFIG_TYPE, metadata: { name: 'nc-pool1', namespace: 'fleet-default' }, instanceType: 't3.medium'
    };
    const clusterData = (configName = 'nc-pool1') => ({
      metadata: { name: 'demo', namespace: 'fleet-default' },
      spec:     {
        rkeConfig: {
          machinePools: [{
            name: 'pool1', quantity: 1, machineConfigRef: { kind: 'Amazonec2Config', name: configName }
          }]
        }
      },
    });

    /** The context of the machine config's entry, with the cluster as the primary resource */
    const context = ({ editedConfig, editedCluster }: { editedConfig?: string, editedCluster?: string } = {}): any => ({
      resource:        configData,
      primaryResource: clusterData(),
      nodeId:          CONFIG_ID,
      primaryNodeId:   CLUSTER_ID,
      editorState:     {
        selected: CONFIG_ID,
        yaml:     {
          ...(editedConfig ? { [CONFIG_ID]: editedConfig } : {}),
          ...(editedCluster ? { [CLUSTER_ID]: editedCluster } : {}),
        },
      },
      initialYaml: { [CONFIG_ID]: toEditorYaml(configData), [CLUSTER_ID]: saferDump(clusterData()) },
    });

    // a save that leaves the machine config's name as it is
    const keepName = jest.fn(() => Promise.resolve());

    it('should save the machine config yaml in the editor, falling back to the yaml it was loaded with', async() => {
      const store = rootStore();
      const edited = toEditorYaml({ ...configData, instanceType: 't3.large' });

      await saveMachineConfigYaml(context({ editedConfig: edited }), store, keepName);
      await saveMachineConfigYaml(context(), store, keepName);

      expect(store.dispatch).toHaveBeenNthCalledWith(1, 'management/create', { ...configData, instanceType: 't3.large' });
      expect(store.dispatch).toHaveBeenNthCalledWith(2, 'management/create', configData);
    });

    it('should save the pool that references the machine config, with the name of the cluster', async() => {
      const savePool = jest.fn(() => Promise.resolve());

      await saveMachineConfigYaml(context(), rootStore(), savePool);

      expect(savePool).toHaveBeenCalledWith({
        pool: clusterData().spec.rkeConfig.machinePools[0], config: configData, update: true
      }, 'demo');
    });

    it('should find the pool by the name the machine config was loaded with, when the yaml renames it', async() => {
      const savePool = jest.fn(() => Promise.resolve());
      const renamed = toEditorYaml({ ...configData, metadata: { ...configData.metadata, name: 'renamed' } });

      await saveMachineConfigYaml(context({ editedConfig: renamed }), rootStore(), savePool);

      expect((savePool.mock.calls[0] as any[])[0].pool.name).toBe('pool1');
    });

    it('should use the name of the saved cluster when the cluster yaml in the editor has none', async() => {
      const savePool = jest.fn(() => Promise.resolve());
      const { metadata, ...nameless } = clusterData();

      await saveMachineConfigYaml(context({ editedCluster: saferDump(nameless) }), rootStore(), savePool);

      expect((savePool.mock.calls[0] as any[])[1]).toBe('demo');
    });

    it('should throw when no pool of the cluster references the machine config', async() => {
      const store = rootStore();
      const otherPool = saferDump(clusterData('nc-other'));

      await expect(saveMachineConfigYaml(context({ editedCluster: otherPool }), store, keepName)).rejects.toThrow('resourceYaml.errors.machinePoolNotFound {"name":"nc-pool1"}');
    });

    it('should point the pool at the saved machine config and write the cluster yaml to the editor', async() => {
      const ctx = context();
      const replace = jest.fn(async(entry: MachinePoolEntry) => {
        entry.config = { ...entry.config, metadata: { ...entry.config.metadata, name: 'nc-pool1-v2' } };
      });

      await saveMachineConfigYaml(ctx, rootStore(), replace);

      expect(jsyaml.load(ctx.editorState.yaml[CLUSTER_ID])).toStrictEqual(clusterData('nc-pool1-v2'));
    });

    it('should leave the cluster yaml in the editor as it is when the pool did not change, so its comments are kept', async() => {
      const withComment = `# kept\n${ saferDump(clusterData()) }`;
      const ctx = context({ editedCluster: withComment });

      await saveMachineConfigYaml(ctx, rootStore(), keepName);

      expect(ctx.editorState.yaml[CLUSTER_ID]).toBe(withComment);
    });

    it('should resolve to the saved machine config', async() => {
      const saved = { metadata: { name: 'nc-pool1' }, saved: true };
      const savePool = jest.fn(async(entry: MachinePoolEntry) => {
        entry.config = saved;
      });

      expect(await saveMachineConfigYaml(context(), rootStore(), savePool)).toBe(saved);
    });
  });
});
