<script>
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
  },

  computed: {
    type() {
      switch (this.value.type) {
      case 'DINGTALK':
        return 'dingTalk';
      case 'MICROSOFT_TEAMS':
        return 'msTeams';
      case 'ALIYUN_SMS':
        return 'aliyunSms';
      default:
        return 'dingTalk';
      }
    },
    showTargetUrl() {
      return this.value.type !== 'ALIYUN_SMS';
    }
  },

  methods: {
    getComponent(name) {
      return require(`./${ name }`).default;
    },
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-12">
        <h3 class="mb-0">
          Target
        </h3>
      </div>
    </div>
    <Banner
      v-if="showNamespaceBanner"
      v-clean-html="t('monitoringReceiver.webhook.modifyNamespace', {}, raw=true)"
      color="info"
    />
    <div
      v-if="showTargetUrl"
      class="row mb-20"
    >
      <div class="col span-12">
        <LabeledInput
          v-model="value.webhook_url"
          :required="true"
          :mode="mode"
          label="URL"
          :tooltip="t('monitoringReceiver.webhook.urlTooltip')"
        />
      </div>
    </div>
    <component
      :is="getComponent(type)"
      :value="value"
      :mode="mode"
    />
  </div>
</template>
