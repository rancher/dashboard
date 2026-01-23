import {
  column,
  ColumnBuilder,
  processHeadersConfig,
  type StandardColumnKey,
  type ColumnConfig,
  type HeadersConfig,
} from '@shell/core/column-builder';

// Mock the table headers modules
jest.mock('@shell/config/table-headers', () => ({
  STATE: {
    name:      'state',
    labelKey:  'tableHeaders.state',
    sort:      ['stateSort', 'nameSort'],
    value:     'stateDisplay',
    width:     100,
    formatter: 'BadgeStateFormatter',
  },
  NAME: {
    name:     'name',
    labelKey: 'tableHeaders.name',
    value:    'nameDisplay',
    sort:     ['nameSort'],
  },
  NAMESPACE: {
    name:     'namespace',
    labelKey: 'tableHeaders.namespace',
    value:    'metadata.namespace',
    sort:     ['metadata.namespace'],
  },
  AGE: {
    name:     'age',
    labelKey: 'tableHeaders.age',
    value:    'metadata.creationTimestamp',
    sort:     ['metadata.creationTimestamp:desc'],
    width:    120,
  },
  NODE: {
    name:     'node',
    labelKey: 'tableHeaders.node',
    value:    'spec.nodeName',
    sort:     ['spec.nodeName'],
  },
  PODS: {
    name:     'pods',
    labelKey: 'tableHeaders.pods',
    value:    'status.replicas',
  },
  TYPE: {
    name:     'type',
    labelKey: 'tableHeaders.type',
    value:    'typeDisplay',
  },
}));

jest.mock('@shell/config/pagination-table-headers', () => ({
  STEVE_NAME_COL: {
    name:  'name',
    label: 'Name',
    sort:  ['nameSort'],
  },
  STEVE_NAMESPACE_COL: {
    name:  'namespace',
    label: 'Namespace',
    sort:  ['namespaceSort'],
  },
  STEVE_AGE_COL: {
    name:  'age',
    label: 'Age',
    sort:  ['ageSort'],
  },
}));

