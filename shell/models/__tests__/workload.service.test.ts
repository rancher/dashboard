import WorkloadService from '@shell/models/workload.service.js';
import { WORKLOAD_TYPES } from '@shell/config/types';

const ctx = {
  getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
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
