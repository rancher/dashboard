import ResourceTable from '@shell/components/ResourceTable.vue';
import ExplorerProjectsNamespaces from '@shell/components/ExplorerProjectsNamespaces.vue';
import ResourceTableViews, { MONTH_GROUPING_PREFIX, TABLE_GROUPING_PREFIX } from '@shell/mixins/resource-table-views';
import { CONFIGURABLE_TABLES } from '@shell/store/features';
import { GROUP_RESOURCES } from '@shell/store/prefs';
import type { TableViewField } from '@shell/types/table-views';

// The table views half of ResourceTable is its own mixin, so that is where most of these live
const { computed, methods } = ResourceTableViews;

interface GroupOption {
  value: string;
  tooltipKey?: string;
  labelKey?: string;
  field?: string;
  hideColumn?: string;
}

const NONE: GroupOption = { value: 'none', tooltipKey: 'resourceTable.groupBy.none' };
const PROJECT: GroupOption = {
  value: 'namespace', tooltipKey: 'resourceTable.groupBy.project', field: 'groupById', hideColumn: 'project'
};
const NODE: GroupOption = {
  value: 'role', tooltipKey: 'resourceTable.groupBy.node', field: 'spec.nodeName'
};

const TRANSLATIONS: Record<string, string> = {
  'resourceTable.groupBy.project': 'Group by Project',
  'resourceTable.groupBy.node':    'Group by Node',
  'tableViews.group.by.project':   'Project',
  'tableViews.group.by.node':      'Node',
  'tableViews.group.by.type':      'Type',
};

const i18n = {
  $store: { getters: { 'i18n/exists': (key: string) => key in TRANSLATIONS } },
  t:      (key: string) => TRANSLATIONS[key] || key,
};

const column = (name: string, value = name): TableViewField => ({
  id:      name,
  label:   name,
  isLabel: false,
  header:  {
    name, value, sort: [value]
  }
});

