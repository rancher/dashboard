
<script lang="ts">
import { _EDIT } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { getGKEClusters } from '../util/gcp';
import type { getGKEClustersResponse } from '../types/gcp.d.ts';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

import debounce from 'lodash/debounce';

export default defineComponent({
  name: 'GKEImport',

  components: {
    LabeledSelect, Banner, Checkbox, LabeledInput
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
    }
  },

  created() {
    this.debouncedloadGKEClusters = debounce(this.loadGKEClusters, 200);
    this.debouncedloadGKEClusters();
  },

  data() {
    return {
      clustersResponse: {} as getGKEClustersResponse, debouncedloadGKEClusters: () => {}, loadClusterFailed: false
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
      return (this.clustersResponse?.clusters || []).map((c) => {
        return c.name;
      });
    }
  },

  methods: {
    // query for GKE clusters every time credentials or region change
    async loadGKEClusters() {
      try {
        const res = await getGKEClusters(this.$store, this.credential, this.project, { zone: this.zone, region: this.region });

        this.clustersResponse = res;
        if (!res?.clusters) {
          this.loadClusterFailed = true;
        } else {
          this.loadClusterFailed = false;
        }
      } catch (err:any) {
        this.$emit('error', err);
      }
    },
  },

});
</script>

<template>
  <div>
    <div class="row mb-10 center">
      <div class="col span-6">
        <LabeledSelect
          v-if="!loadClusterFailed"
          :value="clusterName"
          :mode="mode"
          :label="t('gke.import.cluster.label')"
          :options="clusterOptions"
          @selecting="$emit('update:clusterName', $event)"
        />
        <LabeledInput
          v-else
          :value="clusterName"
          :mode="mode"
          :label="t('gke.import.cluster.label')"
          @input="$emit('update:clusterName', $event)"
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

<style lang="scss" scoped>
  .center {
    display: flex;
    align-items: center;
  }
</style>
