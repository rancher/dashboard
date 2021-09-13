import jsyaml from 'js-yaml';
import randomstring from 'randomstring';

import { sortBy } from '@/utils/sort';
import { clone } from '@/utils/object';
import { allHash } from '@/utils/promise';
import { SOURCE_TYPE } from '@/config/harvester-map';
import { _CLONE } from '@/config/query-params';
import { PVC, HCI, STORAGE_CLASS, NODE } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

const agentJson = {
  package_update: true,
  packages:       ['qemu-guest-agent'],
  runcmd:         [
    [
      'systemctl',
      'enable',
      '--now',
      'qemu-guest-agent'
    ]
  ]
};

const CD_ROM = 'cd-rom';
const HARD_DISK = 'disk';

export default {
  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = {
      pvcs:               this.$store.dispatch('virtual/findAll', { type: PVC }),
      storageClass:       this.$store.dispatch('virtual/findAll', { type: STORAGE_CLASS }),
      ssh:                this.$store.dispatch('virtual/findAll', { type: HCI.SSH }),
      settings:           this.$store.dispatch('virtual/findAll', { type: HCI.SETTING }),
      images:             this.$store.dispatch('virtual/findAll', { type: HCI.IMAGE }),
      versions:           this.$store.dispatch('virtual/findAll', { type: HCI.VM_VERSION }),
      templates:          this.$store.dispatch('virtual/findAll', { type: HCI.VM_TEMPLATE }),
      networkAttachment:  this.$store.dispatch('virtual/findAll', { type: HCI.NETWORK_ATTACHMENT }),
      vmi:                this.$store.dispatch('virtual/findAll', { type: HCI.VMI }),
      vmim:               this.$store.dispatch('virtual/findAll', { type: HCI.VMIM }),
      vm:                 this.$store.dispatch('virtual/findAll', { type: HCI.VM }),
    };

    if (this.$store.getters['virtual/schemaFor'](NODE)) {
      hash.nodes = this.$store.dispatch('virtual/findAll', { type: NODE });
    }
    await allHash(hash);
  },

  data() {
    const type = this.$route.params.resource;
    const isClone = this.$route.query.mode === _CLONE;

    if (isClone) {
      this.deleteCloneValue();
    }

    let spec;
    let sshKey = [];
    let diskRows = [];
    let imageId = '';
    let networkRows = [];
    let hasCreateVolumes = [];
    let userScript = null;
    let networkScript = null;
    let machineType = '';

    if (type !== HCI.BACKUP) {
      const vm = type === HCI.VM ? this.value : this.value.spec.vm;

      spec = type === HCI.VM ? this.value.spec : this.value.spec.vm.spec;

      sshKey = this.getSSHIDs(spec);

      diskRows = this.getDiskRows(vm);
      imageId = this.getRootImageId(vm);
      networkRows = this.getNetworkRows(vm);
      hasCreateVolumes = this.getHasCreatedVolumes(spec);
      ({ userScript, networkScript } = this.getCloudScript(spec));

      machineType = this.value.machineType;
    }

    return {
      spec,
      isClone,
      installAgent:          false,
      sshName:               '',
      publicKey:             '',
      showCloudInit:         false,
      sshAuthorizedKeys:     '',
      useCustomHostname:     false,
      isUseMouseEnhancement: true,
      hasCreateVolumes,
      networkScript,
      userScript,
      sshKey,
      imageId,
      diskRows,
      networkRows,
      machineType,
    };
  },

  computed: {
    isVM() {
      return this.$route.params.resource === HCI.VM;
    },

    isVMTemplate() {
      return this.$route.params.resource === HCI.VM_VERSION;
    },

    ssh() {
      return this.$store.getters['virtual/all'](HCI.SSH) || [];
    },

    images() {
      return this.$store.getters['virtual/all'](HCI.IMAGE) || [];
    },

    versions() {
      return this.$store.getters['virtual/all'](HCI.VM_VERSION) || [];
    },

    templates() {
      return this.$store.getters['virtual/all'](HCI.VM_TEMPLATE) || [];
    },

    pvcs() {
      return this.$store.getters['virtual/all'](PVC) || [];
    },

    nodesIdOptions() {
      const nodes = this.$store.getters['virtual/all'](NODE) || [];

      return nodes.map(node => node.id);
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
      const defaultStorage = this.$store.getters['virtual/all'](STORAGE_CLASS).find( O => O.isDefault);

      return defaultStorage?.metadata?.name || 'longhorn';
    },

    customStorageClassConfig() {
      const storageClassValue = this.$store.getters['virtual/all'](HCI.SETTING).find( O => O.id === 'default-storage-class')?.value || '{}';
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
    }
  },

  methods: {
    getDiskRows(vm) {
      const namespace = vm.metadata.namespace || this.value.metadata.namespace;
      const _volumes = vm.spec.template.spec.volumes || [];
      const _disks = vm.spec.template.spec.domain.devices.disks || [];
      const _volumeClaimTemplates = this.getVolumeClaimTemplates(vm);

      let out = [];

      if (_disks.length === 0) {
        out.push({
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
              const allPVCs = this.$store.getters['virtual/all'](PVC);
              const pvcResource = allPVCs.find( O => O.id === `${ namespace }/${ volume?.persistentVolumeClaim?.claimName }`);

              source = SOURCE_TYPE.ATTACH_VOLUME;
              accessMode = pvcResource?.spec?.accessModes?.[0] || 'ReadWriteMany';
              size = pvcResource?.spec?.resources?.requests?.storage || '10Gi';
              storageClassName = pvcResource?.spec?.storageClassName;
              volumeMode = pvcResource?.spec?.volumeMode || 'Block';
              volumeName = pvcResource?.metadata?.name || '';
            }
          }

          const bus = DISK?.disk?.bus || DISK?.cdrom?.bus;

          const bootOrder = DISK?.bootOrder ? DISK?.bootOrder : index;

          return {
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

      if (!this.spec.template.spec.domain.resources.limits) {
        this.spec.template.spec.domain.resources.limits = {
          memory: null,
          cpu:    ''
        };
      }

      this.spec.template.spec.domain.resources.requests.cpu = this.spec.template.spec.domain.cpu.cores;
      this.spec.template.spec.domain.resources.limits.memory = this.spec.template.spec.domain.resources.requests.memory;
      this.spec.template.spec.domain.resources.limits.cpu = this.spec.template.spec.domain.cpu.cores;
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
          dataVolumeName = `${ prefixName }-${ R.name }-${ randomstring.generate(5).toLowerCase() }`;
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

      if (!disks.find( D => D.name === 'cloudinitdisk')) {
        if (this.networkScript || this.userScript || this.sshKey.length > 0) {
          disks.push({
            name: 'cloudinitdisk',
            disk: { bus: 'virtio' }
          });

          const userData = this.getCloudInit();

          volumes.push({
            name:             'cloudinitdisk',
            cloudInitNoCloud: {
              userData,
              networkData: this.networkScript
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
            annotations: { ...this.spec?.template?.metadata?.annotations },
            labels:      {
              ...this.spec?.template?.metadata?.labels,
              [HCI_ANNOTATIONS.CREATOR]: 'harvester',
              [HCI_ANNOTATIONS.VM_NAME]:  this.value?.metadata?.name,
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

      if (this.isVM) {
        this.$set(this.value.metadata, 'annotations', {
          ...this.value.metadata.annotations,
          [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: JSON.stringify(volumeClaimTemplates)
        });
        this.$set(this.value, 'spec', spec);
        this.$set(this, 'spec', spec);
      } else if (this.isVMTemplate) {
        this.$set(this.value.spec.vm.metadata, 'annotations', { [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: JSON.stringify(volumeClaimTemplates) });
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

    getCloudInit() {
      let out = this.userScript;

      try {
        let newInitScript = {};

        if (out) {
          newInitScript = jsyaml.load(out);
        }

        if (newInitScript && newInitScript.ssh_authorized_keys) {
          const sshList = [...this.getSSHListValue(this.sshKey), ...newInitScript.ssh_authorized_keys];
          const value = new Set(sshList);

          newInitScript.ssh_authorized_keys = [...value];
        } else {
          newInitScript.ssh_authorized_keys = this.getSSHListValue(this.sshKey);
        }
        out = jsyaml.dump(newInitScript);
      } catch (error) {
        new Error(`has error set: ${ error }`);

        return '#cloud-config';
      }

      const hasCloundConfig = out.startsWith('#cloud-config');

      return hasCloundConfig ? out : `#cloud-config\n${ out }`;
    },

    updateSSHKey(neu) {
      this.$set(this, 'sshKey', neu);
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
      } else if (isCloudInitDisk) {
        // cloudInitNoCloud
      }

      return out;
    },

    parseVolumeClaimTemplate(R, dataVolumeName) {
      if (!String(R.size).includes('Gi')) {
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

    getSSHValue(id) {
      const sshResource = this.ssh.find( O => O.id === id);

      return sshResource?.spec?.publicKey || undefined;
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

    updateCloudConfig(userData, networkData) {
      this.userScript = userData;
      this.networkScript = networkData;
    },

    mergeGuestAgent(userScript = '') {
      let parsed;

      try {
        parsed = jsyaml.load(clone(userScript)) || {};
      } catch (err) {
        parsed = {};
      }

      parsed.package_update = true;

      if (Array.isArray(parsed.packages)) {
        const agent = parsed.packages.find( P => P === 'qemu-guest-agent');

        if (!agent) {
          parsed.packages.push('qemu-guest-agent');
        }
      } else {
        parsed.packages = agentJson.packages;
      }

      if (Array.isArray(parsed.runcmd)) {
        const runcmd = parsed.runcmd.find( (S) => {
          return S.join('-') === agentJson.runcmd[0].join('-');
        });

        if (!runcmd) {
          parsed.runcmd.push(agentJson.runcmd[0]);
        }
      } else {
        parsed.runcmd = agentJson.runcmd;
      }

      return parsed;
    },

    deleteGuestAgent(userScript) {
      const parsed = jsyaml.load(clone(userScript)) || {};

      if (Array.isArray(parsed.packages)) {
        for (let i = 0; i < parsed.packages.length; i++) {
          if (parsed.packages[i] === 'qemu-guest-agent') {
            parsed.packages.splice(i, 1);
          }
        }

        if (parsed.packages?.length === 0) {
          delete parsed.packages;
        }
      }

      if (Array.isArray(parsed.runcmd)) {
        for (let i = 0; i < parsed.runcmd.length; i++) {
          if (parsed.runcmd[i].join('-') === agentJson.runcmd[0].join('-')) {
            parsed.runcmd.splice(i, 1);
          }
        }

        if (parsed.runcmd.length === 0) {
          delete parsed.runcmd;
        }
      }

      if (!parsed.packages) {
        delete parsed.package_update;
      }

      if (!Object.keys(parsed).length > 0) {
        return '';
      }

      return parsed;
    },

    getVolumeClaimTemplates(vm) {
      let out = [];

      try {
        out = JSON.parse(vm.metadata.annotations[HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]);
      } catch (e) {
        console.error(`Function: getVolumeClaimTemplates, ${ e }`); // eslint-disable-line no-console
      }

      return out;
    },

    getVolumeNames(vm) {
      return vm.spec.template.spec.volumes?.map( (V) => {
        return V.persistentVolumeClaim.claimName;
      }) || [];
    },

    getCloudInitScript(vm) {
      const cloudInitNoCloud = vm.spec.template.spec.volumes?.find( (V) => {
        return V.name === 'cloudinitdisk';
      })?.cloudInitNoCloud || {};

      return {
        userData:    cloudInitNoCloud.userData,
        networkData: cloudInitNoCloud.networkData
      };
    },

    getRootImageId(vm) {
      const volume = this.getVolumeClaimTemplates(vm);

      return volume[0]?.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID] || '';
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

    getSSHIDs(spec) {
      const ids = spec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.SSH_NAMES] || '[]';

      return JSON.parse(ids);
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

    getCloudScript(spec) {
      const volumes = spec.template.spec.volumes || [];
      let userScript = '';
      let networkScript = '';

      volumes.forEach((v) => {
        if (v.cloudInitNoCloud) {
          userScript = v.cloudInitNoCloud.userData;
          networkScript = v.cloudInitNoCloud.networkData;
        }
      });

      return { userScript, networkScript };
    }
  },

  watch: {
    isUseMouseEnhancement(neu) {
      if (neu) {
        Object.assign(this.spec.template.spec.domain.devices, {
          inputs: [{
            bus:  'usb',
            name: 'tablet',
            type: 'tablet'
          }]
        });
      } else {
        this.$delete(this.spec.template.spec.domain.devices, 'inputs');
      }
    },

    installAgent(neu) {
      let parsed = {};

      if (neu) {
        parsed = this.mergeGuestAgent(clone(this.userScript));
      } else {
        parsed = this.deleteGuestAgent(clone(this.userScript));
      }
      let out = jsyaml.dump(parsed);

      if (parsed === '') {
        out = undefined;
      }

      this.$set(this, 'userScript', out);
    },
  }
};
