<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';

import { get, set } from '@shell/utils/object';
import { MANAGEMENT, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';

export default {
  emits: ['validationChanged'],

  components: { LabeledSelect, Banner },
  mixins:     [CreateEditView],

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
  },

  data() {
    this.$emit('validationChanged', true);

    const cluster = get(this.value, 'harvestercredentialConfig.clusterId') || '';

    return {
      clusters: [],
      cluster,
    };
  },

  computed: {
    clusterOptions() {
      return this.clusters.filter((c) => c.status?.provider === VIRTUAL_HARVESTER_PROVIDER).map( (cluster) => {
        return {
          value: cluster.id,
          label: cluster.nameDisplay
        };
      });
    },
  },

  watch: {
    async cluster(neu) {
      if (!neu) {
        return;
      }

      if (this.isCreate) {
        set(this.value, 'harvestercredentialConfig.clusterId', neu);
      }

      const currentCluster = this.$store.getters['management/all'](MANAGEMENT.CLUSTER).find((x) => x.id === neu);

      window.$globalApp.$loading.start();

      const kubeconfigContent = await currentCluster.generateKubeConfig();

      window.$globalApp.$loading.finish();

      this.value.setData('kubeconfigContent', kubeconfigContent);
    },

    'value.decodedData.clusterId': {
      handler() {
        this.emitValidation();
      },
      immediate: true,
    },
    'value.decodedData.kubeconfigContent': {
      handler() {
        this.emitValidation();
      },
      immediate: true,
    },
  },

  methods: {
    test() {
      const t = this.$store.getters['i18n/t'];

      if (!this.cluster) {
        const cluster = t('cluster.credential.harvester.cluster');
        const errors = [t('validation.required', { key: cluster })];

        return { errors };
      } else {
        return true;
      }
    },

    emitValidation() {
      if (this.test() === true) {
        this.$emit('validationChanged', true);
      } else {
        this.$emit('validationChanged', false);
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <Banner
        color="warning"
        label-key="cluster.credential.harvester.tokenExpirationWarning"
        data-testid="harvester-token-expiration-warning-banner"
      />
    </div>
    <div class="row mb-10">
      <div
        class="col span-6"
      >
        <LabeledSelect
          v-model:value="cluster"
          :mode="mode"
          :disabled="isEdit"
          :options="clusterOptions"
          :required="true"
          :label="t('cluster.credential.harvester.cluster')"
        />
      </div>
    </div>
  </div>
</template>
