import jsyaml from 'js-yaml';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import difference from 'lodash/difference';

import { sortBy } from '@/utils/sort';
import { clone } from '@/utils/object';
import { allHash } from '@/utils/promise';
import { randomStr } from '@/utils/string';
import { base64Decode } from '@/utils/crypto';
import { SOURCE_TYPE } from '@/config/harvester-map';
import { _CLONE } from '@/config/query-params';
import {
  PVC, HCI, STORAGE_CLASS, NODE, SECRET
} from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import impl, { QGA_JSON, USB_TABLET } from '@/mixins/harvester-vm/impl';

const OS = [{
  label: 'Windows',
  value: 'windows'
}, {
  label: 'Linux',
  value: 'linux'
}, {
  label: 'Debian',
  value: 'debian'
}, {
  label: 'Fedora',
  value: 'fedora'
}, {
  label: 'Gentoo',
  value: 'gentoo'
}, {
  label: 'Mandriva',
  value: 'mandriva'
}, {
  label: 'Oracle',
  value: 'oracle'
}, {
  label: 'Red Hat',
  value: 'redhat'
}, {
  label: 'openSUSE',
  match: ['suse', 'opensuse'],
  value: 'openSUSE'
}, {
  label: 'Turbolinux',
  value: 'turbolinux'
}, {
  label: 'Ubuntu',
  value: 'ubuntu'
}, {
  label: 'Xandros',
  value: 'xandros'
}, {
  label: 'Other Linux',
  value: 'otherLinux'
}];

const CD_ROM = 'cd-rom';
const HARD_DISK = 'disk';

const QEMU_RESERVE = 0.1;

