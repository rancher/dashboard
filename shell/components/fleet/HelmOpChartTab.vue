<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { SOURCE_TYPE } from '@shell/config/product/fleet';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  sourceType: {
    type:     String,
    required: true
  },
  sourceTypeOptions: {
    type:     Array,
    required: true
  },
  fvGetAndReportPathRules: {
    type:     Function,
    required: true
  }
});

const emit = defineEmits(['update:source-type']);

const store = useStore();
const { t } = useI18n(store);

const onSourceTypeSelect = (type) => {
  emit('update:source-type', type);
};
</script>

<template>
  <div>
    <h2>{{ t('fleet.helmOp.source.release.title') }}</h2>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.helm.releaseName"
          :mode="mode"
          :label-key="`fleet.helmOp.source.release.label`"
          :placeholder="t(`fleet.helmOp.source.release.placeholder`, null, true)"
        />
      </div>
    </div>

    <h2>{{ t('fleet.helmOp.source.title') }}</h2>

    <div
      v-if="!isView"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledSelect
          :value="sourceType"
          :options="sourceTypeOptions"
          option-key="value"
          :mode="mode"
          :selectable="option => !option.disabled"
          :label="t('fleet.helmOp.source.selectLabel')"
          @update:value="onSourceTypeSelect"
        />
      </div>
    </div>

    <template v-if="sourceType === SOURCE_TYPE.TARBALL">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.chart"
            :mode="mode"
            label-key="fleet.helmOp.source.tarball.label"
            :placeholder="t('fleet.helmOp.source.tarball.placeholder', null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.chart')"
            :required="true"
          />
        </div>
      </div>
    </template>

    <template v-if="sourceType === SOURCE_TYPE.REPO">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.repo"
            :mode="mode"
            :label-key="`fleet.helmOp.source.${ sourceType }.repo.label`"
            :placeholder="t(`fleet.helmOp.source.${ sourceType }.repo.placeholder`, null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.repo')"
            :required="true"
          />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.chart"
            :mode="mode"
            :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
            :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.chart')"
            :required="true"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="value.spec.helm.version"
            :mode="mode"
            label-key="fleet.helmOp.source.version.label"
            :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.version')"
          />
        </div>
      </div>
    </template>

    <template v-if="sourceType === SOURCE_TYPE.OCI">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.repo"
            :mode="mode"
            :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
            :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.repo')"
            :required="true"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="value.spec.helm.version"
            :mode="mode"
            label-key="fleet.helmOp.source.version.label"
            :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.version')"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
</style>
