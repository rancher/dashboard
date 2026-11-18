import ResourceTableViews from '@shell/mixins/resource-table-views';
import { CONFIGURABLE_TABLES } from '@shell/store/features';
import { TABLE_VIEWS } from '@shell/store/prefs';
import type { TableViewField } from '@shell/types/table-views';

// The table views half of ResourceTable is its own mixin, so that is where this lives
const { data, computed, methods } = ResourceTableViews;

const HEADERS = [
  {
    name: 'name', label: 'Name', value: 'metadata.name'
  },
  {
    name: 'namespace', label: 'Namespace', value: 'metadata.namespace'
  },
];

interface Row {
  id: string;
  metadata: { name: string, namespace: string };
}

const row = (name: string, namespace: string): Row => ({ id: `${ namespace }/${ name }`, metadata: { name, namespace } });
const ROWS = [row('a', 'default'), row('b', 'kube'), row('c', 'kube')];

const SAVED = {
  views: [{
    id:             'kube',
    name:           'Kube',
    query:          'namespace:kube',
    columns:        ['name'],
    labelColumns:   [],
    groupBy:        'namespace',
    sort:           'namespace',
    sortDescending: true,
  }],
  defaultViewId: 'kube',
};

/**
 * A list of pods whose user has a default view saved, as the mixin sees it: its data, its
 * computed values read live off the same object, and its methods bound to it.
 */
function list(featureOn: boolean) {
  const dispatch = jest.fn();
  const base: Record<string, unknown> = {
    schema:                    { id: 'pod' },
    tableViews:                null,
    hasAdvancedFiltering:      false,
    externalPaginationEnabled: false,
    _headers:                  HEADERS,
    filteredRows:              ROWS,
    t:                         (key: string) => key,
    $store:                    {
      dispatch,
      getters: {
        'features/get': (name: string) => (name === CONFIGURABLE_TABLES ? featureOn : undefined),
        'prefs/get':    (key: string) => (key === TABLE_VIEWS ? { pod: SAVED } : undefined),
      },
    },
  };
  const ctx: Record<string, unknown> = Object.assign(base, data.call(base));

  Object.entries(computed).forEach(([name, get]) => {
    Object.defineProperty(ctx, name, { get: () => get.call(ctx), configurable: true });
  });
  Object.entries(methods).forEach(([name, method]) => {
    ctx[name] = method.bind(ctx);
  });

  return { ctx: ctx as Record<string, unknown> & typeof methods, dispatch };
}

describe('ResourceTable', () => {
  describe('with the table views feature turned off', () => {
    it('should keep the saved views, so they are all there when it is turned back on', () => {
      const { ctx } = list(false);

      expect(ctx.savedViews).toStrictEqual(SAVED.views);
      expect(ctx.openedViewId).toBe('kube');
    });

    it('should not filter, group or reshape the list by the saved default view', () => {
      const { ctx } = list(false);

      expect(ctx.showTableViews).toBe(false);
      expect(ctx.viewRows).toStrictEqual(ROWS);
      expect(ctx.viewGroupField).toBeNull();
      expect(ctx.viewHeaders).toBe(HEADERS);
    });

    it('should not take the saved default view\'s sort over the table\'s own', () => {
      const { ctx } = list(false);
      const view = ctx.view;

      ctx.recordSort({ sortBy: 'name', descending: false });

      expect(ctx.view).toBe(view);
      expect(ctx.defaultSort).toBeFalsy();
    });

    it('should not ask the api to count the saved views', async() => {
      const { ctx, dispatch } = list(false);

      await ctx.fetchViewCounts();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should apply the same default view once the feature is on', () => {
      const { ctx } = list(true);

      expect(ctx.showTableViews).toBe(true);
      expect((ctx.viewRows as Row[]).map((r) => r.metadata.name)).toStrictEqual(['b', 'c']);
      expect((ctx.viewGroupField as TableViewField | null)?.id).toBe('namespace');
    });
  });
});
