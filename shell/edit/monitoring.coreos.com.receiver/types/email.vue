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
import TLS from '../tls';

export default {
  emits:      ['input'],
  components: {
    Checkbox, LabeledInput, TLS
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
    this.value['send_resolved'] = this.value.send_resolved || false;
    this.value['require_tls'] = this.value.require_tls || false;

    return {};
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>Target</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.to"
          :mode="mode"
          label="Default Recipient Address"
          placeholder="e.g. admin@example.com"
        />
      </div>
      <div class="col span-6">
        <Checkbox
          v-model:value="value.send_resolved"
          :mode="mode"
          class="mt-20"
          label="Enable send resolved alerts"
        />
      </div>
    </div>
    <h2 class="mb-10">
      SMTP
    </h2>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.from"
          :mode="mode"
          label="Sender"
          placeholder="e.g. admin@example.com"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.host"
          :mode="mode"
          label="Host"
          data-testid="input-email-host"
          placeholder="e.g. 192.168.1.121"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.port"
          :mode="mode"
          label="Port"
          data-testid="input-email-port"
          placeholder="e.g. 80"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          v-model:value="value.require_tls"
          :mode="mode"
          class="mt-20"
          label="Use TLS"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.auth_username"
          :mode="mode"
          label="Username"
          placeholder="e.g. John"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.auth_password"
          :mode="mode"
          label="Password"
          type="password"
          autocomplete="password"
        />
      </div>
    </div>
    <TLS
      :value="value"
      class="mb-20"
      :mode="mode"
      @update:value="$emit('input', $event)"
    />
  </div>
</template>
