<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    provider() {
      return this.currentCluster.status.provider;
    }
  },

  mounted() {
    this.value.additionalLoggingSources = this.value.additionalLoggingSources || {};
    this.value.additionalLoggingSources[this.provider] = this.value.additionalLoggingSources[this.provider] || {};
    this.value.additionalLoggingSources[this.provider].enabled = true;
  },
};
</script>

<template>
  <div class="logging">
    <div v-if="provider === 'k3s'" class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.additionalLoggingSources.k3s.container_engine" :label="t('logging.install.k3sContainerEngine')" />
      </div>
    </div>
  </div>
</template>
