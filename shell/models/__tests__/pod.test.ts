import Pod from '@shell/models/pod';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';

const workloadRef = {
  type: WORKLOAD_TYPES.REPLICA_SET, name: 'frontend-57b8b59b77', namespace: 'default'
};

const createPod = (data: any = {}, { schema = { id: WORKLOAD_TYPES.REPLICA_SET } as any } = {}): any => {
  return new Pod({
    metadata: { name: 'frontend-57b8b59b77-abcde', namespace: 'default' },
    ...data,
  }, {
    getters:     { schemaFor: jest.fn(() => schema) },
    dispatch:    jest.fn(),
    rootGetters: {
      'i18n/t':            (key: string) => key,
      'type-map/labelFor': jest.fn(() => 'ReplicaSet'),
    },
  });
};

const stubBaseGlance = (pod: any) => {
  Object.defineProperty(pod, '_glance', {
    get: () => [
      { name: 'state' },
      { name: 'type' },
      { name: 'namespace' },
      { name: 'age' },
    ]
  });
};

const runningStatus = (ready: boolean) => ({
  name: 'app', ready, restartCount: 0, state: { running: {} }
});

describe('class Pod', () => {
  describe('containerReadiness', () => {
    it.each([
      ['no containers or statuses', {}, {}, { ready: 0, total: 0 }],
      ['all containers ready', { containers: [{ name: 'a' }, { name: 'b' }] }, { containerStatuses: [runningStatus(true), runningStatus(true)] }, { ready: 2, total: 2 }],
      ['one container not ready', { containers: [{ name: 'a' }, { name: 'b' }] }, { containerStatuses: [runningStatus(true), runningStatus(false)] }, { ready: 1, total: 2 }],
      ['statuses not reported yet', { containers: [{ name: 'a' }] }, {}, { ready: 0, total: 1 }],
      [
        'a ready container that is not running',
        { containers: [{ name: 'a' }] },
        {
          containerStatuses: [{
            name: 'a', ready: true, state: { terminated: {} }
          }]
        },
        { ready: 0, total: 1 }
      ],
    ])('should count %p', (_, spec, status, expected) => {
      const pod = createPod({ spec, status });

      expect(pod.containerReadiness).toStrictEqual(expected);
    });

    it('should count a started and ready sidecar init container', () => {
      const pod = createPod({
        spec: {
          containers:     [{ name: 'app' }],
          initContainers: [{ name: 'setup' }, { name: 'proxy', restartPolicy: 'Always' }],
        },
        status: {
          containerStatuses:     [runningStatus(true)],
          initContainerStatuses: [
            {
              name: 'setup', ready: true, started: true, state: { terminated: { exitCode: 0 } }
            },
            {
              name: 'proxy', ready: true, started: true, state: { running: {} }
            },
          ],
        },
      });

      expect(pod.containerReadiness).toStrictEqual({ ready: 2, total: 2 });
    });

    it('should not count the app containers while a regular init container is running', () => {
      const pod = createPod({
        spec: {
          containers:     [{ name: 'app' }],
          initContainers: [{ name: 'setup' }],
        },
        status: {
          containerStatuses:     [runningStatus(true)],
          initContainerStatuses: [{
            name: 'setup', ready: false, state: { running: {} }
          }]
        },
      });

      expect(pod.containerReadiness).toStrictEqual({ ready: 0, total: 1 });
    });

    it('should count a sidecar that has not started as not ready', () => {
      const pod = createPod({
        spec: {
          containers:     [{ name: 'app' }],
          initContainers: [{ name: 'proxy', restartPolicy: 'Always' }],
        },
        status: {
          initContainerStatuses: [{
            name: 'proxy', ready: false, started: false, state: { waiting: {} }
          }]
        },
      });

      expect(pod.containerReadiness).toStrictEqual({ ready: 0, total: 2 });
    });
  });

  describe('totalRestartCount', () => {
    it('should add up the app container and sidecar restarts once the pod has initialised', () => {
      const pod = createPod({
        spec: {
          containers:     [{ name: 'app' }, { name: 'worker' }],
          initContainers: [{ name: 'setup' }, { name: 'proxy', restartPolicy: 'Always' }],
        },
        status: {
          containerStatuses:     [{ name: 'app', restartCount: 2 }, { name: 'worker', restartCount: 3 }],
          initContainerStatuses: [
            {
              name: 'setup', restartCount: 5, state: { terminated: { exitCode: 0 } }
            },
            {
              name: 'proxy', restartCount: 1, started: true, state: { running: {} }
            },
          ],
        }
      });

      expect(pod.totalRestartCount).toStrictEqual(6);
    });

    it('should only add up the init container restarts while the pod is initialising', () => {
      const pod = createPod({
        spec: {
          containers:     [{ name: 'app' }],
          initContainers: [{ name: 'setup' }],
        },
        status: {
          containerStatuses:     [{ name: 'app', restartCount: 2 }],
          initContainerStatuses: [{
            name: 'setup', restartCount: 4, state: { waiting: { reason: 'CrashLoopBackOff' } }
          }],
        }
      });

      expect(pod.totalRestartCount).toStrictEqual(4);
    });

    it('should add up the app container restarts when the pod reports it has initialised', () => {
      const pod = createPod({
        spec: {
          containers:     [{ name: 'app' }],
          initContainers: [{ name: 'setup' }],
        },
        status: {
          conditions:            [{ type: 'Initialized', status: 'True' }],
          containerStatuses:     [{ name: 'app', restartCount: 2 }],
          initContainerStatuses: [{
            name: 'setup', restartCount: 4, state: { waiting: {} }
          }],
        }
      });

      expect(pod.totalRestartCount).toStrictEqual(2);
    });

    it('should be 0 when no container statuses are reported', () => {
      const pod = createPod({ status: {} });

      expect(pod.totalRestartCount).toStrictEqual(0);
    });
  });

  describe('workloadTypeLabel', () => {
    it('should use the label of the owning workload type', () => {
      const pod = createPod();

      jest.spyOn(pod, 'workloadRef', 'get').mockReturnValue(workloadRef);

      expect(pod.workloadTypeLabel).toStrictEqual('ReplicaSet');
      expect(pod.$rootGetters['type-map/labelFor']).toHaveBeenCalledWith({ id: WORKLOAD_TYPES.REPLICA_SET });
    });

    it('should fall back to a generic label when the workload type has no schema', () => {
      const pod = createPod({}, { schema: null });

      jest.spyOn(pod, 'workloadRef', 'get').mockReturnValue(workloadRef);

      expect(pod.workloadTypeLabel).toStrictEqual('component.resource.detail.glance.workload');
    });
  });

  describe('details', () => {
    it('should label the workload row with the type of the workload', () => {
      const pod = createPod({ spec: {}, status: { podIP: '10.42.0.1' } });

      jest.spyOn(pod, 'workloadRef', 'get').mockReturnValue(workloadRef);

      const workloadRow = pod.details.find((detail: any) => detail.content === workloadRef.name);

      expect(workloadRow.label).toStrictEqual('ReplicaSet');
    });
  });

  describe('glance', () => {
    const podData = {
      spec: {
        nodeName:   'ip-172-31-13-111',
        containers: [{ name: 'app' }],
      },
      status: {
        phase:             'Running',
        podIP:             '10.42.112.167',
        containerStatuses: [{ ...runningStatus(true), restartCount: 4 }],
      },
    };

    it('should add the pod rows between the namespace and age rows', () => {
      const pod = createPod(podData);

      jest.spyOn(pod, 'workloadRef', 'get').mockReturnValue(workloadRef);
      stubBaseGlance(pod);

      expect(pod.glance.map((item: any) => item.name)).toStrictEqual(['state', 'type', 'namespace', 'ready', 'restarts', 'podIp', 'workload', 'node', 'age']);
    });

    it('should show the ready count with a status coloured by readiness', () => {
      const pod = createPod(podData);

      stubBaseGlance(pod);

      const ready = pod.glance.find((item: any) => item.name === 'ready');

      expect(ready).toStrictEqual({
        name:          'ready',
        label:         'component.resource.detail.glance.ready',
        formatter:     'ReadyIndicator',
        formatterOpts: {
          ready: 1, total: 1, status: undefined
        },
        content: '1/1'
      });
    });

    it.each(['Succeeded', 'Failed'])('should show a neutral ready status when the pod has %p', (phase) => {
      const pod = createPod({ ...podData, status: { ...podData.status, phase } });

      stubBaseGlance(pod);

      const ready = pod.glance.find((item: any) => item.name === 'ready');

      expect(ready.formatterOpts.status).toStrictEqual('none');
    });

    it('should show the restarts of all containers', () => {
      const pod = createPod(podData);

      stubBaseGlance(pod);

      const restarts = pod.glance.find((item: any) => item.name === 'restarts');

      expect(restarts.content).toStrictEqual(4);
    });

    it('should show the pod IP with a copy button', () => {
      const pod = createPod(podData);

      stubBaseGlance(pod);

      const podIp = pod.glance.find((item: any) => item.name === 'podIp');

      expect(podIp).toStrictEqual({
        name:          'podIp',
        label:         'component.resource.detail.glance.podIp',
        formatter:     'CopyToClipboard',
        formatterOpts: { plain: true },
        content:       '10.42.112.167'
      });
    });

    it('should show a dash and no copy button when the pod has no IP', () => {
      const pod = createPod({ ...podData, status: { phase: 'Pending' } });

      stubBaseGlance(pod);

      const podIp = pod.glance.find((item: any) => item.name === 'podIp');

      expect(podIp.formatter).toBeUndefined();
      expect(podIp.content).toStrictEqual('—');
    });

    it('should link to the owning workload, labelled with its type', () => {
      const pod = createPod(podData);

      jest.spyOn(pod, 'workloadRef', 'get').mockReturnValue(workloadRef);
      stubBaseGlance(pod);

      const workload = pod.glance.find((item: any) => item.name === 'workload');

      expect(workload).toStrictEqual({
        name:          'workload',
        label:         'ReplicaSet',
        formatter:     'LinkName',
        formatterOpts: {
          value: workloadRef.name, type: workloadRef.type, namespace: workloadRef.namespace
        },
        content: workloadRef.name
      });
    });

    it('should link to the node the pod is scheduled on', () => {
      const pod = createPod(podData);

      stubBaseGlance(pod);

      const node = pod.glance.find((item: any) => item.name === 'node');

      expect(node).toStrictEqual({
        name:          'node',
        label:         'component.resource.detail.glance.node',
        formatter:     'LinkName',
        formatterOpts: { type: NODE, value: 'ip-172-31-13-111' },
        content:       'ip-172-31-13-111'
      });
    });

    it('should leave out the workload and node rows when the pod has no owner and is not scheduled', () => {
      const pod = createPod({ spec: { containers: [{ name: 'app' }] }, status: { phase: 'Pending' } });

      jest.spyOn(pod, 'workloadRef', 'get').mockReturnValue(undefined);
      stubBaseGlance(pod);

      const names = pod.glance.map((item: any) => item.name);

      expect(names).toStrictEqual(['state', 'type', 'namespace', 'ready', 'restarts', 'podIp', 'age']);
    });
  });
});
