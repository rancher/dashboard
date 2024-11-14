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
    this.value.spec['awsElasticBlockStore'] = this.value.spec.awsElasticBlockStore || {};
    this.value.spec.awsElasticBlockStore['readOnly'] = this.value.spec.awsElasticBlockStore.readOnly || false;
    this.value.spec.awsElasticBlockStore['partition'] = this.value.spec.awsElasticBlockStore.partition || 0;

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
  computed: {
    partition: {
      get() {
        return this.value.spec.awsElasticBlockStore.partition;
      },
      set(value) {
        this.value.spec.awsElasticBlockStore['partition'] = Number.parseInt(value, 10);
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.awsElasticBlockStore.volumeID"
          :mode="mode"
          :label="t('persistentVolume.awsElasticBlockStore.volumeId.label')"
          :placeholder="t('persistentVolume.awsElasticBlockStore.volumeId.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="partition"
          :mode="mode"
          :label="t('persistentVolume.shared.partition.label')"
          :placeholder="t('persistentVolume.shared.partition.placeholder')"
          type="number"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.awsElasticBlockStore.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.awsElasticBlockStore.readOnly"
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
