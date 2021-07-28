<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';

import { get } from '@/utils/object';
import { MANAGEMENT, VIRTUAL_PROVIDER } from '@/config/types';
import { HCI } from '@/config/labels-annotations';

export default {
  components: {
    LabeledInput, LabeledSelect, RadioGroup
  },
  mixins: [CreateEditView],

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
  },

  data() {
    this.$emit('validationChanged', true);

    if (!this.value.decodedData.clusterType) {
      this.value.setData('clusterType', 'import');
    }

    const cluster = get(this.value, `metadata.annotations."${ HCI.CLUSTER_ID }"`) || '';

    return {
      clusters: [],
      cluster,
    };
  },

  computed: {
    clusterOptions() {
      return this.clusters.filter(c => c.status?.provider === VIRTUAL_PROVIDER).map( (cluster) => {
        return {
          value: cluster.id,
          label: cluster.nameDisplay
        };
      });
    },

    isImportCluster() {
      return this.value.decodedData.clusterType === 'import';
    }
  },

  watch: {
    'value.decodedData.clusterType': {
      handler(neu) {
        if (this.isCreate) {
          this.value.setData('kubeconfigContent', '');
          this.cluster = '';
        }
      },
    },

    async cluster(neu) {
      if (!neu) {
        return;
      }

      if (this.isCreate) {
        this.value.setAnnotation(HCI.CLUSTER_ID, neu);
      }

      const currentCluster = this.$store.getters['management/all'](MANAGEMENT.CLUSTER).find(x => x.id === neu);

      this.$nuxt.$loading.start();

      const kubeconfigContent = await currentCluster.generateKubeConfig();

      this.$nuxt.$loading.finish();

      this.value.setData('kubeconfigContent', kubeconfigContent);
    }
  },

  methods: {
    test() {
      const t = this.$store.getters['i18n/t'];

      if (!this.cluster && this.isImportCluster) {
        const cluster = t('cluster.credential.harvester.cluster');
        const errors = [t('validation.required', { key: cluster })];

        return { errors };
      }

      if (!this.value.decodedData.kubeconfigContent) {
        const kubeconfigContent = t('cluster.credential.harvester.kubeconfigContent.label');

        const errors = [t('validation.required', { key: kubeconfigContent })];

        return { errors };
      } else {
        return true;
      }
    },
  }
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <RadioGroup
        v-model="value.decodedData.clusterType"
        :mode="mode"
        :disabled="isEdit"
        name="clusterType"
        :labels="[t('cluster.credential.harvester.import'),t('cluster.credential.harvester.external')]"
        :options="['import', 'external']"
        @input="value.setData('clusterType', $event);"
      />
    </div>

    <div class="row mb-10">
      <div v-if="isImportCluster" class="col span-6">
        <LabeledSelect
          v-model="cluster"
          :mode="mode"
          :disabled="isEdit"
          :options="clusterOptions"
          :required="true"
          label="Cluster"
        />
      </div>

      <div class="col span-6">
        <LabeledInput
          v-if="!isImportCluster"
          :value="value.decodedData.kubeconfigContent"
          label-key="cluster.credential.harvester.kubeconfigContent.label"
          :required="true"
          type="multiline"
          :min-height="160"
          :mode="mode"
          @input="value.setData('kubeconfigContent', $event);"
        />
      </div>
    </div>
  </div>
</template>
