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
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { _VIEW } from '@shell/config/query-params';
import { ALIBABA_CLOUD_SMS_URL, MS_TEAMS_URL } from '@shell/edit/monitoring.coreos.com.receiver/types/webhook.add.vue';
import TLS from '../tls';
import Auth from '../auth';

export default {
  components: {
    Auth, Banner, Checkbox, LabeledInput, TLS
  },
  props: {
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
    this.$set(this.value, 'http_config', this.value.http_config || {});
    this.$set(this.value, 'send_resolved', this.value.send_resolved || false);
    const isDriverUrl = this.value.url === MS_TEAMS_URL || this.value.url === ALIBABA_CLOUD_SMS_URL;

    return { showNamespaceBanner: isDriverUrl && this.mode !== _VIEW };
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3 class="mb-0">
          Target
        </h3>
      </div>
    </div>
    <Banner
      v-if="showNamespaceBanner"
      color="info"
      v-html="t('monitoringReceiver.webhook.modifyNamespace', {}, raw=true)"
    />
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model="value.url"
          :mode="mode"
          label="URL"
          :tooltip="t('monitoringReceiver.webhook.urlTooltip')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model="value.http_config.proxy_url"
          :mode="mode"
          :label="t('monitoringReceiver.shared.proxyUrl.label')"
          :placeholder="t('monitoringReceiver.shared.proxyUrl.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <Checkbox
        v-model="value.send_resolved"
        :mode="mode"
        :label="t('monitoringReceiver.shared.sendResolved.label')"
      />
    </div>
    <TLS
      v-model="value.http_config"
      class="mb-20"
      :mode="mode"
    />
    <Auth
      v-model="value.http_config"
      :mode="mode"
    />
  </div>
</template>
