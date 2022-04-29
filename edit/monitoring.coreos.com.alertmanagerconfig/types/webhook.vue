<script>

import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import Banner from '@/components/Banner';
import SimpleSecretSelector from '@/components/form/SimpleSecretSelector';
import { _VIEW } from '@/config/query-params';
import { ALIBABA_CLOUD_SMS_URL, MS_TEAMS_URL } from '@/edit/monitoring.coreos.com.receiver/types/webhook.add.vue';
import TLS from '../tls';
import Auth from '../auth';

export default {
  components: {
    Auth, Banner, Checkbox, LabeledInput, SimpleSecretSelector, TLS
  },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    namespace: {
      type:     String,
      default:  ''
    }
  },
  data(props) {
    this.$set(this.value, 'httpConfig', this.value.httpConfig || {});
    this.$set(this.value, 'sendResolved', this.value.sendResolved || false);

    const isDriverUrl = this.value.url === MS_TEAMS_URL || this.value.url === ALIBABA_CLOUD_SMS_URL;

    return {
      showNamespaceBanner:  isDriverUrl && this.mode !== _VIEW,
      view:                 _VIEW,
      initialUrlSecretName:  this.value?.urlSecret?.name ? this.value.urlSecret.name : '',
      initialUrlSecretKey:  this.value?.urlSecret?.key ? this.value.urlSecret.key : ''
    };
  },
  methods: {
    updateUrlSecretName(name) {
      const existingKey = this.value.urlSecret?.key || '';

      if (this.value.urlSecret) {
        this.value.urlSecret = {
          key: existingKey,
          name
        };
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
    }
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
    <Banner v-if="showNamespaceBanner" color="info" v-html="t('monitoringReceiver.webhook.modifyNamespace', {}, raw=true)" />
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model="value.url"
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
      <Banner v-else color="error">
        {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
      </Banner>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-model="value.httpConfig.proxyURL" :mode="mode" :label="t('monitoringReceiver.shared.proxyUrl.label')" :placeholder="t('monitoringReceiver.shared.proxyUrl.placeholder')" />
      </div>
    </div>
    <div class="row mb-20">
      <Checkbox v-model="value.sendResolved" :mode="mode" :label="t('monitoringReceiver.shared.sendResolved.label')" />
    </div>
    <TLS v-model="value.httpConfig" class="mb-20" :mode="mode" />
    <Auth v-model="value.httpConfig" :mode="mode" :namespace="namespace" />
  </div>
</template>
