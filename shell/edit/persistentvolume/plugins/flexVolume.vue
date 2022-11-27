<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import KeyValue from '@shell/components/form/KeyValue';

export default {
  components: {
    KeyValue, LabeledInput, RadioGroup
  },
  props: {
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

    this.$set(this.value.spec, 'flexVolume', this.value.spec.flexVolume || {});
    this.$set(this.value.spec.flexVolume, 'readOnly', this.value.spec.flexVolume.readOnly || false);
    this.$set(this.value.spec.flexVolume, 'secretRef', this.value.spec.flexVolume.secretRef || {});

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.flexVolume.driver"
          :mode="mode"
          :label="t('persistentVolume.flexVolume.driver.label')"
          :placeholder="t('persistentVolume.flexVolume.driver.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.flexVolume.secretRef.name"
          :mode="mode"
          :label="t('persistentVolume.shared.secretName.label')"
          :placeholder="t('persistentVolume.shared.secretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.flexVolume.secretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.shared.secretNamespace.label')"
          :placeholder="t('persistentVolume.shared.secretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.flexVolume.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.flexVolume.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="readOnlyOptions"
          :row="true"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <KeyValue
          v-model="value.spec.flexVolume.options"
          :add-label="t('persistentVolume.flexVolume.options.add')"
          :mode="mode"
          :read-allowed="false"
        />
      </div>
    </div>
  </div>
</template>
