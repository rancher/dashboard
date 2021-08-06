<script>
import { mapGetters } from 'vuex';

import LabeledSelect from '@/components/form/LabeledSelect';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';

import { CONFIG_MAP } from '@/config/types';
import { HCI } from '@/config/labels-annotations';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';

export default {
  components: { YamlEditor, LabeledSelect },

  props: {
    userScript: {
      type:    String,
      default: ''
    },
    networkScript: {
      type:    String,
      default: ''
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    return {
      userData:         this.userScript,
      networkData:      this.networkScript,
      configmaps:       [],
      cloudInitUser:    '',
      cloudInitNetwork: '',
    };
  },

  async fetch() {
    this.configmaps = await this.$store.dispatch('virtual/findAll', { type: CONFIG_MAP });
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    editorMode() {
      return this.isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isView() {
      return this.mode === _VIEW;
    },

    cloudInitConfigs() {
      const out = {
        user:    [],
        network: []
      };

      for (const config of this.configmaps) {
        const labelType = config.metadata?.labels?.[HCI.CLOUD_INIT];
        const isUser = labelType === 'user';
        const isNetwork = labelType === 'network';

        let item;

        if (!!labelType) {
          item = {
            label: config.metadata?.name,
            value: config.data.cloudInit
          };
        }

        if (isUser) {
          out.user.push(item);
        }

        if (isNetwork) {
          out.network.push(item);
        }
      }

      out.user.unshift({
        label: this.t('harvester.virtualMachine.cloudConfig.cloudInit.placeholder'),
        value: ''
      });

      out.network.unshift({
        label: this.t('harvester.virtualMachine.cloudConfig.cloudInit.placeholder'),
        value: ''
      });

      return out;
    },
  },

  watch: {
    userScript(neu) {
      this.userData = neu;
    },

    networkScript(neu) {
      this.networkData = neu;
    },

    cloudInitUser(neu) {
      if (!neu) {
        this.userData = '';
      } else {
        this.userData = neu;
      }

      this.update();
    },

    cloudInitNetwork(neu) {
      if (!neu) {
        this.networkData = '';
      } else {
        this.networkData = neu;
      }

      this.update();
    },
  },

  methods: {
    update() {
      this.$emit('updateCloudConfig', this.userData, this.networkData);
    },
    refresh() {
      this.$refs.yamlUser.refresh();
      this.$refs.yamlNetwork.refresh();
    },
    valuesChanged(value, type) {
      this[type] = value;
      this.update();
    },
  }
};
</script>

<template>
  <div @input="update">
    <h2>{{ t('harvester.virtualMachine.cloudConfig.title') }}</h2>

    <div class="mb-20">
      <h3>{{ t('harvester.virtualMachine.cloudConfig.userData.title') }}</h3>
      <p class="text-muted mb-20">
        <t k="harvester.virtualMachine.cloudConfig.userData.tip" :raw="true" />
      </p>

      <LabeledSelect
        v-if="!isView"
        v-model="cloudInitUser"
        class="mb-20"
        :options="cloudInitConfigs.user"
        label-key="harvester.virtualMachine.cloudConfig.userData.label"
      />

      <div class="resource-yaml">
        <YamlEditor
          ref="yamlUser"
          :key="userData"
          :value="userData"
          class="yaml-editor"
          :editor-mode="editorMode"
          @onInput="valuesChanged($event, 'userData')"
        />
      </div>
    </div>

    <div>
      <h3>{{ t('harvester.virtualMachine.cloudConfig.networkData.title') }}</h3>
      <p class="text-muted mb-20">
        <t k="harvester.virtualMachine.cloudConfig.networkData.tip" :raw="true" />
      </p>

      <LabeledSelect
        v-if="!isView"
        v-model="cloudInitNetwork"
        class="mb-20"
        :options="cloudInitConfigs.network"
        label-key="harvester.virtualMachine.cloudConfig.networkData.label"
      />

      <div class="resource-yaml">
        <YamlEditor
          ref="yamlNetwork"
          :key="networkData"
          :value="networkData"
          class="yaml-editor"
          :editor-mode="editorMode"
          @onInput="valuesChanged($event, 'networkData')"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$yaml-height: 200px;

.resource-yaml {
  flex: 1;
  display: flex;
  flex-direction: column;

  & .yaml-editor{
    flex: 1;
    min-height: $yaml-height;

    & .code-mirror .CodeMirror {
      position: initial;
      height: auto;
      min-height: $yaml-height;
    }
  }
}
</style>
