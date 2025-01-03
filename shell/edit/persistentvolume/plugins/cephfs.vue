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

    this.value.spec['cephfs'] = this.value.spec.cephfs || {};
    this.value.spec.cephfs['readOnly'] = this.value.spec.cephfs.readOnly || false;
    this.value.spec.cephfs['secretRef'] = this.value.spec.cephfs.secretRef || {};

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.cephfs.path"
          :mode="mode"
          :label="t('persistentVolume.cephfs.path.label')"
          :placeholder="t('persistentVolume.cephfs.path.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.cephfs.user"
          :mode="mode"
          :label="t('persistentVolume.cephfs.user.label')"
          :placeholder="t('persistentVolume.cephfs.user.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.cephfs.secretFile"
          :mode="mode"
          :label="t('persistentVolume.cephfs.secretFile.label')"
          :placeholder="t('persistentVolume.cephfs.secretFile.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.cephfs.secretRef.name"
          :mode="mode"
          :label="t('persistentVolume.shared.secretName.label')"
          :placeholder="t('persistentVolume.shared.secretName.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.cephfs.secretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.shared.secretNamespace.label')"
          :placeholder="t('persistentVolume.shared.secretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.cephfs.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="readOnlyOptions"
          :row="true"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          v-model:value="value.spec.cephfs.monitors"
          :add-label="t('persistentVolume.shared.monitors.add')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