export default {
  mixins: [impl],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = {
      pvcs:               this.$store.dispatch('harvester/findAll', { type: PVC }),
      storageClass:       this.$store.dispatch('harvester/findAll', { type: STORAGE_CLASS }),
      ssh:                this.$store.dispatch('harvester/findAll', { type: HCI.SSH }),
      settings:           this.$store.dispatch('harvester/findAll', { type: HCI.SETTING }),
      images:             this.$store.dispatch('harvester/findAll', { type: HCI.IMAGE }),
      versions:           this.$store.dispatch('harvester/findAll', { type: HCI.VM_VERSION }),
      templates:          this.$store.dispatch('harvester/findAll', { type: HCI.VM_TEMPLATE }),
      networkAttachment:  this.$store.dispatch('harvester/findAll', { type: HCI.NETWORK_ATTACHMENT }),
      vmi:                this.$store.dispatch('harvester/findAll', { type: HCI.VMI }),
      vmim:               this.$store.dispatch('harvester/findAll', { type: HCI.VMIM }),
      vm:                 this.$store.dispatch('harvester/findAll', { type: HCI.VM }),
      secret:             this.$store.dispatch('harvester/findAll', { type: SECRET }),
    };

    if (this.$store.getters['harvester/schemaFor'](NODE)) {
      hash.nodes = this.$store.dispatch('harvester/findAll', { type: NODE });
    }
    await allHash(hash);
  },

  data() {
    const isClone = this.realMode === _CLONE;
    const type = this.$route.params.resource;

    if (isClone) {
      this.deleteCloneValue();
    }

    return {
      OS,
      type,
      isClone,
      spec:               null,
      osType:             'linux',
      sshKey:             [],
      installAgent:       true,
      hasCreateVolumes:   [],
      installUSBTablet:   true,
      networkScript:      '',
      userScript:         '',
      imageId:            '',
      diskRows:           [],
      networkRows:        [],
      machineType:        '',
      publicKey:          '',
      secretName:         '',
      secretRef:          null,
      showAdvanced:       false
    };
  },

  computed: {
    ssh() {
      return this.$store.getters['harvester/all'](HCI.SSH) || [];
    },

    images() {
      return this.$store.getters['harvester/all'](HCI.IMAGE) || [];
    },

    versions() {
      return this.$store.getters['harvester/all'](HCI.VM_VERSION) || [];
    },

    templates() {
      return this.$store.getters['harvester/all'](HCI.VM_TEMPLATE) || [];
    },

    pvcs() {
      return this.$store.getters['harvester/all'](PVC) || [];
    },

    nodesIdOptions() {
      const nodes = this.$store.getters['harvester/all'](NODE) || [];

      return nodes.filter(N => !N.isUnSchedulable).map((node) => {
        return {
          label: node.nameDisplay,
          value: node.id
        };
      });
    },

    memory: {
      get() {
        return this.spec.template.spec.domain.resources.requests.memory;
      },
      set(neu) {
        this.$set(this.spec.template.spec.domain.resources.requests, 'memory', neu);
      }
    },

    defaultStorageClass() {
      const defaultStorage = this.$store.getters['harvester/all'](STORAGE_CLASS).find( O => O.isDefault);

      return defaultStorage?.metadata?.name || 'longhorn';
    },

    customStorageClassConfig() {
      const storageClassValue = this.$store.getters['harvester/all'](HCI.SETTING).find( O => O.id === 'default-storage-class')?.value || '{}';
      let parse = {};

      try {
        parse = JSON.parse(storageClassValue);
      } catch (e) {}

      return parse;
    },

    customDefaultStorageClass() {
      return this.customStorageClassConfig.storageClass;
    },

    customVolumeMode() {
      return this.customStorageClassConfig.volumeMode || 'Block';
    },

    customAccessMode() {
      return this.customStorageClassConfig.accessModes || 'ReadWriteMany';
    },

    isWindows() {
      return this.osType === 'windows';
    },

    needNewSecret() {
      if (this.type === HCI.VM_VERSION) {
        return true;
      }
    }
  },

  async created() {
    await this.$store.dispatch('harvester/findAll', { type: SECRET });

    this.getInitConfig({ value: this.value });
  },

  methods: {
    getInitConfig(config) {
      const { value } = config;

      const vm = this.type === HCI.VM ? value : this.type === HCI.BACKUP ? this.value.status?.source : value.spec.vm;

      if (!(vm && vm.spec)) {
        return;
      }
      const spec = vm.spec;

      const machineType = value.machineType;
      const sshKey = this.getSSHFromAnnotation(spec) || [];

      const imageId = this.getRootImageId(vm) || '';
      const diskRows = this.getDiskRows(vm) || [];
      const networkRows = this.getNetworkRows(vm) || [];
      const hasCreateVolumes = this.getHasCreatedVolumes(spec) || [];

      let { userData = null, networkData = null } = this.getSecretCloudData(spec);

      if (this.type === HCI.BACKUP) {
        const secretBackups = this.value.status.secretBackups;

        if (secretBackups) {
          userData = base64Decode(secretBackups[0]?.data?.userdata);
          networkData = base64Decode(secretBackups[0]?.data?.networkdata);
        }
      }
      const osType = this.getOsType(vm);

      userData = this.isCreate ? this.getInitUserData({ osType }) : userData;
      const installUSBTablet = this.isInstallUSBTablet(spec);
      const installAgent = this.isCreate ? true : this.hasInstallAgent(userData, osType, true);

      const secretRef = this.getSecret(spec);

      this.$set(this, 'spec', spec);
      this.$set(this, 'secretRef', secretRef);
      this.$set(this, 'userScript', userData);
      this.$set(this, 'networkScript', networkData);

      this.$set(this, 'sshKey', sshKey);
      this.$set(this, 'osType', osType);
      this.$set(this, 'installAgent', installAgent);

      this.$set(this, 'machineType', machineType);

      this.$set(this, 'installUSBTablet', installUSBTablet);

      this.$set(this, 'hasCreateVolumes', hasCreateVolumes);
      this.$set(this, 'networkRows', networkRows);
      this.$set(this, 'imageId', imageId);

      this.$set(this, 'diskRows', diskRows);
      this.$set(this, 'networkRows', networkRows);
    },

    getDiskRows(vm) {
      const namespace = vm.metadata.namespace || this.value.metadata.namespace;
      const _volumes = vm.spec.template.spec.volumes || [];
      const _disks = vm.spec.template.spec.domain.devices.disks || [];
      const _volumeClaimTemplates = this.getVolumeClaimTemplates(vm);

      let out = [];

      if (_disks.length === 0) {
        out.push({
          id:               randomStr(5),
          source:           SOURCE_TYPE.IMAGE,
          name:             'disk-0',
          accessMode:       'ReadWriteMany',
          bus:              'virtio',
          volumeName:       '',
          size:             '10Gi',
          type:             HARD_DISK,
          storageClassName: '',
          image:            this.imageId,
          volumeMode:       'Block',
        });
      } else {
        out = _disks.map( (DISK, index) => {
          const volume = _volumes.find( V => V.name === DISK.name );

          let size = '';
          let image = '';
          let source = '';
          let realName = '';
          let container = '';
          let volumeName = '';
          let accessMode = '';
          let volumeMode = '';
          let storageClassName = '';
          let hotpluggable = false;

          const type = DISK?.cdrom ? CD_ROM : HARD_DISK;

          if (volume?.containerDisk) { // SOURCE_TYPE.CONTAINER
            source = SOURCE_TYPE.CONTAINER;
            container = volume.containerDisk.image;
          }

          if (volume.persistentVolumeClaim && volume.persistentVolumeClaim?.claimName) {
            volumeName = volume.persistentVolumeClaim.claimName;
            const DVT = _volumeClaimTemplates.find( T => T.metadata.name === volumeName);

            realName = volumeName;
            // If the DVT can be found, it cannot be an existing volume
            if (DVT) {
              // has annotation (HCI_ANNOTATIONS.IMAGE_ID) => SOURCE_TYPE.IMAGE
              if (DVT.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID] !== undefined) {
                image = DVT.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID];
                source = SOURCE_TYPE.IMAGE;
              } else {
                source = SOURCE_TYPE.NEW;
              }

              const dataVolumeSpecPVC = DVT?.spec || {};

              volumeMode = dataVolumeSpecPVC?.volumeMode;
              accessMode = dataVolumeSpecPVC?.accessModes?.[0];
              size = dataVolumeSpecPVC?.resources?.requests?.storage || '10Gi';
              storageClassName = dataVolumeSpecPVC?.storageClassName;
            } else { // SOURCE_TYPE.ATTACH_VOLUME
              const allPVCs = this.$store.getters['harvester/all'](PVC);
              const pvcResource = allPVCs.find( O => O.id === `${ namespace }/${ volume?.persistentVolumeClaim?.claimName }`);

              source = SOURCE_TYPE.ATTACH_VOLUME;
              accessMode = pvcResource?.spec?.accessModes?.[0] || 'ReadWriteMany';
              size = pvcResource?.spec?.resources?.requests?.storage || '10Gi';
              storageClassName = pvcResource?.spec?.storageClassName;
              volumeMode = pvcResource?.spec?.volumeMode || 'Block';
              volumeName = pvcResource?.metadata?.name || '';
            }

            hotpluggable = volume.persistentVolumeClaim.hotpluggable || false;
          }

          const bus = DISK?.disk?.bus || DISK?.cdrom?.bus;

          const bootOrder = DISK?.bootOrder ? DISK?.bootOrder : index;

          return {
            id:           randomStr(5),
            bootOrder,
            source,
            name:          DISK.name,
            realName,
            bus,
            volumeName,
            container,
            accessMode,
            size,
            volumeMode:    volumeMode || this.customVolumeMode,
            image,
            type,
            storageClassName,
            hotpluggable,
          };
        });
      }

      out = sortBy(out, 'bootOrder');

      return out.filter( (O) => {
        return O.name !== 'cloudinitdisk';
      });
    },

    getNetworkRows(vm) {
      const networks = vm.spec.template.spec.networks || [];
      const interfaces = vm.spec.template.spec.domain.devices.interfaces || [];

      const out = interfaces.map( (I, index) => {
        const network = networks.find( N => I.name === N.name);

        const type = I.sriov ? 'sriov' : I.bridge ? 'bridge' : 'masquerade';

        const isPod = !!network.pod;

        return {
          ...I,
          index,
          type,
          isPod,
          model:        I.model || 'virtio',
          networkName:  isPod ? 'management Network' : network?.multus?.networkName,
        };
      });

      return out;
    },

    parseVM() {
      this.parseOther();
      this.parseNetworkRows(this.networkRows);
      this.parseDiskRows(this.diskRows);
    },

    parseOther() {
      if (!this.spec.template.spec.domain.machine) {
        this.$set(this.spec.template.spec.domain, 'machine', { type: this.machineType });
      } else {
        this.$set(this.spec.template.spec.domain.machine, 'type', this.machineType);
      }

      if (!this.spec.template.spec.domain.guest) {
        this.spec.template.spec.domain = {
          ...this.spec.template.spec.domain,
          memory: { guest: '' }
        };
      }

      this.spec.template.spec.domain.resources.requests.cpu = this.spec.template.spec.domain.cpu.cores;

      if ( this.memory) {
        const [memoryValue, memoryUnit] = this.memory?.split(/(?=([a-zA-Z]+))/g);

        this.spec.template.spec.domain.memory.guest = `${ memoryValue - QEMU_RESERVE }${ memoryUnit }`;
      }
    },

    parseDiskRows(disk) {
      const disks = [];
      const volumes = [];
      const diskNameLables = [];
      const volumeClaimTemplates = [];

      disk.forEach( (R, index) => {
        const prefixName = this.value.metadata?.name || '';

        let dataVolumeName = '';

        if (this.isClone || !this.hasCreateVolumes.includes(R.realName)) {
          dataVolumeName = `${ prefixName }-${ R.name }-${ randomStr(5).toLowerCase() }`;
        } else if (R.source === SOURCE_TYPE.ATTACH_VOLUME) {
          dataVolumeName = R.volumeName;
        } else {
          dataVolumeName = R.realName;
        }

        const _disk = this.parseDisk(R, index);
        const _volume = this.parseVolume(R, dataVolumeName);
        const _dataVolumeTemplate = this.parseVolumeClaimTemplate(R, dataVolumeName);

        disks.push(_disk);
        volumes.push(_volume);
        diskNameLables.push(dataVolumeName);

        if (R.source !== SOURCE_TYPE.CONTAINER && R.source !== SOURCE_TYPE.ATTACH_VOLUME) {
          volumeClaimTemplates.push(_dataVolumeTemplate);
        }
      });

      if (!this.secretName || this.needNewSecret) {
        this.secretName = this.generateSecretName(this.secretNamePrefix);
      }

      if (!disks.find( D => D.name === 'cloudinitdisk')) {
        if (this.networkScript || this.userScript || this.sshKey.length > 0) {
          disks.push({
            name: 'cloudinitdisk',
            disk: { bus: 'virtio' }
          });

          volumes.push({
            name:             'cloudinitdisk',
            cloudInitNoCloud: {
              secretRef:            { name: this.secretName },
              networkDataSecretRef: { name: this.secretName }
            }
          });
        }
      }

      const isRunVM = this.isCreate ? this.isRunning : this.isRestartImmediately ? true : this.value.spec.running;

      const spec = {
        ...this.spec,
        running:  isRunVM,
        template: {
          ...this.spec.template,
          metadata: {
            ...this.spec?.template?.metadata,
            annotations: {
              ...this.spec?.template?.metadata?.annotations,
              [HCI_ANNOTATIONS.SSH_NAMES]: JSON.stringify(this.sshKey)
            },
            labels:      {
              ...this.spec?.template?.metadata?.labels,
              [HCI_ANNOTATIONS.VM_NAME]: this.value?.metadata?.name,
            }
          },
          spec: {
            ...this.spec.template?.spec,
            domain: {
              ...this.spec.template?.spec?.domain,
              devices: {
                ...this.spec.template?.spec?.domain?.devices,
                disks,
              },
            },
            volumes,
          }
        }
      };

      if (volumes.length === 0) {
        delete spec.template.spec.volumes;
      }

      if (this.type === HCI.VM) {
        this.$set(this.value.metadata, 'annotations', {
          ...this.value.metadata.annotations,
          [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: JSON.stringify(volumeClaimTemplates),
          [HCI_ANNOTATIONS.NETWORK_IPS]:           JSON.stringify(this.value.networkIps)
        });

        this.$set(this.value.metadata, 'labels', {
          ...this.value.metadata.labels,
          [HCI_ANNOTATIONS.CREATOR]: 'harvester',
          [HCI_ANNOTATIONS.OS]:      this.osType
        });

        this.$set(this.value, 'spec', spec);
        this.$set(this, 'spec', spec);
      } else if (this.type === HCI.VM_VERSION) {
        this.$set(this.value.spec.vm, 'spec', spec);
        this.$set(this.value.spec.vm.metadata, 'annotations', { [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: JSON.stringify(volumeClaimTemplates) });
        this.$set(this.value.spec.vm.metadata, 'labels', { [HCI_ANNOTATIONS.OS]: this.osType });
        this.$set(this, 'spec', spec);
      }
    },

    parseNetworkRows(networkRow) {
      const networks = [];
      const interfaces = [];

      networkRow.forEach( (R) => {
        const _network = this.parseNetwork(R);
        const _interface = this.parseInterface(R);

        networks.push(_network);
        interfaces.push(_interface);
      });

      const spec = {
        ...this.spec.template.spec,
        domain: {
          ...this.spec.template.spec.domain,
          devices: {
            ...this.spec.template.spec.domain.devices,
            interfaces,
          },
        },
        networks
      };

      this.$set(this.spec.template, 'spec', spec);
    },

    getInitUserData(config) {
      const _QGA_JSON = this.getMatchQGA(config.osType);
      const out = jsyaml.dump(_QGA_JSON);

      return out.startsWith('#cloud-config') ? out : `#cloud-config\n${ out }`;
    },

    getUserData(config) {
      const { returnType = 'string' } = config;

      let userDataJson = this.convertToJson(this.userScript) || {};

      const sshAuthorizedKeys = userDataJson?.ssh_authorized_keys || [];

      if (userDataJson && sshAuthorizedKeys) {
        const sshList = new Set([...this.getSSHListValue(this.sshKey), ...sshAuthorizedKeys]);

        userDataJson.ssh_authorized_keys = [...sshList];
      } else {
        userDataJson.ssh_authorized_keys = this.getSSHListValue(this.sshKey);
      }

      if (userDataJson.ssh_authorized_keys && userDataJson.ssh_authorized_keys.lenght === 0) {
        delete userDataJson.ssh_authorized_keys;
      }

      userDataJson = config.installAgent ? this.mergeQGA({ userDataJson: clone(userDataJson), ...config }) : this.deleteQGA({ userDataJson, ...config });

      if (returnType === 'string') {
        const out = jsyaml.dump(userDataJson);

        return out.startsWith('#cloud-config') ? out : `#cloud-config\n${ out }`;
      } else {
        return userDataJson;
      }
    },

    updateSSHKey(neu) {
      this.$set(this, 'sshKey', neu);
    },

    updateCpuMemory(cpu, memory) {
      this.$set(this.spec.template.spec.domain.cpu, 'cores', cpu);
      this.$set(this, 'memory', memory);
    },

    parseDisk(R, index) {
      const out = { name: R.name };

      if (R.type === HARD_DISK) {
        out.disk = { bus: R.bus };
      } else if (R.type === CD_ROM) {
        out.cdrom = { bus: R.bus };
      }

      out.bootOrder = index + 1;

      return out;
    },

    parseVolume(R, dataVolumeName, isCloudInitDisk = false) {
      const out = { name: R.name };

      if (R.source === SOURCE_TYPE.ATTACH_VOLUME) {
        dataVolumeName = R.volumeName || R.name;
      }

      if (R.source === SOURCE_TYPE.CONTAINER) {
        out.containerDisk = { image: R.container };
      } else if (R.source === SOURCE_TYPE.IMAGE || R.source === SOURCE_TYPE.NEW || R.source === SOURCE_TYPE.ATTACH_VOLUME) {
        out.persistentVolumeClaim = { claimName: dataVolumeName };
        if (R.hotpluggable) {
          out.persistentVolumeClaim.hotpluggable = true;
        }
      } else if (isCloudInitDisk) {
        // cloudInitNoCloud
      }

      return out;
    },

    parseVolumeClaimTemplate(R, dataVolumeName) {
      if (!String(R.size).includes('Gi') && R.size) {
        R.size = `${ R.size }Gi`;
      }

      const out = {
        metadata:   { name: dataVolumeName },
        spec:       {
          accessModes: [R.accessMode],
          resources:   { requests: { storage: R.size } },
          volumeMode:  R.volumeMode
        }
      };

      switch (R.source) {
      case SOURCE_TYPE.NEW:
        out.spec.storageClassName = this.customDefaultStorageClass || R.storageClassName || this.defaultStorageClass;
        break;
      case SOURCE_TYPE.IMAGE: {
        const image = this.images.find( I => R.image === I.id);

        if (image) {
          out.spec.storageClassName = `longhorn-${ image.metadata.name }`;
          out.metadata.annotations = { [HCI_ANNOTATIONS.IMAGE_ID]: image.id };
        }

        break;
      }
      }

      return out;
    },

    getSSHListValue(arr) {
      return arr.map( id => this.getSSHValue(id)).filter( O => O !== undefined);
    },

    parseInterface(R) {
      const _interface = {};
      const type = R.type;

      _interface[type] = {};

      if (R.macAddress) {
        _interface.macAddress = R.macAddress;
      }

      if (R.ports && R.type === 'masquerade') {
        const ports = [];

        for (const item of R.ports) {
          ports.push({
            ...item,
            port: parseInt(item.port)
          });
        }

        _interface.ports = ports;
      }

      _interface.model = R.model;
      _interface.name = R.name;

      return _interface;
    },

    parseNetwork(R) {
      const out = {};

      if (R.isPod) {
        out.pod = {};
      } else {
        out.multus = { networkName: R.networkName };
      }

      out.name = R.name;

      return out;
    },

    updateUserData(value) {
      this.userScript = value;
    },

    updateNetworkData(value) {
      this.networkScript = value;
    },

    mergeQGA(config) {
      const { userDataJson, osType } = config;
      const _QGA_JSON = this.getMatchQGA(osType);

      userDataJson.package_update = true;
      if (Array.isArray(userDataJson.packages) && !userDataJson.packages.includes('qemu-guest-agent')) {
        userDataJson.packages.push('qemu-guest-agent');
      } else {
        userDataJson.packages = QGA_JSON.packages;
      }

      if (Array.isArray(userDataJson.runcmd)) {
        let findIndex = -1;
        const hasSameRuncmd = userDataJson.runcmd.find( S => S.join('-') === _QGA_JSON.runcmd[0].join('-'));

        const hasSimilarRuncmd = userDataJson.runcmd.find( (S, index) => {
          if (S.join('-') === this.getSimilarRuncmd(osType).join('-')) {
            findIndex = index;

            return true;
          }

          return false;
        });

        if (hasSimilarRuncmd) {
          userDataJson.runcmd[findIndex] = _QGA_JSON.runcmd[0];
        } else if (!hasSameRuncmd) {
          userDataJson.runcmd.push(_QGA_JSON.runcmd[0]);
        }
      } else {
        userDataJson.runcmd = _QGA_JSON.runcmd;
      }

      return userDataJson;
    },

    deleteQGA(config) {
      const { userDataJson, osType } = config;

      if (Array.isArray(userDataJson.packages)) {
        for (let i = 0; i < userDataJson.packages.length; i++) {
          if (userDataJson.packages[i] === 'qemu-guest-agent') {
            userDataJson.packages.splice(i, 1);
          }
        }

        if (userDataJson.packages?.length === 0) {
          delete userDataJson.packages;
        }
      }

      if (Array.isArray(userDataJson.runcmd)) {
        const _QGA_JSON = this.getMatchQGA(osType);

        for (let i = 0; i < userDataJson.runcmd.length; i++) {
          if (userDataJson.runcmd[i].join('-') === _QGA_JSON.runcmd[0].join('-')) {
            userDataJson.runcmd.splice(i, 1);
          }
        }

        if (userDataJson.runcmd.length === 0) {
          delete userDataJson.runcmd;
        }
      }

      if (!userDataJson.packages) {
        delete userDataJson.package_update;
      }

      if (!Object.keys(userDataJson).length > 0) {
        return '';
      }

      return userDataJson;
    },

    getVolumeNames(vm) {
      return vm.spec.template.spec.volumes?.map( (V) => {
        return V.persistentVolumeClaim.claimName;
      }) || [];
    },

    generateSecretName(name) {
      return `${ name }-${ randomStr(5).toLowerCase() }`;
    },

    getOwnerReferencesFromVM(resource) {
      const name = resource.metadata.name;
      const kind = resource.kind;
      const apiVersion = this.type === HCI.VM ? 'kubevirt.io/v1' : 'harvesterhci.io/v1beta1';
      const uid = resource?.metadata?.uid;

      return [{
        name,
        kind,
        uid,
        apiVersion,
      }];
    },

    async saveSecret(vm) {
      if (!vm?.spec) {
        return true;
      }

      let secret = this.getSecret(vm.spec);

      const userData = this.getUserData({ osType: this.osType, installAgent: this.installAgent });

      if (!secret || this.needNewSecret) {
        secret = await this.$store.dispatch('harvester/create', {
          metadata: {
            name:            this.secretName,
            namespace:       this.value.metadata.namespace,
            labels:          { [HCI_ANNOTATIONS.CLOUD_INIT]: 'harvester' },
            ownerReferences: this.getOwnerReferencesFromVM(vm)
          },
          type: SECRET
        });
      }

      try {
        if (secret) {
          secret.setData('userdata', userData);
          secret.setData('networkdata', this.networkScript);
          await secret.save();
        }
      } catch (e) {
        new Error(`Function(saveSecret) error ${ e }`);

        return Promise.reject(e);
      }
    },

    deleteCloneValue() {
      this.value.spec.template.spec.hostname = '';

      const interfaces = this.value.spec.template.spec.domain.devices?.interfaces || [];

      for (let i = 0; i < interfaces.length; i++) {
        if (interfaces[i].macAddress) {
          interfaces[i].macAddress = '';
        }
      }
    },

    getHasCreatedVolumes(spec) {
      const out = [];

      if (spec.template.spec.volumes) {
        spec.template.spec.volumes.forEach((V) => {
          if (V?.persistentVolumeClaim?.claimName) {
            out.push(V.persistentVolumeClaim.claimName);
          }
        });
      }

      return out;
    },

    handlerUSBTablet(val) {
      const hasExist = this.isInstallUSBTablet(this.spec);

      if (val && !hasExist) {
        Object.assign(this.spec.template.spec.domain.devices, {
          inputs: [
            ...this.spec.template.spec.domain.devices.inputs,
            USB_TABLET[0]
          ]
        });
      } else {
        const inputs = this.spec.template.spec.domain.devices.inputs || [];
        const index = inputs.findIndex(O => isEqual(O, USB_TABLET[0]));

        if (hasExist && index.length === 1) {
          this.$delete(this.spec.template.spec.domain.devices, 'inputs');
        } else if (hasExist) {
          inputs.splice(index, 1);
          this.$set(this.spec.template.spec.domain.devices, 'inputs', inputs);
        }
      }
    },

    deleteSSHFromUserData(deleteSSH = []) {
      const userDataSSHKey = this.getSSHFromUserData(this.userScript);

      deleteSSH.map((id) => {
        const index = userDataSSHKey.findIndex(value => value === this.getSSHValue(id));

        if (index >= 0) {
          userDataSSHKey.splice(index, 1);
        }
      });

      let userDataJson = this.convertToJson(this.userScript);

      userDataJson.ssh_authorized_keys = userDataSSHKey;

      if (userDataSSHKey.length === 0) {
        delete userDataJson.ssh_authorized_keys;
      }

      if (isEmpty(userDataJson)) {
        userDataJson = undefined;
      } else {
        userDataJson = jsyaml.dump(userDataJson);
      }

      this.$set(this, 'userScript', userDataJson);
      this.refreshYamlEditor();
    },

    refreshYamlEditor() {
      this.$nextTick(() => {
        this.$refs.yamlEditor?.updateValue();
      });
    },

    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },
  },

  watch: {
    diskRows: {
      handler(neu, old) {
        if (Array.isArray(neu)) {
          const imageId = neu[0]?.image;
          const image = this.images.find( I => imageId === I.id);
          const imageName = image?.spec?.displayName;

          const oldImageId = old[0]?.image;

          if (imageName && this.isCreate && oldImageId === imageId) {
            OS.find( (os) => {
              if (os.match) {
                const hasMatch = os.match.find(mactchValue => imageName.toLowerCase().includes(mactchValue));

                if (hasMatch) {
                  this.osType = os.value;

                  return true;
                }
              } else {
                const hasMatch = imageName.toLowerCase().includes(os.value);

                if (hasMatch) {
                  this.osType = os.value;

                  return true;
                }
              }
            });
          }
        }
      }
    },

    secretRef: {
      handler(secret) {
        if (secret && this.type !== HCI.BACKUP) {
          this.userScript = secret?.decodedData?.userdata;
          this.networkScript = secret?.decodedData?.networkdata;
          this.secretName = secret?.metadata.name;
          this.refreshYamlEditor();
        }
      },
      immediate: true,
      deep:      true
    },

    isWindows(val) {
      if (val) {
        this.$set(this, 'sshKey', []);
        const userDataJson = this.convertToJson(this.userScript);

        delete userDataJson?.ssh_authorized_keys;
        this.$set(this, 'userScript', '');
        this.$set(this, 'installAgent', false);
      }
    },

    installUSBTablet(val) {
      this.handlerUSBTablet(val);
    },

    installAgent: {
      handler(neu) {
        const out = this.getUserData({ installAgent: neu, osType: this.osType });

        this.$set(this, 'userScript', out);
        this.refreshYamlEditor();
      },
      immediate: true
    },

    osType(neu) {
      const out = this.getUserData({ installAgent: this.installAgent, osType: neu });

      this.$set(this, 'userScript', out);
      this.refreshYamlEditor();
    },

    userScript(neu) {
      const hasInstallAgent = this.hasInstallAgent(neu, this.osType, this.installAgent);

      this.installAgent = hasInstallAgent;
    },

    sshKey(neu, old) {
      const _diff = difference(old, neu);

      if (_diff.length && this.isEdit) {
        this.deleteSSHFromUserData(_diff);
      }
    }
  }
};
