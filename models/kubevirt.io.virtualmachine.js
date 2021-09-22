import Vue from 'vue';
import { load } from 'js-yaml';
import { colorForState } from '@/plugins/core-store/resource-instance';
import { POD, NODE, HCI } from '@/config/types';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

const VMI_WAITING_MESSAGE = 'The virtual machine is waiting for resources to become available.';
const VM_ERROR = 'VM error';
const STOPPING = 'Stopping';
const OFF = 'Off';
const WAITING = 'Waiting';

const PAUSED = 'Paused';
const PAUSED_VM_MODAL_MESSAGE = 'This VM has been paused. If you wish to unpause it, please click the Unpause button below. For further details, please check with your system administrator.';

const POD_STATUS_NOT_SCHEDULABLE = 'POD_NOT_SCHEDULABLE';
const POD_STATUS_CONTAINER_FAILING = 'POD_CONTAINER_FAILING';
// eslint-disable-next-line no-unused-vars
const POD_STATUS_NOT_READY = 'POD_NOT_READY';

const POD_STATUS_FAILED = 'POD_FAILED';
const POD_STATUS_CRASHLOOP_BACKOFF = 'POD_CRASHLOOP_BACKOFF';
const POD_STATUS_UNKNOWN = 'POD_STATUS_UNKNOWN';

const POD_STATUS_ALL_ERROR = [
  POD_STATUS_NOT_SCHEDULABLE,
  POD_STATUS_CONTAINER_FAILING,
  POD_STATUS_FAILED,
  POD_STATUS_CRASHLOOP_BACKOFF,
  POD_STATUS_UNKNOWN,
];

const POD_STATUS_COMPLETED = 'POD_STATUS_COMPLETED';
const POD_STATUS_SUCCEEDED = 'POD_STATUS_SUCCEEDED';
const POD_STATUS_RUNNING = 'POD_STATUS_RUNNING';

const POD_STATUS_ALL_READY = [
  POD_STATUS_RUNNING,
  POD_STATUS_COMPLETED,
  POD_STATUS_SUCCEEDED,
];

const RunStrategy = {
  Always:         'Always',
  RerunOnFailure: 'RerunOnFailure',
  Halted:         'Halted',
  Manual:         'Manual',
};

const StateChangeRequest = {
  Start: 'Start',
  Stop:  'Stop',
};