describe('ResourceTable', () => {
  describe('tableGroupings', () => {
    const { tableGroupings } = ResourceTable.computed as unknown as Record<string, (this: object) => GroupOption[]>;

    it('should offer a list\'s own groupings, never the flat list', () => {
      const out = tableGroupings.call({
        showGrouping: true, _groupOptions: [NONE, NODE], groupBy: null
      });

      expect(out.map((option) => option.value)).toStrictEqual(['role']);
    });

    it('should offer none while the list says it can\'t be grouped', () => {
      expect(tableGroupings.call({
        showGrouping: false, _groupOptions: [NONE, NODE], groupBy: null
      })).toStrictEqual([]);
    });

    it('should leave out the plain namespace option, which the namespace column already covers', () => {
      const out = tableGroupings.call({
        showGrouping: true, _groupOptions: [NONE, { value: 'namespace' }], groupBy: null
      });

      expect(out).toStrictEqual([]);
    });

    it('should keep a namespace option that groups by something of its own', () => {
      expect(tableGroupings.call({
        showGrouping: true, _groupOptions: [NONE, PROJECT], groupBy: null
      })).toStrictEqual([PROJECT]);
      expect(tableGroupings.call({
        showGrouping: true, _groupOptions: [NONE, { value: 'namespace' }], groupBy: 'groupById'
      })).toHaveLength(1);
    });
  });

  describe('group', () => {
    const { group } = ResourceTable.computed as unknown as Record<string, { get: (this: object) => string }>;

    it('should follow the toolbar when it shows, and be none for a column grouping', () => {
      expect(group.get.call({ showTableViews: true, viewTableGrouping: PROJECT })).toBe('namespace');
      expect(group.get.call({ showTableViews: true, viewTableGrouping: null })).toBe('none');
    });

    it('should still follow the old buttons\' preference without the toolbar', () => {
      const ctx = {
        showTableViews: false, _groupOptions: [NONE, NODE], _group: 'role', groupDefault: 'none'
      };

      expect(group.get.call(ctx)).toBe('role');
    });
  });

  it('should tell the page how the table is grouped', () => {
    const $emit = jest.fn();
    const { group } = ResourceTable.watch as unknown as Record<string, { handler: (this: object, value: string) => void }>;

    group.handler.call({ $emit }, 'namespace');

    expect($emit).toHaveBeenCalledWith('group-change', 'namespace');
  });

  describe('the Group By menu', () => {
    it('should list the table\'s own groupings first, under their short names', () => {
      const viewFields = [column('name')];
      const fields = computed.viewGroupFields.call({
        ...i18n,
        viewFields,
        viewSortableFields: viewFields,
        viewDateFields:     [],
        tableGroupings:     [NODE],
        tableGroupingLabel: methods.tableGroupingLabel,
      }) as TableViewField[];

      expect(fields.map((field) => `${ field.id }=${ field.label }`)).toStrictEqual([`${ TABLE_GROUPING_PREFIX }role=Node`, 'name=name']);
    });

    it('should drop a column one of those groupings already covers, by name or by path', () => {
      const viewFields = [column('project', 'project.nameDisplay'), column('node', 'spec.nodeName'), column('name')];
      const fields = computed.viewGroupFields.call({
        ...i18n,
        viewFields,
        viewSortableFields: viewFields,
        viewDateFields:     [],
        tableGroupings:     [PROJECT, NODE],
        tableGroupingLabel: methods.tableGroupingLabel,
      }) as TableViewField[];

      expect(fields.map((field) => field.id)).toStrictEqual([`${ TABLE_GROUPING_PREFIX }namespace`, `${ TABLE_GROUPING_PREFIX }role`, 'name']);
    });

    it('should suggest the columns it can sort by, even one a grouping of its own covers in Group By', () => {
      const label = { ...column('label:app'), isLabel: true };
      const data = { ...column('data'), header: { name: 'data', value: 'data' } };
      const viewFields = [column('name'), column('node', 'spec.nodeName'), data, label];
      const viewSortableFields = computed.viewSortableFields.call({ viewFields, serverSideTableViews: false }) as TableViewField[];
      const suggested = computed.viewFilterFields.call({
        viewFields, viewSortableFields, viewDateFields: []
      }) as TableViewField[];

      expect(viewSortableFields.map((field) => field.id)).toStrictEqual(['name', 'node', 'label:app']);
      expect(suggested.map((field) => field.id)).toStrictEqual(['name', 'node']);
    });

    it('should suggest the dates it leaves out of Group By, in the order the table has them', () => {
      const age = { ...column('age', 'metadata.creationTimestamp'), isDate: true };
      const viewFields = [column('name'), age];
      const ctx = {
        viewFields, serverSideTableViews: false, filteredRows: [{ metadata: { creationTimestamp: '2026-09-28T19:02:29Z' } }]
      };
      const viewSortableFields = computed.viewSortableFields.call(ctx) as TableViewField[];
      const viewDateFields = computed.viewDateFields.call(ctx) as TableViewField[];
      const suggested = computed.viewFilterFields.call({
        viewFields, viewSortableFields, viewDateFields
      }) as TableViewField[];

      expect(viewSortableFields.map((field) => field.id)).toStrictEqual(['name']);
      expect(suggested.map((field) => field.id)).toStrictEqual(['name', 'age']);
    });

    it('should offer a date as a date on a server side list only where the api holds it as one', () => {
      const date = (name: string, path: string) => ({
        ...column(name), isDate: true, paginationHeader: { name, sort: path }
      });
      const viewFields = [date('age', 'metadata.creationTimestamp'), date('lastseen', 'metadata.fields.0:desc')];
      // Both hold dates on the page, so only where the api holds them decides
      const filteredRows = [{ age: '2026-09-28T19:02:29Z', lastseen: '2026-09-28T19:02:29Z' }];
      const dates = computed.viewDateFields.call({
        viewFields, serverSideTableViews: true, filteredRows
      }) as TableViewField[];

      // The printed column is relative text, "23m", which no date can match
      expect(dates.map((field) => field.id)).toStrictEqual(['age']);
    });

    it('should not offer a date column with no dates in it - text such as "23m", or nothing scheduled yet', () => {
      const lastSeen = { ...column('lastseen', 'lastSeen'), isDate: true };
      const disableAfter = { ...column('user-disabled-in', 'disabledIn'), isDate: true };
      const filteredRows = [{ lastSeen: '23m', disabledIn: 0 }, { lastSeen: '2h', disabledIn: 0 }];
      const dates = computed.viewDateFields.call({
        viewFields: [lastSeen, disableAfter], serverSideTableViews: false, filteredRows
      }) as TableViewField[];

      expect(dates).toStrictEqual([]);
    });

    it('should offer only the columns the api can be asked about on a server side list', () => {
      const cpu = { ...column('cpu', 'status.allocatable.cpuRaw'), paginationHeader: { name: 'cpu', sort: ['status.allocatable.cpuRaw'] } };
      const age = {
        ...column('age'),
        isDate:           true,
        paginationHeader: {
          name: 'age', sort: 'metadata.creationTimestamp', search: false
        }
      };
      const sortable = computed.viewSortableFields.call({ viewFields: [cpu, age, column('name')], serverSideTableViews: true }) as TableViewField[];
      const suggested = computed.viewFilterFields.call({
        viewFields: [cpu, age, column('name')], viewSortableFields: sortable, viewDateFields: []
      }) as TableViewField[];

      expect(sortable.map((field) => field.id)).toStrictEqual(['cpu']);
      expect(suggested.map((field) => field.id)).toStrictEqual(['cpu']);
    });

    it.each([
      ['its own label', {
        value: 'kind', tooltipKey: 'fleet.application.groupBy', labelKey: 'tableViews.group.by.type'
      }, 'Type'],
      ['the short name matching its tooltip', PROJECT, 'Project'],
      ['its tooltip, with no short name', { value: 'x', tooltipKey: 'ext.groupBy.thing' }, 'ext.groupBy.thing'],
      ['its value, with nothing else', { value: 'x' }, 'x'],
    ])('should name a grouping by %s', (_, option, expected) => {
      expect(methods.tableGroupingLabel.call(i18n, option)).toBe(expected);
    });

    it('should know which of the table\'s groupings the view has picked', () => {
      const ctx = {
        tableGroupings: [PROJECT, NODE], view: { groupBy: `${ TABLE_GROUPING_PREFIX }role` }, defaultGroupBy: null, groupByOf: methods.groupByOf
      };

      expect(computed.viewTableGrouping.call(ctx)).toBe(NODE);
      expect(computed.viewTableGrouping.call({ ...ctx, view: { groupBy: 'namespace' } })).toBeNull();
    });
  });

  describe('a table that groups by default', () => {
    const { defaultGroupBy } = ResourceTable.computed as unknown as Record<string, (this: object) => string | null>;
    const POOL: GroupOption = {
      value: 'poolId', tooltipKey: 'resourceTable.groupBy.pool', field: 'poolId', hideColumn: 'pool'
    };

    it('should start grouped by the grouping the list names as its default', () => {
      expect(defaultGroupBy.call({ groupDefault: 'poolId', tableGroupings: [POOL] })).toBe(`${ TABLE_GROUPING_PREFIX }poolId`);
    });

    it.each([
      ['every list\'s fallback to namespace', 'namespace', [PROJECT]],
      ['a default the table doesn\'t offer', 'poolId', [NODE]],
    ])('should start flat on %s', (_, groupDefault, tableGroupings) => {
      expect(defaultGroupBy.call({ groupDefault, tableGroupings })).toBeNull();
    });

    it.each([
      ['nothing, as the table\'s default', null, `${ TABLE_GROUPING_PREFIX }poolId`],
      ['another grouping', 'state', 'state'],
      ['none, turning the default off', 'none', null],
    ])('should show a view that picked %s', (_, groupBy, expected) => {
      expect(methods.groupByOf.call({ defaultGroupBy: `${ TABLE_GROUPING_PREFIX }poolId` }, { groupBy })).toBe(expected);
    });

    it('should show a view with no grouping flat on a table with no default', () => {
      expect(methods.groupByOf.call({ defaultGroupBy: null }, { groupBy: null })).toBeNull();
    });
  });

  it('should open on the table as it comes, whatever the old grouping buttons were left on', () => {
    const view = ResourceTableViews.data.call({
      schema: { id: 'pod' },
      $store: {
        state:   { prefs: { data: { [GROUP_RESOURCES]: 'role' } } },
        getters: { 'prefs/get': (key: string) => (key === GROUP_RESOURCES ? 'role' : undefined) },
      },
    }).view;

    expect(view.groupBy).toBeNull();
  });

  describe('a page\'s own group heading', () => {
    const slots = {
      'header-right': jest.fn(), 'group-by': jest.fn(), 'cell:name': jest.fn()
    };

    it('should be kept for the table\'s own grouping', () => {
      const out = computed.passthroughSlots.call({
        $slots: slots, viewGroupField: null, showGrouping: true, showTableViews: true
      });

      expect(Object.keys(out)).toStrictEqual(['group-by', 'cell:name']);
    });

    it('should give way to the table\'s heading when a column is grouped by', () => {
      const out = computed.passthroughSlots.call({
        $slots: slots, viewGroupField: column('state'), showGrouping: true, showTableViews: true
      });

      expect(Object.keys(out)).toStrictEqual(['cell:name']);
    });
  });
});

