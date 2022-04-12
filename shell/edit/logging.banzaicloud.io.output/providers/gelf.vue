<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Checkbox from '@shell/components/form/Checkbox';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect
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
  },
  data() {
    const protocolOptions = ['tcp', 'udp'];

    this.$set(this.value, 'tls_options', this.value.tls_options || {});
    this.$set(this.value, 'protocol', this.value.protocol || protocolOptions[0]);

    return { protocolOptions };
  },
  computed: {
    port: {
      get() {
        return this.value.port;
      },
      set(port) {
        this.$set(this.value, 'port', Number.parseInt(port));
      }
    },
    no_verify: {
      get() {
        return this.value.tls_options.no_verify === 'true';
      },
      set(noVerify) {
        this.$set(this.value.tls_options, 'no_verify', noVerify ? 'true' : null);
      }
    },
    all_ciphers: {
      get() {
        return this.value.tls_options.all_ciphers === 'true';
      },
      set(allCiphers) {
        this.$set(this.value.tls_options, 'all_ciphers', allCiphers ? 'true' : null);
      }
    },
  }
};
</script>

<template>
  <div class="gelf">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.host" :mode="mode" :disabled="disabled" class="host" :label="t('logging.gelf.host')" />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="port"
          :mode="mode"
          :disabled="disabled"
          class="port"
          type="number"
          :label="t('logging.gelf.port')"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="value.protocol"
          :options="protocolOptions"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.gelf.protocol')"
        />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox v-model="value.tls" :mode="mode" :disabled="disabled" :label="t('logging.gelf.tls')" />
      </div>
      <div class="col span-6">
        <Checkbox v-model="no_verify" :mode="mode" :disabled="disabled" :label="t('logging.gelf.tlsOptions.noVerify')" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.tls_options.cert" type="multiline" :mode="mode" :disabled="disabled" :label="t('logging.gelf.tlsOptions.clientCert')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.tls_options.key" type="multiline" :mode="mode" :disabled="disabled" :label="t('logging.gelf.tlsOptions.clientKey')" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.tls_options.tls_version" :mode="mode" :disabled="disabled" :label="t('logging.gelf.tlsOptions.tlsVersion')" />
      </div>
      <div class="col span-6">
        <Checkbox v-model="all_ciphers" :mode="mode" :disabled="disabled" :label="t('logging.gelf.tlsOptions.allCiphers')" />
      </div>
    </div>
  </div>
</template>
