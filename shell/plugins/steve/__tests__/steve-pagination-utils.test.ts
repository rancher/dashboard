
import { PaginationFilterEquality, PaginationFilterField, PaginationParamFilter, PaginationParamProjectOrNamespace } from '@shell/types/store/pagination.types';
import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import stevePaginationUtils from '../steve-pagination-utils';
import { Schema } from '@shell/plugins/steve/schema';

// The methods exercised below are `protected` on `NamespaceProjectFilters` or `private` on
// `StevePaginationUtils`. They are reached by element access, which TypeScript permits because
// visibility is checked on property access only. That keeps them hidden from production callers
// while preserving the argument and return types here.

type PrefAndSettingArgs = Parameters<(typeof stevePaginationUtils)['handlePrefAndSettingFilter']>[0];

/**
 * `Namespace` is deliberately left unexported by `steve-pagination-utils` (it is itself a
 * `check-plugins-build` workaround, see the comment on the interface), so it is derived here from
 * the method signature rather than promoted to that module's public API.
 */
type Namespace = PrefAndSettingArgs['allNamespaces'][number];

/**
 * Only `name`, `isObscure` and `isSystem` are read by the filters under test. The cast covers the
 * rest of the `Namespace` model.
 */
const namespaceFixture = ({ name, isObscure = false, isSystem = false }: { name: string, isObscure?: boolean, isSystem?: boolean }) => ({
  id: name, name, isObscure, isSystem
} as unknown as Namespace);

