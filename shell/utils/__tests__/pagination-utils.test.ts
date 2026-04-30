import paginationUtils from '@shell/utils/pagination-utils';
import {
  NAMESPACE_FILTER_ALL_USER,
  NAMESPACE_FILTER_ALL,
  NAMESPACE_FILTER_ALL_SYSTEM,
  NAMESPACE_FILTER_NAMESPACED_YES,
  NAMESPACE_FILTER_NAMESPACED_NO,
  NAMESPACE_FILTER_KINDS,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
  NAMESPACE_FILTER_P_FULL_PREFIX,
} from '@shell/utils/namespace-filter';
import { PAGINATION_SETTINGS_STORE_DEFAULTS } from '@shell/plugins/steve/steve-pagination-utils';
import { PaginationSettings } from '@shell/types/resources/settings';
import { PaginationArgs, PaginationParam } from '@shell/types/store/pagination.types';

/** Helper to build a plain PaginationParam-shaped object for testing */
const makeParam = (param: string, equals: boolean, fields: any[]): PaginationParam => ({
  param,
  equals,
  fields,
} as unknown as PaginationParam);

describe('paginationUtils', () => {
  describe('validateNsProjectFilter', () => {
    it.each([
      [`${ NAMESPACE_FILTER_NS_FULL_PREFIX }my-namespace`, true],
      [`${ NAMESPACE_FILTER_P_FULL_PREFIX }my-project`, true],
      [NAMESPACE_FILTER_ALL, true],
      [NAMESPACE_FILTER_ALL_SYSTEM, true],
      [NAMESPACE_FILTER_ALL_USER, true],
      [NAMESPACE_FILTER_NAMESPACED_YES, true],
      [NAMESPACE_FILTER_NAMESPACED_NO, true],
      [NAMESPACE_FILTER_KINDS.NAMESPACE, true],
      [NAMESPACE_FILTER_KINDS.PROJECT, true],
      ['unknown-filter', false],
      ['all://orphans', false],
      ['', false],
    ])('validates "%s" as %s', (filter, expected) => {
      expect(paginationUtils.validateNsProjectFilter(filter)).toStrictEqual(expected);
    });
  });

  describe('validateNsProjectFilters', () => {
    it('returns true for an empty array', () => {
      expect(paginationUtils.validateNsProjectFilters([])).toStrictEqual(true);
    });

    it('returns true when all filters are valid', () => {
      expect(paginationUtils.validateNsProjectFilters([NAMESPACE_FILTER_ALL, `${ NAMESPACE_FILTER_NS_FULL_PREFIX }kube-system`])).toStrictEqual(true);
    });

    it('returns false when at least one filter is invalid', () => {
      expect(paginationUtils.validateNsProjectFilters([NAMESPACE_FILTER_ALL, 'not-valid'])).toStrictEqual(false);
    });

    it('returns false when all filters are invalid', () => {
      expect(paginationUtils.validateNsProjectFilters(['bad-a', 'bad-b'])).toStrictEqual(false);
    });
  });

  describe('paginationFilterEqual', () => {
    it('returns true for identical params with no fields', () => {
      const a = makeParam('filter', true, []);
      const b = makeParam('filter', true, []);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(true);
    });

    it('returns false for different param names', () => {
      const a = makeParam('filter', true, []);
      const b = makeParam('projectsornamespaces', true, []);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(false);
    });

    it('returns false for different equals values', () => {
      const a = makeParam('filter', true, []);
      const b = makeParam('filter', false, []);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(false);
    });

    it('returns true for same fields in same order', () => {
      const fields = [{ field: 'metadata.name', value: 'test' }];
      const a = makeParam('filter', true, fields);
      const b = makeParam('filter', true, fields);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(true);
    });

    it('returns true for same fields in different order (position-agnostic)', () => {
      const a = makeParam('filter', true, [
        { field: 'metadata.name', value: 'foo' },
        { field: 'metadata.namespace', value: 'bar' },
      ]);
      const b = makeParam('filter', true, [
        { field: 'metadata.namespace', value: 'bar' },
        { field: 'metadata.name', value: 'foo' },
      ]);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(true);
    });

    it('returns false for different field values', () => {
      const a = makeParam('filter', true, [{ field: 'metadata.name', value: 'foo' }]);
      const b = makeParam('filter', true, [{ field: 'metadata.name', value: 'bar' }]);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(false);
    });

    it('returns false for different field names', () => {
      const a = makeParam('filter', true, [{ field: 'metadata.name', value: 'x' }]);
      const b = makeParam('filter', true, [{ field: 'metadata.namespace', value: 'x' }]);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when field counts differ', () => {
      const a = makeParam('filter', true, [{ field: 'a', value: '1' }, { field: 'b', value: '2' }]);
      const b = makeParam('filter', true, [{ field: 'a', value: '1' }]);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(false);
    });
  });

  describe('paginationFiltersEqual', () => {
    it('returns true for two empty arrays', () => {
      expect(paginationUtils.paginationFiltersEqual([], [])).toStrictEqual(true);
    });

    it('returns false when first array is longer', () => {
      const p = makeParam('filter', true, []);

      expect(paginationUtils.paginationFiltersEqual([p], [])).toStrictEqual(false);
    });

    it('returns false when second array is longer', () => {
      const p = makeParam('filter', true, []);

      expect(paginationUtils.paginationFiltersEqual([], [p])).toStrictEqual(false);
    });

    it('returns true for arrays with identical params', () => {
      const p = makeParam('filter', true, []);

      expect(paginationUtils.paginationFiltersEqual([p], [p])).toStrictEqual(true);
    });

    it('returns false when params differ in equals', () => {
      const a = [makeParam('filter', true, [])];
      const b = [makeParam('filter', false, [])];

      expect(paginationUtils.paginationFiltersEqual(a, b)).toStrictEqual(false);
    });

    it('returns true for multiple matching params', () => {
      const p1 = makeParam('filter', true, [{ field: 'x', value: '1' }]);
      const p2 = makeParam('projectsornamespaces', false, []);

      expect(paginationUtils.paginationFiltersEqual([p1, p2], [p1, p2])).toStrictEqual(true);
    });
  });

  describe('paginationEqual', () => {
    it('returns true for two undefined args', () => {
      expect(paginationUtils.paginationEqual(undefined, undefined)).toStrictEqual(true);
    });

    it('returns true for identical args', () => {
      const args = {
        page: 1, pageSize: 10, sort: [], filters: [], projectsOrNamespaces: []
      } as unknown as PaginationArgs;

      expect(paginationUtils.paginationEqual(args, { ...args })).toStrictEqual(true);
    });

    it('returns false when page differs', () => {
      const a = {
        page: 1, pageSize: 10, sort: [], filters: [], projectsOrNamespaces: []
      } as unknown as PaginationArgs;
      const b = { ...a, page: 2 };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when pageSize differs', () => {
      const a = {
        page: 1, pageSize: 10, sort: [], filters: [], projectsOrNamespaces: []
      } as unknown as PaginationArgs;
      const b = { ...a, pageSize: 20 };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when sort field differs', () => {
      const a = {
        page:                 1,
        sort:                 [{ field: 'metadata.name', asc: true }],
        filters:              [],
        projectsOrNamespaces: [],
      } as unknown as PaginationArgs;
      const b = { ...a, sort: [{ field: 'metadata.namespace', asc: true }] };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when sort direction differs', () => {
      const a = {
        page:                 1,
        sort:                 [{ field: 'metadata.name', asc: true }],
        filters:              [],
        projectsOrNamespaces: [],
      } as unknown as PaginationArgs;
      const b = { ...a, sort: [{ field: 'metadata.name', asc: false }] };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('sort comparison is position-sensitive (not agnostic)', () => {
      const sort1 = [{ field: 'a', asc: true }, { field: 'b', asc: false }];
      const sort2 = [{ field: 'b', asc: false }, { field: 'a', asc: true }];
      const a = {
        page:                 1,
        sort:                 sort1,
        filters:              [],
        projectsOrNamespaces: [],
      } as unknown as PaginationArgs;
      const b = { ...a, sort: sort2 };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when filters differ', () => {
      const a = {
        page:                 1,
        sort:                 [],
        filters:              [makeParam('filter', true, []) as any],
        projectsOrNamespaces: [],
      } as unknown as PaginationArgs;
      const b = { ...a, filters: [makeParam('filter', false, []) as any] };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when projectsOrNamespaces differ', () => {
      const a = {
        page:                 1,
        sort:                 [],
        filters:              [],
        projectsOrNamespaces: [makeParam('projectsornamespaces', true, []) as any],
      } as unknown as PaginationArgs;
      const b = { ...a, projectsOrNamespaces: [makeParam('projectsornamespaces', false, []) as any] };

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });
  });

  describe('getStoreSettings', () => {
    it('returns store defaults when useDefaultStores is true', () => {
      const settings: PaginationSettings = { useDefaultStores: true };

      expect(paginationUtils.getStoreSettings(settings)).toStrictEqual(PAGINATION_SETTINGS_STORE_DEFAULTS);
    });

    it('returns store defaults when useDefaultStores is absent', () => {
      const settings = {} as PaginationSettings;

      expect(paginationUtils.getStoreSettings(settings)).toStrictEqual(PAGINATION_SETTINGS_STORE_DEFAULTS);
    });

    it('returns store defaults when useDefaultStores is false but no stores provided', () => {
      const settings: PaginationSettings = { useDefaultStores: false };

      expect(paginationUtils.getStoreSettings(settings)).toStrictEqual(PAGINATION_SETTINGS_STORE_DEFAULTS);
    });

    it('returns custom stores when useDefaultStores is false and stores are provided', () => {
      const customStores = { cluster: { resources: { enableAll: true } } } as any;
      const settings: PaginationSettings = {
        useDefaultStores: false,
        stores:           customStores,
      };

      expect(paginationUtils.getStoreSettings(settings)).toStrictEqual(customStores);
    });
  });
});
