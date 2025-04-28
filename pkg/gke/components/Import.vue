
<script lang="ts">
import { _EDIT } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { getGKEClusters } from '../util/gcp';
import type { getGKEClustersResponse } from '../types/gcp.d.ts';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

import debounce from 'lodash/debounce';

export const GKE_STATES_ENUM = {
  RUNNING:      'RUNNING',
  PROVISIONING: 'PROVISIONING',
  ERROR:        'ERROR'
};

export default defineComponent({
  name: 'GKEImport',

  components: {
    LabeledSelect, Checkbox, LabeledInput
  },

  emits: ['error', 'update:clusterName', 'update:enableNetworkPolicy'],

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    // name of cluster to be imported
    // this wont necessarily align with normanCluster.name as it would w/ provisioning
    clusterName: {
      type:    String,
      default: ''
    },

    credential: {
      type:    String,
      default: null
    },

    project: {
      type:    String,
      default: ''
    },

    region: {
      type:    String,
      default: ''
    },

    zone: {
      type:    String,
      default: ''
    },

    enableNetworkPolicy: {
      type:    Boolean,
      default: false
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  created() {
    this.debouncedloadGKEClusters = debounce(this.loadGKEClusters, 200);
    this.debouncedloadGKEClusters();
  },

  data() {
    return {
      clustersResponse:         {} as getGKEClustersResponse,
      debouncedloadGKEClusters: () => {},
      loadingClusters:          false,
    };
  },

  watch: {
    project() {
      this.debouncedloadGKEClusters();
    },
    region() {
      this.debouncedloadGKEClusters();
    },
    zone() {
      this.debouncedloadGKEClusters();
    },
    credential() {
      this.debouncedloadGKEClusters();
    }
  },

  computed: {
    clusterOptions() {
      return (this.clustersResponse?.clusters || []).filter((c) => c.status === GKE_STATES_ENUM.RUNNING).map((c) => c.name);
    }
  },

  methods: {
    // query for GKE clusters every time credentials or region change
    async loadGKEClusters() {
      this.loadingClusters = true;
      this.$emit('update:clusterName', '');
      try {
        const res = await getGKEClusters(this.$store, this.credential, this.project, { zone: this.zone, region: this.region });

        this.clustersResponse = res;
      } catch (err:any) {
        this.$emit('error', err);
      }
      this.loadingClusters = false;
    },

  },

});
</script>

<template>
  <div>
    <div class="row mb-10 align-center">
      <div class="col span-6">
        <LabeledSelect
          v-if="loadingClusters || clusterOptions.length"
          :loading="loadingClusters"
          :value="clusterName"
          :mode="mode"
          :label="t('gke.import.cluster.label')"
          :options="clusterOptions"
          :rules="rules.importName"
          @selecting="$emit('update:clusterName', $event)"
        />
        <LabeledInput
          v-else
          :value="clusterName"
          :mode="mode"
          :label="t('gke.import.cluster.label')"
          :rules="rules.importName"
          data-testid="gke-import-cluster-name-text"
          @input="$emit('update:clusterName', $event.target.value)"
        />
      </div>
      <div class="col span-6 ">
        <Checkbox
          :value="enableNetworkPolicy"
          :mode="mode"
          :label="t('gke.enableNetworkPolicy.label')"
          @update:value="$emit('update:enableNetworkPolicy', $event)"
        />
      </div>
    </div>
  </div>
</template>
