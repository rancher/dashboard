<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 * Any updates to receiver configuration forms, such as Slack/email/PagerDuty
 * etc, should be made to the receiver forms that are based on the
 * AlertmanagerConfig resource, which has a different API. The new forms are
 * located in @shell/edit/monitoring.coreos.com.alertmanagerconfig/types.
 */
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';

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
    this.value.tls_config = this.value.tls_config || {};

    return {};
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>{{ t('monitoring.receiver.tls.label') }}</h3>
        <Banner color="info">
          <span v-clean-html="t('monitoring.receiver.tls.secretsBanner', {}, true)" />
        </Banner>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.tls_config.ca_file"
          :mode="mode"
          :label="t('monitoring.receiver.tls.caFilePath.label')"
          :placeholder="t('monitoring.receiver.tls.caFilePath.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.tls_config.cert_file"
          :mode="mode"
          :label="t('monitoring.receiver.tls.certFilePath.label')"
          :placeholder="t('monitoring.receiver.tls.certFilePath.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.tls_config.key_file"
          :mode="mode"
          :label="t('monitoring.receiver.tls.keyFilePath.label')"
          :placeholder="t('monitoring.receiver.tls.keyFilePath.placeholder')"
        />
      </div>
    </div>
  </div>
</template>
