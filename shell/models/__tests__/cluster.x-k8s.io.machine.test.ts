import CapiMachine from '@shell/models/cluster.x-k8s.io.machine';
import CapiMachineDeployment from '@shell/models/cluster.x-k8s.io.machinedeployment';
import { CAPI } from '@shell/config/types';
import { CAPI as CAPI_LABELS, MACHINE_ROLES } from '@shell/config/labels-annotations';

const PAUSED_MIN = CAPI_LABELS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_LABELS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

type MachinePool = {
  name: string,
  quantity: number,
  autoscalingMinSize?: number,
  autoscalingMaxSize?: number,
  machineDeploymentAnnotations?: { [key: string]: string },
  machineConfigRef: { name: string },
};

const POOL_CONFIG = 'nc-c1-workers';
const MACHINE_TEMPLATE = 'c1-workers-abc123';
const MACHINE_TEMPLATE_TYPE = 'rke-machine.cattle.io.amazonec2machinetemplate';

const manualPool = (): MachinePool => ({
  name: 'workers', quantity: 2, machineConfigRef: { name: POOL_CONFIG }
});

const autoscalingPool = (): MachinePool => ({
  ...manualPool(), autoscalingMinSize: 1, autoscalingMaxSize: 4
});

const pausedPool = (): MachinePool => ({
  ...manualPool(),
  machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' }
});

const createMachine = ({
  pool, roles = { worker: true }, others = [], machineCanUpdate = true, poolCanUpdate = true, withPool = true
}: {
  pool: MachinePool,
  roles?: { worker?: boolean, controlPlane?: boolean, etcd?: boolean },
  others?: object[],
  machineCanUpdate?: boolean,
  poolCanUpdate?: boolean,
  withPool?: boolean,
}) => {
  const machines: object[] = [];
  const store: Record<string, any> = {
    [CAPI.RANCHER_CLUSTER]: {
      id: 'ns/c1', spec: { rkeConfig: { machinePools: [pool] } }, machines
    },
    [MACHINE_TEMPLATE_TYPE]: {
      id:       `ns/${ MACHINE_TEMPLATE }`,
      metadata: { annotations: { 'rke.cattle.io/cloned-from-name': POOL_CONFIG } }
    },
  };

  const rootGetters = {
    'management/byId':     (type: string, id: string) => (store[type]?.id === id ? store[type] : undefined),
    'type-map/optionsFor': () => ({ isEditable: true }),
    'i18n/t':              (key: string) => key,
  };
  const ctx = { getters: rootGetters, rootGetters };

  if (withPool) {
    store[CAPI.MACHINE_DEPLOYMENT] = new CapiMachineDeployment({
      id:       'ns/c1-workers',
      type:     CAPI.MACHINE_DEPLOYMENT,
      metadata: { name: 'c1-workers', namespace: 'ns' },
      links:    poolCanUpdate ? { update: 'update' } : {},
      spec:     {
        clusterName: 'c1',
        template:    { spec: { infrastructureRef: { name: MACHINE_TEMPLATE, kind: 'Amazonec2MachineTemplate' } } },
      },
    }, ctx);
  }

  const machine = new CapiMachine({
    id:       'ns/c1-workers-xyz',
    type:     CAPI.MACHINE,
    metadata: {
      name:      'c1-workers-xyz',
      namespace: 'ns',
      labels:    {
        [CAPI_LABELS.DEPLOYMENT_NAME]: 'c1-workers',
        [MACHINE_ROLES.WORKER]:        `${ !!roles.worker }`,
        [MACHINE_ROLES.CONTROL_PLANE]: `${ !!roles.controlPlane }`,
        [MACHINE_ROLES.ETCD]:          `${ !!roles.etcd }`,
      },
    },
    links: machineCanUpdate ? { update: 'update' } : {},
    spec:  { clusterName: 'c1' },
  }, ctx);

  machines.push(machine, ...others);

  return machine;
};

describe('class CapiMachine', () => {
  describe('canScaleDown', () => {
    it.each([
      {
        label: 'a manually scaled pool', pool: manualPool, expected: true
      },
      {
        label: 'a paused pool', pool: pausedPool, expected: true
      },
      {
        label: 'an autoscaling pool', pool: autoscalingPool, expected: false
      },
    ])('should be $expected for a machine in $label', ({ pool, expected }) => {
      const machine = createMachine({ pool: pool() });

      expect(machine.canScaleDown).toStrictEqual(expected);
    });

    it.each([
      ['the machine', { machineCanUpdate: false }],
      ['its pool', { poolCanUpdate: false }],
    ])('should be false when the user cannot update %s', (_label, permissions) => {
      const machine = createMachine({ pool: manualPool(), ...permissions });

      expect(machine.canScaleDown).toStrictEqual(false);
    });

    it('should be false when the machine has no pool', () => {
      const machine = createMachine({ pool: autoscalingPool(), withPool: false });

      expect(machine.canScaleDown).toStrictEqual(false);
    });

    it.each([
      {
        label: 'the last etcd machine', others: [], expected: false
      },
      {
        label: 'an etcd machine with another etcd machine left', others: [{ isEtcd: true }], expected: true
      },
    ])('should be $expected for $label', ({ others, expected }) => {
      const machine = createMachine({
        pool: manualPool(), roles: { etcd: true }, others
      });

      expect(machine.canScaleDown).toStrictEqual(expected);
    });
  });
});
