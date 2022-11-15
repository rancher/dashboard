<script>
import { Banner } from '@components/Banner';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: { Banner },
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
    return { isView: this.mode === _VIEW };
  }
};
</script>
<template>
  <Banner
    v-if="model.length === 0 && !isView"
    color="info"
    v-html="t('monitoringReceiver.webhook.banner', {}, raw=true)"
  />
</template>
