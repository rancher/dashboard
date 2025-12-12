
import { PaginationFilterEquality, PaginationFilterField, PaginationParamFilter, PaginationParamProjectOrNamespace } from '@shell/types/store/pagination.types';
import { NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import stevePaginationUtils from '../steve-pagination-utils';
import Schema from '@shell/models/schema';

/**
 * The `NamespaceProjectFilters` class is a protected class within `steve-pagination-utils.ts`.
 * To test its protected methods, we extend it with a test class that exposes them.
 */
class TestNamespaceProjectFilters {
  public handlePrefAndSettingFilter(args: any) {
    return stevePaginationUtils.handlePrefAndSettingFilter(args);
  }

  public handleSystemOrUserFilter(args: any) {
    return stevePaginationUtils.handleSystemOrUserFilter(args);
  }

  public handleSelectionFilter(neu: string[], isLocalCluster: boolean) {
    return stevePaginationUtils.handleSelectionFilter(neu, isLocalCluster);
  }
}

describe('class: NamespaceProjectFilters', () => {
  const testNamespaceProjectFilters = new TestNamespaceProjectFilters();

  const normalNs = {
    id: 'normal', name: 'normal', isObscure: false, isSystem: false
  };
  const obscureNs = {
    id: 'obscure', name: 'obscure', isObscure: true, isSystem: false
  };
  const systemNs = {
    id: 'system', name: 'system', isObscure: false, isSystem: true
  };
  const obscureAndSystemNs = {
    id: 'obscure-system', name: 'obscure-system', isObscure: true, isSystem: true
  };

  const allNamespaces = [normalNs, obscureNs, systemNs, obscureAndSystemNs];

  describe('method: handlePrefAndSettingFilter', () => {
    it('should return no filters if all namespaces are shown', () => {
      const result = testNamespaceProjectFilters.handlePrefAndSettingFilter({
        allNamespaces,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  false,
      });

      expect(result).toStrictEqual([]);
    });

    it('should filter obscure namespaces if showReservedRancherNamespaces is false', () => {
      const result = testNamespaceProjectFilters.handlePrefAndSettingFilter({
        allNamespaces,
        showReservedRancherNamespaces: false,
        productHidesSystemNamespaces:  false,
      });

      expect(result).toHaveLength(1);
      expect(result).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          value: 'obscure,obscure-system', equality: ' NOTIN ', field: `metadata.namespace`
        })]
      }));
    });

    it('should filter system namespaces if productHidesSystemNamespaces is true', () => {
      const result = testNamespaceProjectFilters.handlePrefAndSettingFilter({
        allNamespaces,
        showReservedRancherNamespaces: true,
        productHidesSystemNamespaces:  true,
      });

      expect(result).toHaveLength(1);
      expect(result).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          value: 'system,obscure-system', equality: ' NOTIN ', field: `metadata.namespace`
        })]
      }));
    });

    it('should filter both obscure and system namespaces when both settings are active', () => {
      const result = testNamespaceProjectFilters.handlePrefAndSettingFilter({
        allNamespaces,
        showReservedRancherNamespaces: false,
        productHidesSystemNamespaces:  true,
      });

      expect(result).toHaveLength(1);
      expect(result).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          value: 'obscure,system,obscure-system', equality: ' NOTIN ', field: `metadata.namespace`
        })]
      }));
    });
  });

  describe('method: handleSystemOrUserFilter', () => {
    it('should create an OR filter for system namespaces when isAllSystem is true', () => {
      const result = testNamespaceProjectFilters.handleSystemOrUserFilter({
        allNamespaces,
        isAllSystem: true,
        isAllUser:   false,
      });

      expect(result).toHaveLength(1);
      const filter = result[0] as PaginationParamFilter;

      expect(filter.fields).toHaveLength(2);
      expect(filter.fields).toContainEqual(expect.objectContaining({
        value: 'system', equality: '=', field: 'metadata.namespace'
      }));
      expect(filter.fields).toContainEqual(expect.objectContaining({
        value: 'obscure-system', equality: '=', field: 'metadata.namespace'
      }));
    });

    it('should create AND filters to exclude system namespaces when isAllUser is true', () => {
      const result = testNamespaceProjectFilters.handleSystemOrUserFilter({
        allNamespaces,
        isAllSystem: false,
        isAllUser:   true,
      });

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          value: 'system', equality: '!=', field: 'metadata.namespace'
        })]
      }));
      expect(result).toContainEqual(expect.objectContaining({
        fields: [expect.objectContaining({
          value: 'obscure-system', equality: '!=', field: 'metadata.namespace'
        })]
      }));
    });
  });

  describe('method: handleSelectionFilter', () => {
    const selection = ['ns-1', `${ NAMESPACE_FILTER_P_FULL_PREFIX }p-1`];

    it('should create projectsOrNamespaces filter for a selection in a non-local cluster', () => {
      const result = testNamespaceProjectFilters.handleSelectionFilter(selection, false);

      expect(result.projectsOrNamespaces).toHaveLength(1);
      const pnsFilter = result.projectsOrNamespaces[0] as PaginationParamProjectOrNamespace;

      expect(pnsFilter.param).toBe('projectsornamespaces');
      expect(pnsFilter.fields).toHaveLength(2);
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-1' }));
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'p-1' }));
      expect(result.filters).toStrictEqual([]);
    });

    it('should create projectsOrNamespaces and an exclusion filter for a selection in a local cluster', () => {
      const result = testNamespaceProjectFilters.handleSelectionFilter(selection, true);

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
      const result = testNamespaceProjectFilters.handleSelectionFilter(nsSelection, true);

      expect(result.projectsOrNamespaces).toHaveLength(1);
      const pnsFilter = result.projectsOrNamespaces[0] as PaginationParamProjectOrNamespace;

      expect(pnsFilter.fields).toHaveLength(2);
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-1' }));
      expect(pnsFilter.fields).toContainEqual(expect.objectContaining({ value: 'ns-2' }));
      expect(result.filters).toStrictEqual([]);
    });

    it('should handle selections with only projects in a local cluster', () => {
      const projectSelection = [`${ NAMESPACE_FILTER_P_FULL_PREFIX }p-1`, `${ NAMESPACE_FILTER_P_FULL_PREFIX }p-2`];
      const result = testNamespaceProjectFilters.handleSelectionFilter(projectSelection, true);

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

class TestStevePaginationUtils {
  public convertPaginationParams(args: any) {
    return stevePaginationUtils.convertPaginationParams(args);
  }
}

describe('class StevePaginationUtils', () => {
  const testStevePaginationUtils = new TestStevePaginationUtils();
  const schema = { id: 'pod' } as unknown as Schema;

  it('should return an empty string for no filters', () => {
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters: [] });

    expect(result).toBe('');
  });

  it('should handle a single filter with a single field', () => {
    const filters = [
      new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: 'test' })] }),
    ];
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters });

    expect(result).toBe('filter=metadata.name=test');
  });

  it('should handle a single filter with a single field with encoded char', () => {
    const filters = [
      new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: 'te/st' })] }),
    ];
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters });

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
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters });

    expect(result).toBe('filter=metadata.name=test1,metadata.namespace=ns1');
  });

  it('should handle multiple filters (AND)', () => {
    const filters = [
      new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.name', value: 'test1' })] }),
      new PaginationParamFilter({ fields: [new PaginationFilterField({ field: 'metadata.namespace', value: 'ns1' })] }),
    ];
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters });

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
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters });

    expect(result).toBe('filter=spec.containers.image~nginx&filter=metadata.name!=test');
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
    const result = testStevePaginationUtils.convertPaginationParams({ schema, filters });

    expect(result).toBe('filter=metadata.name IN (test1,test2)&filter=metadata.namespace NOTIN (ns1,ns2)');
  });
});