const STARTING_MESSAGE =
  'This virtual machine will start shortly. Preparing storage, networking, and compute resources.';

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
  availableActions() {
    const out = this._standardActions;

    return [
      {
        action:     'stopVM',
        enabled:    !!this.actions?.stop,
        icon:       'icon icon-close',
        label:      this.t('harvester.action.stop'),
        bulkable:   true,
        external:   true,
      },
      {
        action:     'pauseVM',
        enabled:    !!this.actions?.pause,
        icon:       'icon icon-pause',
        label:      this.t('harvester.action.pause'),
      },
      {
        action:     'unpauseVM',
        enabled:    !!this.actions?.unpause,
        icon:       'icon icon-spinner',
        label:      this.t('harvester.action.unpause'),
      },
      {
        action:     'restartVM',
        enabled:    !!this.actions?.restart,
        icon:       'icon icon-refresh',
        label:      this.t('harvester.action.restart'),
        bulkable:   true,
        external:   true,
      },
      {
        action:     'startVM',
        enabled:    !!this.actions?.start,
        icon:       'icon icon-play',
        label:      this.t('harvester.action.start'),
        bulkable:   true,
        external:   true,
      },
      {
        action:     'backupVM',
        enabled:    !!this.actions?.backup,
        icon:       'icon icon-backup',
        label:      this.t('harvester.action.backup'),
      },
      {
        action:     'restoreVM',
        enabled:    !!this.actions?.restore,
        icon:       'icon icon-backup-restore',
        label:      this.t('harvester.action.restore'),
      },
      {
        action:     'ejectCDROM',
        enabled:    !!this.actions?.ejectCdRom,
        icon:       'icon icon-delete',
        label:      this.t('harvester.action.ejectCDROM'),
      },
      {
        action:     'migrateVM',
        enabled:    !!this.actions?.migrate,
        icon:       'icon icon-copy',
        label:      this.t('harvester.action.migrate'),
      },
      {
        action:     'abortMigrationVM',
        enabled:    !!this.actions?.abortMigration,
        icon:       'icon icon-close',
        label:      this.t('harvester.action.abortMigration'),
      },
      {
        action:     'addHotplug',
        enabled:    !!this.actions?.addVolume,
        icon:       'icon icon-plus',
        label:      this.t('harvester.action.addHotplug'),
      },
      {
        action:     'createTemplate',
        enabled:    !!this.actions?.createTemplate,
        icon:       'icon icon-copy',
        label:      this.t('harvester.action.createTemplate'),
      },
      ...out
    ];
  },

  applyDefaults() {
    return () => {
      const spec = {
        running:              true,
        template:             {
          metadata: { annotations: {} },
          spec:     {
            domain: {
              machine: { type: '' },
              cpu:     {
                cores:   null,
                sockets: 1,
                threads: 1
              },
              devices: {
                inputs: [{
                  bus:  'usb',
                  name: 'tablet',
                  type: 'tablet'
                }],
                interfaces: [{
                  masquerade: {},
                  model:      'virtio',
                  name:       'default'
                }],
                disks: [],
              },
              resources: {
                requests: {
                  memory: null,
                  cpu:    ''
                },
                limits: {
                  memory: null,
                  cpu:    ''
                }
              }
            },
            evictionStrategy: 'LiveMigrate',
            hostname:         '',
            networks:         [{
              name: 'default',
              pod:  {}
            }],
            volumes: []
          }
        }
      };

      Vue.set(this.metadata, 'annotations', { [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: '[]' });
      Vue.set(this, 'spec', spec);
    };
  },

  restartVM() {
    return () => {
      this.doAction('restart', {});
    };
  },

  backupVM() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'harvester/BackupModal'
      });
    };
  },

  restoreVM() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'harvester/RestoreDialog'
      });
    };
  },

  machineType() {
    return this.spec?.template?.spec?.domain?.machine?.type || '';
  },

  realAttachNodeName() {
    const vmi = this.$getters['byId'](HCI.VMI, this.id);
    const nodeName = vmi?.status?.nodeName;
    const node = this.$getters['byId'](NODE, nodeName);

    return node?.nameDisplay || '';
  },

  nodeName() {
    const vmi = this.$getters['byId'](HCI.VMI, this.id);
    const nodeName = vmi?.status?.nodeName;
    const node = this.$getters['byId'](NODE, nodeName);

    return node?.id;
  },

  pauseVM() {
    return () => {
      this.doAction('pause', {});
    };
  },

  unpauseVM() {
    return () => {
      this.doAction('unpause', {});
    };
  },

  stopVM() {
    return () => {
      this.doAction('stop', {});
    };
  },

  startVM() {
    return () => {
      this.doAction('start', {});
    };
  },

  migrateVM() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'harvester/MigrationDialog'
      });
    };
  },

  ejectCDROM() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'harvester/EjectCDROMDialog'
      });
    };
  },

  abortMigrationVM() {
    return () => {
      this.doAction('abortMigration', {});
    };
  },

  createTemplate() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'harvester/CloneTemplate'
      });
    };
  },

  addHotplug() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'harvester/AddHotplugModal'
      });
    };
  },

  isOff() {
    return !this.isVMExpectedRunning ? { status: OFF } : null;
  },

  isWaitingForVMI() {
    if (this && this.isVMExpectedRunning && !this.isVMCreated) {
      return { status: WAITING, message: VMI_WAITING_MESSAGE };
    }

    return null;
  },

  isVMExpectedRunning() {
    if (!this?.spec) {
      return false;
    }
    const { running = null, runStrategy = null } = this.spec;

    if (running !== null) {
      return running;
    }

    if (runStrategy !== null) {
      let changeRequests;

      switch (runStrategy) {
      case RunStrategy.Halted:
        return false;
      case RunStrategy.Always:
      case RunStrategy.RerunOnFailure:
        return true;
      case RunStrategy.Manual:
      default:
        changeRequests = new Set(
          (this.status?.stateChangeRequests || []).map(chRequest => chRequest?.action),
        );

        if (changeRequests.has(StateChangeRequest.Stop)) {
          return false;
        }
        if (changeRequests.has(StateChangeRequest.Start)) {
          return true;
        }

        return this.isVMCreated; // if there is no change request we can assume created is representing running (current and expected)
      }
    }

    return false;
  },

  podResource() {
    const vmiResource = this.$rootGetters['harvester/byId'](HCI.VMI, this.id);
    const podList = this.$rootGetters['harvester/all'](POD);

    return podList.find( (P) => {
      return vmiResource?.metadata?.name === P.metadata?.ownerReferences?.[0].name;
    });
  },

  isPaused() {
    const conditions = this.vmi?.status?.conditions || [];
    const isPause = conditions.filter(cond => cond.type === PAUSED).length > 0;

    return isPause ? {
      status:  PAUSED,
      message: PAUSED_VM_MODAL_MESSAGE
    } : null;
  },

  isVMError() {
    const conditions = get(this, 'status.conditions');
    const vmFailureCond = findBy(conditions, 'type', 'Failure');

    if (vmFailureCond) {
      return {
        status:          VM_ERROR,
        detailedMessage: vmFailureCond.message,
      };
    }

    return null;
  },

  vmi() {
    return this.$rootGetters['harvester/byId'](HCI.VMI, this.id);
  },

  isError() {
    const conditions = get(this.vmi, 'status.conditions');
    const vmiFailureCond = findBy(conditions, 'type', 'Failure');

    if (vmiFailureCond) {
      return { status: 'VMI error', detailedMessage: vmiFailureCond.message };
    }

    if ((this.vmi || this.isVMCreated) && this.podResource) {
      // const podStatus = this.podResource.getPodStatus;

      // if (POD_STATUS_ALL_ERROR.includes(podStatus?.status)) {
      //   return {
      //     ...podStatus,
      //     status: 'LAUNCHER_POD_ERROR',
      //     pod:    this.podResource,
      //   };
      // }
    }

    return this?.vmi?.status?.phase;
  },

  isRunning() {
    if (this.vmi?.status?.phase === VMIPhase.Running) {
      return { status: VMIPhase.Running };
    }

    return null;
  },

  isBeingStopped() {
    if (this && !this.isVMExpectedRunning && this.isVMCreated) {
      return { status: STOPPING };
    }

    return null;
  },

  isStarting() {
    if (this.isVMExpectedRunning && this.isVMCreated) {
      // created but not yet ready
      if (this.podResource) {
        const podStatus = this.podResource.getPodStatus;

        if (!POD_STATUS_ALL_READY.includes(podStatus?.status)) {
          return {
            ...podStatus,
            status:          'Starting',
            message:         STARTING_MESSAGE,
            detailedMessage: podStatus?.message,
            pod:             this.podResource,
          };
        }
      }

      return {
        status: 'Starting', message: STARTING_MESSAGE, pod: this.podResource
      };
    }

    return null;
  },

  otherState() {
    const state = (this.vmi && [VMIPhase.Scheduling, VMIPhase.Scheduled].includes(this.vmi?.status?.phase) && {
      status:  'Starting',
      message: STARTING_MESSAGE,
    }) ||
    (this.vmi && this.vmi.status?.phase === VMIPhase.Pending && {
      status:  'VMI_WAITING',
      message: VMI_WAITING_MESSAGE,
    }) ||
    (this.vmi && this.vmi?.status?.phase === VMIPhase.Failed && { status: 'VMI_ERROR' }) ||
    ((this.isVMExpectedRunning && !this.isVMCreated) && { status: 'Pending' }) ||
    { status: 'UNKNOWN' };

    return state;
  },

  isVMCreated() {
    return !!this?.status?.created;
  },

  getDataVolumeTemplates() {
    return get(this, 'spec.volumeClaimTemplates') === null ? [] : this.spec.volumeClaimTemplates;
  },

  restoreState() {
    return (vmResource = this, id) => {
      if (!id) {
        id = `${ this.metadata.namespace }/${ get(vmResource, `metadata.annotations."${ HCI_ANNOTATIONS.RESTORE_NAME }"`) }`;
      }
      const restoreResource = this.$rootGetters['harvester/byId'](HCI.RESTORE, id);

      if (!restoreResource) {
        return true;
      }

      return restoreResource?.isComplete;
    };
  },

  actualState() {
    if (!this.restoreState()) {
      return 'Restoring';
    }

    if (this?.metadata?.deletionTimestamp) {
      return 'Terminating';
    }

    if (!!this?.vmi?.migrationState && this.vmi.migrationState.status !== 'Failed') {
      return this.vmi.migrationState.status;
    }

    const state =
      this.isPaused?.status ||
      this.isVMError?.status ||
      this.isBeingStopped?.status ||
      this.isOff?.status ||
      this.isError?.status ||
      this.isRunning?.status ||
      this.isStarting?.status ||
      this.isWaitingForVMI?.state ||
      this.otherState?.status;

    return state;
  },

  warningMessage() {
    const conditions = get(this, 'status.conditions');
    const vmFailureCond = findBy(conditions, 'type', 'Failure');

    if (vmFailureCond) {
      return {
        status:  VM_ERROR,
        message: vmFailureCond.message,
      };
    }

    const vmiConditions = get(this.vmi, 'status.conditions');
    const vmiFailureCond = (findBy(vmiConditions, 'type', 'Failure') || {});

    if (vmiFailureCond) {
      return { status: 'VMI error', detailedMessage: vmiFailureCond.message };
    }

    if ((this.vmi || this.isVMCreated) && this.podResource) {
      const podStatus = this.podResource.getPodStatus;

      if (POD_STATUS_ALL_ERROR.includes(podStatus?.status)) {
        return {
          ...podStatus,
          status: 'LAUNCHER_POD_ERROR',
          pod:    this.podResource,
        };
      }
    }

    return null;
  },

  migrationMessage() {
    if (!!this?.vmi?.migrationState && this.vmi.migrationState.status === 'Failed') {
      return {
        ...this.actualState,
        message: this.t('harvester.modal.migration.failedMessage')
      };
    }

    return null;
  },

  stateDisplay() {
    return this.actualState;
  },

  stateColor() {
    const state = this.actualState;

    return colorForState(state);
  },

  networkIps() {
    let networkData = '';
    const out = [];
    const arrVolumes = this.spec.template?.spec?.volumes || [];

    arrVolumes.forEach((V) => {
      if (V.cloudInitNoCloud) {
        networkData = V.cloudInitNoCloud.networkData;
      }
    });

    try {
      const newInitScript = load(networkData);

      if (newInitScript?.config && Array.isArray(newInitScript.config)) {
        const config = newInitScript.config;

        config.forEach((O) => {
          if (O?.subnets && Array.isArray(O.subnets)) {
            const subnets = O.subnets;

            subnets.forEach((S) => {
              if (S.address) {
                out.push(S.address);
              }
            });
          }
        });
      }
    } catch (err) {

    }

    return out;
  },

  warningCount() {
    return this.resourcesStatus.warningCount;
  },

  errorCount() {
    return this.resourcesStatus.errorCount;
  },

  resourcesStatus() {
    const vmList = this.$rootGetters['harvester/all'](HCI.VM);
    let warningCount = 0;
    let errorCount = 0;

    vmList.forEach((vm) => {
      const status = vm.actualState;

      if (status === VM_ERROR) {
        errorCount += 1;
      } else if (status === 'Stopping' || status === 'Waiting' || status === 'Pending' || status === 'Starting' || status === 'Terminating') {
        warningCount += 1;
      }
    });

    return {
      warningCount,
      errorCount
    };
  },

  volumeClaimTemplates() {
    let out = [];

    try {
      out = JSON.parse(this.metadata?.annotations?.[HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]);
    } catch (e) {
      console.error(`modal: getVolumeClaimTemplates, ${ e }`); // eslint-disable-line no-console
    }

    return out;
  },

  restoreName() {
    return get(this, `metadata.annotations."${ HCI_ANNOTATIONS.RESTORE_NAME }"`) || '';
  },

  customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        minLength:      1,
        maxLength:      63,
        translationKey: 'harvester.fields.name'
      },
      {
        nullable:       false,
        path:           'spec.template.spec.domain.cpu.cores',
        min:            1,
        max:            100,
        required:       true,
        translationKey: 'harvester.fields.cpu',
      },
      {
        nullable:       false,
        path:           'spec.template.spec.domain.resources.requests.memory',
        required:       false,
        translationKey: 'harvester.fields.memory',
      },
      {
        nullable:       false,
        path:           'spec.template.spec',
        validators:     ['vmNetworks'],
      },
      {
        nullable:       false,
        path:           'spec',
        validators:     ['vmDisks'],
      },
    ];

    return rules;
  },

  attachNetwork() {
    const networks = this.spec?.template?.spec?.networks || [];
    const hasMultus = networks.find( N => N.multus);

    return !!hasMultus;
  },

  memorySort() {
    const memory = this?.spec?.template?.spec?.domain?.resources?.requests?.memory || 0;

    return parseInt(memory);
  }
};
