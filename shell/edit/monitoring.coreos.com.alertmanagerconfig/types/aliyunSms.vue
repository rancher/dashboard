<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import InputListPandaria from '@shell/components/form/InputListPandaria';

export default {
  components: {
    Checkbox, LabeledInput, InputListPandaria
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
    const phone = this.value.http_config.phone ? this.value.http_config.phone : [];

    return { phone };
  },

  watch: {
    phone(newVal) {
      if (this.value) {
        this.value.http_config.phone = newVal;
      }
    }
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div
        data-testid="input-config-access_key_id"
        class="col span-6"
      >
        <LabeledInput
          v-model="value.http_config.access_key_id"
          type="password"
          :mode="mode"
          :required="true"
          :label="t('monitoringReceiver.pandariaWebhook.aliyunSMS.accessKeyIdLabel')"
          :placeholder="t('monitoringReceiver.pandariaWebhook.aliyunSMS.accessKeyIdPlaceholder')"
        />
      </div>
      <div
        data-testid="input-config-access_key_secret"
        class="col span-6"
      >
        <LabeledInput
          v-model="value.http_config.access_key_secret"
          type="password"
          :required="true"
          :mode="mode"
          :label="t('monitoringReceiver.pandariaWebhook.aliyunSMS.accessKeySecretLabel')"
          :placeholder="t('monitoringReceiver.pandariaWebhook.aliyunSMS.accessKeySecretPlaceholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div
        data-testid="input-config-template_code"
        class="col span-6"
      >
        <LabeledInput
          v-model="value.http_config.template_code"
          :required="true"
          :mode="mode"
          :label="t('monitoringReceiver.pandariaWebhook.aliyunSMS.templateCodeLabel')"
          :placeholder="t('monitoringReceiver.pandariaWebhook.aliyunSMS.templateCodePlaceholder')"
        />
      </div>
      <div
        data-testid="input-config-sign_name"
        class="col span-6"
      >
        <LabeledInput
          v-model="value.http_config.sign_name"
          :required="true"
          :mode="mode"
          :label="t('monitoringReceiver.pandariaWebhook.aliyunSMS.signatureNameLabel')"
          :placeholder="t('monitoringReceiver.pandariaWebhook.aliyunSMS.signatureNamePlaceholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div
        data-testid="input-config-phone"
        class="col span-12"
      >
        <InputListPandaria
          :input-list="phone"
          :mode="mode"
          :input-label="t('monitoringReceiver.pandariaWebhook.aliyunSMS.phoneNumberLabel')"
          :placeholder="t('monitoringReceiver.pandariaWebhook.aliyunSMS.phoneNumberPlaceholder')"
        />
      </div>
    </div>
    <div
      data-testid="input-config-sendResolved"
      class="row mb-20"
    >
      <Checkbox
        v-model="value.sendResolved"
        :mode="mode"
        :label="t('monitoringReceiver.shared.sendResolved.label')"
      />
    </div>
  </div>
</template>
