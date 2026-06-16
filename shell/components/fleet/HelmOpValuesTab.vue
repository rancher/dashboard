<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import YamlEditor from '@shell/components/YamlEditor';
import FleetValuesFrom from '@shell/components/fleet/FleetValuesFrom.vue';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  realMode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  chartValues: {
    type:     String,
    required: true
  },
  chartValuesInit: {
    type:     String,
    required: true
  },
  yamlForm: {
    type:     String,
    required: true
  },
  yamlFormOptions: {
    type:     Array,
    required: true
  },
  yamlDiffModeOptions: {
    type:     Array,
    required: true
  },
  isYamlDiff: {
    type:     Boolean,
    required: true
  },
  editorMode: {
    type:     String,
    required: true
  },
  diffMode: {
    type:     String,
    required: true
  },
  isRealModeEdit: {
    type:     Boolean,
    required: true
  }
});

const emit = defineEmits(['update:yaml-form', 'update:chart-values', 'update:diff-mode']);

const store = useStore();
const { t } = useI18n(store);

const updateYamlForm = () => {
  emit('update:yaml-form');
};

const updateChartValues = (value) => {
  emit('update:chart-values', value);
};

const updateDiffMode = (value) => {
  emit('update:diff-mode', value);
};
</script>

<template>
  <div>
    <Banner
      color="info"
      class="description"
      label-key="fleet.helmOp.values.description"
    />

    <h2>{{ t('fleet.helmOp.values.title') }}</h2>

    <div class="mb-15">
      <div
        v-if="isRealModeEdit"
        class="yaml-form-controls"
      >
        <ButtonGroup
          :value="yamlForm"
          inactive-class="bg-disabled btn-sm"
          active-class="bg-primary btn-sm"
          :options="yamlFormOptions"
          @update:value="updateYamlForm"
        />
        <div
          class="yaml-form-controls-spacer"
          style="flex:1"
        >
          &nbsp;
        </div>
        <ButtonGroup
          v-if="isYamlDiff"
          :value="diffMode"
          :options="yamlDiffModeOptions"
          inactive-class="bg-disabled btn-sm"
          active-class="bg-primary btn-sm"
          @update:value="updateDiffMode"
        />
      </div>

      <YamlEditor
        ref="yaml"
        :value="chartValues"
        :mode="mode"
        :initial-yaml-values="chartValuesInit"
        :scrolling="true"
        :editor-mode="editorMode"
        :hide-preview-buttons="true"
        @update:value="updateChartValues"
      />
    </div>

    <div class="mb-20">
      <FleetValuesFrom
        :value="value.spec.helm.valuesFrom"
        :namespace="value.metadata.namespace"
        :mode="realMode"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.yaml-form-controls {
  display: flex;
  margin-bottom: 15px;
}
</style>
