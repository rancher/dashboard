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

    const kindOptions = [
      {
        label: this.t('persistentVolume.azureDisk.kind.dedicated'),
        value: 'Dedicated'
      },
      {
        label: this.t('persistentVolume.azureDisk.kind.managed'),
        value: 'Managed'
      },
      {
        label: this.t('persistentVolume.azureDisk.kind.shared'),
        value: 'Shared'
      }
    ];

    const cachingModeOptions = [
      {
        label: this.t('persistentVolume.azureDisk.cachingMode.none'),
        value: 'None'
      },
      {
        label: this.t('persistentVolume.azureDisk.cachingMode.readOnly'),
        value: 'ReadOnly'
      },
      {
        label: this.t('persistentVolume.azureDisk.cachingMode.readWrite'),
        value: 'ReadWrite'
      }
    ];

    this.value.spec['azureDisk'] = this.value.spec.azureDisk || {};
    this.value.spec.azureDisk['readOnly'] = this.value.spec.azureDisk.readOnly || false;
    this.value.spec.azureDisk['cachingMode'] = this.value.spec.azureDisk.cachingMode || cachingModeOptions[0].value;
    this.value.spec.azureDisk['kind'] = this.value.spec.azureDisk.kind || kindOptions[2].value;

    return {
      kindOptions, readOnlyOptions, cachingModeOptions
    };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.azureDisk.diskName"
          :required="true"
          :mode="mode"
          :label="t('persistentVolume.azureDisk.diskName.label')"
          :placeholder="t('persistentVolume.azureDisk.diskName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.azureDisk.diskURI"
          :required="true"
          :mode="mode"
          :label="t('persistentVolume.azureDisk.diskURI.label')"
          :placeholder="t('persistentVolume.azureDisk.diskURI.placeholder')"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.azureDisk.kind"
          name="kind"
          :mode="mode"
          :label="t('persistentVolume.azureDisk.kind.label')"
          :options="kindOptions"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.azureDisk.cachingMode"
          name="cachingMode"
          :mode="mode"
          :label="t('persistentVolume.azureDisk.cachingMode.label')"
          :options="cachingModeOptions"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.azureDisk.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.azureDisk.readOnly"
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
