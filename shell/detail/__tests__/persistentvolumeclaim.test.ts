import PersistentVolumeClaim from '@shell/detail/persistentvolumeclaim/index.vue';
import { AGE, NAME, NAMESPACE, STATE } from '@shell/config/table-headers';

describe('persistentVolumeClaim detail page', () => {
  describe('podHeaders', () => {
    const configuredHeaders = [STATE, NAME, NAMESPACE, AGE];

    const stub = {
      $store:    { getters: { 'type-map/headersFor': () => [...configuredHeaders] } },
      podSchema: {},
    };

    it('drops the namespace column', () => {
      const names = (PersistentVolumeClaim as any).computed.podHeaders.call(stub).map((h: any) => h.name);

      expect(names).not.toContain(NAMESPACE.name);
      expect(names).toStrictEqual([STATE.name, NAME.name, AGE.name]);
    });
  });
});
