<script>
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import SecretSelector from '@/components/form/SecretSelector';

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
  },
  computed: {
    port: {
      get() {
        return this.value.endpoint.port;
      },
      set(port) {
        this.$set(this.value.endpoint, 'port', Number.parseInt(port));
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
        <LabeledInput v-model="value.endpoint.url" :mode="mode" :disabled="disabled" :label="t('logging.logz.url')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="port" :mode="mode" :disabled="disabled" type="number" :label="t('logging.logz.port')" />
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
          v-model="value.endpoint.token"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logz.token')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <Checkbox
          v-model="value.gzip"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logz.enableCompression')"
        />
      </div>
    </div>
  </div>
</template>
