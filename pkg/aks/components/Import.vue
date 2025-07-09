<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import { getAKSClusters } from '../util/aks';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

export default defineComponent({
  name: 'AKSImport',

  emits: ['update:clusterName', 'update:resourceGroup', 'update:resourceLocation', 'update:enableNetworkPolicy', 'error'],

  components: {
    LabeledSelect, Banner, Checkbox
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    clusterName: {
      type:    String,
      default: ''
    },

    resourceLocation: {
      type:    String,
      default: ''
    },

    resourceGroup: {
      type:    String,
      default: ''
    },

    enableNetworkPolicy: {
      type:    Boolean,
      default: false
    },

    azureCredentialSecret: {
      type:    String,
      default: ''
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  data() {
    return {
      allClusters: [], loadingClusters: false, rbacEnabled: true
    };
  },

  watch: {
    azureCredentialSecret: {
      handler(neu) {
        if (neu) {
          this.getClusters();
        }
      },
      immediate: true
    }
  },

  methods: {
    async getClusters() {
      this.loadingClusters = true;

      try {
        const clusters = await getAKSClusters(this.$store, this.azureCredentialSecret);

        if (clusters?.length) {
          this.allClusters = clusters;
        } else {
          this.allClusters = [];
        }
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingClusters = false;
    },

    setCluster({
      clusterName, resourceGroup, rbacEnabled, location
    }: any) {
      this.rbacEnabled = rbacEnabled;
      this.$emit('update:clusterName', clusterName);
      this.$emit('update:resourceGroup', resourceGroup);
      this.$emit('update:resourceLocation', location);
    },

    updateNetworkPolicy(neu: boolean) {
      this.$emit('update:enableNetworkPolicy', neu);
    },

  },

});

</script>

<template>
  <Banner
    v-if="!rbacEnabled"
    label-key="aks.importedRbac"
    color="warning"
  />
  <div class="row mb-10 align-center">
    <div class="col span-6">
      <LabeledSelect
        required
        :value="clusterName"
        :mode="mode"
        :options="allClusters"
        label-key="aks.clusterToRegister"
        option-label="clusterName"
        :loading="loadingClusters"
        :rules="rules.clusterName"
        @update:value="setCluster"
      />
    </div>
    <div class="col span-6">
      <Checkbox
        :value="enableNetworkPolicy"
        :mode="mode"
        label-key="aks.enableNetworkPolicy.label"
        @update:value="updateNetworkPolicy"
      />
    </div>
  </div>
</template>
