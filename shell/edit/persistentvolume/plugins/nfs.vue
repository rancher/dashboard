<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: { LabeledInput, RadioGroup },
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    this.value.spec['nfs'] = this.value.spec.nfs || {};
    this.value.spec.nfs['readOnly'] = this.value.spec.nfs.readOnly || false;

    const readOnlyOptions = [
      {
        label: this.t('generic.yes'),
        value: true
      },
      {
        label: this.t('generic.no'),
        value: false
      }
    ];

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.nfs.path"
          :mode="mode"
          :label="t('persistentVolume.nfs.path.label')"
          :placeholder="t('persistentVolume.nfs.path.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.nfs.server"
          :mode="mode"
          :label="t('persistentVolume.nfs.server.label')"
          :placeholder="t('persistentVolume.nfs.server.placeholder')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.nfs.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="readOnlyOptions"
          :row="true"
        />
      </div>
    </div>
  </div>
</template>