describe('ResourceTable columns while grouped', () => {
  const { showNamespaceColumn } = ResourceTable.computed as unknown as Record<string, (this: object) => boolean>;

  it('should keep the namespace column when the toolbar groups by namespace', () => {
    expect(showNamespaceColumn.call({
      group: 'namespace', showGrouping: true, showTableViews: true
    })).toBe(true);
  });

  it('should hide it as it always did without the toolbar', () => {
    expect(showNamespaceColumn.call({
      group: 'namespace', showGrouping: true, showTableViews: false
    })).toBe(false);
  });
});

describe('ExplorerProjectsNamespaces', () => {
  const { groupMode, headers } = ExplorerProjectsNamespaces.computed as unknown as Record<string, (this: object) => unknown>;
  const store = (on: boolean) => ({ getters: { 'features/get': (name: string) => (name === CONFIGURABLE_TABLES ? on : undefined) } });
  const headerNames = (on: boolean, mode: string) => (headers.call({
    $store: store(on), groupMode: mode, t: (key: string) => key, isHarvester: false
  }) as { name: string }[]).map((header) => header.name);

  it('should keep the project column while grouped by project, so the View menu decides the columns', () => {
    expect(headerNames(true, 'namespace')).toStrictEqual(headerNames(true, 'none'));
    expect(headerNames(true, 'namespace')).toContain('project');
  });

  it('should drop it while grouped by project with the feature off, as it always did', () => {
    expect(headerNames(false, 'namespace')).not.toContain('project');
  });

  it('should group by project as the table does, whatever the old preference says', () => {
    expect(groupMode.call({
      $store: store(true), tableGroup: 'namespace', groupPreference: 'none'
    })).toBe('namespace');
    expect(groupMode.call({
      $store: store(true), tableGroup: 'none', groupPreference: 'namespace'
    })).toBe('none');
  });

  it('should start ungrouped, whatever the old preference says, until the table has reported', () => {
    expect(groupMode.call({
      $store: store(true), tableGroup: null, groupPreference: 'namespace'
    })).toBe('none');
  });

  it('should follow the old preference with the feature off, exactly as it did', () => {
    expect(groupMode.call({
      $store: store(false), tableGroup: 'none', groupPreference: 'role'
    })).toBe('role');
  });
});

