import Workload from '@shell/models/workload.js';
import { WORKLOAD_TYPES } from '@shell/config/types';

describe('class Workload', () => {
  it('should set default imagePullPolicy to IfNotPresent', () => {
    const cronJob = new Workload({
      type: WORKLOAD_TYPES.CRON_JOB,
      spec: {}
    });
    const vm = { $set: jest.fn() };

    cronJob.applyDefaults(vm);
    expect(cronJob.spec.jobTemplate.spec.template.spec.containers[0].imagePullPolicy).toBe('IfNotPresent');

    const workload = new Workload({ spec: {} });

    workload.applyDefaults(vm);
    expect(workload.spec.template.spec.containers[0].imagePullPolicy).toBe('IfNotPresent');
  });
});
