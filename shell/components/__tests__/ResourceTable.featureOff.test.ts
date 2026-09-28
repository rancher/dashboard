import ResourceTableViews from '@shell/mixins/resource-table-views';
import { IMPROVED_TABLES } from '@shell/store/features';
import { TABLE_VIEWS } from '@shell/store/prefs';

// The table views half of ResourceTable is its own mixin, so that is where this lives
const { data, computed, methods } = ResourceTableViews as any;

const HEADERS = [
  {
    name: 'name', label: 'Name', value: 'metadata.name'
  },
  {
    name: 'namespace', label: 'Namespace', value: 'metadata.namespace'
  },
];

const row = (name: string, namespace: string) => ({ id: `${ namespace }/${ name }`, metadata: { name, namespace } });
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
  const base: Record<string, any> = {
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
        'features/get': (name: string) => (name === IMPROVED_TABLES ? featureOn : undefined),
        'prefs/get':    (key: string) => (key === TABLE_VIEWS ? { pod: SAVED } : undefined),
      },
    },
  };
  const ctx: Record<string, any> = Object.assign(base, data.call(base));

  Object.keys(computed).forEach((name) => {
    const get = typeof computed[name] === 'function' ? computed[name] : computed[name].get;

    Object.defineProperty(ctx, name, { get: () => get.call(ctx), configurable: true });
  });
  Object.keys(methods).forEach((name) => {
    ctx[name] = methods[name].bind(ctx);
  });

  return { ctx, dispatch };
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
      expect(ctx.viewRows.map((r: any) => r.metadata.name)).toStrictEqual(['b', 'c']);
      expect(ctx.viewGroupField?.id).toBe('namespace');
    });
  });
});
