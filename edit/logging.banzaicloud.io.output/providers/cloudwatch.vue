<script>
import LabeledInput from '@/components/form/LabeledInput';
import SecretSelector from '@/components/form/SecretSelector';

export default {
  components: { LabeledInput, SecretSelector },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      required: true,
    },
    namespace: {
      type:     String,
      required: true
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.region" :mode="mode" :disabled="disabled" :label="t('logging.cloudwatch.region')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.endpoint" :mode="mode" :disabled="disabled" :label="t('logging.cloudwatch.endpoint')" />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.aws_key_id"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.cloudwatch.keyId')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.aws_sec_key"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.cloudwatch.secretKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
