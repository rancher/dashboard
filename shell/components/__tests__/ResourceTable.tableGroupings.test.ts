import ResourceTable from '@shell/components/ResourceTable.vue';
import ExplorerProjectsNamespaces from '@shell/components/ExplorerProjectsNamespaces.vue';
import ResourceTableViews, { TABLE_GROUPING_PREFIX } from '@shell/mixins/resource-table-views';
import { IMPROVED_TABLES } from '@shell/store/features';
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
      const out = tableGroupings.call({ _groupOptions: [NONE, NODE], groupBy: null });

      expect(out.map((option) => option.value)).toStrictEqual(['role']);
    });

    it('should leave out the plain namespace option, which the namespace column already covers', () => {
      const out = tableGroupings.call({ _groupOptions: [NONE, { value: 'namespace' }], groupBy: null });

      expect(out).toStrictEqual([]);
    });

    it('should keep a namespace option that groups by something of its own', () => {
      expect(tableGroupings.call({ _groupOptions: [NONE, PROJECT], groupBy: null })).toStrictEqual([PROJECT]);
      expect(tableGroupings.call({ _groupOptions: [NONE, { value: 'namespace' }], groupBy: 'groupById' })).toHaveLength(1);
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
      const fields = computed.viewGroupFields.call({
        ...i18n,
        viewFields:         [column('name')],
        tableGroupings:     [NODE],
        tableGroupingLabel: methods.tableGroupingLabel,
      }) as TableViewField[];

      expect(fields.map((field) => `${ field.id }=${ field.label }`)).toStrictEqual([`${ TABLE_GROUPING_PREFIX }role=Node`, 'name=name']);
    });

    it('should drop a column one of those groupings already covers, by name or by path', () => {
      const fields = computed.viewGroupFields.call({
        ...i18n,
        viewFields:         [column('project', 'project.nameDisplay'), column('node', 'spec.nodeName'), column('name')],
        tableGroupings:     [PROJECT, NODE],
        tableGroupingLabel: methods.tableGroupingLabel,
      }) as TableViewField[];

      expect(fields.map((field) => field.id)).toStrictEqual([`${ TABLE_GROUPING_PREFIX }namespace`, `${ TABLE_GROUPING_PREFIX }role`, 'name']);
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
      const ctx = { tableGroupings: [PROJECT, NODE], view: { groupBy: `${ TABLE_GROUPING_PREFIX }role` } };

      expect(computed.viewTableGrouping.call(ctx)).toBe(NODE);
      expect(computed.viewTableGrouping.call({ ...ctx, view: { groupBy: 'namespace' } })).toBeNull();
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
  const store = (on: boolean) => ({ getters: { 'features/get': (name: string) => (name === IMPROVED_TABLES ? on : undefined) } });
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
