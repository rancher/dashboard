import mutations from '@shell/plugins/dashboard-store/mutations';
import getters from '@shell/plugins/steve/getters';
import { StorePagination } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';
import Pod from '@shell/models/pod';

describe('mutations', () => {
  jest.mock('vue', () => ({ reactive: jest.fn((arr) => arr) }));

  // Import the function we are testing
  const { loadPage } = mutations;

  let state: any;
  let ctx: Partial<VuexStore>;
  let resourceType: string;
  let pagination: Partial<StorePagination>;
  let revision: string;

  beforeEach(() => {
    jest.clearAllMocks();

    state = { types: {} };
    ctx = {
      getters: {
        keyFieldForType: jest.fn(() => 'id'),
        cleanResource:   getters.cleanResource()
      }
    };
    resourceType = 'pod';
    pagination = { request: undefined, result: undefined };
    revision = 'abc-123';
    ctx.getters.classify = () => Pod;
  });

  describe('loadPage', () => {
    it('should perform an initial load into an empty cache', () => {
      const data = [
        {
          id: 'a', name: 'pod-a', type: resourceType
        },
        {
          id: 'b', name: 'pod-b', type: resourceType
        }
      ];

      loadPage(state, {
        type: resourceType, data, ctx, pagination, revision
      });

      // Get the cache created by the *real* 'registerType'
      const cache = state.types[resourceType];

      // Check cache metadata
      expect(cache.generation).toBe(1);
      expect(cache.havePage).toBe(pagination);
      expect(cache.revision).toBe(revision);

      // Check 'list' (should contain classified proxies)
      expect(cache.list).toHaveLength(2);
      expect(cache.list[0]).toStrictEqual(expect.objectContaining({ id: 'a' }));
      expect(cache.list[1]).toStrictEqual(expect.objectContaining({ id: 'b' }));

      // Check 'map'
      expect(cache.map.size).toBe(2);
      expect(cache.map.get('a')).toBe(cache.list[0]); // Map and list must reference the *same* objects
      expect(cache.map.get('b')).toBe(cache.list[1]);
    });

    it('should update existing resources in-place (tests "replaceResource" effect)', () => {
      const v1Resource = new Pod({ id: 'a', metadata: { a: 'v1-a' } }, ctx);

      state.types[resourceType] = {
        list:       [v1Resource],
        map:        new Map([['a', v1Resource]]),
        generation: 1,
      };

      // Keep a reference to the *original list array* and *original resource object*
      const originalListRef = state.types[resourceType].list;
      const originalResourceRef = v1Resource;

      const newData = [
        { id: 'a', metadata: { a: 'v2-a' } }, // This is the update
      ];
      const newRevision = 'rev-2';

      loadPage(state, {
        type: resourceType, data: newData, ctx, pagination, revision: newRevision
      });

      const cache = state.types[resourceType];

      expect(cache.list).toBe(originalListRef);
      expect(cache.list).toHaveLength(1);

      expect(cache.list[0]).toBe(originalResourceRef);

      expect(originalResourceRef.metadata.a).toBe('v2-a');

      expect(cache.map.get('a')).toBe(originalResourceRef);

      expect(cache.generation).toBe(2);
      expect(cache.revision).toBe(newRevision);
    });

    it('should remove stale data from list and map (paging)', () => {
      const page1Proxy = new Pod({ id: 'a', name: 'stale-pod' }, ctx);

      state.types[resourceType] = {
        list:       [page1Proxy],
        map:        new Map([['a', page1Proxy]]),
        generation: 1,
      };

      const listRef = state.types[resourceType].list;

      const page2Data = [
        { id: 'b', name: 'new-pod' },
      ];

      loadPage(state, {
        type: resourceType, data: page2Data, ctx, pagination, revision
      });

      const cache = state.types[resourceType];

      expect(cache.list).toBe(listRef); // List reference must be preserved

      expect(cache.list).toHaveLength(1);
      expect(cache.list[0].id).toBe('b');

      expect(cache.map.size).toBe(1);
      expect(cache.map.has('a')).toBe(false); // Stale 'a' is gone
      expect(cache.map.has('b')).toBe(true);
    });

    it('should handle partial overlaps (update, remove stale, add new)', () => {
      // 1. Pre-load cache
      const staleResource = new Pod({ id: 'a', prop: 'stale-pod' }, ctx);
      const v1Resource = new Pod({ id: 'b', prop: 'v1-pod-b' }, ctx);

      state.types[resourceType] = {
        list:       [staleResource, v1Resource],
        map:        new Map([['a', staleResource], ['b', v1Resource]]),
        generation: 1,
      };

      const listRef = state.types[resourceType].list;
      const v1ResourceRef = v1Resource;

      const newData = [
        { id: 'b', prop: 'v2-pod-b' }, // Updated
        { id: 'c', prop: 'new-pod-c' }, // New
      ];

      loadPage(state, {
        type: resourceType, data: newData, ctx, pagination, revision
      });

      const cache = state.types[resourceType];

      expect(cache.list).toBe(listRef); // List reference preserved

      expect(cache.list).toHaveLength(2);
      expect(cache.list[0].id).toBe('b');
      expect(cache.list[1].id).toBe('c');

      expect(cache.list[0]).toBe(v1ResourceRef);
      expect(v1ResourceRef.prop).toBe('v2-pod-b');

      expect(cache.list[1]).toStrictEqual(expect.objectContaining({ id: 'c' }));

      expect(cache.map.size).toBe(2);
      expect(cache.map.has('a')).toBe(false); // Stale, removed
      expect(cache.map.get('b')).toBe(v1ResourceRef); // Updated
      expect(cache.map.get('c')).toBe(cache.list[1]); // Added
    });
  });
});
