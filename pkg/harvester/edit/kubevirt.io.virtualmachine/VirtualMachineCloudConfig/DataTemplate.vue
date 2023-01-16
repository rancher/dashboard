<script>
import { mapGetters } from 'vuex';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

import { _VIEW } from '@shell/config/query-params';
import { CONFIG_MAP } from '@shell/config/types';

const _NEW = '_NEW';
const _NONE = '_NONE';

export default {
  components: { YamlEditor, LabeledSelect },

  props: {
    mode: {
      type:    String,
      default: 'create'
    },
    value: {
      type:    String,
      default: ''
    },
    type: {
      type:    String,
      default: ''
    },
    options: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    configId: {
      type:    String,
      default: ''
    },
    viewCode: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      id:         '',
      yamlScript: this.value,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    editorMode() {
      return this.isView || this.viewCode ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE;
    },

    isView() {
      return this.mode === _VIEW;
    },
  },

  watch: {
    value(neu) {
      this.yamlScript = neu;
    },

    configId(neu) {
      this.id = this.configId;
    },

    id(neu, old) {
      const cloudInit = this.$store.getters['harvester/byId'](CONFIG_MAP, neu)?.data?.cloudInit || '';

      this.$emit('updateTemplateId', this.type, neu);

      if (neu === _NEW) {
        this.$emit('show', this.type);
        this.id = old;

        return;
      } else if (neu === _NONE ) {
        this.yamlScript = '';
      } else {
        this.yamlScript = cloudInit;
      }

      this.$refs['yaml'].updateValue(cloudInit);
    },

    yamlScript(neu) {
      this.$emit('update', neu, this.type);
    }
  },

  methods: {
    refresh() {
      this.$refs.yaml.refresh();
    },

    updateValue() {
      this.$refs['yaml'].updateValue(this.value);
    }
  }
};
</script>

<template>
  <div class="mb-20">
    <h3>{{ t(`harvester.virtualMachine.cloudConfig.${type}.title`) }}</h3>
    <p class="text-muted mb-20">
      <t :k="`harvester.virtualMachine.cloudConfig.${type}.tip`" :raw="true" />
    </p>

    <LabeledSelect
      v-if="!isView"
      v-model="id"
      class="mb-20"
      :options="options"
      :disabled="viewCode"
      :label-key="`harvester.virtualMachine.cloudConfig.${type}.label`"
    />

    <div class="resource-yaml">
      <YamlEditor
        ref="yaml"
        v-model="yamlScript"
        class="yaml-editor"
        :editor-mode="editorMode"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$yaml-height: 200px;

::v-deep .resource-yaml {
  flex: 1;
  display: flex;
  flex-direction: column;

  & .yaml-editor{
    flex: 1;
    min-height: $yaml-height;

    & .code-mirror .CodeMirror {
      min-height: $yaml-height;
    }
  }
}
</style>
