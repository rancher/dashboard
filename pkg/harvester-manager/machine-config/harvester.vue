<script>
import draggable from 'vuedraggable';
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';
import YAML from 'yaml';
import { isBase64 } from '@shell/utils/string';

import NodeAffinity from '@shell/components/form/NodeAffinity';
import PodAffinity from '@shell/components/form/PodAffinity';
import InfoBox from '@shell/components/InfoBox';
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ArrayListSelect from '@shell/components/form/ArrayListSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import UnitInput from '@shell/components/form/UnitInput';
import YamlEditor from '@shell/components/YamlEditor';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { clone, get } from '@shell/utils/object';
import { uniq, removeObject } from '@shell/utils/array';

import { _CREATE, _VIEW } from '@shell/config/query-params';

import { mapGetters } from 'vuex';
import {
  HCI,
  NAMESPACE,
  MANAGEMENT,
  CONFIG_MAP,
  NORMAN,
  NODE,
  STORAGE_CLASS
} from '@shell/config/types';

import { SETTING } from '@shell/config/settings';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import { allHashSettled } from '@shell/utils/promise';
import { podAffinity as podAffinityValidator } from '@shell/utils/validators/pod-affinity';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import { isValidMac } from '@shell/utils/validators/cidr';
import { HCI as HCI_ANNOTATIONS, STORAGE } from '@shell/config/labels-annotations';
import { isEqual } from 'lodash';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';

const STORAGE_NETWORK = 'storage-network.settings.harvesterhci.io';

// init qemu guest agent
export const QGA_JSON = {
  package_update: true,
  packages:       ['qemu-guest-agent'],
  runcmd:         [
    [
      'systemctl',
      'enable',
      '--now',
      'qemu-guest-agent.service'
    ]
  ]
};

export function isReady() {
  function getStatusConditionOfType(type, defaultValue = []) {
    const conditions = Array.isArray(get(this, 'status.conditions')) ? this.status.conditions : defaultValue;

    return conditions.find( (cond) => cond.type === type);
  }

  const initialized = getStatusConditionOfType.call(this, 'Initialized');
  const imported = getStatusConditionOfType.call(this, 'Imported');
  const isCompleted = this.status?.progress === 100;

  if ([initialized?.status, imported?.status].includes('False')) {
    return false;
  } else {
    return isCompleted && true;
  }
}

const SOURCE_TYPE = {
  Volume: 'volume',
  IMAGE:  'image',
};

const VGPU_PREFIX = { NVIDIA: 'nvidia.com/' };

