<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';

export default {
  components: {
    Checkbox, LabeledInput, SecretSelector
  },
  props: {
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
  },
  computed: {
    overwrite: {
      get() {
        return this.value.overwrite === 'true';
      },
      set(value) {
        this.value['overwrite'] = value.toString();
      }
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
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.s3_endpoint"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.endpoint')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.s3_bucket"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.bucket')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.path"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.path')"
        />
      </div>
      <div class="col span-6 overwrite">
        <Checkbox
          v-model:value="overwrite"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.overwriteExistingPath')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.aws_key_id"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.s3.keyId')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.aws_sec_key"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.s3.secretKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overwrite {
    display: flex;
    align-items: center;
}
</style>
