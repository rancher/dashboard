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
import { PaginationArgs, PaginationFilterField, PaginationParam } from '@shell/types/store/pagination.types';

/** Helper to build a plain PaginationParam-shaped object for testing */
const makeParam = (param: string, equals: boolean, fields: any[]): PaginationParam => ({
  param,
  equals,
  fields,
} as unknown as PaginationParam);

/** Helper to build a PaginationArgs object with sensible defaults */
const makeArgs = (overrides: Partial<PaginationArgs> = {}): PaginationArgs => ({
  page:                 1,
  pageSize:             10,
  sort:                 [],
  filters:              [],
  projectsOrNamespaces: [],
  ...overrides,
} as unknown as PaginationArgs);

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
      // Edge cases: prefix without a value
      [NAMESPACE_FILTER_NS_FULL_PREFIX, true],
      [NAMESPACE_FILTER_P_FULL_PREFIX, true],
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

    it('returns undefined when input is undefined (optional chaining)', () => {
      expect(paginationUtils.validateNsProjectFilters(undefined as any)).toBeUndefined();
    });

    it('returns true for a single valid filter in the array', () => {
      expect(paginationUtils.validateNsProjectFilters([NAMESPACE_FILTER_ALL])).toStrictEqual(true);
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

    it('handles duplicate fields correctly (position-agnostic does not double-match)', () => {
      const a = makeParam('filter', true, [
        { field: 'metadata.name', value: 'foo' },
        { field: 'metadata.name', value: 'foo' },
      ]);
      const b = makeParam('filter', true, [
        { field: 'metadata.name', value: 'foo' },
        { field: 'metadata.name', value: 'bar' },
      ]);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(false);
    });

    it('returns true with real PaginationFilterField instances', () => {
      const fieldA = new PaginationFilterField({
        field: 'metadata.name', value: 'test', equals: true, exact: true
      });
      const fieldB = new PaginationFilterField({
        field: 'metadata.name', value: 'test', equals: true, exact: true
      });
      const a = makeParam('filter', true, [fieldA]);
      const b = makeParam('filter', true, [fieldB]);

      expect(paginationUtils.paginationFilterEqual(a, b)).toStrictEqual(true);
    });

    it('returns false with real PaginationFilterField instances differing in equality', () => {
      const fieldA = new PaginationFilterField({
        field: 'metadata.name', value: 'test', equals: true, exact: true
      });
      const fieldB = new PaginationFilterField({
        field: 'metadata.name', value: 'test', equals: false, exact: true
      });
      const a = makeParam('filter', true, [fieldA]);
      const b = makeParam('filter', true, [fieldB]);

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

    it('is position-sensitive (same params in different order returns false)', () => {
      const p1 = makeParam('filter', true, [{ field: 'x', value: '1' }]);
      const p2 = makeParam('projectsornamespaces', true, [{ field: 'y', value: '2' }]);

      expect(paginationUtils.paginationFiltersEqual([p1, p2], [p2, p1])).toStrictEqual(false);
    });
  });

  describe('paginationEqual', () => {
    it('returns true for two undefined args', () => {
      expect(paginationUtils.paginationEqual(undefined, undefined)).toStrictEqual(true);
    });

    it('returns false when first arg is undefined and second is defined', () => {
      const args = makeArgs();

      expect(paginationUtils.paginationEqual(undefined, args)).toStrictEqual(false);
    });

    it('returns false when first arg is defined and second is undefined', () => {
      const args = makeArgs();

      expect(paginationUtils.paginationEqual(args, undefined)).toStrictEqual(false);
    });

    it('returns true for identical args', () => {
      const args = makeArgs();

      expect(paginationUtils.paginationEqual(args, { ...args })).toStrictEqual(true);
    });

    it.each([
      ['page', { page: 2 }],
      ['pageSize', { pageSize: 20 }],
    ])('returns false when %s differs', (_field, override) => {
      const a = makeArgs();
      const b = makeArgs(override);

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when sort field differs', () => {
      const a = makeArgs({ sort: [{ field: 'metadata.name', asc: true }] });
      const b = makeArgs({ sort: [{ field: 'metadata.namespace', asc: true }] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when sort direction differs', () => {
      const a = makeArgs({ sort: [{ field: 'metadata.name', asc: true }] });
      const b = makeArgs({ sort: [{ field: 'metadata.name', asc: false }] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('sort comparison is position-sensitive (not agnostic)', () => {
      const a = makeArgs({ sort: [{ field: 'a', asc: true }, { field: 'b', asc: false }] });
      const b = makeArgs({ sort: [{ field: 'b', asc: false }, { field: 'a', asc: true }] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns true when sort has same entries in same order', () => {
      const sort = [{ field: 'a', asc: true }, { field: 'b', asc: false }];
      const a = makeArgs({ sort: [...sort] });
      const b = makeArgs({ sort: [...sort] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(true);
    });

    it('returns false when filters differ', () => {
      const a = makeArgs({ filters: [makeParam('filter', true, []) as any] });
      const b = makeArgs({ filters: [makeParam('filter', false, []) as any] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when projectsOrNamespaces differ', () => {
      const a = makeArgs({ projectsOrNamespaces: [makeParam('projectsornamespaces', true, []) as any] });
      const b = makeArgs({ projectsOrNamespaces: [makeParam('projectsornamespaces', false, []) as any] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns false when sort count differs', () => {
      const a = makeArgs({ sort: [{ field: 'a', asc: true }] });
      const b = makeArgs({ sort: [{ field: 'a', asc: true }, { field: 'b', asc: false }] });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(false);
    });

    it('returns true when both have empty optional arrays', () => {
      const a = makeArgs({
        sort: [], filters: [], projectsOrNamespaces: []
      });
      const b = makeArgs({
        sort: [], filters: [], projectsOrNamespaces: []
      });

      expect(paginationUtils.paginationEqual(a, b)).toStrictEqual(true);
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

    it('returns store defaults when settings is undefined (via overload)', () => {
      const settings = undefined as unknown as PaginationSettings;

      expect(paginationUtils.getStoreSettings(settings)).toStrictEqual(PAGINATION_SETTINGS_STORE_DEFAULTS);
    });
  });
});
