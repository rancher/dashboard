<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';
import { updatePort } from './utils';

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
    port: {
      get() {
        return this.value.endpoint.port;
      },
      set(port) {
        updatePort((value) => (this.value.endpoint['port'] = value), port);
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
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.endpoint.url"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logz.url')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="port"
          :mode="mode"
          :disabled="disabled"
          type="number"
          min="1"
          max="65535"
          :label="t('logging.logz.port')"
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
          v-model:value="value.endpoint.token"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.logz.token')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <Checkbox
          v-model:value="value.gzip"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logz.enableCompression')"
        />
      </div>
    </div>
  </div>
</template>
