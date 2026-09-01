<script>

import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _VIEW } from '@shell/config/query-params';
import TLS from '../tls';
import Auth from '../auth';

export const MS_TEAMS_URL = 'http://rancher-alerting-drivers-prom2teams.cattle-monitoring-system.svc:8089/v2/connector';
export const ALIBABA_CLOUD_SMS_URL = 'http://rancher-alerting-drivers-sachet.cattle-monitoring-system.svc:9876/alert';
export const WEBHOOK_TYPES = {
  ALIBABA_CLOUD_SMS: 'alibaba-cloud-sms',
  GENERIC:           'generic',
  MS_TEAMS:          'ms-teams'
};

export default {
  components: {
    Auth,
    Banner,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    SimpleSecretSelector,
    TLS,
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    namespace: {
      type:    String,
      default: ''
    }
  },
  data(props) {
    this.value['httpConfig'] = this.value.httpConfig || {};
    this.value['sendResolved'] = this.value.sendResolved || false;

    const isDriverUrl = this.value.url === MS_TEAMS_URL || this.value.url === ALIBABA_CLOUD_SMS_URL;

    return {
      showNamespaceBanner:  isDriverUrl && this.mode !== _VIEW,
      view:                 _VIEW,
      initialUrlSecretName: this.value?.urlSecret?.name ? this.value.urlSecret.name : '',
      initialUrlSecretKey:  this.value?.urlSecret?.key ? this.value.urlSecret.key : '',
      webhookOptons:        [
        {
          label: this.t('monitoringReceiver.webhook.add.generic'),
          value: WEBHOOK_TYPES.GENERIC
        },
        {
          label: this.t('monitoringReceiver.webhook.add.msTeams'),
          value: WEBHOOK_TYPES.MS_TEAMS
        },
        {
          label: this.t('monitoringReceiver.webhook.add.alibabaCloudSms'),
          value: WEBHOOK_TYPES.ALIBABA_CLOUD_SMS
        }
      ],
      msTeamsUrl:          MS_TEAMS_URL,
      alibabaCloudSmsUrl:  ALIBABA_CLOUD_SMS_URL,
      selectedWebhookType: this.getTypeFromUrl(this.value.url),
      none:                '__[[NONE]]__',
    };
  },
  methods: {
    getTypeFromUrl(url) {
      switch (url) {
      case MS_TEAMS_URL:
        return WEBHOOK_TYPES.MS_TEAMS;
      case ALIBABA_CLOUD_SMS_URL:
        return WEBHOOK_TYPES.ALIBABA_CLOUD_SMS;
      default:
        return WEBHOOK_TYPES.GENERIC;
      }
    },
    updateUrlSecretName(name) {
      const existingKey = this.value.urlSecret?.key || '';

      if (this.value.urlSecret) {
        if (name === this.none) {
          delete this.value.urlSecret;
        } else {
          this.value.urlSecret = {
            key: existingKey,
            name
          };
        }
      } else {
        this.value['urlSecret'] = {
          key: '',
          name
        };
      }
    },
    updateUrlSecretKey(key) {
      const existingName = this.value.urlSecret?.name || '';

      if (this.value.urlSecret) {
        this.value.urlSecret = {
          name: existingName,
          key
        };
      } else {
        this.value['urlSecret'] = {
          name: '',
          key
        };
      }
    },
    updateWebhookType(event) {
      switch (event) {
      case ('ms-teams'):
        this.value.url = this.msTeamsUrl;
        this.selectedWebhookType = WEBHOOK_TYPES.MS_TEAMS;
        break;
      case ('alibaba-cloud-sms'):
        this.value.url = this.alibabaCloudSmsUrl;
        this.selectedWebhookType = WEBHOOK_TYPES.ALIBABA_CLOUD_SMS;
        break;
      default:
        this.value.url = '';
        this.selectedWebhookType = WEBHOOK_TYPES.GENERIC;
      }
    },
    updateWebhookUrl(val) {
      this.value.url = val;
    }
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="mode !== view"
      v-clean-html="t('monitoringReceiver.webhook.banner', {}, raw=true)"
      color="info"
    />
    <div class="row mb-20">
      <LabeledSelect
        v-model:value="selectedWebhookType"
        :disabled="mode === view"
        :label="t('monitoringReceiver.webhook.add.selectWebhookType')"
        :placeholder="t('monitoringReceiver.webhook.add.generic')"
        :localized-label="true"
        :options="webhookOptons"
        @update:value="updateWebhookType($event)"
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
      v-clean-html="t('monitoringReceiver.webhook.modifyNamespace', {}, raw=true)"
      color="info"
    />
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.url"
          :mode="mode"
          :label="t('monitoring.alertmanagerConfig.webhook.url')"
          :tooltip="t('monitoring.alertmanagerConfig.webhook.urlSecretTooltip')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialUrlSecretKey"
        :initial-name="initialUrlSecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.webhook.urlSecret')"
        @updateSecretName="updateUrlSecretName"
        @updateSecretKey="updateUrlSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
      </Banner>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.httpConfig.proxyURL"
          :mode="mode"
          :label="t('monitoringReceiver.shared.proxyUrl.label')"
          :placeholder="t('monitoringReceiver.shared.proxyUrl.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <Checkbox
        v-model:value="value.sendResolved"
        :mode="mode"
        :label="t('monitoringReceiver.shared.sendResolved.label')"
      />
    </div>
    <TLS
      v-model:value="value.httpConfig"
      class="mb-20"
      :mode="mode"
      :namespace="namespace"
    />
    <Auth
      v-model:value="value.httpConfig"
      :mode="mode"
      :namespace="namespace"
    />
  </div>
</template>
