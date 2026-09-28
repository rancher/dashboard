import ResourceTableViews from '@shell/mixins/resource-table-views';
import { TABLE_VIEWS } from '@shell/store/prefs';

// The table views half of ResourceTable is its own mixin, so that is where this lives
const { data } = ResourceTableViews;

describe('ResourceTable', () => {
  describe('openedViewId', () => {
    const saved = {
      views: [
        {
          id: 'aaa', name: 'Untitled', query: '', columns: null, labelColumns: [], groupBy: null
        },
        {
          id: 'bbb', name: 'Untitled 2', query: '', columns: null, labelColumns: [], groupBy: null
        },
      ],
      defaultViewId: 'bbb',
    };

    function open(prefs: Record<string, unknown> = saved) {
      return data.call({
        schema: { id: 'pod' },
        $store: { getters: { 'prefs/get': (key: string) => (key === TABLE_VIEWS ? { pod: prefs } : undefined) } },
      });
    }

    it('should name the default view when the list opens on it', () => {
      expect(open().openedViewId).toBe('bbb');
    });

    it('should name no view when the user has no default', () => {
      expect(open({ ...saved, defaultViewId: null }).openedViewId).toBeUndefined();
    });
  });
});
