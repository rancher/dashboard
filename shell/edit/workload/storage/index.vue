<script>
import ButtonDropdown from '@shell/components/ButtonDropdown';
import Mount from '@shell/edit/workload/storage/Mount';
import { _VIEW } from '@shell/config/query-params';
import CodeMirror from '@shell/components/CodeMirror';
import jsyaml from 'js-yaml';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor.vue';
import { randomStr } from '@shell/utils/string';
import { uniq } from '@shell/utils/array';

export default {
  name: 'Storage',

  emits: ['removePvcForm'],

  components: {
    ArrayListGrouped,
    ButtonDropdown,
    Mount,
    CodeMirror,
    YamlEditor
  },

  props: {
    mode: {
      type:    String,
      default: 'create',
    },

    // pod spec
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },

    namespace: {
      type:    String,
      default: null,
    },

    savePvcHookName: {
      type:     String,
      required: true,
    },

    // namespaced configmaps and secrets
    configMaps: {
      type:    Array,
      default: () => [],
    },

    secrets: {
      type:    Array,
      default: () => [],
    },
    namespacedPvcs: {
      type:    Array,
      default: () => [],
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },
    loading: {
      default: false,
      type:    Boolean
    },
  },

  data() {
    this.initializeStorage();

    return {};
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    /**
     * Generated list of volumes
     */
    volumeTypeOptions() {
      const excludedFiles = ['index', 'Mount', 'PVC', 'ContainerMountPaths'];
      const defaultVolumeTypes = [
        'csi',
        'configMap',
        'createPVC',
        'persistentVolumeClaim'
      ];
      // Get all the custom volume types from the file names of this folder
      const customVolumeTypes = require
        .context('@shell/edit/workload/storage', false, /^.*\.vue$/)
        .keys()
        .map((path) => path.replace(/(\.\/)|(.vue)/g, '').split('/').findLast(() => true))
        .filter((file) => !excludedFiles.includes(file));

      return uniq([
        ...customVolumeTypes,
        ...defaultVolumeTypes
      ])
        .sort()
        .map((volumeType) => ({
          label:  this.t(`workload.storage.subtypes.${ volumeType }`),
          action: this.addVolume,
          value:  volumeType,
        }));
    },

    pvcNames() {
      return this.namespacedPvcs.map((pvc) => pvc.metadata.name);
    },

    yamlEditorMode() {
      return this.isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE;
    }
  },

  // need to refresh codemirror when the tab is opened and hash change === tab change
  watch: {
    '$route.hash': {
      deep: true,
      handler() {
        this.refresh();
      }
    }
  },

  methods: {
    /**
     * Initialize missing values for the container
     */
    initializeStorage() {
      if (!this.value.volumes) {
        this.value['volumes'] = [];
      }
    },

    /**
     * Remove all mounts for given storage volume
     */
    removeVolume(volume) {
      const removeName = volume.row.value.name;

      this.value.volumes = this.value.volumes.filter(({ name }) => name !== removeName);
    },

    addVolume(type) {
      const name = `vol-${ randomStr(5).toLowerCase() }`;
      const newVolume = { name, _type: type };

      if (type === 'createPVC') {
        newVolume.persistentVolumeClaim = {};
      } else if (type === 'csi') {
        newVolume.csi = { volumeAttributes: {} };
      } else if (type === 'emptyDir') {
        newVolume.emptyDir = { medium: '' };
      } else {
        newVolume[type] = {};
      }

      this.value.volumes = [...this.value.volumes, newVolume];
      // this.container.volumeMounts.push({ name });
    },

    volumeType(vol) {
      const type = Object.keys(vol).filter(
        (key) => typeof vol[key] === 'object'
      )[0];

      return type;
    },

    // import component for volume type
    getComponent(type) {
      switch (type) {
      case 'configMap':
        return require(`@shell/edit/workload/storage/secret.vue`).default;
      case 'createPVC':
      case 'persistentVolumeClaim':
        return require(`@shell/edit/workload/storage/persistentVolumeClaim/index.vue`)
          .default;
      case 'csi':
        return require(`@shell/edit/workload/storage/csi/index.vue`).default;

      default: {
        let component;

        try {
          component = require(`@shell/edit/workload/storage/${ type }.vue`).default;
        } catch {}

        return component;
      }
      }
    },

    headerFor(type) {
      if (
        this.$store.getters['i18n/exists'](`workload.storage.subtypes.${ type }`)
      ) {
        return this.t(`workload.storage.subtypes.${ type }`);
      } else {
        return type;
      }
    },

    yamlDisplay(volume) {
      try {
        return jsyaml.dump(volume);
      } catch {
        return volume;
      }
    },

    openPopover() {
      const button = this.$refs.buttonDropdown;

      try {
        button.togglePopover();
      } catch (e) {}
    },

    // codemirror needs to refresh if it is in a tab that wasn't visible on page load
    refresh() {
      if (this.$refs) {
        // if a constant ref is assigned to the codemirror component in the template below, only the last instance of that codemirror component gets the ref
        const cmRefs = Object.keys(this.$refs).filter((ref) => ref.startsWith('cm-'));

        cmRefs.forEach((r) => this.$refs[r].refresh());
      }
    },

    removePvcForm(hookName) {
      this.$emit('removePvcForm', hookName);
    },

  },
};
</script>

<template>
  <div>
    <!-- Storage Volumes -->
    <ArrayListGrouped
      v-model:value="value.volumes"
      :mode="mode"
      @remove="removeVolume"
    >
      <!-- Custom/default storage volume form -->
      <template #default="props">
        <h3>{{ headerFor(volumeType(props.row.value)) }}</h3>
        <div class="bordered-section">
          <component
            :is="getComponent(volumeType(props.row.value))"
            v-if="getComponent(volumeType(props.row.value))"
            :value="props.row.value"
            :pod-spec="value"
            :mode="mode"
            :namespace="namespace"
            :secrets="secrets"
            :config-maps="configMaps"
            :pvcs="pvcNames"
            :register-before-hook="registerBeforeHook"
            :save-pvc-hook-name="savePvcHookName"
            :loading="loading"
            :data-testid="`volume-component-${props.i}`"
            @removePvcForm="removePvcForm"
          />
          <div
            v-else
          >
            <YamlEditor
              :ref="`cm-${props.i}`"
              v-model:value="props.row.value"
              :as-object="true"
              :data-testid="`volume-component-${props.i}`"
              :editor-mode="yamlEditorMode"
            />
          </div>
        </div>

        <!-- Mount point list to be mapped to volume
        <Mount
          :container="container"
          :name="props.row.value.name"
          :mode="mode"
        /> -->
      </template>

      <!-- Add Storage Volume -->
      <template #add>
        <ButtonDropdown
          v-if="!isView"
          id="select-volume"
          :button-label="t('workload.storage.addVolume')"
          :dropdown-options="volumeTypeOptions"
          size="sm"
          data-testid="dropdown-button-storage-volume"
          @click-action="e=>addVolume(e.value)"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>

<style lang='scss' scoped>
.volume-source {
  padding: 20px;
  margin: 20px 0px 20px 0px;
  position: relative;

  :deep() .code-mirror {
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
  padding: 0px;
}

.add-vol:focus {
  outline: none;
  box-shadow: none;
}
</style>