describe('class: NamespaceProjectFilters', () => {
  const normalNs = namespaceFixture({ name: 'normal' });
  const obscureNs = namespaceFixture({ name: 'obscure', isObscure: true });
  const systemNs = namespaceFixture({ name: 'system', isSystem: true });
  const obscureAndSystemNs = namespaceFixture({
    name: 'obscure-system', isObscure: true, isSystem: true
  });

  const allNamespaces = [normalNs, obscureNs, systemNs, obscureAndSystemNs];

  describe('method: handlePrefAndSettingFilter', () => {
    it('should return no filters if all namespaces are shown', () => {
      const result = stevePaginationUtils['handlePrefAndSettingFilter']({
        allNamespaces,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  false,
      });

      expect(result).toStrictEqual({});
    });

    it('should filter obscure namespaces if showReservedRancherNamespaces is false', () => {
      const result = stevePaginationUtils['handlePrefAndSettingFilter']({
        allNamespaces,
        showReservedRancherNamespaces: false,
        productHidesSystemNamespaces:  false,
      });

      expect(result).toStrictEqual({
        obscure:          false,
        'obscure-system': false
      });
    });

    it('should filter system namespaces if productHidesSystemNamespaces is true', () => {
      const result = stevePaginationUtils['handlePrefAndSettingFilter']({
        allNamespaces,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  true,
      });

      expect(result).toStrictEqual({
        system:           false,
        'obscure-system': false
      });
    });

    it('should filter both obscure and system namespaces when both settings are active', () => {
      const result = stevePaginationUtils['handlePrefAndSettingFilter']({
        allNamespaces,
        showReservedRancherNamespaces: false,
        productHidesSystemNamespaces:  true,
      });

      expect(result).toStrictEqual({
        obscure:          false,
        system:           false,
        'obscure-system': false
      });
    });
  });

  describe('method: handleSystemOrUserFilter', () => {
    it('should create an OR filter for system namespaces when isAllSystem is true', () => {
      const result = stevePaginationUtils['handleSystemOrUserFilter']({
        allNamespaces,
        isAllSystem: true,
        isAllUser:   false,
      });

      expect(result).toStrictEqual({
        system:           true,
        'obscure-system': true
      });
    });

    it('should create AND filters to exclude system namespaces when isAllUser is true', () => {
      const result = stevePaginationUtils['handleSystemOrUserFilter']({
        allNamespaces,
        isAllSystem: false,
        isAllUser:   true,
      });

      expect(result).toStrictEqual({
        system:           false,
        'obscure-system': false
      });
    });
  });

  describe('method: combineNsProjectFilterResults', () => {
    it('should merge two results, prioritizing the first', () => {
      const a = { ns1: true, ns2: false };
      const b = { ns2: true, ns3: true };
      const result = stevePaginationUtils['combineNsProjectFilterResults'](a, b);

      expect(result).toStrictEqual({
        ns1: true,
        ns2: false, // kept from a
        ns3: true // added from b
      });
    });
  });

  describe('method: createFiltersFromNamespaceProjectFilterResult', () => {
    it('should create IN filter if there are included namespaces', () => {
      const input = {
        ns1: true, ns2: true, ns3: false
      };
      const result = stevePaginationUtils['createFiltersFromNamespaceProjectFilterResult'](input);

      expect(result).toHaveLength(1);
      expect(result[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.IN,
        value:    'ns1,ns2'
      });
    });

    it('should create NOT_IN filter if there are only excluded namespaces', () => {
      const input = { ns1: false, ns2: false };
      const result = stevePaginationUtils['createFiltersFromNamespaceProjectFilterResult'](input);

      expect(result).toHaveLength(1);
      expect(result[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.NOT_IN,
        value:    'ns1,ns2'
      });
    });

    it('should return empty array if input is empty', () => {
      const input = {};
      const result = stevePaginationUtils['createFiltersFromNamespaceProjectFilterResult'](input);

      expect(result).toHaveLength(0);
    });
  });

  describe('method: handleSelectionFilter', () => {
    const selection = ['ns-1', `${ NAMESPACE_FILTER_P_FULL_PREFIX }p-1`];

    it('should create projectsOrNamespaces filter for a selection in a non-local cluster', () => {
      const result = stevePaginationUtils['handleSelectionFilter'](selection, false);

      expect(result.projectsOrNamespaces).toHaveLength(1);
      const pnsFilter = result.projectsOrNamespaces[0] as PaginationParamProjectOrNamespace;

      expect(pnsFilter.param).toBe('projectsornamespaces');
      expect(pnsFilter.fields).toHaveLength(2);
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-1' }));
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'p-1' }));
      expect(result.filters).toStrictEqual([]);
    });

    it('should create projectsOrNamespaces and an exclusion filter for a selection in a local cluster', () => {
      const result = stevePaginationUtils['handleSelectionFilter'](selection, true);

      // projectsOrNamespaces part
      expect(result.projectsOrNamespaces).toHaveLength(1);
      const pnsFilter = result.projectsOrNamespaces[0] as PaginationParamProjectOrNamespace;

      expect(pnsFilter.param).toBe('projectsornamespaces');
      expect(pnsFilter.fields).toHaveLength(2);
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-1' }));
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'p-1' }));

      // filters part
      expect(result.filters).toHaveLength(1);
      const filter = result.filters[0] as PaginationParamFilter;

      expect(filter.fields).toHaveLength(1);
      expect(filter.fields).toContainEqual(expect.objectContaining({
        field:    'metadata.namespace',
        equality: '!=',
        value:    'p-1',
      }));
    });

    it('should handle selections with only namespaces in a local cluster', () => {
      const nsSelection = ['ns-1', 'ns-2'];
      const result = stevePaginationUtils['handleSelectionFilter'](nsSelection, true);

      expect(result.projectsOrNamespaces).toHaveLength(1);
      const pnsFilter = result.projectsOrNamespaces[0] as PaginationParamProjectOrNamespace;

      expect(pnsFilter.fields).toHaveLength(2);
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-1' }));
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-2' }));
      expect(result.filters).toStrictEqual([]);
    });

    it('should handle selections with only projects in a local cluster', () => {
      const projectSelection = [`${ NAMESPACE_FILTER_P_FULL_PREFIX }p-1`, `${ NAMESPACE_FILTER_P_FULL_PREFIX }p-2`];
      const result = stevePaginationUtils['handleSelectionFilter'](projectSelection, true);

      expect(result.projectsOrNamespaces).toHaveLength(1);
      const pnsFilter = result.projectsOrNamespaces[0] as PaginationParamProjectOrNamespace;

      expect(pnsFilter.fields).toHaveLength(2);
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'p-1' }));
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'p-2' }));

      expect(result.filters).toHaveLength(2);
      expect(result.filters).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          field:    'metadata.namespace',
          equality: '!=',
          value:    'p-1'
        })],
      }));
      expect(result.filters).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          field:    'metadata.namespace',
          equality: '!=',
          value:    'p-2'
        })],
      }));
    });
  });
});