describe('column-builder', () => {
  describe('columnBuilder class', () => {
    it('should create a column builder from standard column key', () => {
      const builder = new ColumnBuilder('state');

      expect(builder).toBeInstanceOf(ColumnBuilder);
    });

    it('should build column with default configuration', () => {
      const builder = new ColumnBuilder('state');
      const config = builder.build();

      expect(config).toMatchObject({
        name:      'state',
        labelKey:  'tableHeaders.state',
        sort:      ['stateSort', 'nameSort'],
        value:     'stateDisplay',
        width:     100,
        formatter: 'BadgeStateFormatter',
      });
    });

    it('should disable sorting with noSort()', () => {
      const config = column('state').noSort().build();

      expect(config.sort).toBe(false);
    });

    it('should disable searching with noSearch()', () => {
      const config = column('state').noSearch().build();

      expect(config.search).toBe(false);
    });

    it('should set custom sort path with sort()', () => {
      const config = column('state').sort('custom.path').build();

      expect(config.sort).toStrictEqual(['custom.path']);
    });

    it('should set multiple sort paths with sort()', () => {
      const config = column('state').sort(['path1', 'path2']).build();

      expect(config.sort).toStrictEqual(['path1', 'path2']);
    });

    it('should set custom search path with search()', () => {
      const config = column('state').search('custom.search').build();

      expect(config.search).toStrictEqual(['custom.search']);
    });

    it('should set multiple search paths with search()', () => {
      const config = column('state').search(['search1', 'search2']).build();

      expect(config.search).toStrictEqual(['search1', 'search2']);
    });

    it('should set column width with width()', () => {
      const config = column('state').width(200).build();

      expect(config.width).toBe(200);
    });

    it('should set custom label with label()', () => {
      const config = column('state').label('Custom Label').build();

      expect(config.label).toBe('Custom Label');
    });

    it('should set label translation key with labelKey()', () => {
      const config = column('state').labelKey('custom.i18n.key').build();

      expect(config.labelKey).toBe('custom.i18n.key');
    });

    it('should set value path with value() using string', () => {
      const config = column('state').value('custom.value.path').build();

      expect(config.value).toBe('custom.value.path');
    });

    it('should set getValue function with value() using function', () => {
      const getterFn = (row: any) => row.customValue;
      const config = column('state').value(getterFn).build();

      expect(config.getValue).toBe(getterFn);
    });

    it('should set formatter with formatter()', () => {
      const config = column('state').formatter('CustomFormatter').build();

      expect(config.formatter).toBe('CustomFormatter');
    });

    it('should set formatter with options', () => {
      const config = column('state').formatter('Badge', { color: 'blue' }).build();

      expect(config.formatter).toBe('Badge');
      expect(config.formatterOpts).toStrictEqual({ color: 'blue' });
    });

    it('should enable dashIfEmpty with dashIfEmpty()', () => {
      const config = column('state').dashIfEmpty().build();

      expect(config.dashIfEmpty).toBe(true);
    });

    it('should set alignment with align()', () => {
      const config = column('state').align('center').build();

      expect(config.align).toBe('center');
    });

    it('should set custom property with set()', () => {
      const config = column('state').set('customProp', 'customValue').build();

      expect((config as any).customProp).toBe('customValue');
    });

    it('should merge multiple properties with merge()', () => {
      const config = column('state').merge({
        width:  250,
        align:  'right',
        custom: 'value',
      }).build();

      expect(config.width).toBe(250);
      expect(config.align).toBe('right');
      expect((config as any).custom).toBe('value');
    });

    it('should support method chaining', () => {
      const config = column('state')
        .noSort()
        .noSearch()
        .width(150)
        .label('Status')
        .align('center')
        .dashIfEmpty()
        .build();

      expect(config).toMatchObject({
        name:        'state',
        sort:        false,
        search:      false,
        width:       150,
        label:       'Status',
        align:       'center',
        dashIfEmpty: true,
      });
    });

    it('should return config with toConfig() alias', () => {
      const builder = column('state');
      const config1 = builder.build();
      const config2 = builder.toConfig();

      expect(config1).toStrictEqual(config2);
    });

    it('should warn on unknown standard column', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const builder = new ColumnBuilder('nonexistent' as StandardColumnKey);
      const config = builder.build();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown standard column: "nonexistent"'
      );
      expect(config.name).toBe('nonexistent');

      consoleWarnSpy.mockRestore();
    });

    it('should create builder from custom column config', () => {
      const customConfig: ColumnConfig = {
        name:  'custom',
        label: 'Custom Column',
        value: 'spec.custom',
        sort:  ['spec.custom'],
        width: 180,
        align: 'right',
      };

      const builder = new ColumnBuilder(customConfig);
      const config = builder.build();

      expect(config).toMatchObject(customConfig);
    });

    it('should allow modifying custom column config', () => {
      const customConfig: ColumnConfig = {
        name:  'custom',
        label: 'Custom',
        value: 'spec.custom',
      };

      const config = new ColumnBuilder(customConfig)
        .width(200)
        .noSort()
        .build();

      expect(config).toMatchObject({
        name:  'custom',
        label: 'Custom',
        value: 'spec.custom',
        width: 200,
        sort:  false,
      });
    });
  });

  describe('column() helper function', () => {
    it('should create a ColumnBuilder instance', () => {
      const builder = column('state');

      expect(builder).toBeInstanceOf(ColumnBuilder);
    });

    it('should accept standard column key', () => {
      const config = column('name').build();

      expect(config.name).toBe('name');
    });

    it('should accept custom column config', () => {
      const customConfig: ColumnConfig = {
        name:  'custom',
        label: 'Custom',
      };

      const config = column(customConfig).build();

      expect(config).toMatchObject(customConfig);
    });
  });

  describe('processHeadersConfig', () => {
    describe('preset configurations', () => {
      it('should process namespaced preset', () => {
        const config: HeadersConfig = {
          preset:     'namespaced',
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(4);
        expect(result.defaults[0].name).toBe('state');
        expect(result.defaults[1].name).toBe('name');
        expect(result.defaults[2].name).toBe('namespace');
        expect(result.defaults[3].name).toBe('age');
      });

      it('should process cluster preset', () => {
        const config: HeadersConfig = {
          preset:     'cluster',
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(3);
        expect(result.defaults[0].name).toBe('state');
        expect(result.defaults[1].name).toBe('name');
        expect(result.defaults[2].name).toBe('age');
      });

      it('should process workload preset', () => {
        const config: HeadersConfig = {
          preset:     'workload',
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults.length).toBeGreaterThan(4);
        expect(result.defaults.map((c) => c.name)).toContain('state');
        expect(result.defaults.map((c) => c.name)).toContain('name');
        expect(result.defaults.map((c) => c.name)).toContain('namespace');
        expect(result.defaults.map((c) => c.name)).toContain('type');
      });

      it('should process storage preset', () => {
        const config: HeadersConfig = {
          preset:     'storage',
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(4);
        expect(result.defaults.map((c) => c.name)).toContain('state');
        expect(result.defaults.map((c) => c.name)).toContain('name');
        expect(result.defaults.map((c) => c.name)).toContain('namespace');
        expect(result.defaults.map((c) => c.name)).toContain('age');
      });
    });

    describe('preset with additional columns', () => {
      it('should add columns to preset', () => {
        const config: HeadersConfig = {
          preset:     'namespaced',
          add:        ['pods', 'node'],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(6);
        expect(result.defaults.map((c) => c.name)).toContain('pods');
        expect(result.defaults.map((c) => c.name)).toContain('node');
      });

      it('should add columns in correct order', () => {
        const config: HeadersConfig = {
          preset:     'cluster',
          add:        ['pods'],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        // Should be: state, name, age, pods
        expect(result.defaults[0].name).toBe('state');
        expect(result.defaults[1].name).toBe('name');
        expect(result.defaults[2].name).toBe('age');
        expect(result.defaults[3].name).toBe('pods');
      });
    });

    describe('explicit columns configuration', () => {
      it('should process explicit column keys', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'name', 'node', 'age'],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(4);
        expect(result.defaults[0].name).toBe('state');
        expect(result.defaults[1].name).toBe('name');
        expect(result.defaults[2].name).toBe('node');
        expect(result.defaults[3].name).toBe('age');
      });

      it('should process ColumnBuilder instances', () => {
        const config: HeadersConfig = {
          columns: [
            'state',
            column('name').noSort(),
            'age',
          ],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(3);
        expect(result.defaults[1].name).toBe('name');
        expect(result.defaults[1].sort).toBe(false);
      });

      it('should process custom column configs', () => {
        const config: HeadersConfig = {
          columns: [
            'state',
            {
              name:  'custom',
              label: 'Custom Field',
              value: 'spec.custom',
              width: 150,
            },
            'age',
          ],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(3);
        expect(result.defaults[1].name).toBe('custom');
        expect(result.defaults[1].label).toBe('Custom Field');
        expect(result.defaults[1].value).toBe('spec.custom');
        expect(result.defaults[1].width).toBe(150);
      });

      it('should handle mixed column types', () => {
        const config: HeadersConfig = {
          columns: [
            'state',
            column('name').width(200),
            {
              name:  'custom',
              label: 'Custom',
            },
            'age',
          ],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(4);
        expect(result.defaults[0].name).toBe('state');
        expect(result.defaults[1].name).toBe('name');
        expect(result.defaults[1].width).toBe(200);
        expect(result.defaults[2].name).toBe('custom');
        expect(result.defaults[3].name).toBe('age');
      });
    });

    describe('pagination configuration', () => {
      it('should auto-map columns for pagination: auto', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'name', 'namespace', 'age'],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.pagination).toHaveLength(4);
        expect(result.pagination[1].name).toBe('name');
        expect(result.pagination[2].name).toBe('namespace');
        expect(result.pagination[3].name).toBe('age');
      });

      it('should use same columns for pagination: same', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'name', 'namespace'],
          pagination: 'same',
        };

        const result = processHeadersConfig(config);

        expect(result.pagination).toStrictEqual(result.defaults);
      });

      it('should default to auto when pagination not specified', () => {
        const config: HeadersConfig = { columns: ['state', 'name', 'namespace'] };

        const result = processHeadersConfig(config);

        // When pagination is undefined, it defaults to 'auto'
        expect(result.pagination.length).toBeGreaterThan(0);
      });

      it('should process custom pagination configuration', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'name', 'namespace'],
          pagination: {
            state:     'state',
            name:      'name',
            namespace: 'namespace',
          },
        };

        const result = processHeadersConfig(config);

        expect(result.pagination).toHaveLength(3);
      });
    });

    describe('column overrides', () => {
      it('should apply overrides to preset columns', () => {
        const config: HeadersConfig = {
          preset:     'namespaced',
          override:   { name: { width: 300, sort: false } },
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        const nameColumn = result.defaults.find((c) => c.name === 'name');

        expect(nameColumn?.width).toBe(300);
        expect(nameColumn?.sort).toBe(false);
      });

      it('should apply overrides to explicit columns', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'name', 'age'],
          override:   { state: { align: 'center', width: 80 }, age: { formatter: 'CustomAge' } },
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        const stateColumn = result.defaults.find((c) => c.name === 'state');
        const ageColumn = result.defaults.find((c) => c.name === 'age');

        expect(stateColumn?.align).toBe('center');
        expect(stateColumn?.width).toBe(80);
        expect(ageColumn?.formatter).toBe('CustomAge');
      });

      it('should not create new columns in override', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'name'],
          override:   { nonexistent: { width: 100 } },
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(2);
        expect(result.defaults.find((c) => c.name === 'nonexistent')).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty columns array', () => {
        const config: HeadersConfig = { columns: [], pagination: 'auto' };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(0);
        expect(result.pagination).toHaveLength(0);
      });

      it('should handle config with no columns or preset', () => {
        const config: HeadersConfig = { pagination: 'auto' };

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(0);
      });

      it('should handle invalid standard column keys gracefully', () => {
        const config: HeadersConfig = {
          columns:    ['state', 'invalid-column' as StandardColumnKey, 'age'],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        // Invalid columns should still be included with basic config
        expect(result.defaults).toHaveLength(3);
        expect(result.defaults[1].name).toBe('invalid-column');
      });

      it('should preserve column order from config', () => {
        const config: HeadersConfig = {
          columns:    ['age', 'namespace', 'name', 'state'],
          pagination: 'auto',
        };

        const result = processHeadersConfig(config);

        expect(result.defaults[0].name).toBe('age');
        expect(result.defaults[1].name).toBe('namespace');
        expect(result.defaults[2].name).toBe('name');
        expect(result.defaults[3].name).toBe('state');
      });

      it('should handle complex nested configuration', () => {
        /* eslint-disable key-spacing */
        const config: HeadersConfig = {
          preset:     'namespaced',
          add:        [
            column('pods').width(100).noSort(),
            {
              name:  'custom',
              label: 'Custom',
              value: 'spec.custom',
            },
          ],
          override:   { name: { width: 250 } },
          pagination: 'auto',
        };
        /* eslint-enable key-spacing */

        const result = processHeadersConfig(config);

        expect(result.defaults).toHaveLength(6);
        expect(result.defaults.map((c) => c.name)).toContain('pods');
        expect(result.defaults.map((c) => c.name)).toContain('custom');

        const nameColumn = result.defaults.find((c) => c.name === 'name');
        const podsColumn = result.defaults.find((c) => c.name === 'pods');

        expect(nameColumn?.width).toBe(250);
        expect(podsColumn?.sort).toBe(false);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should create workload resource headers configuration', () => {
      const config: HeadersConfig = {
        preset:     'workload',
        pagination: 'auto',
      };

      const result = processHeadersConfig(config);

      expect(result.defaults.length).toBeGreaterThan(4);
      expect(result.pagination.length).toBeGreaterThan(0);
    });

    it('should create service resource headers with custom columns', () => {
      const config: HeadersConfig = {
        preset:     'namespaced',
        add:        ['type', 'pods'],
        pagination: 'auto',
      };

      const result = processHeadersConfig(config);

      expect(result.defaults.map((c) => c.name)).toStrictEqual([
        'state',
        'name',
        'namespace',
        'age',
        'type',
        'pods',
      ]);
    });

    it('should create CRD headers with fully custom columns', () => {
      const config: HeadersConfig = {
        columns: [
          'state',
          'name',
          'namespace',
          {
            name:      'spec',
            label:     'Specification',
            value:     'spec.config.value',
            sort:      ['spec.config.value'],
            search:    ['spec.config.value'],
            width:     200,
            formatter: 'json',
          },
          column('age').width(100),
        ],
        pagination: 'auto',
      };

      const result = processHeadersConfig(config);

      expect(result.defaults).toHaveLength(5);

      const specColumn = result.defaults[3];

      expect(specColumn.name).toBe('spec');
      expect(specColumn.label).toBe('Specification');
      expect(specColumn.value).toBe('spec.config.value');
      expect(specColumn.width).toBe(200);
    });

    it('should handle headers for ingress resources', () => {
      const config: HeadersConfig = {
        columns:  ['state', 'name', 'namespace', 'age'],
        override: {
          name: {
            sort:   'spec.rules[0].host',
            search: false,
          },
        },
        pagination: 'auto',
      };

      const result = processHeadersConfig(config);

      const nameColumn = result.defaults.find((c) => c.name === 'name');

      expect(nameColumn?.sort).toBe('spec.rules[0].host');
      expect(nameColumn?.search).toBe(false);
    });
  });
});
