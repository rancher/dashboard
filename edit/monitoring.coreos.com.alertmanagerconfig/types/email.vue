<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import TLS from '../tls';

export default {
  components: {
    Checkbox, LabeledInput, TLS
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
  data() {
    this.$set(this.value, 'sendResolved', this.value.sendResolved || false);
    this.$set(this.value, 'requireTls', this.value.requireTls || false);

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
        <LabeledInput v-model="value.to" :mode="mode" label="Default Recipient Address" placeholder="e.g. admin@example.com" />
      </div>
      <div class="col span-6">
        <Checkbox v-model="value.sendResolved" :mode="mode" class="mt-20" label="Enable send resolved alerts" />
      </div>
    </div>
    <h2 class="mb-10">
      SMTP
    </h2>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-model="value.from" :mode="mode" label="Sender" placeholder="e.g. admin@example.com" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.smarthost" :mode="mode" label="Host" placeholder="e.g. 192.168.1.121:587" />
      </div>
      <div class="col span-6">
        <Checkbox v-model="value.requireTls" :mode="mode" class="mt-20" label="Use TLS" />
      </div>
    </div>
    <div v-if="namespace" class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.authUsername" :mode="mode" label="Username" placeholder="e.g. John" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.authPassword" :mode="mode" label="Password" type="password" autocomplete="password" />
      </div>
    </div>
    <Banner v-else color="error">
      {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
    </Banner>
    <TLS v-model="value" class="mb-20" :mode="mode" />
  </div>
</template>
