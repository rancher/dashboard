<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: { LabeledInput, LabeledSelect },
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
    const mustBeOptions = [
      {
        label: this.t('persistentVolume.hostPath.mustBe.anything'),
        value: ''
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.directory'),
        value: 'DirectoryOrCreate'
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.file'),
        value: 'FileOrCreate'
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.existingDirectory'),
        value: 'Directory'
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.existingFile'),
        value: 'File'
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.existingSocket'),
        value: 'Socket'
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.existingCharacter'),
        value: 'CharDevice'
      },
      {
        label: this.t('persistentVolume.hostPath.mustBe.existingBlock'),
        value: 'BlockDevice'
      },
    ];

    this.$set(this.value.spec, 'hostPath', this.value.spec.hostPath || {});
    this.$set(this.value.spec.hostPath, 'type', this.value.spec.hostPath.type || mustBeOptions[0].value);

    return { mustBeOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.hostPath.path"
          :mode="mode"
          :label="t('persistentVolume.hostPath.pathOnTheNode.label')"
          :placeholder="t('persistentVolume.hostPath.pathOnTheNode.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.spec.hostPath.type"
          :mode="mode"
          :label="t('persistentVolume.hostPath.mustBe.label')"
          :options="mustBeOptions"
        />
      </div>
    </div>
  </div>
</template>
