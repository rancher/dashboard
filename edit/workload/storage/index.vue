<script>
import { PVC } from '@/config/types';
// import ButtonDropdown from '@/components/ButtonDropdown';
import { removeObject } from '@/utils/array.js';

export default {
  // components: { ButtonDropdown },

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    // pod spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    namespace: {
      type:    String,
      default: 'default'
    },

    // namespaced configmaps and secrets
    configMaps: {
      type:    Array,
      default: () => []
    },

    secrets: {
      type:    Array,
      default: () => []
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },
  },

  async fetch() {
    const pvcs = await this.$store.dispatch('cluster/findAll', { type: PVC });

    this.pvcs = pvcs.filter(pvc => pvc.metadata.namespace === this.namespace).map(pvc => pvc.metadata.name);
  },

  data() {
    return { pvcs: [] };
  },

  computed: {
    volumeOpts() {
      return ['secret', 'hostPath', 'certificate', 'configMap', 'persistentVolumeClaim', 'createPersistentVolumeClaim', 'csi', 'nfs'];
    }
  },

  created() {
    const container = this.value?.containers[0];

    if (!container.volumeMounts) {
      this.$set(container, 'volumeMounts', []);
    }
  },

  methods: {
    addVolume(type) {
      if (!this.value.volumes) {
        this.$set(this.value, 'volumes', []);
      }
      if (type === 'certificate') {
        this.value.volumes.push({
          _type: 'certificate', secret: {}, name: `vol${ this.value.volumes.length }`
        });
      } else if (type === 'createPersistentVolumeClaim') {
        this.value.volumes.push({
          _type: 'createPVC', persistentVolumeClaim: {}, name: `vol${ this.value.volumes.length }`
        });
      } else {
        this.value.volumes.push({ [type]: {}, name: `vol${ this.value.volumes.length }` });
      }
    },

    removeVolume(vol) {
      removeObject(this.value.volumes, vol);
    },

    volumeType(vol) {
      return Object.keys(vol).filter(key => typeof vol[key] === 'object')[0];
    },

    // import component for volume type
    componentFor(type) {
      switch (type) {
      case 'secret':
      case 'certificate':
      case 'configMap':
        return require(`@/edit/workload/storage/Secret.vue`).default;
      case 'hostPath':
        return require(`@/edit/workload/storage/HostPath.vue`).default;
      case 'persistentVolumeClaim':
      case 'createPersistentVolumeClaim':
        return require(`@/edit/workload/storage/PVC.vue`).default;
      case 'csi':
        return require(`@/edit/workload/storage/ephemeralVolume/index.vue`).default;
      case 'nfs':
        return require(`@/edit/workload/storage/NFS.vue`).default;
      }
    }
  }
};
</script>

<template>
  <div>
    <template v-for="(volume, i) in value.volumes">
      <component
        :is="componentFor(volumeType(volume))"
        :key="i"
        class="volume-source simple-box"
        :value="volume"
        :pod-spec="value"
        :mode="mode"
        :secrets="secrets"
        :config-maps="configMaps"
        :pvcs="pvcs"
        :register-before-hook="registerBeforeHook"
        @remove="removeVolume(volume)"
      />
    </template>
    <div class="row">
      <div class="col span-6">
        <v-select
          :searchable="false"
          :multiple="false"
          class="inline btn-like"
          :value="'label'"
          :options="['secret', 'hostPath', 'certificate', 'configMap', 'persistentVolumeClaim', 'createPersistentVolumeClaim', 'csi', 'nfs']"
          :get-option-label="opt=>t(`workload.storage.subtypes.${opt}`)"
          @input="e=>addVolume(e)"
        />
      </div>
    </div>
    <!-- <ButtonDropdown>
      <template #button-content>
        <button type="button" class="btn bg-transparent">
          <t k="workload.storage.addVolume" />
        </button>
      </template>
      <template v-if="volumeOpts.length" #popover-content>
        <ul class="list-unstyled">
          <li v-for="opt in volumeOpts" :key="opt" @click="addVolume(opt)">
            {{ t(`workload.storage.subtypes.${opt}`) }}
          </li>
        </ul>
      </template>
    </ButtonDropdown> -->
  </div>
</template>

<style lang='scss'>
.volume-source{
  padding: 20px;
  margin: 20px 0px 20px 0px;
  position: relative;
}

.remove-vol {
  position: absolute;
  top: 10px;
  right: 10px;
  padding:0px;
}
</style>
