<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';
import { _VIEW } from '@shell/config/query-params';
import { ALIBABA_CLOUD_SMS_URL, MS_TEAMS_URL } from '@shell/edit/monitoring.coreos.com.receiver/types/webhook.add.vue';
import DingTalk from './dingTalk';
import AliyunSms from './aliyunSms';

export const WEBHOOK_TYPES = {
  DING_TALK:  'DINGTALK',
  ALIYUN_SMS: 'ALIYUN_SMS',
};

export const PANDARIA_WEBHOOK_URL = 'http://alerting-drivers.cattle-monitoring-system.svc:9094/';

export default {
  components: {
    Banner, LabeledInput, DingTalk, AliyunSms, LabeledSelect
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

    return {
      showNamespaceBanner: isDriverUrl && this.mode !== _VIEW,
      view:                _VIEW,
      webhookOptons:       [
        {
          label: this.t('monitoringReceiver.pandariaWebhook.add.dingTalk'),
          value: WEBHOOK_TYPES.DING_TALK
        },
        {
          label: this.t('monitoringReceiver.pandariaWebhook.add.aliyunSMS'),
          value: WEBHOOK_TYPES.ALIYUN_SMS
        },
      ],
      selectedWebhookType: this.value.type || 'DINGTALK',
    };
  },

  computed: {
    showTargetUrl() {
      return this.selectedWebhookType !== WEBHOOK_TYPES.ALIYUN_SMS;
    }
  },

  methods: {
    updateWebhookType(event) {
      this.value.type = event;
    },
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="mode !== view"
      color="info"
      v-html="t('monitoringReceiver.pandariaWebhook.banner', {}, raw=true)"
    />
    <div
      data-testid="input-config-webhook_type"
      class="row mb-20"
    >
      <LabeledSelect
        v-model="selectedWebhookType"
        :disabled="mode === view"
        :label="t('monitoringReceiver.webhook.add.selectWebhookType')"
        :placeholder="t('monitoringReceiver.webhook.add.generic')"
        :localized-label="true"
        :options="webhookOptons"
        @input="updateWebhookType($event)"
      />
    </div>
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
    <div
      v-if="showTargetUrl"
      class="row mb-20"
    >
      <div
        data-testid="input-config-webhook_url"
        class="col span-12"
      >
        <LabeledInput
          v-model="value.webhook_url"
          :required="true"
          :mode="mode"
          label="URL"
          :tooltip="t('monitoringReceiver.webhook.urlTooltip')"
        />
      </div>
    </div>
    <AliyunSms
      v-if="selectedWebhookType==='ALIYUN_SMS'"
      :value="value"
      :mode="mode"
    />
    <DingTalk
      v-else
      :value="value"
      :mode="mode"
    />
  </div>
</template>
