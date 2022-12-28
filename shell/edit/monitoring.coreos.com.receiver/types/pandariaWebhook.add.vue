<script>
import ButtonDropdown from '@shell/components/ButtonDropdown';
import { RECEIVERS_TYPES } from '@shell/models/monitoring.coreos.com.receiver';
import { _VIEW } from '@shell/config/query-params';

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
          label: this.t('monitoringReceiver.pandariaWebhook.add.dingTalk'),
          value: 'DINGTALK'
        },
        {
          label: this.t('monitoringReceiver.pandariaWebhook.add.aliyunSMS'),
          value: 'ALIYUN_SMS'
        },
      ],
      webhookType: RECEIVERS_TYPES.find(type => type.name === 'pandariaWebhook'),
      isView:      this.mode === _VIEW
    };
  },
  methods: {
    add({ value }) {
      return this.model.push({ type: value });
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