export default {
  name: 'ConfigComponentHarvester',

  components: {
    ArrayListSelect, Checkbox, draggable, Loading, LabeledSelect, LabeledInput, UnitInput, Banner, YamlEditor, NodeAffinity, PodAffinity, InfoBox
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true
    },

    uuid: {
      type:     String,
      required: true
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    poolIndex: {
      type:     Number,
      required: true
    },

    machinePools: {
      type:    Array,
      default: () => []
    }
  },

  async fetch() {
    this.errors = [];

    try {
      this.credential = await this.$store.dispatch('rancher/find', {
        type: NORMAN.CLOUD_CREDENTIAL,
        id:   this.credentialId
      });
      const clusterId = get(this.credential, 'decodedData.clusterId');

      const url = `/k8s/clusters/${ clusterId }/v1`;

      if (clusterId) {
        let configMapsUrl = `${ url }/${ CONFIG_MAP }s`;

        if (this.$store.getters[`cluster/paginationEnabled`](CONFIG_MAP)) {
          const pagination = new FilterArgs({
            filters: [
              PaginationParamFilter.createMultipleFields([
                new PaginationFilterField({ field: `metadata.label["${ HCI_ANNOTATIONS.CLOUD_INIT }"]`, value: 'user' }),
                new PaginationFilterField({ field: `metadata.label["${ HCI_ANNOTATIONS.CLOUD_INIT }"]`, value: 'network' })
              ])
            ]
          });

          configMapsUrl = this.$store.getters[`cluster/urlFor`](CONFIG_MAP, null, { pagination, url: configMapsUrl });
        }

        const res = await allHashSettled({
          namespaces:   this.$store.dispatch('cluster/request', { url: `${ url }/${ NAMESPACE }s` }),
          images:       this.$store.dispatch('cluster/request', { url: `${ url }/${ HCI.IMAGE }s` }),
          configMaps:   this.$store.dispatch('cluster/request', { url: configMapsUrl }),
          networks:     this.$store.dispatch('cluster/request', { url: `${ url }/k8s.cni.cncf.io.network-attachment-definitions` }),
          storageClass: this.$store.dispatch('cluster/request', { url: `${ url }/${ STORAGE_CLASS }es` }),
          settings:     this.$store.dispatch('cluster/request', { url: `${ url }/${ MANAGEMENT.SETTING }s` })
        });

        for (const key of Object.keys(res)) {
          const obj = res[key];

          if (obj.status === 'rejected') {
            this.errors.push(stringify(obj.reason));
            continue;
          }
        }

        if (this.errors.length > 0) {
          // If an error is reported in the request data, see if it is due to a cluster error
          const cluster = await this.$store.dispatch('management/find', {
            type: MANAGEMENT.CLUSTER,
            id:   clusterId
          });

          if (cluster.stateDescription && !cluster.isReady) {
            this.errors = [cluster.stateDescription];
          }
        }

        const userDataOptions = [];
        const networkDataOptions = [];

        (res.configMaps.value?.data || []).map((O) => {
          const cloudTemplate =
            O.metadata?.labels?.[HCI_ANNOTATIONS.CLOUD_INIT];

          if (cloudTemplate === 'user') {
            userDataOptions.push({
              label: O.metadata.name,
              value: O.data.cloudInit
            });
          }

          if (cloudTemplate === 'network') {
            networkDataOptions.push({
              label: O.metadata.name,
              value: O.data.cloudInit
            });
          }
        });

        this.userDataOptions = userDataOptions;
        this.networkDataOptions = networkDataOptions;
        this.images = res.images.value?.data;
        this.storageClass = res.storageClass.value?.data;
        this.networkOptions = (res.networks.value?.data || []).filter((O) => O.metadata?.annotations?.[STORAGE_NETWORK] !== 'true').map((O) => {
          let value;
          let label;

          try {
            const config = JSON.parse(O.spec.config);

            const id = config.vlan;

            value = O.id;
            label = `${ value } (vlanId=${ id })`;
          } catch (err) {}

          return {
            label,
            value
          };
        });

        let systemNamespaces = (res.settings.value?.data || []).filter((x) => x.id === SETTING.SYSTEM_NAMESPACES);

        if (systemNamespaces) {
          systemNamespaces = (systemNamespaces[0]?.value || systemNamespaces[0]?.default)?.split(',') || [];
        }

        (res.namespaces.value.data || []).forEach(async(namespace) => {
          const proxyNamespace = await this.$store.dispatch('cluster/create', namespace);

          const isSettingSystemNamespace = systemNamespaces.includes(namespace.metadata.name);

          const systemNS = proxyNamespace.isSystem || proxyNamespace.isFleetManaged || isSettingSystemNamespace || proxyNamespace.isObscure;

          if (!systemNS && namespace.links.update) {
            const value = namespace.metadata.name;
            const label = namespace.metadata.name;

            this.namespaces.push({
              nameDisplay: label,
              id:          value
            });

            this.namespaceOptions.push({
              label,
              value
            });
          }
        });

        try {
          const { data: nodes } = await this.$store.dispatch('cluster/request', { url: `${ url }/${ NODE }s` });

          this.allNodeObjects = nodes;
        } catch (err) {
          this.allNodeObjects = [];
        }
      }

      if (isEmpty(this.value.cpuCount)) {
        this.value.cpuCount = '2';
      }

      if (isEmpty(this.value.memorySize)) {
        this.value.memorySize = '4';
      }

      if (!this.value.diskInfo) {
        if (this.mode !== _CREATE) {
          this.isOldFormat = true;
        }

        // Convert the old format to the new format
        const disk = {
          imageName: this.value.imageName || '',
          bootOrder: 1,
          size:      this.value.diskSize || 40,
        };

        if (this.value.diskBus) {
          disk.bus = this.value.diskBus;
        }

        const diskInfo = { disks: [disk] };

        this.value.diskInfo = JSON.stringify(diskInfo);
      }

      this.disks = JSON.parse(this.value.diskInfo).disks || [];
      this.disksObj = JSON.parse(this.value.diskInfo);
      this.disksHistoric = this.value.diskInfo;

      if (!this.value.networkInfo) {
        if (this.mode !== _CREATE) {
          this.isOldFormat = true;
        }

        const _interface = {
          networkName: this.value.networkName || '',
          macAddress:  '',
        };

        if (this.value.networkModel) {
          _interface.model = 'virtio';
        }

        const networkInfo = { interfaces: [_interface] };

        this.value.networkInfo = JSON.stringify(networkInfo);
      }
      this.interfaces = JSON.parse(this.value.networkInfo).interfaces || [];
      this.networksObj = JSON.parse(this.value.networkInfo);
      this.networksHistoric = this.value.networkInfo;

      this.getAvailableVGpuDevices();

      this.update();
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    const isCreate = this.mode === _CREATE;

    let vmAffinity = { affinity: {} };
    let vmAffinityObj = {};
    let vmAffinityIsBase64 = true;
    const vmAffinityHistoric = this.value.vmAffinity;

    if (this.value.vmAffinity) {
      if (isBase64(this.value.vmAffinity)) {
        vmAffinityObj = JSON.parse(base64Decode(this.value.vmAffinity));
      } else {
        vmAffinityIsBase64 = false;
        vmAffinityObj = JSON.parse(this.value.vmAffinity);
      }
    }

    vmAffinity = { affinity: clone(vmAffinityObj) };

    let vGpus = [];
    let networkData = '';
    let userData = '';
    let installAgent;
    let userDataIsBase64 = true;
    let networkDataIsBase64 = true;

    if (isCreate) {
      installAgent = true;
      userData = this.addCloudConfigComment(QGA_JSON);
      this.value.userData = base64Encode(userData);
    } else {
      if (isBase64(this.value.userData)) {
        userData = base64Decode(this.value.userData);
      } else {
        userDataIsBase64 = false;
        userData = this.value.userData;
      }
      installAgent = this.hasInstallAgent(userData, false);
    }

    if (this.value.networkData) {
      if (isBase64(this.value.networkData)) {
        networkData = base64Decode(this.value.networkData);
      } else {
        networkDataIsBase64 = false;
        networkData = this.value.networkData;
      }
    }

    if (this.value.vgpuInfo) {
      const vGPURequests = JSON.parse(this.value.vgpuInfo)?.vGPURequests;

      vGpus = vGPURequests?.map((r) => r?.deviceName).filter((f) => f) || [];
    }

    return {
      credential:         null,
      vmAffinity,
      vmAffinityObj,
      vmAffinityHistoric,
      userData,
      userDataTemplate:   '',
      networkData,
      images:             [],
      storageClass:       [],
      namespaces:         [],
      namespaceOptions:   [],
      networkOptions:     [],
      userDataOptions:    [],
      networkDataOptions: [],
      allNodeObjects:     [],
      cpuCount:           '',
      disks:              [],
      disksObj:           {},
      disksHistoric:      {},
      interfaces:         [],
      networksObj:        {},
      networksHistoric:   {},
      isOldFormat:        false,
      installAgent,
      userDataIsBase64,
      networkDataIsBase64,
      vmAffinityIsBase64,
      SOURCE_TYPE,
      vGpuDevices:        {},
      vGpusInit:          vGpus,
      vGpus,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    disabledEdit() {
      return this.disabled || !!(this.isEdit && this.value.id);
    },

    imageOptions: {
      get() {
        return (this.images || []).filter( (O) => {
          return !O.spec.url.endsWith('.iso') && isReady.call(O);
        }).sort((a, b) => a.metadata.creationTimestamp > b.metadata.creationTimestamp ? -1 : 1).map( (O) => {
          const value = O.id;
          const label = `${ O.spec.displayName } (${ value })`;

          return {
            label,
            value
          };
        });
      },
      set(neu) {
        this.images = neu;
      }
    },

    namespaceDisabled() {
      return this.disabledEdit || this.poolIndex > 0;
    },

    storageClassOptions() {
      const out = (this.storageClass || []).filter((s) => !s.parameters?.backingImage).map((s) => {
        const isDefault = s.metadata?.annotations?.[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';
        const label = isDefault ? `${ s.metadata.name } (${ this.t('generic.default') })` : s.metadata.name;

        return {
          label,
          value: s.metadata.name,
        };
      }) || [];

      return out;
    },

    defaultStorageClass() {
      const defaultStorageClass = (this.storageClass || []).filter((s) => !s.parameters?.backingImage).find((s) => {
        const isDefault = s.metadata?.annotations?.[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';

        return isDefault;
      });

      return defaultStorageClass?.metadata?.name || '';
    },

    affinityLabels() {
      return {
        namespaceInputLabel:      this.t('harvesterManager.affinity.namespaces.label'),
        namespaceSelectionLabels: [
          this.t('harvesterManager.affinity.thisPodNamespace'),
          this.t('workload.scheduling.affinity.allNamespaces'),
          this.t('harvesterManager.affinity.matchExpressions.inNamespaces')
        ],
        addLabel:               this.t('harvesterManager.affinity.addLabel'),
        topologyKeyPlaceholder: this.t('harvesterManager.affinity.topologyKey.placeholder')
      };
    },

    vGpuOptions() {
      const vGpuTypes = uniq([
        ...this.vGpusInit,
        ...Object.values(this.vGpuDevices)
          .filter((vGpu) => vGpu.enabled && !!vGpu.type && (vGpu.allocatable === null || vGpu.allocatable > 0))
          .map((vGpu) => vGpu.type),
      ]);

      return vGpuTypes;
    },

    showVGpuAllocationInfo() {
      return this.mode !== _VIEW && !!Object.values(this.vGpuDevices).find((d) => d.allocatable);
    }
  },

  watch: {
    credentialId() {
      if (!this.isEdit) {
        this.imageOptions = [];
        this.networkOptions = [];
        this.namespaces = [];
        this.storageClass = [];
        this.namespaceOptions = [];
        this.vmAffinity = { affinity: {} };
        this.vmAffinityObj = {};
        this.value.imageName = '';
        this.value.networkName = '';
        this.value.vmNamespace = '';
        this.value.vmAffinity = '';

        // set default disk
        const diskInfo = {
          disks: [{
            imageName: '',
            bootOrder: 1,
            size:      40,
          }]
        };

        this.value.diskInfo = JSON.stringify(diskInfo);

        // set default network
        const networkInfo = {
          interfaces: [{
            networkName: '',
            macAddress:  '',
          }]
        };

        this.value.networkInfo = JSON.stringify(networkInfo);
      }

      this.$fetch();
    },

    networkData(neu) {
      this.$refs.networkYamlEditor.refresh();
      this.value.networkData = base64Encode(neu);
    },

    userData(neu) {
      const hasInstall = this.hasInstallAgent(neu, this.installAgent);

      this.installAgent = hasInstall;
      this.value.userData = base64Encode(neu);
    },

    machinePools: {
      handler(pools) {
        const vmNamespace = pools[0].config.vmNamespace;

        if (this.poolIndex > 0 && this.value.vmNamespace !== vmNamespace) {
          this.value.vmNamespace = vmNamespace;
        }
      },
      deep: true
    }
  },

  methods: {
    stringify,

    test() {
      const errors = [];

      if (!this.userDataIsBase64 && isBase64(this.value.userData)) {
        this.value.userData = base64Decode(this.value.userData);
      }

      if (!this.networkDataIsBase64 && isBase64(this.value.networkData)) {
        this.value.networkData = base64Decode(this.value.networkData);
      }

      if (!this.vmAffinityIsBase64 && isBase64(this.value.vmAffinity)) {
        this.value.vmAffinity = base64Decode(this.value.vmAffinity);
      }

      if (!this.value.cpuCount) {
        const message = this.validatorRequiredField(
          this.t('cluster.credential.harvester.cpu')
        );

        errors.push(message);
      }

      if (!this.value.vmNamespace) {
        const message = this.validatorRequiredField(
          this.t('cluster.credential.harvester.namespace')
        );

        errors.push(message);
      }

      if (!this.value.memorySize) {
        const message = this.validatorRequiredField(
          this.t('cluster.credential.harvester.memory')
        );

        errors.push(message);
      }

      if (!this.value.sshUser) {
        const message = this.validatorRequiredField(
          this.t('cluster.credential.harvester.sshUser')
        );

        errors.push(message);
      }

      this.validatorDiskAndNetowrk(errors);

      this.validatorVGpus(errors);

      podAffinityValidator(this.vmAffinity.affinity, this.$store.getters, errors);

      return { errors };
    },

    validatorRequiredField(key) {
      return this.t('validation.required', { key });
    },

    validatorDiskAndNetowrk(errors) {
      const disks = JSON.parse(this.value.diskInfo).disks;
      const interfaces = JSON.parse(this.value.networkInfo).interfaces;

      disks.forEach((disk) => {
        if (Object.prototype.hasOwnProperty.call(disk, 'imageName') && !disk.imageName) {
          const message = this.validatorRequiredField(
            this.t('cluster.credential.harvester.image')
          );

          errors.push(message);
        }

        if (Object.prototype.hasOwnProperty.call(disk, 'storageClassName') && !disk.storageClassName) {
          const message = this.validatorRequiredField(
            this.t('cluster.credential.harvester.volume.storageClass')
          );

          errors.push(message);
        }

        if (!disk.size) {
          const message = this.validatorRequiredField(
            this.t('cluster.credential.harvester.disk')
          );

          errors.push(message);
        }
      });

      interfaces.forEach((_interface) => {
        if (!_interface.networkName) {
          const message = this.validatorRequiredField(
            this.t('cluster.credential.harvester.network.networkName')
          );

          errors.push(message);
        }

        if (_interface.macAddress && !isValidMac(_interface.macAddress)) {
          const message = this.$store.getters['i18n/t']('cluster.credential.harvester.network.macFormat');

          errors.push(message);
        }
      });

      if (this.isOldFormat && this.disks.length === 1 && this.interfaces.length === 1) {
        // It should be converted back to the old format, otherwise the user does not modify any value, and the vm will be automatically recreated after saving
        delete this.value.diskInfo;
        delete this.value.networkInfo;

        this.value.imageName = disks[0].imageName;
        this.value.diskSize = String(disks[0].size);

        this.value.networkName = interfaces[0].networkName;
      }
    },

    validatorVGpus(errors) {
      const notAllocatable = this.vGpus
        .map((type) => {
          const allocated = this.machinePools.reduce((acc, machinePool) => {
            const vGPURequests = JSON.parse(machinePool?.config?.vgpuInfo || '')?.vGPURequests;

            const vGpuTypes = vGPURequests?.map((r) => r?.deviceName).filter((f) => f) || [];

            if (vGpuTypes.includes(type)) {
              return acc + machinePool.pool.quantity;
            }

            return acc;
          }, 0);

          return {
            vGpu: Object.values(this.vGpuDevices).filter((f) => f.type === type)?.[0],
            allocated
          };
        })
        .filter(({ vGpu, allocated }) => vGpu && vGpu.allocatable > 0 && vGpu.allocatable < allocated);

      notAllocatable.forEach(({ vGpu, allocated }) => {
        const message = this.$store.getters['i18n/t']('cluster.credential.harvester.vGpus.errors.notAllocatable', {
          vGpu:        vGpu?.type,
          allocated,
          allocatable: vGpu?.allocatable
        });

        errors.push(message);
      });
    },

    valuesChanged(value, type) {
      this.value[type] = base64Encode(value);
    },

    onOpen() {
      this.getVmImage();
    },

    async getVmImage() {
      try {
        const clusterId = get(this.credential, 'decodedData.clusterId');

        if (clusterId) {
          const url = `/k8s/clusters/${ clusterId }/v1`;
          const res = await this.$store.dispatch('cluster/request', { url: `${ url }/${ HCI.IMAGE }s` });

          this.images = res?.data;
        }
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }
    },

    async getAvailableVGpuDevices() {
      const clusterId = get(this.credential, 'decodedData.clusterId');

      if (clusterId) {
        const url = `/k8s/clusters/${ clusterId }/v1`;

        let deviceCapacity = null;
        let vGpus = null ;

        try {
          vGpus = await this.$store.dispatch('cluster/request', { url: `${ url }/${ HCI.VGPU_DEVICE }` });

          const harvesterCluster = await this.$store.dispatch('cluster/request', { url: `${ url }/harvester/cluster/local` });

          if (harvesterCluster?.links?.deviceCapacity) {
            deviceCapacity = await this.$store.dispatch('cluster/request', { url: harvesterCluster?.links?.deviceCapacity });
          }
        } catch (e) {
        }

        this.vGpuDevices = (vGpus?.data || [])
          .reduce((acc, v) => {
            const type = v.spec.vGPUTypeName ? `${ VGPU_PREFIX.NVIDIA }${ v.spec.vGPUTypeName.replace(' ', '_') }` : '';

            let allocatable = null;

            if (deviceCapacity) {
              allocatable = deviceCapacity[type] ? Number(deviceCapacity[type]) : 0;
            }

            return {
              ...acc,
              [v.id]: {
                id:      v.id,
                enabled: v.spec.enabled,
                allocatable,
                type,
              },
            };
          }, {});
      }
    },

    removeAffinityUnusedFields(data) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];

          if (key.startsWith('_') || value === null || value === '' || (Array.isArray(value) && value.length === 0) || (key !== 'namespaceSelector' && typeof value === 'object' && Object.keys(value).length === 0)) {
            delete data[key];
          } else if (typeof value === 'object') {
            this.removeAffinityUnusedFields(value);
            if (key !== 'namespaceSelector' && Object.keys(value).length === 0) {
              delete data[key];
            }
          }
        }
      }

      return data;
    },

    updateScheduling(neu) {
      const { affinity } = clone(neu);

      if (!affinity.nodeAffinity && !affinity.podAffinity && !affinity.podAntiAffinity) {
        this.value.vmAffinity = '';
        this.vmAffinity = { affinity: {} };

        return;
      }

      const newAffinity = this.removeAffinityUnusedFields(affinity);

      // Do not update if it is not an actual change, such as the removal of whitespace or a change in map key order
      if (!isEqual(this.vmAffinityObj, newAffinity)) {
        this.value.vmAffinity = base64Encode(JSON.stringify(newAffinity));
      } else if (this.vmAffinityIsBase64) {
        this.value.vmAffinity = this.vmAffinityHistoric;
      } else {
        this.value.vmAffinity = base64Encode(this.vmAffinityHistoric);
      }
      this.vmAffinity = neu;
    },

    updateNodeScheduling(nodeAffinity) {
      if (!this.vmAffinity.affinity) {
        Object.assign(this.vmAffinity, { affinity: { nodeAffinity } });
      } else {
        Object.assign(this.vmAffinity.affinity, { nodeAffinity });
      }

      this.updateScheduling(this.vmAffinity);
    },

    addVolume(type) {
      if (type === 'volume') {
        this.disks.push({
          storageClassName: this.defaultStorageClass,
          size:             10,
        });
      } else if (type === 'image') {
        this.disks.push({
          imageName: '',
          size:      40,
        });
      }

      this.update();
    },

    addNetwork() {
      this.interfaces.push({
        networkName: '',
        macAddress:  ''
      });

      this.update();
    },

    update() {
      const diskInfo = {
        disks: this.disks.map((disk, idx) => {
          return {
            ...disk,
            size:      Number(disk.size),
            bootOrder: idx + 1
          };
        })
      };

      // Do not update if it is not an actual change, such as the removal of whitespace or a change in map key order
      if (!isEqual(this.disksObj, diskInfo)) {
        this.value.diskInfo = JSON.stringify(diskInfo);
      } else {
        this.value.diskInfo = this.disksHistoric;
      }

      const networkInfo = { interfaces: this.interfaces };

      // Do not update if it is not an actual change, such as the removal of whitespace or a change in map key order
      if (!isEqual(this.networksObj, networkInfo)) {
        this.value.networkInfo = JSON.stringify(networkInfo);
      } else {
        this.value.networkInfo = this.networksHistoric;
      }
    },

    removeVolume(vol) {
      this.vol = vol;
      removeObject(this.disks, vol);
      this.update();
    },

    removeNetwork(vol) {
      this.vol = vol;
      removeObject(this.interfaces, vol);
      this.update();
    },

    changeSort(idx, type) {
      // true: down, false: up
      this.disks.splice(type ? idx : idx - 1, 1, ...this.disks.splice(type ? idx + 1 : idx, 1, this.disks[type ? idx : idx - 1]));
      this.update();
    },

    headerFor(disk = {}) {
      const type = Object.prototype.hasOwnProperty.call(disk, 'imageName') ? 'image' : 'volume';

      return {
        [SOURCE_TYPE.Volume]: this.$store.getters['i18n/t']('cluster.credential.harvester.volume.volume'),
        [SOURCE_TYPE.IMAGE]:  this.$store.getters['i18n/t']('cluster.credential.harvester.volume.imageVolume'),
      }[type];
    },

    updateUserData(templateValue) {
      try {
        const templateJsonData = this.convertToJson(templateValue);

        let userDataYaml;

        if (this.installAgent) {
          const mergedObj = Object.assign(templateJsonData, { ...QGA_JSON });

          userDataYaml = this.addCloudConfigComment(mergedObj);
        } else {
          userDataYaml = templateValue;
        }

        this.$refs.userDataYamlEditor.updateValue(userDataYaml);
        this.userData = userDataYaml;
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   this.t('generic.notification.title.error'),
          message: this.t('harvesterManager.rke.templateError')
        }, { root: true });
      }
    },

    updateVGpu() {
      const vGPURequests = this.vGpus?.filter((f) => f).map((deviceName) => ({
        /**
         * 'provisioned' is a placeholder.
         * The real vGpu name is assigned to the provisioned VM by the backend and saved in 'harvesterhci.io/deviceAllocationDetails' annotation.
         */
        name: 'provisioned',
        deviceName,
      })) || [];

      this.value.vgpuInfo = vGPURequests.length > 0 ? JSON.stringify({ vGPURequests }) : '';
    },

    addCloudConfigComment(value) {
      if (typeof value === 'object' && value !== null) {
        return `#cloud-config\n${ jsyaml.dump(value) }`;
      } else if (typeof value === 'string' && !value.startsWith('#cloud-config')) {
        return `#cloud-config\n${ value }`;
      } else if (typeof value === 'string') {
        return value;
      }
    },

    /**
     * @param {striing || YAML.parseDocument} userScript
     */
    hasCloudConfigComment(userScript) {
      /**
       * Check that userData contains: #cloud-config
       * case 1:
            ## template: jinja
            #cloud-config
      */
      const userDataDoc = userScript ? YAML.parseDocument(userScript) : YAML.parseDocument({});
      const items = userDataDoc?.contents?.items || [];

      let exist = false;

      if (userDataDoc?.comment === 'cloud-config' || userDataDoc?.comment?.includes('cloud-config\n')) {
        exist = true;
      }

      if (userDataDoc?.commentBefore === 'cloud-config' || userDataDoc?.commentBefore?.includes('cloud-config\n')) {
        exist = true;
      }

      items.map((item) => {
        const key = item.key;

        if (key?.commentBefore?.includes('cloud-config')) {
          exist = true;
        }
      });

      return exist;
    },

    convertToJson(script = '') {
      let out = {};

      try {
        out = jsyaml.load(script);
      } catch (e) {
        throw new Error('Function(convertToJson) error');
      }

      return out;
    },

    hasInstallAgent(userScript, installAgent) {
      let dataFormat = {};

      try {
        dataFormat = this.convertToJson(userScript);
      } catch {
        // When the yaml cannot be converted to json, the previous installAgent value should be returned
        return installAgent;
      }

      const hasInstall = dataFormat?.packages?.includes('qemu-guest-agent') && !!dataFormat?.runcmd?.find( (S) => Array.isArray(S) && S.join('-') === QGA_JSON.runcmd[0].join('-'));

      return !!hasInstall;
    },

    /**
     * @param paths A Object path, e.g. 'a.b.c' => ['a', 'b', 'c']. Refer to https://eemeli.org/yaml/#scalar-values
     * @returns
     */
    deleteYamlDocProp(doc, paths) {
      try {
        const item = doc.getIn([])?.items[0];
        const key = item?.key;
        const hasCloudConfigComment = !!key?.commentBefore?.includes('cloud-config');
        const isMatchProp = key.source === paths[paths.length - 1];

        if (key && hasCloudConfigComment && isMatchProp) {
          // Comments are mounted on the next node and we should not delete the node containing cloud-config
        } else {
          doc.deleteIn(paths);
        }
      } catch (e) {}
    },

    addGuestAgent(userData) {
      const userDataDoc = userData ? YAML.parseDocument(userData) : YAML.parseDocument({});
      const userDataYAML = userDataDoc.toString();
      const userDataJSON = YAML.parse(userDataYAML);
      let packages = userDataJSON?.packages || [];
      let runcmd = userDataJSON?.runcmd || [];

      userDataDoc.setIn(['package_update'], true);

      if (Array.isArray(packages)) {
        if (!packages.includes('qemu-guest-agent')) {
          packages.push('qemu-guest-agent');
        }
      } else {
        packages = QGA_JSON.packages;
      }

      if (Array.isArray(runcmd)) {
        const hasSameRuncmd = runcmd.find( (S) => Array.isArray(S) && S.join('-') === QGA_JSON.runcmd[0].join('-'));

        if (!hasSameRuncmd) {
          runcmd.push(QGA_JSON.runcmd[0]);
        }
      } else {
        runcmd = QGA_JSON.runcmd;
      }

      if (packages.length > 0) {
        userDataDoc.setIn(['packages'], packages);
      } else {
        userDataDoc.setIn(['packages'], []); // It needs to be set empty first, as it is possible that cloud-init comments are mounted on this node
        this.deleteYamlDocProp(userDataDoc, ['packages']);
        this.deleteYamlDocProp(userDataDoc, ['package_update']);
      }

      if (runcmd.length > 0) {
        userDataDoc.setIn(['runcmd'], runcmd);
      } else {
        this.deleteYamlDocProp(userDataDoc, ['runcmd']);
      }

      return userDataDoc;
    },

    deleteGuestAgent(userData) {
      const userDataDoc = userData ? YAML.parseDocument(userData) : YAML.parseDocument({});

      const userDataYAML = userDataDoc.toString();
      const userDataJSON = YAML.parse(userDataYAML);
      const packages = userDataJSON?.packages || [];
      const runcmd = userDataJSON?.runcmd || [];

      if (Array.isArray(packages)) {
        for (let i = 0; i < packages.length; i++) {
          if (packages[i] === 'qemu-guest-agent') {
            packages.splice(i, 1);
          }
        }
      }

      if (Array.isArray(runcmd)) {
        for (let i = 0; i < runcmd.length; i++) {
          if (Array.isArray(runcmd[i]) && runcmd[i].join('-') === QGA_JSON.runcmd[0].join('-')) {
            runcmd.splice(i, 1);
          }
        }
      }

      if (packages.length > 0) {
        userDataDoc.setIn(['packages'], packages);
      } else {
        userDataDoc.setIn(['packages'], []);
        this.deleteYamlDocProp(userDataDoc, ['packages']);
        this.deleteYamlDocProp(userDataDoc, ['package_update']);
      }

      if (runcmd.length > 0) {
        userDataDoc.setIn(['runcmd'], runcmd);
      } else {
        this.deleteYamlDocProp(userDataDoc, ['runcmd']);
      }

      return userDataDoc;
    },

    updateAgent(isInstall) {
      const userDataDoc = isInstall ? this.addGuestAgent(this.userData) : this.deleteGuestAgent(this.userData);

      let userDataYaml = userDataDoc.toString();

      if (userDataYaml === '{}\n') {
        // When the YAML parsed value is '{}\n', it means that the userData is empty.
        userDataYaml = '';
      }

      const hasCloudComment = this.hasCloudConfigComment(userDataYaml);

      if (!hasCloudComment) {
        userDataYaml = `#cloud-config\n${ userDataYaml }`;
      }

      this.$refs.userDataYamlEditor.updateValue(userDataYaml);
      this['userData'] = userDataYaml;
    },

    vGpuOptionLabel(opt) {
      let label = opt.replace(VGPU_PREFIX.NVIDIA, '');

      if (this.mode === _VIEW) {
        return label;
      }

      /**
       * We get the allocatable label from the first vGpu profile found for each vGpu type.
       * This is consistent as long as vGpu profiles with the same vGpu type, have the same allocable number.
       */
      const vGpu = Object.values(this.vGpuDevices).filter((f) => f.type === opt)?.[0];

      if (vGpu?.allocatable === null) {
        label += ` (${ this.t('harvesterManager.vGpu.allocatableUnknown') })`;
      } else if (vGpu?.allocatable > 0) {
        label += ` (${ this.t('harvesterManager.vGpu.allocatable') }: ${ vGpu.allocatable })`;
      }

      return label;
    }
  }
};
</script>

