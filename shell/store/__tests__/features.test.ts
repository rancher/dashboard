import {
  getters,
  actions,
  mapFeature,
  create,
  MULTI_CLUSTER,
  LEGACY,
  RKE2,
} from '@shell/store/features';
import { MANAGEMENT } from '@shell/config/types';

describe('features store', () => {
  describe('create', () => {
    it('returns the feature name', () => {
      const name = 'test-feature-create-only';
      const result = create(name, true);

      expect(result).toStrictEqual(name);
    });
  });

  describe('mapFeature', () => {
    it('calls the features/get getter with the feature name', () => {
      const mockGetFn = jest.fn(() => true);
      const ctx = { $store: { getters: { 'features/get': mockGetFn } } };
      const mapped = mapFeature('some-feature');

      const result = mapped.get.call(ctx);

      expect(mockGetFn).toHaveBeenCalledWith('some-feature');
      expect(result).toBe(true);
    });

    it('set throws an error indicating the store is get-only', () => {
      const mapped = mapFeature('some-feature');

      expect(() => mapped.set(true)).toThrow('The feature store only supports getting');
    });
  });

  describe('getters', () => {
    describe('get', () => {
      it('throws for an unknown feature name', () => {
        const rootGetters = { 'management/byId': jest.fn(() => undefined) };

        expect(() => getters.get({}, {}, {}, rootGetters)('unknown-feature-xyz')).toThrow('Unknown feature: unknown-feature-xyz');
      });

      it('returns entry.enabled from the server when an entry is found', () => {
        const entry = { enabled: false };
        const rootGetters = { 'management/byId': jest.fn(() => entry) };

        const result = getters.get({}, {}, {}, rootGetters)(MULTI_CLUSTER);

        expect(result).toBe(false);
      });

      it.each([
        {
          desc:     'multi-cluster-management (default true)',
          feature:  MULTI_CLUSTER,
          expected: true,
        },
        {
          desc:     'legacy (default false)',
          feature:  LEGACY,
          expected: false,
        },
        {
          desc:     'rke2 (default true)',
          feature:  RKE2,
          expected: true,
        },
      ])('returns the registered default when no server entry exists for $desc', ({ feature, expected }) => {
        const rootGetters = { 'management/byId': jest.fn(() => undefined) };

        const result = getters.get({}, {}, {}, rootGetters)(feature);

        expect(result).toBe(expected);
      });

      it('calls management/byId with the MANAGEMENT.FEATURE type and the feature name', () => {
        const byId = jest.fn(() => undefined);
        const rootGetters = { 'management/byId': byId };

        getters.get({}, {}, {}, rootGetters)(RKE2);

        expect(byId).toHaveBeenCalledWith(MANAGEMENT.FEATURE, RKE2);
      });
    });
  });

  describe('actions', () => {
    describe('loadServer', () => {
      it('dispatches management/findAll when canList returns true', async() => {
        const findAllResult = [{ name: 'feature-1' }];
        const dispatch = jest.fn().mockResolvedValue(findAllResult);
        const rootGetters = { 'management/canList': jest.fn(() => true) };

        const result = await actions.loadServer({ rootGetters, dispatch });

        expect(dispatch).toHaveBeenCalledWith(
          'management/findAll',
          { type: MANAGEMENT.FEATURE, opt: { watch: false } },
          { root: true }
        );
        expect(result).toStrictEqual(findAllResult);
      });

      it('does not dispatch when canList returns false', async() => {
        const dispatch = jest.fn();
        const rootGetters = { 'management/canList': jest.fn(() => false) };

        const result = await actions.loadServer({ rootGetters, dispatch });

        expect(dispatch).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
      });

      it('calls management/canList with the MANAGEMENT.FEATURE type', async() => {
        const canList = jest.fn(() => false);
        const dispatch = jest.fn();
        const rootGetters = { 'management/canList': canList };

        await actions.loadServer({ rootGetters, dispatch });

        expect(canList).toHaveBeenCalledWith(MANAGEMENT.FEATURE);
      });
    });
  });
});
