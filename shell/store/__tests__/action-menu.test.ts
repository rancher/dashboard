import {
  state,
  getters,
  mutations,
  actions,
} from '@shell/store/action-menu';

describe('action-menu store', () => {
  describe('state', () => {
    it('returns initial default values', () => {
      const s = state();

      expect(s.show).toStrictEqual(false);
      expect(s.resources).toStrictEqual([]);
      expect(s.elem).toStrictEqual(null);
      expect(s.event).toStrictEqual(null);
      expect(s.showPromptRemove).toStrictEqual(false);
      expect(s.showPromptRestore).toStrictEqual(false);
      expect(s.showModal).toStrictEqual(false);
      expect(s.performCallbackData).toStrictEqual(undefined);
      expect(s.toRemove).toStrictEqual([]);
      expect(s.toRestore).toStrictEqual([]);
      expect(s.modalData).toStrictEqual({});
    });

    it('returns a fresh object on each call', () => {
      const s1 = state();
      const s2 = state();

      expect(s1).not.toBe(s2);
      expect(s1.toRemove).not.toBe(s2.toRemove);
    });
  });

  describe('getters', () => {
    it('showing returns state.show', () => {
      expect(getters.showing({ show: true } as any)).toStrictEqual(true);
      expect(getters.showing({ show: false } as any)).toStrictEqual(false);
    });

    it('elem returns state.elem', () => {
      const elem = document.createElement('div');

      expect(getters.elem({ elem } as any)).toBe(elem);
    });

    it('event returns state.event', () => {
      const event = { type: 'click' };

      expect(getters.event({ event } as any)).toBe(event);
    });

    it('resources returns state.resources', () => {
      const resources = [{ id: 'r1' }];

      expect(getters.resources({ resources } as any)).toBe(resources);
    });

    it('performCallbackData returns state.performCallbackData', () => {
      const data = { foo: 'bar' };

      expect(getters.performCallbackData({ performCallbackData: data } as any)).toBe(data);
    });

    describe('optionsArray', () => {
      it('returns empty array when resources is null', () => {
        const s = { resources: null } as any;

        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when resources is not an array', () => {
        const s = { resources: 'not-an-array' } as any;

        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when resources is empty', () => {
        const s = { resources: [] } as any;

        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when no node has availableActions', () => {
        const s = { resources: [{ name: 'r1' }, { name: 'r2' }] } as any;

        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when node availableActions is empty', () => {
        const s = { resources: [{ availableActions: [] }] } as any;

        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('includes an enabled action from a single resource', () => {
        const s = {
          resources: [{
            availableActions: [{
              action: 'edit', label: 'Edit', enabled: true
            }]
          }],
        } as any;

        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].action).toStrictEqual('edit');
        expect(result[0].enabled).toStrictEqual(true);
        expect(result[0].available).toStrictEqual(1);
        expect(result[0].total).toStrictEqual(1);
      });

      it('excludes an action that is disabled for all resources', () => {
        const s = {
          resources: [{
            availableActions: [{
              action: 'delete', label: 'Delete', enabled: false
            }]
          }],
        } as any;

        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('includes an action with undefined enabled as enabled', () => {
        const s = { resources: [{ availableActions: [{ action: 'view', label: 'View' }] }] } as any;

        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].enabled).toStrictEqual(true);
      });

      it('marks action enabled=false when available < total across multiple resources', () => {
        const s = {
          resources: [
            {
              availableActions: [{
                action: 'edit', label: 'Edit', enabled: true
              }]
            },
            {
              availableActions: [{
                action: 'edit', label: 'Edit', enabled: false
              }]
            },
          ],
        } as any;

        const result = getters.optionsArray(s);

        // available=1 (only first resource has it enabled), total=2 → enabled = 1>=2 = false
        expect(result).toHaveLength(1);
        expect(result[0].enabled).toStrictEqual(false);
        expect(result[0].available).toStrictEqual(1);
        expect(result[0].total).toStrictEqual(2);
      });

      it('marks action enabled=true when all resources have it enabled', () => {
        const s = {
          resources: [
            { availableActions: [{ action: 'view', enabled: true }] },
            { availableActions: [{ action: 'view', enabled: true }] },
          ],
        } as any;

        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].enabled).toStrictEqual(true);
        expect(result[0].available).toStrictEqual(2);
        expect(result[0].total).toStrictEqual(2);
      });

      it('merges actions from multiple resources into a single list', () => {
        const s = {
          resources: [
            { availableActions: [{ action: 'edit', enabled: true }, { action: 'delete', enabled: true }] },
            { availableActions: [{ action: 'edit', enabled: true }] },
          ],
        } as any;

        const result = getters.optionsArray(s);

        const actions = result.map((a: any) => a.action);

        expect(actions).toContain('edit');
        expect(actions).toContain('delete');
        // delete only appears in first resource — available=1, total=1 (only added once from first resource)
        const deleteAction = result.find((a: any) => a.action === 'delete');

        expect(deleteAction.enabled).toStrictEqual(true);
      });

      it('skips nodes without availableActions property', () => {
        const s = {
          resources: [
            { name: 'r1' },
            { availableActions: [{ action: 'view', enabled: true }] },
          ],
        } as any;

        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].action).toStrictEqual('view');
      });
    });

    describe('options', () => {
      it('returns spread of optionsArray', () => {
        const mockGetters = { optionsArray: [{ action: 'edit' }, { action: 'delete' }] } as any;
        const result = getters.options(null as any, mockGetters);

        expect(result).toStrictEqual({ 0: { action: 'edit' }, 1: { action: 'delete' } });
      });

      it('returns empty object for empty optionsArray', () => {
        const mockGetters = { optionsArray: [] } as any;

        expect(getters.options(null as any, mockGetters)).toStrictEqual({});
      });
    });
  });

  describe('mutations', () => {
    describe('show', () => {
      it('sets show=true, elem, event and wraps single resource in array', () => {
        const s = state();
        const resource = { id: 'r1' };
        const elem = document.createElement('div');
        const event = { type: 'click' };

        mutations.show(s, {
          resources: resource, elem, event,
        });

        expect(s.show).toStrictEqual(true);
        expect(s.resources).toStrictEqual([resource]);
        expect(s.elem).toBe(elem);
        expect(s.event).toBe(event);
      });

      it('keeps array resources as-is', () => {
        const s = state();
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.show(s, {
          resources, elem: null, event: null,
        });

        expect(s.resources).toBe(resources);
        expect(s.show).toStrictEqual(true);
      });
    });

    describe('hide', () => {
      it('sets show=false, resources=null, elem=null', () => {
        const s = state();

        s.show = true;
        s.resources = [{ id: 'r1' }] as any;
        s.elem = document.createElement('div') as any;
        mutations.hide(s);

        expect(s.show).toStrictEqual(false);
        expect(s.resources).toStrictEqual(null);
        expect(s.elem).toStrictEqual(null);
      });
    });

    describe('togglePromptRemove', () => {
      it('sets showPromptRemove=false and toRemove=[] when resources is null', () => {
        const s = state();

        s.showPromptRemove = true;
        mutations.togglePromptRemove(s, null as any);

        expect(s.showPromptRemove).toStrictEqual(false);
        expect(s.toRemove).toStrictEqual([]);
      });

      it('sets showPromptRemove=false and toRemove=[] when resources is undefined', () => {
        const s = state();

        s.showPromptRemove = true;
        mutations.togglePromptRemove(s, undefined as any);

        expect(s.showPromptRemove).toStrictEqual(false);
        expect(s.toRemove).toStrictEqual([]);
      });

      it('toggles showPromptRemove to true and wraps single resource', () => {
        const s = state();
        const resource = { id: 'r1' };

        mutations.togglePromptRemove(s, resource as any);

        expect(s.showPromptRemove).toStrictEqual(true);
        expect(s.toRemove).toStrictEqual([resource]);
      });

      it('toggles showPromptRemove back to false on second call with resources', () => {
        const s = state();
        const resource = { id: 'r1' };

        mutations.togglePromptRemove(s, resource as any);
        mutations.togglePromptRemove(s, resource as any);

        expect(s.showPromptRemove).toStrictEqual(false);
      });

      it('keeps array resources without wrapping', () => {
        const s = state();
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.togglePromptRemove(s, resources as any);

        expect(s.toRemove).toBe(resources);
      });
    });

    describe('togglePromptRestore', () => {
      it('sets showPromptRestore=false and toRestore=[] when resources is null', () => {
        const s = state();

        s.showPromptRestore = true;
        mutations.togglePromptRestore(s, null as any);

        expect(s.showPromptRestore).toStrictEqual(false);
        expect(s.toRestore).toStrictEqual([]);
      });

      it('toggles showPromptRestore to true and wraps single resource', () => {
        const s = state();
        const resource = { id: 'r1' };

        mutations.togglePromptRestore(s, resource as any);

        expect(s.showPromptRestore).toStrictEqual(true);
        expect(s.toRestore).toStrictEqual([resource]);
      });

      it('toggles showPromptRestore back to false on second call', () => {
        const s = state();
        const resource = { id: 'r1' };

        mutations.togglePromptRestore(s, resource as any);
        mutations.togglePromptRestore(s, resource as any);

        expect(s.showPromptRestore).toStrictEqual(false);
      });

      it('keeps array resources without wrapping', () => {
        const s = state();
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.togglePromptRestore(s, resources as any);

        expect(s.toRestore).toBe(resources);
      });
    });

    describe('togglePromptModal', () => {
      it('sets showModal=false and modalData=null when data is null', () => {
        const s = state();

        s.showModal = true;
        mutations.togglePromptModal(s, null as any);

        expect(s.showModal).toStrictEqual(false);
        expect(s.modalData).toStrictEqual(null);
      });

      it('sets performCallbackData and showModal=false when data.performCallback is truthy', () => {
        const s = state();
        const data = { performCallback: true, action: 'confirm' };

        mutations.togglePromptModal(s, data as any);

        expect(s.performCallbackData).toBe(data);
        expect(s.showModal).toStrictEqual(false);
        expect(s.modalData).toBe(data);
      });

      it('sets showModal=true when data has no performCallback', () => {
        const s = state();
        const data = { title: 'Confirm', action: 'delete' };

        mutations.togglePromptModal(s, data as any);

        expect(s.showModal).toStrictEqual(true);
        expect(s.modalData).toBe(data);
      });

      it('does not set performCallbackData when data has no performCallback', () => {
        const s = state();
        const prevCallback = { existing: true };

        s.performCallbackData = prevCallback as any;
        mutations.togglePromptModal(s, { title: 'Modal' } as any);

        expect(s.performCallbackData).toBe(prevCallback);
      });
    });

    describe('updateModalData', () => {
      it('merges key/value pairs into existing modalData', () => {
        const s = state();

        s.modalData = { existing: 'value' };
        mutations.updateModalData(s, [
          { key: 'foo', value: 'bar' },
          { key: 'num', value: 42 },
        ]);

        expect(s.modalData).toStrictEqual({
          existing: 'value',
          foo:      'bar',
          num:      42,
        });
      });

      it('creates modalData object when it is falsy before merging', () => {
        const s = state();

        s.modalData = null as any;
        mutations.updateModalData(s, [{ key: 'x', value: 1 }]);

        expect(s.modalData).toStrictEqual({ x: 1 });
      });

      it('overwrites existing key with new value', () => {
        const s = state();

        s.modalData = { key: 'old' };
        mutations.updateModalData(s, [{ key: 'key', value: 'new' }]);

        expect(s.modalData.key).toStrictEqual('new');
      });
    });

    describe('clearCallbackData', () => {
      it('sets performCallbackData to undefined', () => {
        const s = state();

        s.performCallbackData = { some: 'data' } as any;
        mutations.clearCallbackData(s);

        expect(s.performCallbackData).toStrictEqual(undefined);
      });
    });

    describe('SET_RESOURCE', () => {
      it('wraps a single non-array resource in an array', () => {
        const s = state();
        const resource = { id: 'r1' };

        mutations.SET_RESOURCE(s, resource as any);

        expect(s.resources).toStrictEqual([resource]);
      });

      it('keeps array resources as-is', () => {
        const s = state();
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.SET_RESOURCE(s, resources as any);

        expect(s.resources).toBe(resources);
      });
    });
  });

  describe('actions', () => {
    describe('execute', () => {
      it('calls the action function on a single resource', async() => {
        const editFn = jest.fn().mockResolvedValue('edit-result');
        const resource = { edit: editFn };
        const s = { resources: [resource] };
        const action = { action: 'edit' };

        await actions.execute({ state: s } as any, {
          action,
          args: ['arg1'],
          opts: {},
        });

        expect(editFn).toHaveBeenCalledWith('arg1');
      });

      it('skips resources that do not have the action function', async() => {
        const resource1 = { edit: jest.fn().mockResolvedValue('ok') };
        const resource2 = {};
        const s = { resources: [resource1, resource2] };

        await actions.execute({ state: s } as any, {
          action: { action: 'edit' },
          args:   [],
          opts:   {},
        });

        expect(resource1.edit).toHaveBeenCalledWith();
      });

      it('calls altAction when opts.alt is true and action.altAction is defined', async() => {
        const normalFn = jest.fn();
        const altFn = jest.fn().mockResolvedValue('alt-result');
        const resource = {
          edit:    normalFn,
          editAlt: altFn,
        };
        const s = { resources: [resource] };

        await actions.execute({ state: s } as any, {
          action: { action: 'edit', altAction: 'editAlt' },
          args:   [],
          opts:   { alt: true },
        });

        expect(altFn).toHaveBeenCalledWith();
        expect(normalFn).not.toHaveBeenCalled();
      });

      it('uses altResource when action.altResource is defined', async() => {
        const altEditFn = jest.fn().mockResolvedValue('alt-resource-result');
        const altResource = { edit: altEditFn };
        const resource = { edit: jest.fn() };
        const s = { resources: [resource] };

        await actions.execute({ state: s } as any, {
          action: { action: 'edit', altResource },
          args:   [],
          opts:   {},
        });

        expect(altEditFn).toHaveBeenCalledWith();
        expect(resource.edit).not.toHaveBeenCalled();
      });

      it('calls bulkAction on resources[0] when multiple resources and bulkAction defined', async() => {
        const bulkFn = jest.fn().mockReturnValue('bulk-result');
        const resource1 = { bulkDelete: bulkFn };
        const resource2 = { bulkDelete: jest.fn() };
        const s = { resources: [resource1, resource2] };

        await actions.execute({ state: s } as any, {
          action: { action: 'delete', bulkAction: 'bulkDelete' },
          args:   ['extra'],
          opts:   {},
        });

        expect(bulkFn).toHaveBeenCalledWith([resource1, resource2], 'extra');
      });

      it('falls back to per-resource loop when opts.alt is true even with bulkAction', async() => {
        const normalFn = jest.fn().mockResolvedValue('ok');
        const resource1 = { delete: normalFn };
        const resource2 = { delete: normalFn };
        const s = { resources: [resource1, resource2] };

        await actions.execute({ state: s } as any, {
          action: { action: 'delete', bulkAction: 'bulkDelete' },
          args:   [],
          opts:   { alt: true },
        });

        expect(normalFn).toHaveBeenCalledTimes(2);
      });

      it('defaults args to [] when not provided', async() => {
        const editFn = jest.fn().mockResolvedValue('ok');
        const resource = { edit: editFn };
        const s = { resources: [resource] };

        await actions.execute({ state: s } as any, {
          action: { action: 'edit' },
          args:   null as any,
          opts:   {},
        });

        expect(editFn).toHaveBeenCalledWith();
      });

      it('calls actions on multiple resources and returns all results', async() => {
        const res1 = { edit: jest.fn().mockResolvedValue('result-1') };
        const res2 = { edit: jest.fn().mockResolvedValue('result-2') };
        const s = { resources: [res1, res2] };

        const result = await actions.execute({ state: s } as any, {
          action: { action: 'edit' },
          args:   [],
          opts:   {},
        });

        expect(result).toStrictEqual(['result-1', 'result-2']);
      });
    });

    describe('setResource', () => {
      it('commits SET_RESOURCE with the resource', () => {
        const commit = jest.fn();
        const resource = { id: 'r1' };

        actions.setResource({ commit } as any, resource as any);

        expect(commit).toHaveBeenCalledWith('SET_RESOURCE', resource);
      });
    });

    describe('clearCallbackData', () => {
      it('commits clearCallbackData', () => {
        const commit = jest.fn();

        actions.clearCallbackData({ commit } as any);

        expect(commit).toHaveBeenCalledWith('clearCallbackData');
      });
    });
  });
});
