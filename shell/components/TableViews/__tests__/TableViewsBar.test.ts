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
    // Two saved views can hold the same config - a duplicate, or one saved on top of another -
    // and a saved view can hold the same config as the All tab
    const running = { query: 'state:Running', groupBy: 'namespace' };
    const first = makeView('aaa', 'Need attention', running);
    const second = makeView('bbb', 'test', running);
    const sameAsAll = makeView('ccc', 'same as all');

    function createContext(pickedViewId: string | null | undefined, view: any = { ...EMPTY, ...running }) {
      const ctx: any = {
        pickedViewId,
        savedViews: [first, second, sameAsAll],
        view,
        isSameConfig,
      };

      ctx.editingView = (TableViewsBar as any).computed.editingView.call(ctx);
      ctx.activeViewId = activeViewId.call(ctx);
      ctx.isModified = (TableViewsBar as any).computed.isModified.call(ctx);

      return ctx;
    }

    it('should select the view that was picked, not the first one matching its config', () => {
      expect(selectedViewId.call(createContext('bbb'))).toBe('bbb');
    });

    it('should select nothing when the All tab was picked, even if a view holds the same config', () => {
      // Otherwise clicking All jumps to that view and All can never be got back to
      const ctx = createContext(null, { ...EMPTY });

      expect(ctx.activeViewId).toBe('ccc');
      expect(selectedViewId.call(ctx)).toBeNull();
    });

    it('should select the matching view when one arrives in a shared url', () => {
      // Nothing picked here, so the config is the only handle on it
      expect(selectedViewId.call(createContext(undefined))).toBe('aaa');
    });

    it('should select nothing on a fresh unmodified list', () => {
      // Nothing picked and nothing applied is the All tab, whatever configs happen to be saved
      expect(selectedViewId.call(createContext(undefined, { ...EMPTY }))).toBeNull();
    });

    it('should keep the picked view selected once it has been edited away from', () => {
      const ctx = createContext('bbb', { ...EMPTY, query: 'state:Running name:foo' });

      expect(ctx.activeViewId).toBeNull();
      expect(selectedViewId.call(ctx)).toBe('bbb');
    });

    it('should fall back to the config when the picked view has been deleted', () => {
      expect(selectedViewId.call(createContext('gone'))).toBe('aaa');
    });
  });

  describe('isDirty', () => {
    const { isDirty } = (TableViewsBar as any).computed;
    const sameAsAll = makeView('ccc', 'same as all');

    it('should report changes made on top of the All tab as unsaved', () => {
      // Even when a saved view happens to hold the same config as what was typed
      const ctx: any = {
        pickedViewId: null,
        savedViews:   [sameAsAll],
        view:         { ...EMPTY, query: 'name:foo' },
        isSameConfig,
      };

      ctx.editingView = null;
      ctx.activeViewId = activeViewId.call(ctx);
      ctx.isModified = (TableViewsBar as any).computed.isModified.call(ctx);

      expect(isDirty.call(ctx)).toBe(true);
    });

    it('should report the All tab itself as clean', () => {
      const ctx: any = {
        pickedViewId: null,
        savedViews:   [sameAsAll],
        view:         { ...EMPTY },
        isSameConfig,
      };

      ctx.editingView = null;
      ctx.activeViewId = activeViewId.call(ctx);
      ctx.isModified = (TableViewsBar as any).computed.isModified.call(ctx);

      expect(isDirty.call(ctx)).toBe(false);
    });
  });

  describe('deleteView', () => {
    const { deleteView } = (TableViewsBar as any).methods;
    const first = makeView('aaa', 'Need attention', { query: 'state:Running' });
    const second = makeView('bbb', 'test', { query: 'name:foo' });

    // persist() really does replace savedViews, so by the time the old code asked which view
    // was selected the answer was already "none" - the context has to behave the same way
    function createContext(pickedViewId: string | null) {
      return {
        pickedViewId,
        savedViews: [first, second],
        applied:    [] as any[],
        isSameConfig,
        get editingView() {
          return this.savedViews.find((v: any) => v.id === this.pickedViewId) || null;
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
