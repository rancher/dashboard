<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import UnitInput from '@shell/components/form/UnitInput';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    UnitInput
  },
  props: {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },
  data() {
    return {
      mediumOpts: [{
        label: 'workload.storage.emptyDir.medium.default', // i18n-uses workload.storage.emptyDir.medium.default
        value: ''
      }, {
        label: 'workload.storage.emptyDir.medium.memory', // i18n-uses workload.storage.emptyDir.medium.memory
        value: 'Memory'
      }]
    };
  },
  computed: {
    medium: {
      get() {
        return this.value.emptyDir.medium ?? '';
      },
      set(v) {
        this.value.emptyDir['medium'] = v;
      }
    },
  },
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.name"
          :required="true"
          :mode="mode"
          :label="t('workload.storage.volumeName')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model:value="medium"
          :mode="mode"
          :label="t('workload.storage.emptyDir.medium.label')"
          :options="mediumOpts"
          localized-label
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <UnitInput
          v-model:value="value.emptyDir.sizeLimit"
          :mode="mode"
          :label="t('workload.storage.emptyDir.sizeLimit.label')"
          :increment="1024"
          :input-exponent="2"
          :output-modifier="true"
          :placeholder="t('workload.storage.emptyDir.sizeLimit.placeholder')"
        />
      </div>
    </div>
  </div>
</template>
