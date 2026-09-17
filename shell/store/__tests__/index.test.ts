import { actions, getters, mutations } from '../index';

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

    it('should validate against a list given to it', () => {
      const ctx = context([]);

      actions.restoreWorkspace(ctx, { value: 'removed-workspace', all: workspaces });

      expect(ctx.state.allWorkspaces).toStrictEqual(workspaces);
      expect(ctx.state.workspace).toBe('fleet-default');
    });
  });
});
