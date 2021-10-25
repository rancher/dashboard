import { colorForState } from '@/plugins/core-store/resource-instance';
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

const PAUSED = 'Paused';
const PAUSED_VM_MODAL_MESSAGE = 'This VM has been paused. If you wish to unpause it, please click the Unpause button below. For further details, please check with your system administrator.';
const VMIPhase = {
  Pending:    'Pending',
  Scheduling: 'Scheduling',
  Scheduled:  'Scheduled',
  Running:    'Running',
  Succeeded:  'Succeeded',
  Failed:     'Failed',
  Unknown:    'Unknown',
};

export default {
  _availableActions() {
    const out = this._standardActions;

    const actions = out.find((O) => {
      return O.action === 'promptRemove';
    });

    return [actions];
  },

  stateDisplay() {
    // const phase = this?.status?.phase;
    if (this?.metadata?.deletionTimestamp) {
      return 'Terminating';
    }

    return this?.status?.phase;
  },

  stateBackground() {
    return colorForState(this.stateDisplay).replace('text-', 'bg-');
  },

  stateColor() {
    const state = this.stateDisplay;

    return colorForState(state);
  },

  vmimResource() {
    const all = this.$rootGetters['harvester/all'](HCI.VMIM) || [];
    const vmimList = all.filter(vmim => vmim.spec?.vmiName === this.metadata?.name);

    if (vmimList.length === 0) {
      return [];
    }

    vmimList.sort((a, b) => {
      return a?.metadata?.creationTimestamp > b?.metadata?.creationTimestamp ? -1 : 1;
    });

    return vmimList[0];
  },

  migrationState() {
    const state = this.metadata?.annotations?.[HCI_ANNOTATIONS.MIGRATION_STATE];

    if (this.vmimResource?.status?.phase === VMIPhase.Failed) {
      return {
        type:   'migration',
        status: VMIPhase.Failed
      };
    }

    if (this.vmimResource?.status?.phase && state) {
      return {
        type:   'migration',
        status: state
      };
    }
  },

  migrationStateBackground() {
    const state = this.migrationState.status;

    return colorForState(state).replace('text-', 'bg-');
  },

  isPaused() {
    const conditions = this?.status?.conditions || [];
    const isPause = conditions.filter(cond => cond.type === PAUSED).length > 0;

    return isPause ? {
      status:  PAUSED,
      message: PAUSED_VM_MODAL_MESSAGE
    } : null;
  },

  isRunning() {
    if (this?.status?.phase === VMIPhase.Running) {
      return { status: VMIPhase.Running };
    }

    return null;
  },

  getVMIApiPath() {
    const clusterId = this.$rootGetters['clusterId'];

    if (this.$rootGetters['isMultiVirtualCluster']) {
      const prefix = `/k8s/clusters/${ clusterId }`;

      return `${ prefix }/apis/subresources.kubevirt.io/v1/namespaces/${ this.metadata.namespace }/virtualmachineinstances/${ this.name }/vnc`;
    } else {
      return `/apis/subresources.kubevirt.io/v1/namespaces/${ this.metadata.namespace }/virtualmachineinstances/${ this.name }/vnc`;
    }
  },

  getSerialConsolePath() {
    const clusterId = this.$rootGetters['clusterId'];

    if (this.$rootGetters['isMultiVirtualCluster']) {
      const prefix = `/k8s/clusters/${ clusterId }`;

      return `${ prefix }/apis/subresources.kubevirt.io/v1/namespaces/${ this.metadata.namespace }/virtualmachineinstances/${ this.name }/console`;
    } else {
      return `/apis/subresources.kubevirt.io/v1/namespaces/${ this.metadata.namespace }/virtualmachineinstances/${ this.name }/console`;
    }
  }
};
