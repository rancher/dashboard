import debounce from 'lodash/debounce';
import ResourceTableViews from '@shell/mixins/resource-table-views';

// The table views half of ResourceTable is its own mixin, so that is where these live
const { methods, watch } = ResourceTableViews;
const { viewFiltersApplied } = ResourceTableViews.computed;

type Watcher = (this: unknown, neu?: unknown, old?: unknown) => void;

const STATE_FILTER = { fields: [{ field: 'metadata.state.name', value: 'updating' }] };

/** A server side list showing `args`, with the switch methods and watchers on it */
function list(args: object) {
  const ctx: Record<string, unknown> = {
    serverSideTableViews:   true,
    externalPaginationArgs: args,
    pendingViewFilters:     [],
    supersededViewFilters:  [],
    viewSwitching:          false,
    viewSwitchTimer:        null,
    viewSwitchFromArgs:     null,
    settledQuery:           '',
    view:                   { query: '' },
  };

  ctx.debouncedSettleQuery = debounce((query: string) => {
    ctx.settledQuery = query;
  }, 1000);
  Object.defineProperty(ctx, 'viewFiltersApplied', { get: () => viewFiltersApplied.call(ctx) });
  Object.entries(methods).forEach(([name, method]) => {
    ctx[name] = method.bind(ctx);
  });

  const on = (name: string, ...values: unknown[]) => (watch[name as keyof typeof watch] as Watcher).call(ctx, ...values);

  return { ctx: ctx as Record<string, unknown> & typeof methods, on };
}

describe('ResourceTable', () => {
  describe('switching views on a server side list', () => {
    afterEach(() => jest.useRealTimers());

    it('should keep waiting through the answer to a request made before the switch', () => {
      const before = { filters: [] };
      const { ctx, on } = list(before);

      // A view grouping differently, filtering as the last did
      ctx.beginViewSwitch();
      on('externalPaginationResult');

      expect(ctx.viewSwitching).toBe(true);
    });

    it('should stop waiting on the answer to the request the view makes', () => {
      const { ctx, on } = list({ filters: [] });

      ctx.beginViewSwitch();
      ctx.externalPaginationArgs = { filters: [], sort: [{ field: 'status.info.kubernetesVersion' }] };
      on('externalPaginationResult');

      expect(ctx.viewSwitching).toBe(false);
    });

    it('should keep waiting while the request carries the old view\'s filters', () => {
      const { ctx, on } = list({ filters: [STATE_FILTER] });

      ctx.supersededViewFilters = [STATE_FILTER];
      ctx.pendingViewFilters = [];
      ctx.beginViewSwitch();
      ctx.externalPaginationArgs = { filters: [STATE_FILTER], sort: [{ field: 'spec.displayName' }] };
      on('externalPaginationResult');

      expect(ctx.viewSwitching).toBe(true);
    });

    it('should stop waiting when the view asks for the page already in hand', () => {
      const { ctx, on } = list({ filters: [], sort: [{ field: 'spec.displayName' }] });

      ctx.beginViewSwitch();
      ctx.externalPaginationArgs = { filters: [], sort: [{ field: 'spec.displayName' }] };
      on('externalPaginationArgs', ctx.externalPaginationArgs);

      expect(ctx.viewSwitching).toBe(false);
    });
  });

  describe('opening a tab', () => {
    it('should apply its query at once, even from an empty one', () => {
      jest.useFakeTimers();
      const { ctx, on } = list({ filters: [] });

      ctx.openTabView({ query: 'state:updating' });
      on('view.query', 'state:updating', '');

      expect(ctx.settledQuery).toBe('state:updating');
      jest.runAllTimers();
      expect(ctx.settledQuery).toBe('state:updating');
    });

    it('should still wait for typing to pause', () => {
      jest.useFakeTimers();
      const { ctx, on } = list({ filters: [] });

      ctx.view = { query: 'state:upd' };
      on('view.query', 'state:upd', 'state:up');

      expect(ctx.settledQuery).toBe('');
      jest.runAllTimers();
      expect(ctx.settledQuery).toBe('state:upd');
    });
  });
});
