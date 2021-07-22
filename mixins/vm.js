import cloneDeep from 'lodash/cloneDeep';
import randomstring from 'randomstring';
import { safeLoad, safeDump } from 'js-yaml';

import { allHash } from '@/utils/promise';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { SOURCE_TYPE } from '@/config/map';
import {
  PVC, HCI, STORAGE_CLASS, POD, NODE
} from '@/config/types';

const TEMPORARY_VALUE = '$occupancy_url';
const MANAGEMENT_NETWORK = 'management Network';

const agentJson = {
  package_update: true,
  packages:       [
    'qemu-guest-agent'
  ],
  runcmd: [
    [
      'systemctl',
      'enable',
      '--now',
      'qemu-guest-agent'
    ]
  ]
};

export default {
  inheritAttrs: false,

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      pods:               this.$store.dispatch('virtual/findAll', { type: POD }),
      nodes:              this.$store.dispatch('virtual/findAll', { type: NODE }),
      pvcs:               this.$store.dispatch('virtual/findAll', { type: PVC }),
      storageClass:       this.$store.dispatch('virtual/findAll', { type: STORAGE_CLASS }),
      ssh:                this.$store.dispatch('virtual/findAll', { type: HCI.SSH }),
      settings:           this.$store.dispatch('virtual/findAll', { type: HCI.SETTING }),
      images:             this.$store.dispatch('virtual/findAll', { type: HCI.IMAGE }),
      dataVolume:         this.$store.dispatch('virtual/findAll', { type: HCI.DATA_VOLUME }),
      versions:           this.$store.dispatch('virtual/findAll', { type: HCI.VM_VERSION }),
      templates:          this.$store.dispatch('virtual/findAll', { type: HCI.VM_TEMPLATE }),
      networkAttachment:  this.$store.dispatch('virtual/findAll', { type: HCI.NETWORK_ATTACHMENT }),
      vmi:                this.$store.dispatch('virtual/findAll', { type: HCI.VMI }),
      vmim:               this.$store.dispatch('virtual/findAll', { type: HCI.VMIM }),
      vm:                 this.$store.dispatch('virtual/findAll', { type: HCI.VM }),
    });

    this.ssh = hash.ssh;
    this.images = hash.images;
    this.versions = hash.versions;
    this.templates = hash.templates;
  },

  data() {
    const type = this.$route.params.resource;
    const isClone = this.$route.query.mode === 'clone';

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
      spec = type === HCI.VM ? this.value.spec : this.value.spec.vm;

      sshKey = this.getSSHIDs(spec);

      diskRows = this.getDiskRows(spec);
      imageId = this.getRootImageId(spec);
      networkRows = this.getNetworkRows(spec);
      hasCreateVolumes = this.getHasCreatedVolumes(spec);
      ({ userScript, networkScript } = this.getCloudScript(spec));

      machineType = this.value.machineType;
    }

    return {
      spec,
      isClone,
      ssh:                   [],
      images:                [],
      versions:              [],
      templates:             [],
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
      autoChangeForImage:     true
    };
  },

  computed: {
    isVM() {
      return this.$route.params.resource === HCI.VM;
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
      } catch {
        parse = {};
      }

      return parse;
    },

    customDefaultStorageClass() {
      return this.customStorageClassConfig.storageClass;
    },

    customVolumeMode() {
      return this.customStorageClassConfig.volumeMode || 'Block';
    },

    customAccessMode() {
      return this.customStorageClassConfig.accessModes || 'ReadWriteOnce';
    }
  },

  methods: {
    normalizeSpec() {
      this.$set(this.spec.template.spec.domain.machine, 'type', this.machineType);

      this.parseNetworkRows(this.networkRows);

      this.parseDiskRows(this.diskRows);
    },

    getDiskRows(spec) {
      const namespace = this.value?.metadata?.namespace;
      const _volumes = spec.template.spec.volumes || [];
      const _dataVolumeTemplates = spec.dataVolumeTemplates || [];
      const _disks = spec.template.spec.domain.devices?.disks || [];

      let out = [];

      if (_disks.length === 0) {
        out.push({
          source:           SOURCE_TYPE.IMAGE,
          name:             'disk-0',
          accessMode:       'ReadWriteMany',
          bus:              'virtio',
          volumeName:       '',
          size:             '10Gi',
          type:             'disk',
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

          const type = DISK?.cdrom ? 'cd-rom' : 'disk';

          if (volume?.containerDisk) { // SOURCE_TYPE.CONTAINER
            source = SOURCE_TYPE.CONTAINER;
            container = volume.containerDisk.image;
          }

          if (volume?.dataVolume && volume?.dataVolume?.name) {
            volumeName = volume.dataVolume.name;
            const DVT = _dataVolumeTemplates.find( T => T.metadata.name === volumeName);

            realName = volumeName;

            // If the DVT can be found, it cannot be an existing volume
            if (DVT) {
              // has annotation (HCI_ANNOTATIONS.IMAGE_ID) => SOURCE_TYPE.IMAGE
              if (!!DVT.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID]) {
                image = DVT.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID];
                source = SOURCE_TYPE.IMAGE;
              } else {
                source = SOURCE_TYPE.NEW;
              }

              const dataVolumeSpecPVC = DVT?.spec?.pvc || {};

              volumeMode = dataVolumeSpecPVC?.volumeMode;
              accessMode = dataVolumeSpecPVC?.accessModes?.[0];
              size = dataVolumeSpecPVC?.resources?.requests?.storage || '10Gi';
              storageClassName = dataVolumeSpecPVC?.storageClassName;
            } else { // SOURCE_TYPE.ATTACH_VOLUME
              const choices = this.$store.getters['virtual/all'](HCI.DATA_VOLUME);
              const dvResource = choices.find( O => O.id === `${ namespace }/${ volume?.dataVolume?.name }`);

              source = SOURCE_TYPE.ATTACH_VOLUME;
              accessMode = dvResource?.spec?.pvc?.accessModes?.[0] || 'ReadWriteMany';
              size = dvResource?.spec?.pvc?.resources?.requests?.storage || '10Gi';
              storageClassName = dvResource?.spec?.pvc?.storageClassName;
              volumeMode = dvResource?.spec?.pvc?.volumeMode || 'Block';
              volumeName = dvResource?.metadata?.name || '';
            }
          }

          const bus = DISK?.disk?.bus || DISK?.cdrom?.bus;

          const bootOrder = DISK?.bootOrder;

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

      return out.filter( (O) => {
        return O.name !== 'cloudinitdisk';
      });
    },

    getNetworkRows(spec) {
      const networks = spec.template.spec?.networks || [];
      const interfaces = spec.template.spec.domain?.devices?.interfaces || [];

      const out = interfaces.map( (O, index) => {
        const network = networks.find( N => O.name === N.name);

        const type = O.sriov ? 'sriov' : O.bridge ? 'bridge' : 'masquerade';
        const isPod = !!network?.pod;

        return {
          ...O,
          type,
          model:        O.model || 'virtio',
          networkName:  network?.multus?.networkName || MANAGEMENT_NETWORK,
          index,
          isPod
        };
      });

      return out;
    },

    parseDiskRows(disk) {
      const disks = [];
      const volumes = [];
      const diskNameLables = [];
      const dataVolumeTemplates = [];

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

        const _disk = this.parseDisk(R);
        const _volume = this.parseVolume(R, dataVolumeName);
        const _dataVolumeTemplate = this.parseDateVolumeTemplate(R, dataVolumeName);

        disks.push(_disk);
        volumes.push(_volume);
        diskNameLables.push(dataVolumeName);

        if (R.source !== SOURCE_TYPE.CONTAINER && R.source !== SOURCE_TYPE.ATTACH_VOLUME) {
          dataVolumeTemplates.push(_dataVolumeTemplate);
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
        dataVolumeTemplates,
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

      // if (!this.isVM) {
      //   if (!this.imageId) {
      //     spec.dataVolumeTemplates[0].metadata.annotations[HCI_ANNOTATIONS.IMAGE_ID] = TEMPORARY_VALUE;
      //   }
      // }

      if (volumes.length === 0) {
        delete spec.template.spec.volumes;
        delete spec.dataVolumeTemplates;
      }

      if (this.isVM) {
        this.$set(this.value, 'spec', spec);
        this.$set(this, 'spec', spec);
      } else {
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

      if (!this.spec?.template?.metadata?.annotations) {
        this.$set(this.spec.template.metadata, 'annotations', {});
      }

      if (this.isVM) {
        this.$set(this.value.spec.template, 'spec', spec);
      }
      this.$set(this.spec.template, 'spec', spec);
    },

    getCloudInit() {
      let out = this.userScript;

      try {
        let newInitScript = {};

        if (out) {
          newInitScript = safeLoad(out);
        }

        if (newInitScript && newInitScript.ssh_authorized_keys) {
          const sshList = [...this.getSSHListValue(this.sshKey), ...newInitScript.ssh_authorized_keys];
          const value = new Set(sshList);

          newInitScript.ssh_authorized_keys = [...value];
        } else {
          newInitScript.ssh_authorized_keys = this.getSSHListValue(this.sshKey);
        }
        out = safeDump(newInitScript);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('has error set', error);

        return '#cloud-config';
      }

      const hasCloundConfig = out.startsWith('#cloud-config');

      return hasCloundConfig ? out : `#cloud-config\n${ out }`;
    },

    updateSSHKey(neu) {
      this.$set(this, 'sshKey', neu);
    },

    parseDisk(R) {
      let _disk = {};

      if (R.type === 'disk') {
        _disk = {
          disk: { bus: R.bus },
          name: R.name,
        };
      } else if (R.type === 'cd-rom') {
        _disk = {
          cdrom: { bus: R.bus },
          name:  R.name,
        };
      }

      if ( R.bootOrder ) {
        _disk.bootOrder = R.bootOrder;
      }

      return _disk;
    },

    parseVolume(R, dataVolumeName, isCloudInitDisk = false) {
      if (R.source === SOURCE_TYPE.ATTACH_VOLUME) {
        dataVolumeName = R.volumeName || R.name;
      }

      const _volume = { name: R.name };

      if (R.source === SOURCE_TYPE.CONTAINER) {
        _volume.containerDisk = { image: R.container };
      } else if (R.source === SOURCE_TYPE.IMAGE || R.source === SOURCE_TYPE.NEW || R.source === SOURCE_TYPE.ATTACH_VOLUME) {
        _volume.dataVolume = { name: dataVolumeName };
      } else if (isCloudInitDisk) {
        // cloudInitNoCloud
      }

      return _volume;
    },

    parseDateVolumeTemplate(R, dataVolumeName) {
      if (!String(R.size).includes('Gi')) {
        R.size = `${ R.size }Gi`;
      }

      const _dataVolumeTemplate = {
        apiVersion: 'cdi.kubevirt.io/v1beta1',
        kind:       'DataVolume',
        metadata:   { name: dataVolumeName },
        spec:       {
          pvc: {
            accessModes: [R.accessMode],
            resources:   { requests: { storage: R.size } },
            volumeMode:  R.volumeMode
          }
        }
      };

      switch (R.source) {
      case SOURCE_TYPE.NEW:
        _dataVolumeTemplate.spec.pvc.storageClassName = this.customDefaultStorageClass || R.storageClassName || this.defaultStorageClass;
        _dataVolumeTemplate.spec.source = { blank: {} };
        break;
      case SOURCE_TYPE.IMAGE: {
        _dataVolumeTemplate.spec.source = { blank: {} };

        const imageResource = this.getImageResourceById(R.image);

        if (imageResource?.metadata?.name) {
          _dataVolumeTemplate.spec.pvc.storageClassName = `longhorn-${ imageResource?.metadata?.name }`;
          _dataVolumeTemplate.metadata.annotations = { [HCI_ANNOTATIONS.IMAGE_ID]: imageResource?.id };
        } else if (this.isVM) {
          _dataVolumeTemplate.metadata.annotations = { [HCI_ANNOTATIONS.IMAGE_ID]: undefined };
        }
        //  else { // vmTemplate rootImage can be empty
        //   _dataVolumeTemplate.metadata.annotations = { [HCI_ANNOTATIONS.IMAGE_ID]: TEMPORARY_VALUE };
        // }
        break;
      }
      }

      return _dataVolumeTemplate;
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
      const _network = {};

      if (R.isPod) {
        _network.pod = {};
      } else {
        _network.multus = { networkName: R.networkName };
      }
      _network.name = R.name;

      return _network;
    },

    updateCloudConfig(userData, networkData) {
      this.userScript = userData;
      this.networkScript = networkData;
    },

    mergeGuestAgent(userScript = '') {
      let parsed;

      try {
        parsed = safeLoad(cloneDeep(userScript)) || {};
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
      const parsed = safeLoad(cloneDeep(userScript)) || {};

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

    getImageResourceById(id) {
      return this.images.find( I => id === I.id);
    },

    getRootImageId(spec) {
      const id = (spec?.dataVolumeTemplates || [])[0]?.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID] || '';

      return id !== TEMPORARY_VALUE ? id : '';
    },

    deleteCloneValue() {
      // delete host
      this.value.spec.template.spec.hostname = '';

      // delete macAddress
      const template = this.value.spec.template;
      const interfaces = template?.spec?.domain?.devices?.interfaces || [];

      for (let i = 0; i < interfaces.length; i++) {
        if (interfaces[i].macAddress) {
          interfaces[i].macAddress = '';
        }
      }
    },

    getSSHIDs(spec) {
      const ids = spec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.SSH_NAMES] || '[]';

      return JSON.parse(ids) || [];
    },

    getHasCreatedVolumes(spec) {
      const out = [];

      if (spec?.template?.spec?.volumes?.map) {
        spec.template.spec.volumes.map((V) => {
          if (V?.dataVolume?.name) {
            out.push(V.dataVolume.name);
          }
        });
      }

      return out;
    },

    getCloudScript(spec) {
      const volumes = spec.template?.spec?.volumes || [];
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

    imageId: {
      handler(neu) {
        if (this.diskRows.length > 0) {
          const _diskRows = cloneDeep(this.diskRows);
          const imageResource = this.getImageResourceById(neu);

          const isIso = /.iso$/.test(imageResource?.spec?.url);

          if (this.autoChangeForImage) {
            if (isIso) {
              _diskRows[0].type = 'cd-rom';
              _diskRows[0].bus = 'sata';
            } else {
              _diskRows[0].type = 'disk';
              _diskRows[0].bus = 'virtio';
            }
          }

          this.autoChangeForImage = true;
          _diskRows[0].image = neu;
          this.$set(this, 'diskRows', _diskRows);
        }
      },
    }
  }
};
