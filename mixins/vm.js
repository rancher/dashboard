import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import randomstring from 'randomstring';
import { safeLoad, safeDump } from 'js-yaml';

import { allHash } from '@/utils/promise';
import {
  HCI as HCI_ANNOTATIONS,
  HARVESTER_IMAGE_NAME,
  HARVESTER_IMAGE_ID
} from '@/config/labels-annotations';
import { SOURCE_TYPE } from '@/config/map';
import {
  PVC, HCI, STORAGE_CLASS, POD, NODE
} from '@/config/types';

const TEMPORARY_VALUE = '$occupancy_url';
const MANAGEMENT_NETWORK = 'management Network';

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
      this.value.spec.template.spec.hostname = '';

      this.deleteMacAddress(this.value.spec.template);
    }

    let pageType = '';
    let spec = null;

    if (type === HCI.VM) {
      pageType = 'vm';
      spec = this.value.spec;
    } else {
      pageType = 'template';
      spec = this.value.spec.vm;
    }

    const sshKeyName = spec?.template?.metadata?.annotations?.['harvesterhci.io/sshNames'] || '[]';
    const sshKey = JSON.parse(sshKeyName) || [];

    const hasCreateVolumes = [];

    spec?.template?.spec?.volumes?.map((V) => { // eslint-disable-line
      if (V?.dataVolume?.name) {
        hasCreateVolumes.push(V.dataVolume.name);
      }
    });

    let userScript = '';
    let networkScript = '';
    const volumes = spec.template?.spec?.volumes || [];

    volumes.forEach((v) => {
      if (v.cloudInitNoCloud) {
        userScript = v.cloudInitNoCloud.userData;
        networkScript = v.cloudInitNoCloud.networkData;
      }
    });

    const machineType = this.value.machineType;

    const diskRows = this.getDiskRows(spec);
    const networkRows = this.getNetworkRows(spec);
    const imageName = this.getRootImage(spec);

    return {
      ssh:                   [],
      images:                [],
      versions:              [],
      templates:             [],
      installAgent:          false,
      isClone,
      spec,
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
      pageType,
      imageName,
      diskRows,
      networkRows,
      machineType,
      autoChangeForImage:     true
    };
  },

  computed: {
    memory: {
      get() {
        return this.spec.template.spec.domain.resources.requests.memory;
      },
      set(neu) {
        this.$set(this.spec.template.spec.domain.resources.requests, 'memory', neu);
      }
    },

    defaultStorageClass() {
      let out = 'longhorn';

      const defaultStorage = this.$store.getters['cluster/all'](STORAGE_CLASS).find( O => O.isDefault);

      if (defaultStorage) {
        out = defaultStorage.metadata.name;
      }

      return out;
    },

    customDefaultStorageClass() {
      const defaultStorageClass = this.$store.getters['cluster/all'](HCI.SETTING).find( O => O.id === 'default-storage-class');

      if (defaultStorageClass?.value) {
        return defaultStorageClass?.value.split(':')[0];
      }

      return null;
    },

    customVolumeMode() {
      const defaultStorageClass = this.$store.getters['cluster/all'](HCI.SETTING).find( O => O.id === 'default-storage-class');

      if (defaultStorageClass?.value) {
        return defaultStorageClass?.value.split(':')[1];
      }

      return 'Block';
    },

    customAccessMode() {
      const defaultStorageClass = this.$store.getters['cluster/all'](HCI.SETTING).find( O => O.id === 'default-storage-class');

      if (defaultStorageClass?.value) {
        return defaultStorageClass?.value.split(':')[2];
      }

      return 'ReadWriteOnce';
    }
  },

  methods: {
    getDiskRows(spec) {
      const _disks = spec?.template?.spec?.domain?.devices?.disks || [];
      const _volumes = spec?.template?.spec?.volumes || [];
      const _dataVolumeTemplates = spec?.dataVolumeTemplates || [];

      let out = [];

      if (_disks.length === 0) {
        out.push({
          source:           SOURCE_TYPE.IMAGE,
          name:             'disk-0',
          accessMode:       'ReadWriteMany',
          bus:              'virtio',
          pvcNS:            '',
          volumeName:       '',
          size:             '10Gi',
          type:             'disk',
          storageClassName: '',
          image:            this.imageName,
          volumeMode:       'Block',
        });
      } else {
        out = _disks.map( (DISK, index) => {
          const volume = _volumes.find( V => V.name === DISK.name );

          let source = '';
          let volumeName = '';
          const pvcNS = '';
          let accessMode = '';
          let size = '';
          let volumeMode = '';
          let storageClassName = '';
          let image = '';
          let container = '';
          let realName = '';

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
              // has annotation(HARVESTER_IMAGE_ID) => SOURCE_TYPE.IMAGE
              if (!!DVT.metadata?.annotations?.[HARVESTER_IMAGE_ID]) {
                const imageId = DVT.metadata?.annotations?.[HARVESTER_IMAGE_ID];

                image = this.getImageSourceById(imageId);
                source = SOURCE_TYPE.IMAGE;
              } else {
                source = SOURCE_TYPE.NEW;
              }

              const dataVolumeSpecPVC = DVT?.spec?.pvc || {};

              volumeMode = dataVolumeSpecPVC?.volumeMode;
              accessMode = dataVolumeSpecPVC?.accessModes?.[0];
              size = dataVolumeSpecPVC?.resources?.requests?.storage || '10Gi';
              storageClassName = dataVolumeSpecPVC?.storageClassName || this.customDefaultStorageClass;
            } else { // SOURCE_TYPE.ATTACH_VOLUME
              const choices = this.$store.getters['cluster/all'](HCI.DATA_VOLUME);
              const dvResource = choices.find( O => O.metadata.name === volume?.dataVolume?.name);

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
            pvcNS,
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
      const networks = spec?.template?.spec?.networks || [];
      const interfaces = spec?.template?.spec?.domain?.devices?.interfaces || [];
      // const templateAnnotations = spec?.template?.metadata?.annotations;
      // let networkAnnotition = [];

      // if (templateAnnotations?.[HCI_ANNOTATIONS.CIRD_NETWORK]) {
      //   networkAnnotition = JSON.parse(templateAnnotations?.[HCI_ANNOTATIONS.CIRD_NETWORK]);
      // }

      const out = interfaces.map( (O, index) => {
        const network = networks.find( N => O.name === N.name);

        // const netwrokAnnotation = networkAnnotition.find((N) => {
        //   return network?.multus?.networkName === N.name;
        // });
        const type = O.sriov ? 'sriov' : O.bridge ? 'bridge' : 'masquerade';
        const isPod = !!network?.pod;

        return {
          ...O,
          type,
          model:        O.model || 'virtio',
          networkName:  network?.multus?.networkName || MANAGEMENT_NETWORK,
          index,
          // isIpamStatic: !!netwrokAnnotation,
          // cidr:         netwrokAnnotation?.ips || '',
          isPod
        };
      });

      return out;
    },

    getRootImage(spec) {
      const _dataVolumeTemplates = spec?.dataVolumeTemplates || [];
      const id = _dataVolumeTemplates?.[0]?.metadata?.annotations?.[HARVESTER_IMAGE_ID] || '';

      return this.getImageSourceById(id);
    },

    getCloudInit() {
      let out = this.userScript;

      try {
        let newInitScript = {};

        if (out) {
          newInitScript = safeLoad(out);
        }

        // eslint-disable-next-line camelcase
        if (newInitScript?.ssh_authorized_keys) {
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

    normalizeSpec() {
      this.$set(this.spec.template.spec.domain.machine, 'type', this.machineType);

      this.parseNetworkRows(this.networkRows);

      this.parseDiskRows(this.diskRows);

      this.supportMigration();
    },

    getImageSource(url) {
      if (!url) {
        return;
      }
      const images = this.$store.getters['cluster/all'](HCI.IMAGE);
      const image = images.find( I => url === I?.status?.downloadUrl);

      return image?.spec?.displayName;
    },

    getImageSourceById(id) {
      if (!id) {
        return;
      }

      const images = this.$store.getters['cluster/all'](HCI.IMAGE);
      const image = images.find( I => id === I?.id );

      return image?.spec?.displayName;
    },

    getUrlFromImage(name) {
      const image = this.images.find( I => name === I?.spec?.displayName);

      return image?.status?.downloadUrl;
    },

    getImageResource(name) {
      return this.images.find( I => name === I?.spec?.displayName);
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
        dataVolumeName = R.volumeName || R.name; // TODO
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
      const accessModel = R.accessMode;

      if (!String(R.size).includes('Gi')) {
        R.size = `${ R.size }Gi`;
      }

      const _dataVolumeTemplate = {
        apiVersion: 'cdi.kubevirt.io/v1beta1',
        kind:       'DataVolume',
        metadata:   { name: dataVolumeName },
        spec:       {
          pvc: {
            accessModes: [accessModel],
            resources:   { requests: { storage: R.size } },
            volumeMode:  R.volumeMode
          }
        }
      };

      switch (R.source) {
      case SOURCE_TYPE.NEW:
        _dataVolumeTemplate.spec.pvc.storageClassName = this.customDefaultStorageClass; // R.storageClassName
        _dataVolumeTemplate.spec.source = { blank: {} };
        break;
      case SOURCE_TYPE.IMAGE: {
        _dataVolumeTemplate.spec.source = { blank: {} };

        const imageResource = this.getImageResource(R.image);
        const imageId = imageResource?.id;

        if (imageResource?.metadata?.name) {
          _dataVolumeTemplate.spec.pvc.storageClassName = `longhorn-${ imageResource?.metadata?.name }`;
          _dataVolumeTemplate.metadata.annotations = { [HARVESTER_IMAGE_ID]: imageId };
        } else if (this.pageType !== 'vm') {
          _dataVolumeTemplate.metadata.annotations = { [HARVESTER_IMAGE_ID]: TEMPORARY_VALUE };
        }
        break;
      }
      }

      return _dataVolumeTemplate;
    },

    parseSshKeys(checkedSSH) {
      const out = [];

      checkedSSH.map( (O) => {
        const ssh = find(this.ssh, S => S?.spec?.publicKey === O);

        if (!ssh) {
          out.push(O);
        }
      });

      return out;
    },

    getInSshList(arr) {
      const out = [];

      arr.map( (O) => {
        const ssh = find(this.ssh, S => S.spec.publicKey === O);

        if (ssh) {
          out.push(ssh.metadata.name);
        }
      });

      return out;
    },

    parseDiskRows(disk) {
      const disks = [];
      const volumes = [];
      const dataVolumeTemplates = [];
      const diskNameLables = [];

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

        diskNameLables.push(dataVolumeName);
        disks.push(_disk);
        volumes.push(_volume);

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
              [HARVESTER_IMAGE_NAME]:    this.value?.metadata?.name,
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

      if (this.pageType !== 'vm') {
        if (!this.imageName) {
          // spec.dataVolumeTemplates[0].spec.source.http.url = TEMPORARY_VALUE;
          spec.dataVolumeTemplates[0].metadata.annotations[HARVESTER_IMAGE_ID] = TEMPORARY_VALUE;
        }
      }

      if (volumes.length === 0) {
        delete spec.template.spec.volumes;
        delete spec.dataVolumeTemplates;
      }

      if (this.pageType === 'vm') {
        this.$set(this.value, 'spec', spec);
        this.$set(this, 'spec', spec);
      } else {
        this.$set(this, 'spec', spec);
      }
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

    parseTemplateNetworkAnnotation(R) {
      return {
        name:  R.networkName,
        ips:   R.cidr,
      };
    },

    parseNetworkRows(networkRow) {
      const interfaces = [];
      const networks = [];
      // const templateNetworkAnnotation = [];

      networkRow.forEach( (R) => {
        const _interface = this.parseInterface(R);
        const _network = this.parseNetwork(R);

        // if (R.isIpamStatic) {
        //   const _templateNetwrokAnnotation = this.parseTemplateNetworkAnnotation(R);

        //   templateNetworkAnnotation.push(_templateNetwrokAnnotation);
        // }

        interfaces.push(_interface);
        networks.push(_network);
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

      // if (this.pageType === 'vm') {
      //   Object.assign(this.spec.template.metadata.annotations, { [HCI_ANNOTATIONS.CIRD_NETWORK]: JSON.stringify(templateNetworkAnnotation) });
      // }

      if (this.pageType === 'vm') {
        this.$set(this.value.spec.template, 'spec', spec);
        this.$set(this.spec.template, 'spec', spec);
      } else {
        this.$set(this.spec.template, 'spec', spec);
      }
    },

    supportMigration() {
      this.$set(this.spec.template.spec, 'evictionStrategy', 'LiveMigrate');
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

      parsed.package_update = true; // overwritten

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

    deleteMacAddress(template) {
      const interfaces = template?.spec?.domain?.devices?.interfaces || [];

      for (let i = 0; i < interfaces.length; i++) {
        if (interfaces[i].macAddress) {
          interfaces[i].macAddress = '';
        }
      }
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

    imageName: {
      handler(neu) {
        if (this.diskRows.length > 0) {
          const _diskRows = cloneDeep(this.diskRows);

          const isIso = /.iso$/.test(neu);

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
