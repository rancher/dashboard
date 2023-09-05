<template>
  <tab
    name="customContainerdConfig"
    label-key="cluster.tabs.customContainerdConfig"
    :weight="-1"
    @active="refreshTomls"
  >
    <!-- <h3>{{ t('cluster.customContainerdConfig.title') }}</h3> -->
    <ArrayListGrouped
      v-model="value.spec.rkeConfig.containerSelectorConfig"
      class="mb-20"
      :add-label="t('cluster.customContainerdConfig.machineSelector.label')"
      :can-remove="canRemoveRow"
      :default-add-value="{machineLabelSelector: { matchExpressions: [], matchLabels: {} }}"
    >
      <template #default="{row}">
        <h3>{{ t('cluster.customContainerdConfig.machineSelector.title') }}</h3>
        <MatchExpressions
          v-model="row.value.machineLabelSelector"
          class="mb-20"
          :mode="mode"
          :show-remove="false"
          :initial-empty-row="true"
        />
        <div class="spacer" />
        <h3>{{ t('cluster.customContainerdConfig.template.title') }}</h3>
        <TomlEditor
          ref="toml-values"
          v-model="row.value.containerdConfigTemplate"
          :lint="false"
          :scrolling="true"
          :as-object="true"
          :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
          :hide-preview-buttons="true"
        />
      </template>
    </ArrayListGrouped>
  </tab>
</template>
<script>
import Tab from '@shell/components/Tabbed/Tab';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import TomlEditor from '@shell/components/TomlEditor';
import isArray from 'lodash/isArray';

export default {
  components: {
    Tab,
    ArrayListGrouped,
    MatchExpressions,
    TomlEditor
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },

  methods: {
    refreshTomls() {
      const keys = Object.keys(this.$refs).filter(x => x.startsWith('toml'));

      for ( const k of keys ) {
        const entry = this.$refs[k];
        const list = isArray(entry) ? entry : [entry];

        for ( const component of list ) {
          component?.refresh();
        }
      }
    },
    canRemoveRow(row, idx) {
      return idx !== 0;
    },
  },
  // created() {
  //   if (!this.value.spec.rkeConfig?.containerdSelectorConfig) {
  //     this.value.spec.rkeConfig.containerdSelectorConfig = [];
  //   }
  // }
};
</script>
<style scoped>

</style>
