<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import ArrayList from '@shell/components/form/ArrayList';

export default {
  components: {
    ArrayList, LabeledInput, RadioGroup
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

    this.$set(this.value.spec, 'rbd', this.value.spec.rbd || {});
    this.$set(this.value.spec.rbd, 'readOnly', this.value.spec.rbd.readOnly || false);
    this.$set(this.value.spec.rbd, 'secretRef', this.value.spec.rbd.secretRef || {});

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.user"
          :mode="mode"
          :label="t('persistentVolume.rbd.user.label')"
          :placeholder="t('persistentVolume.rbd.user.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.keyring"
          :mode="mode"
          :label="t('persistentVolume.rbd.keyRing.label')"
          :placeholder="t('persistentVolume.rbd.keyRing.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.pool"
          :mode="mode"
          :label="t('persistentVolume.rbd.pool.label')"
          :placeholder="t('persistentVolume.rbd.pool.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.image"
          :mode="mode"
          :label="t('persistentVolume.rbd.image.label')"
          :placeholder="t('persistentVolume.rbd.image.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.secretRef.name"
          :mode="mode"
          :label="t('persistentVolume.shared.secretName.label')"
          :placeholder="t('persistentVolume.shared.secretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.secretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.shared.secretNamespace.label')"
          :placeholder="t('persistentVolume.shared.secretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.rbd.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.rbd.readOnly"
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
        <ArrayList
          v-model="value.spec.rbd.monitors"
          :add-label="t('persistentVolume.shared.monitors.add')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
