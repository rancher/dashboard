import PersistentVolume from '@shell/detail/persistentvolume/index.vue';
import { AGE, NAME, NAMESPACE, STATE } from '@shell/config/table-headers';

describe('persistentVolume detail page', () => {
  describe('claims', () => {
    const claims = (persistentVolumeClaim: any) => (PersistentVolume as any).computed.claims.call({ persistentVolumeClaim });

    it('returns an empty array when there is no bound claim', () => {
      expect(claims(null)).toStrictEqual([]);
    });

    it('wraps the bound claim in an array for the table', () => {
      const claim = { id: 'default/c' };

      expect(claims(claim)).toStrictEqual([claim]);
    });
  });

  describe('pvcHeaders', () => {
    const configuredHeaders = [STATE, NAME, NAMESPACE, AGE];

    const stub = {
      $store:    { getters: { 'type-map/headersFor': () => [...configuredHeaders] } },
      pvcSchema: {},
    };

    it('drops the namespace column', () => {
      const names = (PersistentVolume as any).computed.pvcHeaders.call(stub).map((h: any) => h.name);

      expect(names).not.toContain(NAMESPACE.name);
      expect(names).toStrictEqual([STATE.name, NAME.name, AGE.name]);
    });
  });
});
