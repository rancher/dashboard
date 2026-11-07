import { actions, getters, mutations } from '../index';
import { HELM } from '@shell/config/types';
import paginationUtils from '@shell/utils/pagination-utils';

describe('mutations', () => {
  describe('updateNamespaces', () => {
    it.each([
      ['drops a filter left over from the removed "Only Namespaced Resources" option', ['namespaced://true'], []],
      ['drops a filter left over from the removed "Only Cluster Resources" option', ['namespaced://false'], []],
      ['keeps namespace and project filters alongside a leftover one', ['ns://a', 'namespaced://true', 'project://p'], ['ns://a', 'project://p']],
      ['keeps the filters it is given', ['all://user'], ['all://user']],
      ['keeps an empty selection, which means all namespaces', [], []],
    ])('%s', (_label, filters, expectation) => {
      const state = { namespaceFilters: [], allNamespaces: [] } as any;

      mutations.updateNamespaces(state, {
        filters, all: [], getters: { currentProduct: undefined }
      });

      expect(state.namespaceFilters).toStrictEqual(expectation);
    });

    it('leaves a leftover filter meaning all namespaces, as it did before the options were removed', () => {
      const state = { namespaceFilters: [], allNamespaces: [] } as any;

      mutations.updateNamespaces(state, {
        filters: ['namespaced://true'], all: [], getters: { currentProduct: undefined }
      });

      expect(getters.isAllNamespaces(state, { currentProduct: { showNamespaceFilter: true } })).toStrictEqual(true);
    });
  });
});