describe('grouping a date by month', () => {
  const age: TableViewField = {
    id:      'age',
    label:   'Age',
    isLabel: false,
    isDate:  true,
    header:  {
      name: 'age', value: 'metadata.creationTimestamp', sort: 'metadata.creationTimestamp:desc'
    }
  };
  const name = column('name');
  const ctx = {
    viewFields:     [name, age],
    viewDateFields: [age],
    monthGrouping:  methods.monthGrouping,
  };

  it('should offer a date column in Group By, grouped by month, under its own name in its own place', () => {
    const fields = computed.viewGroupFields.call({
      ...ctx, tableGroupings: [], viewSortableFields: [name], tableGroupingLabel: methods.tableGroupingLabel
    }) as TableViewField[];

    expect(fields.map((field) => `${ field.id }=${ field.label }`)).toStrictEqual(['name=name', `${ MONTH_GROUPING_PREFIX }age=Age`]);
  });

  it('should find the month grouping a view names, and nothing for a date the list has no dates in', () => {
    const found = methods.groupFieldFor.call(ctx, `${ MONTH_GROUPING_PREFIX }age`);

    expect(found).toMatchObject({ byMonth: true, header: age.header });
    expect(methods.groupFieldFor.call({ ...ctx, viewDateFields: [] }, `${ MONTH_GROUPING_PREFIX }age`)).toBeNull();
    expect(methods.groupFieldFor.call(ctx, 'name')).toBe(name);
  });

  it('should keep a month\'s rows together by sorting on the date itself', () => {
    const found = methods.groupFieldFor.call(ctx, `${ MONTH_GROUPING_PREFIX }age`) as TableViewField;

    expect(methods.groupSortFor.call(ctx, found)).toBe('metadata.creationTimestamp');
  });

  it('should gather rows under the month they fall in, and the undated under "none"', () => {
    const { computedGroupBy } = ResourceTable.computed as unknown as Record<string, (this: object) => (row: object) => string>;
    const key = computedGroupBy.call({ viewGroupField: methods.groupFieldFor.call(ctx, `${ MONTH_GROUPING_PREFIX }age`), t: (k: string) => (k === 'tableViews.group.empty' ? '(none)' : k) });

    expect(key({ metadata: { creationTimestamp: '2026-09-28T19:02:29Z' } })).toBe('2026-09');
    expect(key({ metadata: {} })).toBe('(none)');
  });
});
