<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import YamlEditor from '@shell/components/YamlEditor';
import FleetValuesFrom from '@shell/components/fleet/FleetValuesFrom.vue';

const yaml = ref<{ refresh?:() => void } | null>(null);

const refreshYaml = () => {
  nextTick(() => {
    yaml.value?.refresh?.();
  });
};

defineExpose({ refreshYaml });

interface ButtonGroupOption {
  labelKey: string;
  value: string;
  disabled?: boolean;
}

withDefaults(defineProps<{
  value: Record<string, any>;
  mode: string;
  realMode: string;
  isView?: boolean;
  chartValues: string;
  chartValuesInit: string;
  yamlForm: string;
  yamlFormOptions: ButtonGroupOption[];
  yamlDiffModeOptions: ButtonGroupOption[];
  isYamlDiff: boolean;
  editorMode: string;
  diffMode: string;
  isRealModeEdit: boolean;
  hideTitle?: boolean;
  isSuseAppCollection?: boolean;
  bgBorder?: boolean;
  hideBanner?: boolean;
}>(), {
  isView:              false,
  hideTitle:           false,
  isSuseAppCollection: false,
  bgBorder:            false,
  hideBanner:          false,
});

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:yaml-form'): void;
  (e: 'update:chart-values', value: string): void;
  (e: 'update:diff-mode', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const updateYamlForm = () => {
  emit('update:yaml-form');
};

const updateChartValues = (value: string) => {
  emit('update:chart-values', value);
};

const updateDiffMode = (value: string) => {
  emit('update:diff-mode', value);
};
</script>

<template>
  <div data-testid="helmop-values-tab">
    <Banner
      v-if="!hideBanner"
      color="info"
      class="description mt-0"
      :label-key="isSuseAppCollection ? 'fleet.helmOp.values.appCoDescription' : 'fleet.helmOp.values.description'"
      data-testid="helmop-values-info-banner"
    />

    <h2 v-if="!hideTitle">
      {{ t('fleet.helmOp.values.title') }}
    </h2>

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
        :class="{ 'bg-border': bgBorder }"
        :value="chartValues"
        :mode="mode"
        :initial-yaml-values="chartValuesInit"
        :scrolling="true"
        :editor-mode="editorMode"
        :hide-preview-buttons="true"
        data-testid="helmop-values-yaml-editor"
        @update:value="updateChartValues"
      />
    </div>

    <div class="mb-20">
      <FleetValuesFrom
        :value="value.spec.helm.valuesFrom"
        :namespace="value.metadata.namespace"
        :mode="realMode"
        :reduceTitleSize="hideTitle"
        data-testid="helmop-values-from"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.yaml-form-controls {
  display: flex;
  margin-bottom: 15px;
}

.bg-border {
  border: 2px solid var(--body-bg);
}
</style>