<template>
  <div>
    <Loading
      v-if="$fetchState.pending"
      :delayed="true"
    />
    <div v-else>
      <div class="row mt-20">
        <div class="col span-6">
          <UnitInput
            v-model:value="value.cpuCount"
            v-int-number
            label-key="cluster.credential.harvester.cpu"
            suffix="C"
            output-as="string"
            required
            :mode="mode"
            :disabled="disabled"
            :placeholder="t('cluster.harvester.machinePool.cpu.placeholder')"
          />
        </div>

        <div class="col span-6">
          <UnitInput
            v-model:value="value.memorySize"
            v-int-number
            label-key="cluster.credential.harvester.memory"
            output-as="string"
            suffix="GiB"
            :mode="mode"
            :disabled="disabled"
            required
            :placeholder="t('cluster.harvester.machinePool.memory.placeholder')"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.vmNamespace"
            :mode="mode"
            :options="namespaceOptions"
            :searchable="true"
            :required="true"
            :disabled="namespaceDisabled"
            label-key="cluster.credential.harvester.namespace"
            :placeholder="
              t('cluster.harvester.machinePool.namespace.placeholder')
            "
          />
        </div>

        <div class="col span-6">
          <LabeledInput
            v-model:value="value.sshUser"
            label-key="cluster.credential.harvester.sshUser"
            :required="true"
            :mode="mode"
            :disabled="disabled"
            :placeholder="
              t('cluster.harvester.machinePool.sshUser.placeholder')
            "
            tooltip-key="cluster.harvester.machinePool.sshUser.toolTip"
          />
        </div>
      </div>

      <h2 class="mt-20">
        {{ t('cluster.credential.harvester.volume.title') }}
      </h2>
      <draggable
        :item-key="() => ''"
        :list="disks"
        :options="{disabled: isView}"
        :drag-options="{
          animation: 250,
          group: 'people',
          disabled: false,
          ghostClass: 'ghost'
        }"
        @end="update"
      >
        <template #item="{ element: disk, index: i }">
          <div>
            <InfoBox
              class="box"
              :class="[disks.length === i +1 ? 'mb-10' : 'mb-20']"
            >
              <button
                type="button"
                class="role-link btn btn-sm remove"
                :disabled="i === 0"
                @click="removeVolume(disk)"
              >
                <i class="icon icon-x" />
              </button>

              <h4>
                {{ headerFor(disk) }}
              </h4>

              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledSelect
                    v-if="disk.hasOwnProperty('imageName')"
                    v-model:value="disk.imageName"
                    :mode="mode"
                    :options="imageOptions"
                    :required="true"
                    :searchable="true"
                    :disabled="disabled"
                    label-key="cluster.credential.harvester.image"
                    :placeholder="t('cluster.harvester.machinePool.image.placeholder')"
                    @on-open="onOpen"
                    @update:value="update"
                  />

                  <LabeledSelect
                    v-else
                    v-model:value="disk.storageClassName"
                    :options="storageClassOptions"
                    label-key="cluster.credential.harvester.volume.storageClass"
                    :mode="mode"
                    :disabled="disabled"
                    :required="true"
                    @update:value="update"
                  />
                </div>

                <div class="col span-6">
                  <UnitInput
                    v-model:value="disk.size"
                    v-int-number
                    label-key="cluster.credential.harvester.disk"
                    output-as="string"
                    suffix="GiB"
                    :mode="mode"
                    :disabled="disabled"
                    required
                    :placeholder="t('cluster.harvester.machinePool.disk.placeholder')"
                    @update:value="update"
                  />
                </div>
              </div>

              <div class="bootOrder">
                <div
                  class="mr-15"
                >
                  <button
                    :disabled="i === 0"
                    class="btn btn-sm role-primary"
                    @click.prevent="changeSort(i, false)"
                  >
                    <i class="icon icon-lg icon-chevron-up" />
                  </button>

                  <button
                    :disabled="i === disks.length -1"
                    class="btn btn-sm role-primary"
                    @click.prevent="changeSort(i, true)"
                  >
                    <i class="icon icon-lg icon-chevron-down" />
                  </button>
                </div>

                <div class="text-muted">
                  bootOrder: {{ i + 1 }}
                </div>
              </div>
            </InfoBox>
          </div>
        </template>
      </draggable>

      <div class="volume">
        <button
          type="button"
          class="btn btn-sm bg-primary mr-15 mb-10"
          @click="addVolume('volume')"
        >
          {{ t('cluster.credential.harvester.volume.addVolume') }}
        </button>

        <button
          type="button"
          class="btn btn-sm bg-primary mr-15 mb-10"
          @click="addVolume('image')"
        >
          {{ t('cluster.credential.harvester.volume.addVMImage') }}
        </button>
      </div>

      <hr class="mt-10 mb-10">

      <h2>{{ t('cluster.credential.harvester.network.title') }}</h2>
      <div
        v-for="(network, i) in interfaces"
        :key="i"
      >
        <InfoBox
          class="box"
          :class="[interfaces.length === i +1 ? 'mb-10' : 'mb-20']"
        >
          <button
            type="button"
            class="role-link btn btn-sm remove"
            :disabled="i === 0"
            @click="removeNetwork(network)"
          >
            <i class="icon icon-x" />
          </button>

          <h4>
            <span>
              {{ t('cluster.credential.harvester.network.network') }}
            </span>
          </h4>

          <div
            class="row"
          >
            <div class="col span-6">
              <LabeledSelect
                v-model:value="network.networkName"
                :mode="mode"
                :options="networkOptions"
                :required="true"
                label-key="cluster.credential.harvester.network.networkName"
                :placeholder="t('cluster.harvester.machinePool.network.placeholder')"
                @update:value="update"
              />
            </div>

            <!-- <div class="col span-6">
              <LabeledInput
                v-model:value="network.macAddress"
                label-key="cluster.credential.harvester.network.macAddress"
                :mode="mode"
                @update:value="update"
              />
            </div> -->
          </div>
        </InfoBox>
      </div>

      <button
        type="button"
        class="btn btn-sm bg-primary"
        @click="addNetwork"
      >
        {{ t('cluster.credential.harvester.network.addNetwork') }}
      </button>

      <portal :to="'advanced-'+uuid">
        <h3 class="mt-20">
          {{ t("harvesterManager.vGpu.title") }}
        </h3>
        <div>
          <Banner
            v-if="showVGpuAllocationInfo"
            color="warning"
            :label="t('cluster.credential.harvester.vGpus.warnings.minimumAllocatable')"
          />
          <ArrayListSelect
            v-model:value="vGpus"
            class="mt-20"
            :array-list-props="{
              addAllowed: true,
              addDisabled: vGpus.length > 0,
              mode,
              disabled
            }"
            :select-props="{
              mode,
              disabled,
              getOptionLabel: vGpuOptionLabel
            }"
            :options="vGpuOptions"
            label-key="harvesterManager.vGpu.label"
            @update:value="updateVGpu"
          />
        </div>

        <h3 class="mt-20">
          {{ t("cluster.credential.harvester.userData.title") }}
        </h3>
        <div>
          <LabeledSelect
            v-if="isCreate"
            v-model:value="userDataTemplate"
            class="mb-10"
            :options="userDataOptions"
            label-key="cluster.credential.harvester.userData.label"
            :mode="mode"
            :disabled="disabled"
            @update:value="updateUserData"
          />

          <YamlEditor
            ref="userDataYamlEditor"
            v-model:value="userData"
            class="yaml-editor mb-10"
            :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
            :disabled="disabled"
          />

          <Checkbox
            v-model:value="installAgent"
            class="check mb-20"
            type="checkbox"
            label-key="cluster.credential.harvester.installGuestAgent"
            :mode="mode"
            @update:value="updateAgent"
          />
        </div>

        <h3>{{ t('cluster.credential.harvester.networkData.title') }}</h3>
        <div>
          <LabeledSelect
            v-if="isCreate"
            v-model:value="networkData"
            class="mb-10"
            :options="networkDataOptions"
            label-key="cluster.credential.harvester.networkData.label"
            :mode="mode"
            :disabled="disabled"
          />

          <YamlEditor
            ref="networkYamlEditor"
            :key="networkData"
            class="yaml-editor mb-10"
            :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
            :value="networkData"
            :disabled="disabled"
            @onInput="valuesChanged($event, 'networkData')"
          />
        </div>

        <hr class="divider mt-20">

        <h3 class="mt-20">
          {{ t("workload.container.titles.nodeScheduling") }}
        </h3>
        <NodeAffinity
          :mode="mode"
          :value="vmAffinity.affinity.nodeAffinity"
          @update:value="updateNodeScheduling"
        />

        <h3 class="mt-20">
          {{ t("harvesterManager.affinity.vmAffinityTitle") }}
        </h3>
        <PodAffinity
          :mode="mode"
          :value="vmAffinity"
          :nodes="allNodeObjects"
          :namespaces="namespaces"
          :overwrite-labels="affinityLabels"
          :all-namespaces-option-available="true"
          @update="updateScheduling"
        />

        <hr class="divider mt-20">
      </portal>
    </div>
    <div v-if="errors.length">
      <div
        v-for="(err, idx) in errors"
        :key="idx"
      >
        <Banner
          color="error"
          :label="stringify(err.Message || err)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$yaml-height: 200px;

:deep() .yaml-editor {
  flex: 1;
  min-height: $yaml-height;
  & .code-mirror .CodeMirror {
    position: initial;
    height: auto;
    min-height: $yaml-height;
  }
}

:deep() .info-box {
  margin-bottom: 10px;
}

.box {
  position: relative;
}

.remove {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0px;
}

.bootOrder {
  display: flex;
  align-items: center;
}
</style>
