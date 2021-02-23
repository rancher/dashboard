<script>
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    this.$set(this.value, 'tls_config', this.value.tls_config || {});

    return {};
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>SSL</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.tls_config.ca_file" :mode="mode" label="CA File Path" placeholder="e.g. ./ca-file.csr" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.tls_config.cert_file" :mode="mode" label="Cert File Path" placeholder="e.g. ./cert-file.crt" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.tls_config.key_file" :mode="mode" label="Key File Path" placeholder="e.g. ./key-file.pfx" />
      </div>
    </div>
  </div>
</template>
