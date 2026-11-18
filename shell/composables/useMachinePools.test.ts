import { useMachinePools, syncMachineConfigWithLatest } from '@shell/composables/useMachinePools';

const mockGetters: Record<string, any> = { 'i18n/t': (key: string) => key };

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      }
    }),
    dispatch: jest.fn(),
  }),
}));

const pool = (overrides: Record<string, any> = {}) => ({
  id:     'pool-1',
  remove: false,
  create: false,
  pool:   {
    etcdRole: false, controlPlaneRole: false, workerRole: true, quantity: 1
  },
  ...overrides,
});

describe('composable: useMachinePools', () => {
  describe('nodeTotals / hasRequiredNodes', () => {
    it('marks a role as error when it has no nodes', () => {
      const { nodeTotals, hasRequiredNodes, machinePools } = useMachinePools();

      machinePools.value = [];

      expect(nodeTotals.value.color.etcd).toBe('bg-error');
      expect(nodeTotals.value.color.controlPlane).toBe('bg-error');
      expect(nodeTotals.value.color.worker).toBe('bg-error');
      expect(hasRequiredNodes()).toBe(false);
    });

    it('marks etcd as a warning for an even count, a single node, or more than 7', () => {
      const { nodeTotals, machinePools } = useMachinePools();

      machinePools.value = [pool({ pool: { etcdRole: true, quantity: 2 } })];

      expect(nodeTotals.value.color.etcd).toBe('bg-warning');
    });

    it('marks roles as success once every required role has at least one node', () => {
      const { nodeTotals, hasRequiredNodes, machinePools } = useMachinePools();

      machinePools.value = [
        pool({
          pool: {
            etcdRole: true, controlPlaneRole: true, workerRole: false, quantity: 3
          }
        }),
        pool({ id: 'pool-2', pool: { workerRole: true, quantity: 2 } }),
      ];

      expect(nodeTotals.value.color.etcd).toBe('bg-success');
      expect(nodeTotals.value.color.controlPlane).toBe('bg-success');
      expect(nodeTotals.value.color.worker).toBe('bg-success');
      expect(hasRequiredNodes()).toBe(true);
    });

    it('ignores pools marked for removal and pools with a non-numeric quantity', () => {
      const { nodeTotals, machinePools } = useMachinePools();

      machinePools.value = [
        pool({ remove: true, pool: { etcdRole: true, quantity: 3 } }),
        pool({ id: 'pool-2', pool: { etcdRole: true, quantity: 'not-a-number' } }),
      ];

      expect(nodeTotals.value.color.etcd).toBe('bg-error');
    });
  });

  describe('unremovedMachinePools', () => {
    it('filters out pools marked for removal', () => {
      const { unremovedMachinePools, machinePools } = useMachinePools();

      machinePools.value = [pool({ id: 'keep' }), pool({ id: 'drop', remove: true })];

      expect(unremovedMachinePools.value.map((p: any) => p.id)).toStrictEqual(['keep']);
    });
  });

  describe('hasOnlyIpv6Pools / hasDualStackPools', () => {
    it('is only ipv6 when every pool is ipv6 and none are dual-stack', () => {
      const { hasOnlyIpv6Pools, machinePools } = useMachinePools();

      machinePools.value = [pool({ isIpv6: true }), pool({ id: 'pool-2', isIpv6: true })];

      expect(hasOnlyIpv6Pools.value).toBe(true);
    });

    it('is not only-ipv6 when any pool is not ipv6', () => {
      const { hasOnlyIpv6Pools, machinePools } = useMachinePools();

      machinePools.value = [pool({ isIpv6: true }), pool({ id: 'pool-2', isIpv6: false })];

      expect(hasOnlyIpv6Pools.value).toBe(false);
    });

    it('detects dual-stack pools', () => {
      const { hasDualStackPools, machinePools } = useMachinePools();

      machinePools.value = [pool({ isDualStack: true })];

      expect(hasDualStackPools.value).toBe(true);
    });
  });

  describe('removeMachinePool', () => {
    it('does nothing when the index does not exist', () => {
      const { removeMachinePool, machinePools } = useMachinePools();

      machinePools.value = [pool({ create: true })];

      removeMachinePool(5);

      expect(machinePools.value).toHaveLength(1);
    });

    it('drops a not-yet-saved pool entirely', () => {
      const { removeMachinePool, machinePools } = useMachinePools();

      machinePools.value = [pool({ create: true })];

      removeMachinePool(0);

      expect(machinePools.value).toHaveLength(0);
    });

    it('marks an existing pool for removal instead of deleting it', () => {
      const { removeMachinePool, machinePools } = useMachinePools();

      machinePools.value = [pool({ create: false })];

      removeMachinePool(0);

      expect(machinePools.value).toHaveLength(1);
      expect((machinePools.value as any[])[0].remove).toBe(true);
    });
  });

  describe('machinePoolValidationChanged', () => {
    it('records the validation state for a pool', () => {
      const { machinePoolValidationChanged, machinePoolValidation } = useMachinePools();

      machinePoolValidationChanged('pool-1', false);

      expect(machinePoolValidation.value['pool-1']).toBe(false);
    });

    it('removes the entry when the value is undefined', () => {
      const { machinePoolValidationChanged, machinePoolValidation } = useMachinePools();

      machinePoolValidationChanged('pool-1', false);
      machinePoolValidationChanged('pool-1', undefined);

      expect(machinePoolValidation.value).not.toHaveProperty('pool-1');
    });
  });

  describe('recordMachinePoolError', () => {
    const message = (count: number, poolName: string, fields: string) => `cluster.banner.machinePoolError-${ JSON.stringify({
      count, pool_name: poolName, fields
    }) }`;

    it('formats a single offending field without a conjunction', () => {
      const { recordMachinePoolError } = useMachinePools();

      const result = recordMachinePoolError({ 'pool-1': ['quantity'] });

      expect(result).toStrictEqual([message(1, 'pool-1', 'quantity')]);
    });

    it('joins two offending fields with "and"', () => {
      const { recordMachinePoolError } = useMachinePools();

      const result = recordMachinePoolError({ 'pool-1': ['quantity', 'roles'] });

      expect(result).toStrictEqual([message(2, 'pool-1', 'quantity and roles')]);
    });

    it('joins three or more offending fields with commas and a trailing "and"', () => {
      const { recordMachinePoolError } = useMachinePools();

      const result = recordMachinePoolError({ 'pool-1': ['quantity', 'roles', 'labels'] });

      expect(result).toStrictEqual([message(3, 'pool-1', 'roles, labels, and quantity')]);
    });

    it('merges errors across multiple calls and returns one message per pool', () => {
      const { recordMachinePoolError } = useMachinePools();

      recordMachinePoolError({ 'pool-1': ['quantity'] });
      const result = recordMachinePoolError({ 'pool-2': ['roles'] });

      expect(result).toStrictEqual([message(1, 'pool-1', 'quantity'), message(1, 'pool-2', 'roles')]);
    });

    it('omits pools whose error list is empty', () => {
      const { recordMachinePoolError } = useMachinePools();

      recordMachinePoolError({ 'pool-1': ['quantity'] });
      const result = recordMachinePoolError({ 'pool-2': [] });

      expect(result).toStrictEqual([message(1, 'pool-1', 'quantity')]);
    });

    it('does NOT clear a pool\'s prior errors by reporting an empty list - lodash `merge` never shrinks an existing array', () => {
      const { recordMachinePoolError } = useMachinePools();

      recordMachinePoolError({ 'pool-1': ['quantity'] });
      const result = recordMachinePoolError({ 'pool-1': [] });

      expect(result).toStrictEqual([message(1, 'pool-1', 'quantity')]);
    });
  });

  describe('syncMachineConfigWithLatest', () => {
    const buildStore = () => ({
      dispatch: jest.fn((action: string, payload: any) => {
        if (action === 'management/create') {
          return Promise.resolve({ ...payload, toJSON: () => payload });
        }
        if (action === 'management/request') {
          return Promise.resolve({ metadata: { resourceVersion: '1' } });
        }

        return Promise.resolve(payload);
      }),
      getters: { 'i18n/t': (key: string, params: any) => `${ key } ${ JSON.stringify(params) }` },
    });

    it('does nothing when the machine pool has no config id', async() => {
      const store = buildStore();

      await syncMachineConfigWithLatest(store as any, {}, { config: null });

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('fetches the latest config and initial value for the pool', async() => {
      const store = buildStore();
      const config: any = {
        id: 'mc-1', type: 'rke-machine-config.digitaloceandroplet', metadata: { resourceVersion: '1' }
      };

      config.toJSON = () => config;

      await syncMachineConfigWithLatest(store as any, { 'mc-1': { metadata: { resourceVersion: '1' } } }, { config });

      expect(store.dispatch).toHaveBeenCalledWith('management/request', { url: '/v1/rke-machine-config.digitaloceandroplets/mc-1' });
    });

    it('does not throw and applies non-conflicting server changes when there is no real conflict', async() => {
      const store = buildStore();
      // Server added a label the user never touched; user only changed `size`.
      const initial = { metadata: { resourceVersion: '1' }, size: 's-2vcpu-4gb' };
      const config: any = {
        id: 'mc-1', type: 'rke-machine-config.digitaloceandroplet', metadata: { resourceVersion: '1' }, size: 's-4vcpu-8gb'
      };

      config.toJSON = () => config;
      const machinePool = { config };
      const latestFromServer = { metadata: { resourceVersion: '2', labels: { env: 'prod' } }, size: 's-2vcpu-4gb' };

      store.dispatch.mockImplementation((action: string, payload: any) => {
        if (action === 'management/request') {
          return Promise.resolve(latestFromServer);
        }
        if (action === 'management/create') {
          if (payload === latestFromServer) {
            return Promise.resolve({ ...latestFromServer, toJSON: () => latestFromServer });
          }

          return Promise.resolve({ ...payload, toJSON: () => payload });
        }

        return Promise.resolve(payload);
      });

      await expect(syncMachineConfigWithLatest(store as any, { 'mc-1': initial }, machinePool)).resolves.toBeUndefined();

      // Background change (label) applied, user's own change (size) preserved.
      expect((machinePool.config as any).metadata.labels).toStrictEqual({ env: 'prod' });
      expect(machinePool.config.size).toBe('s-4vcpu-8gb');
      expect(machinePool.config.metadata.resourceVersion).toBe('2');
    });

    it('throws when the server and the user changed the same field to different values', async() => {
      const store = buildStore();
      const initial = { metadata: { resourceVersion: '1' }, size: 's-2vcpu-4gb' };
      const config: any = {
        id: 'mc-1', type: 'rke-machine-config.digitaloceandroplet', metadata: { resourceVersion: '1' }, size: 's-4vcpu-8gb'
      };

      config.toJSON = () => config;
      const machinePool = { config };
      // Server also changed `size`, to a third value - a genuine conflict.
      const latestFromServer = { metadata: { resourceVersion: '2' }, size: 's-8vcpu-16gb' };

      store.dispatch.mockImplementation((action: string, payload: any) => {
        if (action === 'management/request') {
          return Promise.resolve(latestFromServer);
        }
        if (action === 'management/create') {
          if (payload === latestFromServer) {
            return Promise.resolve({ ...latestFromServer, toJSON: () => latestFromServer });
          }

          return Promise.resolve({ ...payload, toJSON: () => payload });
        }

        return Promise.resolve(payload);
      });

      await expect(syncMachineConfigWithLatest(store as any, { 'mc-1': initial }, machinePool)).rejects.toThrow();
    });
  });
});
