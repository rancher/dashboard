<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import Banner from '@shell/components/Banner';

export default {
  components: { Banner, LabeledInput },
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
      <div class="col span-12">
        <h3>{{ t('monitoring.receiver.tls.label') }}</h3>
        <Banner color="info" v-html="t('monitoring.receiver.tls.secretsBanner', {}, true)" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.tls_config.ca_file" :mode="mode" :label="t('monitoring.receiver.tls.caFilePath.label')" :placeholder="t('monitoring.receiver.tls.caFilePath.placeholder')" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.tls_config.cert_file" :mode="mode" :label="t('monitoring.receiver.tls.certFilePath.label')" :placeholder="t('monitoring.receiver.tls.certFilePath.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.tls_config.key_file" :mode="mode" :label="t('monitoring.receiver.tls.keyFilePath.label')" :placeholder="t('monitoring.receiver.tls.keyFilePath.placeholder')" />
      </div>
    </div>
  </div>
</template>
