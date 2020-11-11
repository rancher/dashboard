<script>
import { PVC } from '@/config/types';
import { removeObject } from '@/utils/array.js';
import ButtonDropdown from '@/components/ButtonDropdown';
import Mount from '@/edit/workload/storage/Mount';
import { _VIEW } from '@/config/query-params';
import CodeMirror from '@/components/CodeMirror';
import jsyaml from 'js-yaml';

export default {
  components: {
    ButtonDropdown, Mount, CodeMirror
  },

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
      default: null
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
    const namespace = this.namespace || this.$store.getters['defaultNamespace'];

    this.pvcs = pvcs.filter(pvc => pvc.metadata.namespace === namespace);
  },

  data() {
    return { pvcs: [] };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    opts() {
      const hasComponent = require.context('@/edit/workload/storage', false, /^.*\.vue$/).keys()
        .map(path => path.replace(/(\.\/)|(.vue)/g, ''))
        .filter(file => file !== 'index' && file !== 'Mount' && file !== 'PVC');

      const out = [...hasComponent, 'csi', 'configMap', 'createPVC', 'persistentVolumeClaim'];

      out.sort();

      return out;
    },

    pvcNames() {
      return this.pvcs.map(pvc => pvc.metadata.name);
    },
  },

  created() {
    const container = this.value?.containers[0];

    if (!container.volumeMounts) {
      this.$set(container, 'volumeMounts', []);
    }
    if (!this.value.volumes) {
      this.$set(this.value, 'volumes', []);
    }
  },

  methods: {
    addVolume(type) {
      if (type === 'createPVC') {
        this.value.volumes.push({
          _type: 'createPVC', persistentVolumeClaim: {}, name: `vol${ this.value.volumes.length }`
        });
      } else if ( type === 'csi' ) {
        this.value.volumes.push({
          _type: type, csi: { volumeAttributes: {} }, name: `vol${ this.value.volumes.length }`
        });
      } else {
        this.value.volumes.push({
          _type: type, [type]: {}, name: `vol${ this.value.volumes.length }`
        });
      }
    },

    removeVolume(vol) {
      removeObject(this.value.volumes, vol);
    },

    volumeType(vol) {
      const type = Object.keys(vol).filter(key => typeof vol[key] === 'object')[0];

      return type;
    },

    // import component for volume type
    componentFor(type) {
      switch (type) {
      case 'configMap':
        return require(`@/edit/workload/storage/secret.vue`).default;
      case 'createPVC':
      case 'persistentVolumeClaim':
        return require(`@/edit/workload/storage/persistentVolumeClaim/index.vue`).default;
      case 'csi':
        return require(`@/edit/workload/storage/csi/index.vue`).default;
      default: {
        let component;

        try {
          component = require(`@/edit/workload/storage/${ type }.vue`).default;
        } catch {
        }

        return component;
      }
      }
    },

    headerFor(type) {
      if (this.$store.getters['i18n/exists'](`workload.storage.subtypes.${ type }`)) {
        return this.t(`workload.storage.subtypes.${ type }`);
      } else {
        return type;
      }
    },

    yamlDisplay(volume) {
      try {
        return jsyaml.safeDump(volume);
      } catch {
        return volume;
      }
    },

    openPopover() {
      const button = this.$refs.buttonDropdown;

      try {
        button.togglePopover();
      } catch (e) {
      }
    },

    // codemirror needs to refresh if it is in a tab that wasn't visible on page load
    refresh() {
      if ( this.$refs.cm ) {
        this.$refs.cm.forEach(component => component.refresh());
      }
    },
  }
};
</script>

<template>
  <div>
    <div v-for="(volume, i) in value.volumes" :key="i">
      <div v-if="componentFor(volumeType(volume)) || isView" class=" volume-source simple-box">
        <button v-if="mode!=='view'" type="button" class="role-link btn btn-lg remove-vol" @click="removeVolume(volume)">
          <i class="icon icon-2x icon-x" />
        </button>
        <h3>{{ headerFor(volumeType(volume)) }}</h3>
        <div class="bordered-section">
          <component
            :is="componentFor(volumeType(volume))"
            v-if="componentFor(volumeType(volume))"
            :value="volume"
            :pod-spec="value"
            :mode="mode"
            :namespace="namespace"
            :secrets="secrets"
            :config-maps="configMaps"
            :pvcs="pvcNames"
            :register-before-hook="registerBeforeHook"
          />
          <div v-else-if="isView">
            <CodeMirror
              ref="cm"
              :value="yamlDisplay(volume)"
              :options="{readOnly:true, cursorBlinkRate:-1}"
            />
          </div>
        </div>
        <Mount :pod-spec="value" :name="volume.name" :mode="mode" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <ButtonDropdown v-if="mode!=='view'" ref="buttonDropdown" size="sm">
          <template #button-content>
            <button v-if="mode!=='view'" type="button" class="btn btn-sm text-primary bg-transparent" @click="openPopover">
              {{ t('workload.storage.addVolume') }}
            </button>
          </template>
          <template #popover-content>
            <ul class="list-unstyled menu">
              <li v-for="opt in opts" :key="opt" v-close-popover @click="addVolume(opt)">
                {{ t(`workload.storage.subtypes.${opt}`) }}
              </li>
            </ul>
          </template>
        </ButtonDropdown>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.volume-source{
  padding: 20px;
  margin: 20px 0px 20px 0px;
  position: relative;

  ::v-deep .code-mirror  {
    .CodeMirror {
      background-color: var(--yaml-editor-bg);
      & .CodeMirror-gutters {
        background-color: var(--yaml-editor-bg);
      }
    }
  }
}

.remove-vol {
  position: absolute;
  top: 10px;
  right: 10px;
  padding:0px;
}

.add-vol:focus{
  outline: none;
  box-shadow: none;
}

</style>
