import PV from '@shell/models/persistentvolume.js';
import { PVC } from '@shell/config/types';

const rootGetters = {
  'i18n/t':            (key: string) => key,
  'i18n/withFallback': (key: string, args: any, fallback: string) => fallback,
};

describe('class: PV', () => {
  describe('details', () => {
    it('surfaces capacity, reclaim policy, storage class and access modes', () => {
      const pv = new PV({
        type:     PVC,
        metadata: { name: 'pv-1' },
        spec:     {
          capacity:                      { storage: '10Gi' },
          persistentVolumeReclaimPolicy: 'Retain',
          storageClassName:              'standard',
          accessModes:                   ['ReadWriteOnce', 'ReadOnlyMany'],
        },
      }, {
        getters: {}, dispatch: jest.fn(), rootGetters
      });

      const details = pv.details;
      const byLabel = (label: string) => details.find((d: any) => d.label === label)?.content;

      expect(byLabel('persistentVolume.capacity.label')).toBe('10Gi');
      expect(byLabel('persistentVolume.detail.reclaimPolicy')).toBe('Retain');
      expect(byLabel('persistentVolume.detail.storageClass')).toBe('standard');
      expect(byLabel('persistentVolume.customize.accessModes.label')).toBe('ReadWriteOnce, ReadOnlyMany');
    });
  });

  describe('fetchPersistentVolumeClaim', () => {
    it('returns null without dispatching when there is no claimRef', async() => {
      const dispatch = jest.fn();
      const pv = new PV({
        type: PVC, metadata: { name: 'pv-1' }, spec: {}
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => false }, dispatch, rootGetters
      });

      await expect(pv.fetchPersistentVolumeClaim()).resolves.toBeNull();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('returns null without dispatching when the PVC schema is unavailable', async() => {
      const dispatch = jest.fn();
      const pv = new PV({
        type: PVC, metadata: { name: 'pv-1' }, spec: { claimRef: { name: 'c', namespace: 'default' } }
      }, {
        getters: { schemaFor: () => null, paginationEnabled: () => false }, dispatch, rootGetters
      });

      await expect(pv.fetchPersistentVolumeClaim()).resolves.toBeNull();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('fetches the claim server-side by name when pagination is enabled', async() => {
      const claim = { metadata: { name: 'c', namespace: 'default' } };
      const dispatch = jest.fn().mockResolvedValue({ data: [claim] });
      const pv = new PV({
        type: PVC, metadata: { name: 'pv-1' }, spec: { claimRef: { name: 'c', namespace: 'default' } }
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => true }, dispatch, rootGetters
      });

      await expect(pv.fetchPersistentVolumeClaim()).resolves.toStrictEqual(claim);
      expect(dispatch).toHaveBeenCalledWith('findPage', expect.objectContaining({
        type: PVC,
        opt:  expect.objectContaining({ transient: true }),
      }));
    });

    it('falls back to a direct lookup when pagination is disabled', async() => {
      const claim = { metadata: { name: 'c', namespace: 'default' } };
      const dispatch = jest.fn().mockResolvedValue(claim);
      const pv = new PV({
        type: PVC, metadata: { name: 'pv-1' }, spec: { claimRef: { name: 'c', namespace: 'default' } }
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => false }, dispatch, rootGetters
      });

      await expect(pv.fetchPersistentVolumeClaim()).resolves.toStrictEqual(claim);
      expect(dispatch).toHaveBeenCalledWith('find', { type: PVC, id: 'default/c' });
    });
  });
});
