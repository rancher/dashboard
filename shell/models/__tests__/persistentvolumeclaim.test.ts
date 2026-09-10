import PVC from '@shell/models/persistentvolumeclaim.js';
import { POD, PV, PVC as PVC_TYPE } from '@shell/config/types';

const rootGetters = { 'i18n/t': (key: string) => key };

describe('class: PVC', () => {
  describe('details', () => {
    it('surfaces capacity, storage class and access modes', () => {
      const pvc = new PVC({
        type:     PVC_TYPE,
        metadata: { name: 'pvc-1', namespace: 'default' },
        spec:     {
          resources:        { requests: { storage: '5Gi' } },
          storageClassName: 'standard',
          accessModes:      ['ReadWriteOnce'],
        },
      }, {
        getters: {}, dispatch: jest.fn(), rootGetters
      });

      const details = pvc.details;
      const byLabel = (label: string) => details.find((d: any) => d.label === label)?.content;

      expect(byLabel('persistentVolumeClaim.capacity')).toBe('5Gi');
      expect(byLabel('persistentVolumeClaim.storageClass')).toBe('standard');
      expect(byLabel('persistentVolumeClaim.accessModes')).toBe('ReadWriteOnce');
    });

    it('links to the bound volume when one exists', () => {
      const pvc = new PVC({
        type:     PVC_TYPE,
        metadata: { name: 'pvc-1', namespace: 'default' },
        spec:     { volumeName: 'pv-1' },
      }, {
        getters: {}, dispatch: jest.fn(), rootGetters
      });

      const volume = pvc.details.find((d: any) => d.label === 'persistentVolumeClaim.volumeName');

      expect(volume.content).toBe('pv-1');
      expect(volume.formatter).toBe('LinkName');
      expect(volume.formatterOpts).toStrictEqual({ type: PV, value: 'pv-1' });
    });

    it('omits the volume entry when the claim is not bound', () => {
      const pvc = new PVC({
        type:     PVC_TYPE,
        metadata: { name: 'pvc-1', namespace: 'default' },
        spec:     {},
      }, {
        getters: {}, dispatch: jest.fn(), rootGetters
      });

      expect(pvc.details.find((d: any) => d.label === 'persistentVolumeClaim.volumeName')).toBeUndefined();
    });
  });

  describe('fetchMountedPods', () => {
    const podsWithClaims = [
      { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'pvc-1' } }] } },
      { spec: { volumes: [{ configMap: { name: 'cm' } }] } },
      { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'other' } }] } },
      { spec: {} },
    ];

    it('returns an empty array without dispatching when the Pod schema is unavailable', async() => {
      const dispatch = jest.fn();
      const pvc = new PVC({
        type: PVC_TYPE, metadata: { name: 'pvc-1', namespace: 'default' }, spec: {}
      }, {
        getters: { schemaFor: () => null, paginationEnabled: () => false }, dispatch, rootGetters
      });

      await expect(pvc.fetchMountedPods()).resolves.toStrictEqual([]);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('fetches namespaced pods server-side and filters by claim name when pagination is enabled', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: podsWithClaims });
      const pvc = new PVC({
        type: PVC_TYPE, metadata: { name: 'pvc-1', namespace: 'default' }, spec: {}
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => true }, dispatch, rootGetters
      });

      const result = await pvc.fetchMountedPods();

      expect(result).toStrictEqual([podsWithClaims[0]]);
      expect(dispatch).toHaveBeenCalledWith('findPage', expect.objectContaining({
        type: POD,
        opt:  expect.objectContaining({ transient: true }),
      }));
    });

    it('falls back to a namespaced findAll and filters by claim name when pagination is disabled', async() => {
      const dispatch = jest.fn().mockResolvedValue(podsWithClaims);
      const pvc = new PVC({
        type: PVC_TYPE, metadata: { name: 'pvc-1', namespace: 'default' }, spec: {}
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => false }, dispatch, rootGetters
      });

      const result = await pvc.fetchMountedPods();

      expect(result).toStrictEqual([podsWithClaims[0]]);
      expect(dispatch).toHaveBeenCalledWith('findAll', { type: POD, opt: { namespaced: 'default' } });
    });
  });
});
