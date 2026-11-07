import { createRouter, createMemoryHistory, RouteRecordRaw } from 'vue-router';
import routes from '@shell/config/router/routes';

describe('routes', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: routes as RouteRecordRaw[] });

  describe('global settings', () => {
    it('should resolve the settings redirect page within the default layout', () => {
      const resolved = router.resolve('/c/_/settings');

      expect(resolved.name).toStrictEqual('c-cluster-settings');
      expect(resolved.matched[0].name).toStrictEqual('default');
    });
  });
});
