import Vue from 'vue';
import { load } from 'js-yaml';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { POD, NODE, HCI, PVC } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import { parseSi } from '@shell/utils/units';
import { get } from '@shell/utils/object';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { _CLONE } from '@shell/config/query-params';
import SteveModel from '@shell/plugins/steve/steve-class';

export const OFF = 'Off';

const VMI_WAITING_MESSAGE = 'The virtual machine is waiting for resources to become available.';
const VM_ERROR = 'VM error';
const STOPPING = 'Stopping';
const WAITING = 'Waiting';
const NOT_READY = 'Not Ready';
const AGENT_CONNECTED = 'AgentConnected';

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

const IgnoreMessages = ['pod has unbound immediate PersistentVolumeClaims'];

export default class VirtVm extends SteveModel {
  get availableActions() {
    const out = super._availableActions;

    return [
      {
        action:     'stopVM',
        enabled:    !!this.actions?.stop,
        icon:       'icon icon-close',
        label:      this.t('harvester.action.stop'),
        bulkable:   true,
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
      },
      {
        action:     'softrebootVM',
        enabled:    !!this.actions?.softreboot,
        icon:       'icon icon-refresh',
        label:      this.t('harvester.action.softreboot'),
      },
      {
        action:     'startVM',
        enabled:    !!this.actions?.start,
        icon:       'icon icon-play',
        label:      this.t('harvester.action.start'),
        bulkable:   true,
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
      {
        action:     'openLogs',
        enabled:    !!this.links.view,
        icon:       'icon icon-fw icon-chevron-right',
        label:      this.t('harvester.action.viewlogs'),
        total:      1,
      },
      ...out
    ];
  }

  applyDefaults(resources = this, realMode) {
    const spec = {
      runStrategy: 'RerunOnFailure',
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
              limits: {
                memory: null,
                cpu:    ''
              }
            },
            features: { acpi: { enabled: true } },
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

    if (realMode !== _CLONE) {
      Vue.set(this.metadata, 'annotations', { [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: '[]' });
      Vue.set(this, 'spec', spec);
    }
  }

  cleanForNew() {
    this.cleanForNew();

    this.spec.template.spec.hostname = '';
    const interfaces = this.spec.template.spec.domain.devices?.interfaces || [];

    for (let i = 0; i < interfaces.length; i++) {
      if (interfaces[i].macAddress) {
        interfaces[i].macAddress = '';
      }
    }
  }

  restartVM() {
    this.doActionGrowl('restart', {});
  }

  softrebootVM() {
    this.doActionGrowl('softreboot', {});
  }

  openLogs() {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-logs`,
      label:     this.nameDisplay,
      icon:      'file',
      component: 'ContainerLogs',
      attrs:     { pod: this.podResource }
    }, { root: true });
  }

  backupVM(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/BackupModal'
    });
  }

  unplugVolume(diskName) {
    const resources = this;

    this.$dispatch('promptModal', {
      resources,
      diskName,
      component: 'harvester/UnplugVolume'
    });
  }

  restoreVM(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/RestoreDialog'
    });
  }

  get machineType() {
    return this.spec?.template?.spec?.domain?.machine?.type || '';
  }

  get realAttachNodeName() {
    const vmi = this.$getters['byId'](HCI.VMI, this.id);
    const nodeName = vmi?.status?.nodeName;
    const node = this.$getters['byId'](NODE, nodeName);

    return node?.nameDisplay || '';
  }

  get nodeName() {
    const vmi = this.$getters['byId'](HCI.VMI, this.id);
    const nodeName = vmi?.status?.nodeName;
    const node = this.$getters['byId'](NODE, nodeName);

    return node?.id;
  }

  pauseVM() {
    this.doActionGrowl('pause', {});
  }

  unpauseVM() {
    this.doActionGrowl('unpause', {});
  }

  stopVM() {
    this.doActionGrowl('stop', {});
  }

  startVM() {
    this.doActionGrowl('start', {});
  }

  migrateVM(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/MigrationDialog'
    });
  }

  ejectCDROM(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/EjectCDROMDialog'
    });
  }

  abortMigrationVM() {
    this.doActionGrowl('abortMigration', {});
  }

  createTemplate(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/CloneTemplate'
    });
  }

  addHotplug(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/AddHotplugModal'
    });
  }

  get networksName() {
    const interfaces = this.spec.template.spec.domain.devices?.interfaces || [];

    return interfaces.map(I => I.name);
  }

  get isOff() {
    return !this.isVMExpectedRunning ? { status: OFF } : null;
  }

  get isWaitingForVMI() {
    if (this && this.isVMExpectedRunning && !this.isVMCreated) {
      return { status: WAITING, message: VMI_WAITING_MESSAGE };
    }

    return null;
  }

  get isVMExpectedRunning() {
    if (!this?.spec) {
      return false;
    }
    const { running = null, runStrategy = null } = this.spec;
    const conditions = this?.status?.conditions || [];

    if (running) {
      return true;
    }

    if (runStrategy !== null) {
      let changeRequests;

      switch (runStrategy) {
      case RunStrategy.Halted:
        return false;
      case RunStrategy.Always:
        return true;
      case RunStrategy.RerunOnFailure:
        if (this.status?.printableStatus === 'ErrorUnschedulable' && conditions.find(C => C.message && C.message.includes(IgnoreMessages))) {
          return true;
        }

        return ['Starting', 'Running'].includes(this.status?.printableStatus);
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

        if (changeRequests.size === 0 ) {
          return ['Starting', 'Running'].includes(this.status?.printableStatus);
        }

        return this.isVMCreated; // if there is no change request we can assume created is representing running (current and expected)
      }
    }

    return false;
  }

  get podResource() {
    const vmiResource = this.$rootGetters['harvester/byId'](HCI.VMI, this.id);
    const podList = this.$rootGetters['harvester/all'](POD);

    return podList.find( (P) => {
      return vmiResource?.metadata?.name && vmiResource?.metadata?.name === P.metadata?.ownerReferences?.[0].name;
    });
  }

  get isPaused() {
    const conditions = this.vmi?.status?.conditions || [];
    const isPause = conditions.filter(cond => cond.type === PAUSED).length > 0;

    return isPause ? {
      status:  PAUSED,
      message: PAUSED_VM_MODAL_MESSAGE
    } : null;
  }

  get isVMError() {
    const conditions = get(this, 'status.conditions');
    const vmFailureCond = findBy(conditions, 'type', 'Failure');

    if (vmFailureCond) {
      return {
        status:          VM_ERROR,
        detailedMessage: vmFailureCond.message,
      };
    }

    return null;
  }

  get vmi() {
    const vmis = this.$rootGetters['harvester/all'](HCI.VMI);

    return vmis.find(VMI => VMI.id === this.id);
  }

  get isError() {
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
  }

  get isRunning() {
    const conditions = get(this.vmi, 'status.conditions');
    const isVMIReady = findBy(conditions, 'type', 'Ready')?.status === 'True';

    if (this.vmi?.status?.phase === VMIPhase.Running && isVMIReady) {
      return { status: VMIPhase.Running };
    }

    return null;
  }

  get isNotReady() {
    const conditions = get(this.vmi, 'status.conditions');
    const VMIReadyCondition = findBy(conditions, 'type', 'Ready');

    if (VMIReadyCondition?.status === 'False' && this.vmi?.status?.phase === VMIPhase.Running) {
      return { status: NOT_READY };
    }

    return null;
  }

  get isBeingStopped() {
    if (this && !this.isVMExpectedRunning && this.isVMCreated && this.vmi?.isTerminated) {
      return { status: STOPPING };
    }

    return null;
  }

  get isStarting() {
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
  }

  get otherState() {
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
  }

  get isVMCreated() {
    return !!this?.status?.created;
  }

  get getDataVolumeTemplates() {
    return get(this, 'spec.volumeClaimTemplates') === null ? [] : this.spec.volumeClaimTemplates;
  }

  restoreState(vmResource = this, id) {
    if (!id) {
      id = `${ this.metadata.namespace }/${ get(vmResource, `metadata.annotations."${ HCI_ANNOTATIONS.RESTORE_NAME }"`) }`;
    }
    const allRestore = this.$rootGetters['harvester/all'](HCI.RESTORE);

    const restoreResource = allRestore.find(O => O.id === id);

    if (!restoreResource) {
      return true;
    }

    return restoreResource?.isComplete;
  }

  get actualState() {
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
      this.isNotReady?.status ||
      this.isStarting?.status ||
      this.isWaitingForVMI?.state ||
      this.otherState?.status;

    return state;
  }

  get warningMessage() {
    const conditions = get(this, 'status.conditions');
    const vmFailureCond = findBy(conditions, 'type', 'Failure');

    if (vmFailureCond) {
      return {
        status:  VM_ERROR,
        message: vmFailureCond.message,
      };
    }

    const vmiConditions = get(this.vmi, 'status.conditions');
    const vmiFailureCond = findBy(vmiConditions, 'type', 'Failure');

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
  }

  get migrationMessage() {
    if (!!this?.vmi?.migrationState && this.vmi.migrationState.status === 'Failed') {
      return {
        ...this.actualState,
        message: this.t('harvester.modal.migration.failedMessage')
      };
    }

    return null;
  }

  get stateDisplay() {
    return this.actualState;
  }

  get stateColor() {
    const state = this.actualState;

    return colorForState(state);
  }

  get networkIps() {
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
  }

  get warningCount() {
    return this.resourcesStatus.warningCount;
  }

  get errorCount() {
    return this.resourcesStatus.errorCount;
  }

  get resourcesStatus() {
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
  }

  get volumeClaimTemplates() {
    let out = [];

    try {
      out = JSON.parse(this.metadata?.annotations?.[HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]);
    } catch (e) {}

    return out;
  }

  get persistentVolumeClaimName() {
    const volumes = this.spec.template.spec.volumes || [];

    return volumes.map((O) => {
      return O?.persistentVolumeClaim?.claimName;
    }).filter( name => !!name);
  }

  get rootImageId() {
    let imageId = '';
    const pvcs = this.$rootGetters[`harvester/all`](PVC) || [];

    const volumes = this.spec.template.spec.volumes || [];

    const firstVolumeName = volumes[0]?.persistentVolumeClaim?.claimName;
    const isNoExistingVolume = this.volumeClaimTemplates.find((volume) => {
      return firstVolumeName === volume?.metadata?.name;
    });

    if (!isNoExistingVolume) {
      const existingVolume = pvcs.find(P => P.id === `${ this.metadata.namespace }/${ firstVolumeName }`);

      if (existingVolume) {
        return existingVolume?.metadata?.annotations?.['harvesterhci.io/imageId'];
      }
    }

    this.volumeClaimTemplates.find( (volume) => {
      imageId = volume?.metadata?.annotations?.['harvesterhci.io/imageId'];

      return !!imageId;
    });

    return imageId;
  }

  get restoreName() {
    return get(this, `metadata.annotations."${ HCI_ANNOTATIONS.RESTORE_NAME }"`) || '';
  }

  get customValidationRules() {
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
        required:       true,
        translationKey: 'harvester.fields.cpu',
      },
      {
        nullable:       false,
        path:           'spec.template.spec.domain.resources.limits.memory',
        required:       true,
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
        validators:     [`vmDisks`],
      },
    ];

    return rules;
  }

  get attachNetwork() {
    const networks = this.spec?.template?.spec?.networks || [];
    const hasMultus = networks.find( N => N.multus);

    return !!hasMultus;
  }

  get memorySort() {
    const memory = this?.spec?.template?.spec?.domain?.resources?.requests?.memory || 0;

    const formatSize = parseSi(memory);

    return parseInt(formatSize);
  }

  get ingoreVMMessage() {
    const ignoreConditions = [{
      name:    'unavailable',
      error:   false,
      vmState: this.actualState === PAUSED
    }];

    const state = this.metadata?.state;

    return ignoreConditions.find(condition => condition.name === state?.name && condition.error === state?.error && condition.vmState) ||
    IgnoreMessages.find(M => super.stateDescription?.includes(M)) ||
    this.isOff;
  }

  get stateDescription() {
    return this.ingoreVMMessage ? '' : super.stateDescription;
  }

  get displayMemory() {
    return this.spec.template.spec.domain.resources?.limits?.memory || this.spec.template.spec.domain.resources?.requests?.memory;
  }

  get isQemuInstalled() {
    const conditions = this.vmi?.status?.conditions || [];
    const qemu = conditions.find(cond => cond.type === AGENT_CONNECTED);

    return qemu?.status === 'True';
  }
}
