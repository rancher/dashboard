<script>
import ButtonDropdown from '@shell/components/ButtonDropdown';
import { RECEIVERS_TYPES } from '@shell/models/monitoring.coreos.com.receiver';
import { _VIEW } from '@shell/config/query-params';

export const MS_TEAMS_URL = 'http://rancher-alerting-drivers-prom2teams.cattle-monitoring-system.svc:8089/v2/connector';
export const ALIBABA_CLOUD_SMS_URL = 'http://rancher-alerting-drivers-sachet.cattle-monitoring-system.svc:9876/alert';

export default {
  components: { ButtonDropdown },
  props:      {
    model: {
      type:     Array,
      required: true
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    return {
      options: [
        {
          label: this.t('monitoringReceiver.webhook.add.generic'),
          value: 'generic'
        },
        {
          label: this.t('monitoringReceiver.webhook.add.msTeams'),
          value: 'ms-teams'
        },
        {
          label: this.t('monitoringReceiver.webhook.add.alibabaCloudSms'),
          value: 'alibaba-cloud-sms'
        }
      ],
      webhookType: RECEIVERS_TYPES.find(type => type.name === 'webhook'),
      isView:      this.mode === _VIEW
    };
  },
  methods: {
    add({ value }) {
      switch (value) {
      case 'generic':
        return this.model.push({});
      case 'ms-teams':
        return this.model.push({ url: MS_TEAMS_URL });
      case 'alibaba-cloud-sms':
        return this.model.push({ url: ALIBABA_CLOUD_SMS_URL });
      }
    }
  }
};
</script>
<template>
  <ButtonDropdown
    v-if="!isView"
    :button-label="t('monitoringReceiver.addButton', { type: t(webhookType.label) })"
    :dropdown-options="options"
    size="sm"
    @click-action="add"
  />
</template>
