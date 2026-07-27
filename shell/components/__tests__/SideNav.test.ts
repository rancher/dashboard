import SideNav from '@shell/components/SideNav.vue';
import { COUNT } from '@shell/config/types';

describe('component: SideNav', () => {
  describe('countTypes', () => {
    const countTypes = (SideNav as any).computed.countTypes;
    const watchCountTypes = (SideNav as any).watch.countTypes;

    const getStore = (counts: Record<string, any>) => ({
      getters: {
        'cluster/all': (type: string) => {
          if (type === COUNT) {
            return [{ counts }];
          }

          return [];
        },
      },
    });

    it('returns an empty list when management is not ready', () => {
      const types = countTypes.call({
        managementReady: false,
        currentProduct:  { inStore: 'cluster' },
        $store:          getStore({ 'my.io.crd': { summary: { count: 5 } } }),
      });

      expect(types).toStrictEqual([]);
    });

    it('returns only types with a positive count, sorted by type id', () => {
      const types = countTypes.call({
        managementReady: true,
        currentProduct:  { inStore: 'cluster' },
        $store:          getStore({
          'z.io.hidden':      { summary: { count: 0 } },
          'a.io.visible':     { summary: { count: 3 } },
          'c.io.not-visible': { summary: { count: -1 } },
          'b.io.visible':     { summary: { count: 1 } },
          'd.io.bad-type':    { summary: {} },
        }),
      });

      expect(types).toStrictEqual(['a.io.visible', 'b.io.visible']);
    });

    it('returns an empty list when count data is missing', () => {
      const types = countTypes.call({
        managementReady: true,
        currentProduct:  { inStore: 'cluster' },
        $store:          {
          getters: {
            'cluster/all': (type: string) => {
              if (type === COUNT) {
                return [];
              }

              return [];
            },
          },
        },
      });

      expect(types).toStrictEqual([]);
    });

    it('queues a nav refresh when visible count types change', () => {
      const queueUpdate = jest.fn();
      const logSideNavDebug = jest.fn();

      watchCountTypes.call({ queueUpdate, logSideNavDebug }, ['a.io.visible'], ['a.io.visible', 'b.io.visible']);

      expect(queueUpdate).toHaveBeenCalledWith();
    });

    it('does not queue a nav refresh when visible count types are unchanged', () => {
      const queueUpdate = jest.fn();
      const logSideNavDebug = jest.fn();

      watchCountTypes.call({ queueUpdate, logSideNavDebug }, ['a.io.visible'], ['a.io.visible']);

      expect(queueUpdate).not.toHaveBeenCalled();
    });
  });
});
