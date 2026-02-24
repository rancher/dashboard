<script setup>
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import FleetGitRepoPaths from '@shell/components/fleet/FleetGitRepoPaths.vue';

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
  refType: {
    type:     String,
    required: true
  },
  refValue: {
    type:     String,
    required: true
  },
  touched: {
    type:    [Object, Boolean],
    default: null
  },
  fvGetAndReportPathRules: {
    type:     Function,
    required: true
  }
});

const emit = defineEmits(['update:ref', 'update:paths', 'touched']);

const store = useStore();
const { t } = useI18n(store);

const changeRef = (event) => {
  emit('update:ref', event);
};

const updatePaths = (value) => {
  emit('update:paths', value);
};

const onTouched = (value) => {
  emit('touched', value);
};
</script>

<template>
  <div>
    <h2>{{ t('fleet.gitRepo.repo.title') }}</h2>
    <div
      class="row mb-20"
      :class="{'mt-20': isView}"
    >
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.repo"
          :mode="mode"
          label-key="fleet.gitRepo.repo.label"
          :placeholder="t('fleet.gitRepo.repo.placeholder', null, true)"
          :required="true"
          :rules="fvGetAndReportPathRules('spec.repo')"
        />
      </div>
      <div class="col span-6">
        <InputWithSelect
          :data-testid="`gitrepo-${refType}`"
          :mode="mode"
          :select-label="t('fleet.gitRepo.ref.label')"
          :select-value="refType"
          :text-label="t(`fleet.gitRepo.ref.${refType}Label`)"
          :text-placeholder="t(`fleet.gitRepo.ref.${refType}Placeholder`)"
          :text-value="refValue"
          :text-required="true"
          :options="[{label: t('fleet.gitRepo.ref.branch'), value: 'branch'}, {label: t('fleet.gitRepo.ref.revision'), value: 'revision'}]"
          @update:value="changeRef($event)"
        />
      </div>
    </div>

    <FleetGitRepoPaths
      :value="{
        paths: value.spec.paths,
        bundles: value.spec.bundles
      }"
      :mode="mode"
      :touched="touched"
      @update:value="updatePaths"
      @touched="onTouched"
    />
  </div>
</template>
