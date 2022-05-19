<script>
import Checkbox from '@shell/components/form/Checkbox';
import LabeledInput from '@shell/components/form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';

export default {
  components: {
    Checkbox, LabeledInput, SecretSelector
  },
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
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.project" :mode="mode" :disabled="disabled" :label="t('logging.gcs.project')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.bucket" :mode="mode" :disabled="disabled" :label="t('logging.gcs.bucket')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.path" :mode="mode" :disabled="disabled" :label="t('logging.gcs.path')" />
      </div>
      <div class="col span-6 overwrite">
        <Checkbox v-model="value.overwrite" :mode="mode" :disabled="disabled" :label="t('logging.gcs.overwriteExistingPath')" />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.credentials_json"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.gcs.credentialsJson')"
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