describe('getters', () => {
  describe('namespaces', () => {
    it('should return empty dictionary', () => {
      const expectation = {};
      const state = {};
      const stateGetters = { currentProduct: () => ({}) };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should return all the namespaces for related category', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-namespace';
      const expectation = { [namespaceId]: true };
      const state = {
        allNamespaces:    [{ id: namespaceId }],
        prefs:            { data: { 'all-namespaces': false } },
        namespaceFilters: []
      };
      const stateGetters = {
        isAllNamespaces: true,
        currentProduct:  { inStore: 'whatever' },
        'whatever/all':  {},
        currentCluster:  { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should return Rancher system namespaces', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-rancher-system-namespace';
      const expectation = { [namespaceId]: true };
      const state = {
        allNamespaces: [{
          id:        namespaceId,
          isObscure: true
        }],
        prefs:            { data: { 'all-namespaces': true } },
        namespaceFilters: []
      };
      const stateGetters = {
        isAllNamespaces: true,
        currentProduct:  { inStore: 'whatever' },
        'whatever/all':  {},
        currentCluster:  { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should filter Rancher system namespaces', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-rancher-system-namespace';
      const expectation = { };
      const state = {
        allNamespaces: [{
          id:        namespaceId,
          isObscure: true
        }],
        prefs:            { data: { 'all-namespaces': false } },
        namespaceFilters: []
      };
      const stateGetters = {
        isAllNamespaces: true,
        currentProduct:  { inStore: 'whatever' },
        'whatever/all':  {},
        currentCluster:  { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should filter namespaces by project', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-product-namespace';
      const projectId = 'my-project';
      const expectation = { [namespaceId]: true };
      const state = {
        allNamespaces:    [{ id: namespaceId }],
        prefs:            { data: { 'all-namespaces': false } },
        namespaceFilters: [`project://${ projectId }`]
      };
      const stateGetters = {
        isAllNamespaces:   false,
        currentProduct:    { inStore: 'whatever' },
        'whatever/all':    {},
        'management/byId': () => ({
          id:         projectId,
          namespaces: [{ id: namespaceId }]
        }),
        currentCluster: { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });
  });
});

describe('actions', () => {
  describe('restoreWorkspace', () => {
    const workspaces = [{ id: 'fleet-default' }, { id: 'fleet-local' }, { id: 'my-workspace' }];

    const context = (allWorkspaces: { id: string }[] = workspaces) => {
      const state = { allWorkspaces, workspace: '' };
      const storeGetters = { currentProduct: { showWorkspaceSwitcher: true } };

      return {
        state,
        getters: storeGetters,
        commit:  (name: string, payload: { value: string, all: { id: string }[], getters: unknown }) => {
          expect(name).toBe('updateWorkspace');

          return mutations.updateWorkspace(state, payload);
        },
      };
    };

    it('should keep a workspace that exists', () => {
      const ctx = context();

      actions.restoreWorkspace(ctx, { value: 'my-workspace', all: undefined });

      expect(ctx.state.workspace).toBe('my-workspace');
    });

    it('should replace a workspace that no longer exists with the default one', () => {
      const ctx = context();

      actions.restoreWorkspace(ctx, { value: 'removed-workspace', all: undefined });

      expect(ctx.state.workspace).toBe('fleet-default');
    });

    it('should fall back to the first workspace when there is no default one', () => {
      const ctx = context([{ id: 'my-workspace' }]);

      actions.restoreWorkspace(ctx, { value: 'removed-workspace', all: undefined });

      expect(ctx.state.workspace).toBe('my-workspace');
    });

    it('should keep the value when no workspaces are known', () => {
      const ctx = context([]);

      actions.restoreWorkspace(ctx, { value: 'my-workspace', all: undefined });

      expect(ctx.state.workspace).toBe('my-workspace');
    });

    it('should not correct the value when the caller sets it directly', () => {
      const ctx = context();

      actions.setWorkspace(ctx, { value: 'removed-workspace' });

      expect(ctx.state.workspace).toBe('removed-workspace');
      expect(ctx.state.allWorkspaces).toStrictEqual(workspaces);
    });

    it('should validate against a list given to it', () => {
      const ctx = context([]);

      actions.restoreWorkspace(ctx, { value: 'removed-workspace', all: workspaces });

      expect(ctx.state.allWorkspaces).toStrictEqual(workspaces);
      expect(ctx.state.workspace).toBe('fleet-default');
    });
  });

  describe('loadCluster', () => {
    const failure = (status: number) => () => Promise.reject(Object.assign(new Error('Failed'), { status }));

    beforeEach(() => {
      jest.spyOn(paginationUtils, 'isEnabled').mockReturnValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const load = async(hasSchema: boolean, find: () => Promise<unknown>) => {
      const commit = jest.fn();
      const dispatch = jest.fn((action: string) => {
        if (action === 'management/find') {
          return Promise.resolve({ isReady: true });
        }

        return action === 'cluster/find' ? find() : Promise.resolve([]);
      });
      const storeGetters = {
        'cluster/schemaFor':    (type: string) => (hasSchema && type === HELM.PROJECTHELMCHART ? {} : undefined),
        'management/schemaFor': () => undefined,
        'prefs/get':            () => ({}),
      };

      await actions.loadCluster({
        state: { managementReady: true }, commit, dispatch, getters: storeGetters, rootGetters: {}
      }, {
        id: 'c-abc', product: 'monitoring', oldProduct: undefined, oldPkg: undefined, newPkg: undefined, targetRoute: undefined
      });

      return commit;
    };

    it.each([
      [false, 'the config map exists', () => Promise.resolve({})],
      [false, 'find returns nothing', () => Promise.resolve(undefined)],
      [false, 'the config map request is forbidden', failure(403)],
      [false, 'the config map request fails', failure(500)],
      [true, 'the config map is not found', failure(404)],
    ])('should set federatorMissing to %p when %s', async(federatorMissing, _label, find) => {
      const commit = await load(true, find);

      expect(commit).toHaveBeenCalledWith('federatorMissing', federatorMissing);
    });

    it('should not look for the config map without the project helm chart schema', async() => {
      const find = jest.fn();
      const commit = await load(false, find);

      expect(find).not.toHaveBeenCalled();
      expect(commit).toHaveBeenCalledWith('federatorMissing', false);
    });

    it('should set federatorMissing before the cluster is ready, as that builds the side nav', async() => {
      const commit = await load(true, failure(404));
      const names = commit.mock.calls.map(([name]) => name);

      expect(commit).toHaveBeenCalledWith('federatorMissing', true);
      expect(commit).toHaveBeenCalledWith('clusterReady', true);
      expect(names.indexOf('federatorMissing')).toBeLessThan(names.indexOf('clusterReady'));
    });
  });
});
