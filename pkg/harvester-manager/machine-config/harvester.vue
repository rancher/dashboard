<script>
import draggable from 'vuedraggable';
import isEmpty from 'lodash/isEmpty';
import NodeAffinity from '@shell/components/form/NodeAffinity';
// import PodAffinity from '@shell/components/form/PodAffinity';
import InfoBox from '@shell/components/InfoBox';
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import UnitInput from '@shell/components/form/UnitInput';
import YamlEditor from '@shell/components/YamlEditor';
import { Banner } from '@components/Banner';

import { get } from '@shell/utils/object';
import { removeObject } from '@shell/utils/array';
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

const STORAGE_NETWORK = 'storage-network.settings.harvesterhci.io';

export function isReady() {
  function getStatusConditionOfType(type, defaultValue = []) {
    const conditions = Array.isArray(get(this, 'status.conditions')) ? this.status.conditions : defaultValue;

    return conditions.find( cond => cond.type === type);
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

export default {
  name: 'ConfigComponentHarvester',

  components: {
    draggable, Loading, LabeledSelect, LabeledInput, UnitInput, Banner, YamlEditor, NodeAffinity, InfoBox
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
        const res = await allHashSettled({
          namespaces:   this.$store.dispatch('cluster/request', { url: `${ url }/${ NAMESPACE }s` }),
          images:       this.$store.dispatch('cluster/request', { url: `${ url }/${ HCI.IMAGE }s` }),
          configMaps:   this.$store.dispatch('cluster/request', { url: `${ url }/${ CONFIG_MAP }s` }),
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
        this.networkOptions = (res.networks.value?.data || []).filter(O => O.metadata?.annotations?.[STORAGE_NETWORK] !== 'true').map((O) => {
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

        let systemNamespaces = (res.settings.value?.data || []).filter(x => x.id === SETTING.SYSTEM_NAMESPACES);

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

            this.namespaces.push(namespace);
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
        this.isOldFormat = true;

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

      if (!this.value.networkInfo) {
        this.isOldFormat = true;

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

      this.update();
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    let vmAffinity = { affinity: {} };
    let userData = '';
    let networkData = '';

    if (this.value.vmAffinity) {
      vmAffinity = { affinity: JSON.parse(base64Decode(this.value.vmAffinity)) };
    }

    if (this.value.userData) {
      userData = base64Decode(this.value.userData);
    }

    if (this.value.networkData) {
      networkData = base64Decode(this.value.networkData);
    }

    return {
      credential:         null,
      vmAffinity,
      userData,
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
      interfaces:         [],
      isOldFormat:        false,
      SOURCE_TYPE
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
      const out = (this.storageClass || []).filter(s => !s.parameters?.backingImage).map((s) => {
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
      const defaultStorageClass = (this.storageClass || []).filter(s => !s.parameters?.backingImage).find((s) => {
        const isDefault = s.metadata?.annotations?.[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';

        return isDefault;
      });

      return defaultStorageClass?.metadata?.name || '';
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
      this.$refs.userDataYamlEditor.refresh();
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

    valuesChanged(value, type) {
      this.value[type] = base64Encode(value);
    },

    onOpen() {
      this.getVmImage();
    },

    async getVmImage() {
      try {
        const clusterId = get(this.credential, 'decodedData.clusterId');
        const url = `/k8s/clusters/${ clusterId }/v1`;

        if (url) {
          const res = await this.$store.dispatch('cluster/request', { url: `${ url }/${ HCI.IMAGE }s` });

          this.images = res?.data;
        }
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }
    },

    updateScheduling(neu) {
      const { affinity } = neu;

      if (!affinity.nodeAffinity && !affinity.podAffinity && !affinity.podAntiAffinity) {
        this.value.vmAffinity = '';
        this.vmAffinity = { affinity: {} };

        return;
      }

      this.value.vmAffinity = base64Encode(JSON.stringify(affinity));
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

      this.value.diskInfo = JSON.stringify(diskInfo);

      const networkInfo = { interfaces: this.interfaces };

      this.value.networkInfo = JSON.stringify(networkInfo);
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
            v-model="value.cpuCount"
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
            v-model="value.memorySize"
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
            v-model="value.vmNamespace"
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
            v-model="value.sshUser"
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
        v-model="disks"
        :disabled="isView"
        @end="update"
      >
        <transition-group>
          <div
            v-for="(disk, i) in disks"
            :key="i"
          >
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
                    v-model="disk.imageName"
                    :mode="mode"
                    :options="imageOptions"
                    :required="true"
                    :searchable="true"
                    :disabled="disabled"
                    label-key="cluster.credential.harvester.image"
                    :placeholder="t('cluster.harvester.machinePool.image.placeholder')"
                    @on-open="onOpen"
                    @input="update"
                  />

                  <LabeledSelect
                    v-else
                    v-model="disk.storageClassName"
                    :options="storageClassOptions"
                    label-key="cluster.credential.harvester.volume.storageClass"
                    :mode="mode"
                    :disabled="disabled"
                    :required="true"
                    @input="update"
                  />
                </div>

                <div class="col span-6">
                  <UnitInput
                    v-model="disk.size"
                    v-int-number
                    label-key="cluster.credential.harvester.disk"
                    output-as="string"
                    suffix="GiB"
                    :mode="mode"
                    :disabled="disabled"
                    required
                    :placeholder="t('cluster.harvester.machinePool.disk.placeholder')"
                    @input="update"
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
        </transition-group>
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
                v-model="network.networkName"
                :mode="mode"
                :options="networkOptions"
                :required="true"
                label-key="cluster.credential.harvester.network.networkName"
                :placeholder="t('cluster.harvester.machinePool.network.placeholder')"
                @input="update"
              />
            </div>

            <div class="col span-6">
              <LabeledInput
                v-model="network.macAddress"
                label-key="cluster.credential.harvester.network.macAddress"
                :mode="mode"
                @input="update"
              />
            </div>
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
          {{ t("workload.container.titles.nodeScheduling") }}
        </h3>
        <NodeAffinity
          :mode="mode"
          :value="vmAffinity.affinity.nodeAffinity"
          @input="updateNodeScheduling"
        />

        <!-- <h3 class="mt-20">
          {{ t("workload.container.titles.podScheduling") }}
        </h3>
        <PodAffinity
          :mode="mode"
          :value="vmAffinity"
          :nodes="allNodeObjects"
          :namespaces="namespaces"
          @update="updateScheduling"
        /> -->

        <h3 class="mt-20">
          {{ t("cluster.credential.harvester.userData.title") }}
        </h3>
        <div>
          <LabeledSelect
            v-if="isCreate"
            v-model="userData"
            class="mb-10"
            :options="userDataOptions"
            label-key="cluster.credential.harvester.userData.label"
            :mode="mode"
            :disabled="disabled"
          />

          <YamlEditor
            ref="userDataYamlEditor"
            :key="userData"
            class="yaml-editor mb-20"
            :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
            :value="userData"
            :disabled="disabled"
            @onInput="valuesChanged($event, 'userData')"
          />
        </div>

        <h3>{{ t('cluster.credential.harvester.networkData.title') }}</h3>
        <div>
          <LabeledSelect
            v-if="isCreate"
            v-model="networkData"
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

::v-deep .yaml-editor {
  flex: 1;
  min-height: $yaml-height;
  & .code-mirror .CodeMirror {
    position: initial;
    height: auto;
    min-height: $yaml-height;
  }
}

::v-deep .info-box {
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
