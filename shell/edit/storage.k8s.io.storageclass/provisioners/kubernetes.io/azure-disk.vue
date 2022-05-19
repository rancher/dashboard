<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },
  data() {
    const kindOptions = [
      {
        label: this.t('storageClass.azure-disk.kind.shared'),
        value: 'shared'
      },
      {
        label: this.t('storageClass.azure-disk.kind.dedicated'),
        value: 'dedicated'
      },
      {
        label: this.t('storageClass.azure-disk.kind.managed'),
        value: 'managed'
      },
    ];

    // The 'shared' kind was removed by azure so we don't want to create any new ones. However we still should
    // show the option for existing storage classes.
    if (this.value.parameters.kind !== 'shared') {
      kindOptions.shift();
    }

    if (this.mode === _CREATE) {
      this.$set(this.value.parameters, 'kind', this.value.parameters.kind || kindOptions[0].value);
    }

    return { kindOptions };
  },
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.storageaccounttype" :placeholder="t('storageClass.azure-disk.storageAccountType.placeholder')" :label="t('storageClass.azure-disk.storageAccountType.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledSelect v-model="value.parameters.kind" :options="kindOptions" :label="t('storageClass.azure-disk.kind.label')" :mode="mode" />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .col > .labeled-select:not(.taggable) {
    height: 100%;
    max-height: 100%;
  }
</style>
