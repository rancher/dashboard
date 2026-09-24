import { flushPromises } from '@vue/test-utils';
import { AGE, NAME, NAMESPACE, STATE } from '@shell/config/table-headers';
import { withoutNamespaceColumn, useMountedPods } from '@shell/detail/persistentvolumeclaim/composables';

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

describe('persistentVolumeClaim detail composables', () => {
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

  describe('useMountedPods', () => {
    it('exposes the mounted pods and namespace-free headers', async() => {
      const pods = [{ id: 'default/pod-1' }];
      const podSchema = {};

      mockGetters['cluster/schemaFor'] = () => podSchema;
      mockGetters['type-map/headersFor'] = () => [STATE, NAME, NAMESPACE, AGE];

      const pvc = { fetchMountedPods: jest.fn().mockResolvedValue(pods) };
      const { podSchema: schema, podHeaders, mountedPods } = useMountedPods(pvc);

      await flushPromises();

      expect(pvc.fetchMountedPods).toHaveBeenCalledWith();
      expect(schema.value).toStrictEqual(podSchema);
      expect(podHeaders.value.map((h: any) => h.name)).toStrictEqual([STATE.name, NAME.name, AGE.name]);
      expect(mountedPods.value).toStrictEqual(pods);
    });

    it('does not fetch and returns empty headers when the Pod schema is unavailable', () => {
      mockGetters['cluster/schemaFor'] = () => null;

      const pvc = { fetchMountedPods: jest.fn() };
      const { podHeaders, mountedPods } = useMountedPods(pvc);

      expect(pvc.fetchMountedPods).not.toHaveBeenCalledWith();
      expect(podHeaders.value).toStrictEqual([]);
      expect(mountedPods.value).toStrictEqual([]);
    });
  });
});
