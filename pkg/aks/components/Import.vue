<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import { getAKSClusters } from '../util/aks';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

export default defineComponent({
  name: 'AKSImport',

  emits: ['update:clusterName', 'update:resourceGroup', 'update:resourceLocation', 'update:enableNetworkPolicy'],

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
      type:    Array,
      default: () => []
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
      this.allClusters = await getAKSClusters(this.$store, this.azureCredentialSecret);
      this.loadingClusters = false;
    },

    setCluster({
      clusterName, resourceGroup, rbacEnabled, location
    }) {
      this.rbacEnabled = rbacEnabled;
      this.$emit('update:clusterName', clusterName);
      this.$emit('update:resourceGroup', resourceGroup);
      this.$emit('update:resourceLocation', location);
    },

    updateNetworkPolicy(neu) {
      console.log('*** setting network policy ', neu);
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
  <div class="row mb-10 center-inputs">
    <div class="col span-6">
      <LabeledSelect
        :value="clusterName"
        :mode="mode"
        :options="allClusters"
        label-key="aks.clusterToRegister"
        option-label="clusterName"
        :rules="rules"
        :loading="loadingClusters"
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

<style lang="scss" scoped>
  .center-inputs {
    display: flex;
    align-items: center;
  }
</style>
