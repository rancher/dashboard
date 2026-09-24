import WorkloadService from '@shell/models/workload.service.js';
import { WORKLOAD_TYPES, PVC } from '@shell/config/types';

const ctx = {
  getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
  dispatch:    jest.fn(),
  rootGetters: { 'i18n/t': jest.fn() },
};

const storageCtx = {
  getters:     { schemaFor: () => ({}), paginationEnabled: () => false },
  dispatch:    jest.fn(),
  rootGetters: { 'i18n/t': jest.fn() },
};

describe('class: WorkloadService containers/initContainers getters', () => {
  // Regression for https://github.com/rancher/dashboard/issues/10171
  // A standalone Pod stores containers natively and often has no
  // spec.initContainers key - the getter must not dive into spec.template.
  it('returns native pod containers and does not throw when initContainers is absent', () => {
    const pod = new WorkloadService({
      type:     'pod',
      metadata: { name: 'p', namespace: 'default' },
      spec:     { containers: [{ name: 'container-0', image: 'nginx' }] }, // no initContainers, no template
    }, ctx);

    expect(pod.containers).toHaveLength(1);
    expect(pod.containers[0].name).toBe('container-0');
    expect(() => pod.initContainers).not.toThrow();
    expect(pod.initContainers).toBeUndefined();
  });

  it('still reads workload containers nested under spec.template.spec', () => {
    const deployment = new WorkloadService({
      type:     WORKLOAD_TYPES.DEPLOYMENT,
      metadata: { name: 'd', namespace: 'default' },
      spec:     { template: { spec: { containers: [{ name: 'c0' }], initContainers: [{ name: 'i0' }] } } },
    }, ctx);

    expect(deployment.containers[0].name).toBe('c0');
    expect(deployment.initContainers[0].name).toBe('i0');
  });
});

describe('class: WorkloadService PersistentVolumeClaim helpers', () => {
  describe('persistentVolumeClaimNames', () => {
    it('collects claim names from a workload pod template, ignoring other volume types', () => {
      const deployment = new WorkloadService({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'd', namespace: 'default' },
        spec:     {
          template: {
            spec: {
              volumes: [
                { name: 'v1', persistentVolumeClaim: { claimName: 'pvc-a' } },
                { name: 'config', configMap: { name: 'cm' } },
                { name: 'v2', persistentVolumeClaim: { claimName: 'pvc-b' } },
              ]
            }
          }
        },
      }, storageCtx);

      expect(deployment.persistentVolumeClaimNames).toStrictEqual(['pvc-a', 'pvc-b']);
    });

    it('collects claim names from a cron job template', () => {
      const cronJob = new WorkloadService({
        type:     WORKLOAD_TYPES.CRON_JOB,
        metadata: { name: 'cj', namespace: 'default' },
        spec:     { jobTemplate: { spec: { template: { spec: { volumes: [{ name: 'v1', persistentVolumeClaim: { claimName: 'pvc-cron' } }] } } } } },
      }, storageCtx);

      expect(cronJob.persistentVolumeClaimNames).toStrictEqual(['pvc-cron']);
    });

    it('collects claim names from a native pod spec', () => {
      const pod = new WorkloadService({
        type:     'pod',
        metadata: { name: 'p', namespace: 'default' },
        spec:     { volumes: [{ name: 'v1', persistentVolumeClaim: { claimName: 'pvc-pod' } }] },
      }, storageCtx);

      expect(pod.persistentVolumeClaimNames).toStrictEqual(['pvc-pod']);
    });

    it('includes claims mounted by the workload pods and de-duplicates', () => {
      const statefulSet = new WorkloadService({
        type:     WORKLOAD_TYPES.STATEFUL_SET,
        metadata: { name: 's', namespace: 'default' },
        spec:     { template: { spec: { volumes: [{ name: 'v1', persistentVolumeClaim: { claimName: 'shared' } }] } } },
      }, storageCtx);

      // volumeClaimTemplates create per-pod claims which only surface via the loaded pods
      (statefulSet as any).pods = [
        { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'data-s-0' } }, { persistentVolumeClaim: { claimName: 'shared' } }] } },
        { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'data-s-1' } }] } },
      ];

      expect(statefulSet.persistentVolumeClaimNames).toStrictEqual(['shared', 'data-s-0', 'data-s-1']);
    });

    it('returns an empty array when the workload has no volumes', () => {
      const deployment = new WorkloadService({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'd', namespace: 'default' },
        spec:     { template: { spec: { containers: [] } } },
      }, storageCtx);

      expect(deployment.persistentVolumeClaimNames).toStrictEqual([]);
    });
  });

  describe('fetchPersistentVolumeClaims', () => {
    it('returns an empty array without dispatching when no claims are mounted', async() => {
      const dispatch = jest.fn();
      const deployment = new WorkloadService({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'd', namespace: 'default' },
        spec:     { template: { spec: {} } },
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => false }, dispatch, rootGetters: {}
      });

      await expect(deployment.fetchPersistentVolumeClaims()).resolves.toStrictEqual([]);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('returns an empty array without dispatching when the PVC schema is unavailable', async() => {
      const dispatch = jest.fn();
      const deployment = new WorkloadService({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'd', namespace: 'default' },
        spec:     { template: { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'pvc-a' } }] } } },
      }, {
        getters: { schemaFor: () => null, paginationEnabled: () => false }, dispatch, rootGetters: {}
      });

      await expect(deployment.fetchPersistentVolumeClaims()).resolves.toStrictEqual([]);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('fetches claims server-side by name when pagination is enabled', async() => {
      const pvcs = [{ metadata: { name: 'pvc-a', namespace: 'default' } }];
      const dispatch = jest.fn().mockResolvedValue({ data: pvcs });
      const deployment = new WorkloadService({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'd', namespace: 'default' },
        spec:     { template: { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'pvc-a' } }] } } },
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => true }, dispatch, rootGetters: {}
      });

      await expect(deployment.fetchPersistentVolumeClaims()).resolves.toStrictEqual(pvcs);
      expect(dispatch).toHaveBeenCalledWith('findPage', expect.objectContaining({
        type: PVC,
        opt:  expect.objectContaining({ transient: true }),
      }));
    });

    it('falls back to a namespaced client-side filter when pagination is disabled', async() => {
      const all = [
        { metadata: { name: 'pvc-a', namespace: 'default' } },
        { metadata: { name: 'pvc-a', namespace: 'other' } }, // same name, different namespace
        { metadata: { name: 'pvc-z', namespace: 'default' } }, // not mounted by this workload
      ];
      const dispatch = jest.fn().mockResolvedValue(all);
      const deployment = new WorkloadService({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'd', namespace: 'default' },
        spec:     { template: { spec: { volumes: [{ persistentVolumeClaim: { claimName: 'pvc-a' } }] } } },
      }, {
        getters: { schemaFor: () => ({}), paginationEnabled: () => false }, dispatch, rootGetters: {}
      });

      await expect(deployment.fetchPersistentVolumeClaims()).resolves.toStrictEqual([{ metadata: { name: 'pvc-a', namespace: 'default' } }]);
      expect(dispatch).toHaveBeenCalledWith('findAll', { type: PVC });
    });
  });
});