describe('class StevePaginationUtils', () => {
  const schema = { id: 'pod' } as Schema;

  describe('method: createParamsFromNsFilter', () => {
    const allNamespaces = [
      namespaceFixture({ name: 'normal' }),
      namespaceFixture({ name: 'obscure', isObscure: true }),
      namespaceFixture({ name: 'system', isSystem: true }),
    ];

    it('should return empty filters if all namespaces requested and settings allow all', () => {
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection:                     [],
        isAllNamespaces:               true,
        isLocalCluster:                false,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  false,
      });

      expect(result.projectsOrNamespaces).toHaveLength(0);
      expect(result.filters).toHaveLength(0);
    });

    it('should filter obscure namespaces if showReservedRancherNamespaces is false', () => {
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection:                     [],
        isAllNamespaces:               true,
        isLocalCluster:                false,
        showReservedRancherNamespaces: false,
        productHidesSystemNamespaces:  false,
      });

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.NOT_IN,
        value:    'obscure'
      });
    });

    it('should filter system namespaces if productHidesSystemNamespaces is true', () => {
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection:                     [],
        isAllNamespaces:               true,
        isLocalCluster:                false,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  true,
      });

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.NOT_IN,
        value:    'system'
      });
    });

    it('should filter both obscure and system namespaces when both settings are active', () => {
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection:                     [],
        isAllNamespaces:               true,
        isLocalCluster:                false,
        showReservedRancherNamespaces: false,
        productHidesSystemNamespaces:  true,
      });

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.NOT_IN,
        value:    'obscure,system'
      });
    });

    it('should handle ALL_SYSTEM selection', () => {
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection:                     [NAMESPACE_FILTER_ALL_SYSTEM],
        isAllNamespaces:               false,
        isLocalCluster:                false,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  false,
      });

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.IN,
        value:    'system'
      });
    });

    it('should handle ALL_USER selection', () => {
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection:                     [NAMESPACE_FILTER_ALL_USER],
        isAllNamespaces:               false,
        isLocalCluster:                false,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  false,
      });

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].fields[0]).toMatchObject({
        field:    'metadata.namespace',
        equality: PaginationFilterEquality.NOT_IN,
        value:    'system'
      });
    });

    it('should handle specific project/namespace selection', () => {
      const selection = ['ns-1'];
      const result = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces,
        selection,
        isAllNamespaces:               false,
        isLocalCluster:                false,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  false,
      });

      expect(result.projectsOrNamespaces).toHaveLength(1);
      expect(result.projectsOrNamespaces[0].fields[0].value).toBe('ns-1');
    });
  });

  describe('method: convertPaginationParams', () => {
    it('should return an empty string for no filters', () => {
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters: [] });

      expect(result).toBe('');
    });

    it('should handle a single filter with a single field', () => {
      const filters = [
        new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: 'test' })] }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe('filter=metadata.name=test');
    });

    it('should handle a single filter with a single field with encoded char', () => {
      const filters = [
        new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: 'te/st' })] }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe('filter=metadata.name="te%2Fst"');
    });

    it('should handle a single filter with multiple fields (OR)', () => {
      const filters = [
        new PaginationParamFilter({
          fields: [
            new PaginationFilterField({ field: 'metadata.name', value: 'test1' }),
            new PaginationFilterField({ field: 'metadata.namespace', value: 'ns1' }),
          ],
        }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe('filter=metadata.name=test1,metadata.namespace=ns1');
    });

    it('should handle multiple filters (AND)', () => {
      const filters = [
        new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: 'test1' })] }),
        new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.namespace', value: 'ns1' })] }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe('filter=metadata.name=test1&filter=metadata.namespace=ns1');
    });

    it('should handle different equality operators', () => {
      const filters = [
        new PaginationParamFilter({
          fields: [
            new PaginationFilterField({
              field:    'spec.containers.image',
              value:    'nginx',
              equality: PaginationFilterEquality.CONTAINS,
            }),
          ],
        }),
        new PaginationParamFilter({
          fields: [
            new PaginationFilterField({
              field:    'metadata.name',
              value:    'test',
              equality: PaginationFilterEquality.NOT_EQUALS,
            }),
          ],
        }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe('filter=spec.containers.image~nginx&filter=metadata.name!=test');
    });

    it.each([
      ['test', 'test'],
      ['-test', '"-test"'],
      ['te-st', '"te-st"'],
      ['test-', '"test-"'],
    ])('should handle filter value %s with hyphens', (x, y) => {
      const filters = [
        new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: x })] }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe(`filter=metadata.name=${ y }`);
    });

    it('should handle IN and NOT_IN operators', () => {
      const filters = [
        new PaginationParamFilter({
          fields: [
            new PaginationFilterField({
              field:    'metadata.name',
              value:    'test1,test2',
              equality: PaginationFilterEquality.IN,
            }),
          ],
        }),
        new PaginationParamFilter({
          fields: [
            new PaginationFilterField({
              field:    'metadata.namespace',
              value:    'ns1,ns2',
              equality: PaginationFilterEquality.NOT_IN,
            }),
          ],
        }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe('filter=metadata.name IN (test1,test2)&filter=metadata.namespace NOTIN (ns1,ns2)');
    });

    it.each([
      [null, '""'],
      [undefined, '""'],
      [false, 'false'],
      [true, 'true'],
      [0, '0'],
      [1, '1'],
    ])('should handle falsy filter value %s', (x: any, y) => {
      const filters = [
        new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: x })] }),
      ];
      const result = stevePaginationUtils['convertPaginationParams']({ schema, filters });

      expect(result).toBe(`filter=metadata.name=${ y }`);
    });
  });
});
