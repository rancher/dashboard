<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import TLS from '../tls';
import Auth from '../auth';

export default {
  components: {
    Auth, Checkbox, LabeledInput, TLS
  },
  props:      {
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
      <div class="col span-12">
        <LabeledInput v-model="value.url" :mode="mode" label="URL" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-model="value.http_config.proxy_url" :mode="mode" label="Proxy URL" placeholder="e.g. http://my-proxy/" />
      </div>
    </div>
    <div class="row mb-20">
      <Checkbox v-model="value.send_resolved" :mode="mode" label="Enable send resolved alerts" />
    </div>
    <TLS v-model="value.http_config" class="mb-20" :mode="mode" />
    <Auth v-model="value.http_config" :mode="mode" />
  </div>
</template>
