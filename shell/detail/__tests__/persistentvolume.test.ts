import { flushPromises } from '@vue/test-utils';
import { AGE, NAME, NAMESPACE, STATE } from '@shell/config/table-headers';
import { withoutNamespaceColumn, useBoundPersistentVolumeClaim } from '@shell/detail/persistentvolume/composables';

const mockGetters: Record<string, any> = {};

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      },
    }),
  }),
}));

describe('persistentVolume detail composables', () => {
  beforeEach(() => {
    Object.keys(mockGetters).forEach((k) => delete mockGetters[k]);
  });

  describe('withoutNamespaceColumn', () => {
    it('drops the namespace column and keeps the rest in order', () => {
      const names = withoutNamespaceColumn([STATE, NAME, NAMESPACE, AGE]).map((h) => h.name);

      expect(names).not.toContain(NAMESPACE.name);
      expect(names).toStrictEqual([STATE.name, NAME.name, AGE.name]);
    });
  });

  describe('useBoundPersistentVolumeClaim', () => {
    it('wraps the bound claim in an array and exposes namespace-free headers', async() => {
      const claim = { id: 'default/c' };
      const pvcSchema = {};

      mockGetters['cluster/schemaFor'] = () => pvcSchema;
      mockGetters['type-map/headersFor'] = () => [STATE, NAME, NAMESPACE, AGE];

      const pv = { fetchPersistentVolumeClaim: jest.fn().mockResolvedValue(claim) };
      const { pvcSchema: schema, pvcHeaders, claims } = useBoundPersistentVolumeClaim(pv);

      await flushPromises();

      expect(pv.fetchPersistentVolumeClaim).toHaveBeenCalledWith();
      expect(schema.value).toStrictEqual(pvcSchema);
      expect(pvcHeaders.value.map((h: any) => h.name)).toStrictEqual([STATE.name, NAME.name, AGE.name]);
      expect(claims.value).toStrictEqual([claim]);
    });

    it('leaves claims empty when there is no bound claim', async() => {
      mockGetters['cluster/schemaFor'] = () => ({});
      mockGetters['type-map/headersFor'] = () => [];

      const pv = { fetchPersistentVolumeClaim: jest.fn().mockResolvedValue(null) };
      const { claims } = useBoundPersistentVolumeClaim(pv);

      await flushPromises();

      expect(claims.value).toStrictEqual([]);
    });

    it('does not fetch and returns empty headers when the PVC schema is unavailable', () => {
      mockGetters['cluster/schemaFor'] = () => null;

      const pv = { fetchPersistentVolumeClaim: jest.fn() };
      const { pvcHeaders, claims } = useBoundPersistentVolumeClaim(pv);

      expect(pv.fetchPersistentVolumeClaim).not.toHaveBeenCalledWith();
      expect(pvcHeaders.value).toStrictEqual([]);
      expect(claims.value).toStrictEqual([]);
    });
  });
});
