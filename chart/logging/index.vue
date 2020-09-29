<script>
import Checkbox from '@/components/form/Checkbox';
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { Checkbox, LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { deployToControlPlane: false };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    provider() {
      return this.currentCluster.status.provider;
    }
  },

  watch: {
    deployToControlPlane(newValue) {
      if (!newValue) {
        if (this.value.fluentbit_tolerations) {
          this.value.fluentbit_tolerations = [];
        }
      } else {
        this.value.fluentbit_tolerations = [
          {
            key:    'node-role.kubernetes.io/controlplane',
            value:  'true',
            effect: 'NoSchedule',
          },
          {
            key:    'node-role.kubernetes.io/etcd',
            value:  'true',
            effect: 'NoExecute'
          }
        ];
      }
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
    <div class="row">
      <div class="col span-6">
        <Checkbox v-model="deployToControlPlane" :label="t('logging.install.deployToControlPlane')" />
      </div>
    </div>
    <div v-if="provider === 'k3s'" class="row mt-10">
      <div class="col span-6">
        <LabeledInput v-model="value.additionalLoggingSources.k3s.container_engine" :label="t('logging.install.k3sContainerEngine')" />
      </div>
    </div>
  </div>
</template>
