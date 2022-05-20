<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';
import UnitInput from '@shell/components/form/UnitInput';
import { _CREATE } from '@shell/config/query-params';

export default {
  components: {
    LabeledInput, RadioGroup, UnitInput
  },
  props: {
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
    const volumeTypeOptions = [
      {
        label: this.t('storageClass.aws-ebs.volumeType.gp2'),
        value: 'gp2'
      },
      {
        label: this.t('storageClass.aws-ebs.volumeType.io1'),
        value: 'io1'
      },
      {
        label: this.t('storageClass.aws-ebs.volumeType.st1'),
        value: 'st1'
      },
      {
        label: this.t('storageClass.aws-ebs.volumeType.sc1'),
        value: 'sc1'
      },
    ];

    const availabilityZoneOptions = [
      {
        label: this.t('storageClass.aws-ebs.availabilityZone.automatic'),
        value: 'automatic'
      },
      {
        label: this.t('storageClass.aws-ebs.availabilityZone.manual'),
        value: 'manual'
      }
    ];
    const encryptionOptions = [
      {
        label: this.t('storageClass.aws-ebs.encryption.enabled'),
        value: 'true'
      },
      {
        label: this.t('storageClass.aws-ebs.encryption.disabled'),
        value: 'false'
      }
    ];

    const keyIdOptions = [
      {
        label: this.t('storageClass.aws-ebs.keyId.automatic'),
        value: 'automatic'
      },
      {
        label: this.t('storageClass.aws-ebs.keyId.manual'),
        value: 'manual'
      }
    ];

    if (this.mode === _CREATE) {
      this.$set(this.value.parameters, 'type', this.value.parameters.type || volumeTypeOptions[0].value);
      this.$set(this.value.parameters, 'encrypted', this.value.parameters.encrypted || encryptionOptions[0].value);
      this.$set(this.value.parameters, 'iopsPerGB', this.value.parameters.iopsPerGB || '0');
    }

    return {
      volumeTypeOptions,
      availabilityZoneOptions,
      encryptionOptions,
      keyIdOptions,

      availabilityZone: this.value.parameters.zones ? availabilityZoneOptions[1].value : availabilityZoneOptions[0].value,
      keyId:            this.value.parameters.kmsKeyId ? keyIdOptions[1].value : keyIdOptions[0].value
    };
  },
  computed: {
    iopsPerGB: {
      get() {
        return Number.parseInt(this.value.parameters.iopsPerGB);
      },
      set(value) {
        this.$set(this.value.parameters, 'iopsPerGB', value.toString());
      }
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters.type"
          name="volumeType"
          :label="t('storageClass.aws-ebs.volumeType.label')"
          :mode="mode"
          :options="volumeTypeOptions"
        />
        <UnitInput
          v-if="value.parameters.type === 'io1'"
          v-model="iopsPerGB"
          class="mt-10"
          :label="t('storageClass.aws-ebs.volumeType.provisionedIops.label')"
          :suffix="t('storageClass.aws-ebs.volumeType.provisionedIops.suffix')"
          :mode="mode"
        />
        <LabeledInput v-model="value.parameters.fsType" class="mt-10" :placeholder="t('storageClass.aws-ebs.filesystemType.placeholder')" :label="t('storageClass.aws-ebs.filesystemType.label')" :mode="mode" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="availabilityZone"
          name="availabilityZone"
          :label="t('storageClass.aws-ebs.availabilityZone.label')"
          :mode="mode"
          :options="availabilityZoneOptions"
        />
        <LabeledInput v-if="availabilityZone === 'manual'" v-model="value.parameters.zones" class="mt-10" :placeholder="t('storageClass.aws-ebs.availabilityZone.placeholder')" :mode="mode" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters.encrypted"
          name="encryption"
          :label="t('storageClass.aws-ebs.encryption.label')"
          :mode="mode"
          :options="encryptionOptions"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-if="value.parameters.encrypted === 'true'"
          v-model="keyId"
          class="mt-10"
          name="keyId"
          :label="t('storageClass.aws-ebs.keyId.label')"
          :mode="mode"
          :options="keyIdOptions"
        />
        <LabeledInput v-if="keyId === 'manual'" v-model="value.parameters.kmsKeyId" class="mt-10" :mode="mode" />
      </div>
    </div>
  </div>
</template>
