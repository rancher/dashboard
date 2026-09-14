import TableViewsBar from '@shell/components/TableViews/TableViewsBar.vue';

const { selectedViewId, activeViewId } = (TableViewsBar as any).computed;
const { isSameConfig } = (TableViewsBar as any).methods;

const EMPTY = {
  query: '', columns: null, labelColumns: [], groupBy: null
};

function makeView(id: string, name: string, overrides = {}) {
  return {
    id, name, ...EMPTY, ...overrides
  };
}

describe('TableViewsBar', () => {
  describe('selectedViewId', () => {
    // Two saved views can hold the same config - a duplicate, or one saved on top of another.
    const running = { query: 'state:Running', groupBy: 'namespace' };
    const first = makeView('aaa', 'Need attention', running);
    const second = makeView('bbb', 'test', running);

    function createContext(editingViewId: string | null, view: any = { ...EMPTY, ...running }) {
      const ctx: any = {
        savedViews: [first, second],
        view,
        isSameConfig,
      };

      ctx.editingView = (TableViewsBar as any).computed.editingView.call({ ...ctx, editingViewId });
      ctx.activeViewId = activeViewId.call(ctx);

      return ctx;
    }

    it('should select the view that was picked, not the first one matching its config', () => {
      expect(selectedViewId.call(createContext('bbb'))).toBe('bbb');
    });

    it('should still select the first matching view when nothing has been picked', () => {
      // A view arriving in the URL is only identifiable by its config
      expect(selectedViewId.call(createContext(null))).toBe('aaa');
    });

    it('should keep the picked view selected once it has been edited away from', () => {
      const ctx = createContext('bbb', { ...EMPTY, query: 'state:Running name:foo' });

      expect(ctx.activeViewId).toBeNull();
      expect(selectedViewId.call(ctx)).toBe('bbb');
    });

    it('should select nothing when the All tab is showing', () => {
      const ctx = createContext(null, { ...EMPTY });

      expect(selectedViewId.call(ctx)).toBeNull();
    });

    it('should fall back to the config when the picked view has been deleted', () => {
      const ctx = createContext('gone');

      expect(selectedViewId.call(ctx)).toBe('aaa');
    });
  });

  describe('deleteView', () => {
    const { deleteView } = (TableViewsBar as any).methods;
    const first = makeView('aaa', 'Need attention', { query: 'state:Running' });
    const second = makeView('bbb', 'test', { query: 'name:foo' });

    // persist() really does replace savedViews, so by the time the old code asked which view
    // was selected the answer was already "none" - the context has to behave the same way
    function createContext(editingViewId: string | null) {
      return {
        editingViewId,
        savedViews: [first, second],
        applied:    [] as any[],
        isSameConfig,
        get editingView() {
          return this.savedViews.find((v: any) => v.id === this.editingViewId) || null;
        },
        get activeViewId() {
          return activeViewId.call(this);
        },
        get selectedViewId() {
          return selectedViewId.call(this);
        },
        // Nothing here shares a config, so nothing else can match once a view is gone
        view: { ...EMPTY, query: 'name:foo' },
        persist(views: any[]) {
          this.savedViews = views;
        },
        applyView(view: any) {
          this.applied.push(view);
        },
      };
    }

    it('should go back to the All tab when the view being shown is deleted', () => {
      const ctx = createContext('bbb');

      deleteView.call(ctx, second);

      expect(ctx.savedViews).toStrictEqual([first]);
      expect(ctx.applied).toStrictEqual([null]);
    });

    it('should leave the shown view alone when a different one is deleted', () => {
      const ctx = createContext('aaa');

      deleteView.call(ctx, second);

      expect(ctx.savedViews).toStrictEqual([first]);
      expect(ctx.applied).toStrictEqual([]);
    });
  });
});
