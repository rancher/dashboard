<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';

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
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.azure_container" :mode="mode" :disabled="disabled" :label="t('logging.azurestorage.container')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.path" :mode="mode" :disabled="disabled" :label="t('logging.azurestorage.path')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.store_as" :mode="mode" :disabled="disabled" :label="t('logging.azurestorage.storeAs')" />
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
          v-model="value.azure_storage_account"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.azurestorage.storageAccount')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.azure_storage_access_key"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.azurestorage.accessKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
