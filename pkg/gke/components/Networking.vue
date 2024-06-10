<script lang="ts">

import { mapGetters } from 'vuex';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

import { getGKENetworks, getGKESubnetworks, getGKESharedSubnetworks } from '../util/gcp';
import type { getGKESubnetworksResponse, getGKESharedSubnetworksResponse } from '../types/gcp.d.ts';
import debounce from 'lodash/debounce';
import { getGKENetworksResponse, GKESubnetwork, GKENetwork } from '../types/gcp';
import Banner from '@components/Banner/Banner.vue';

const GKE_NONE_OPTION = 'none';

export default defineComponent({
  name: 'GKENetworking',

  components: {
    LabeledSelect, Checkbox, Banner, LabeledInput, KeyValue
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    zone: {
      type:    String,
      default: ''
    },

    region: {
      type:    String,
      default: ''
    },

    cloudCredentialId: {
      type:    String,
      default: ''
    },

    projectId: {
      type:    String,
      default: ''
    },

    network: {
      type:    String,
      default: ''
    },

    subnetwork: {
      type:    String,
      default: ''
    },

    createSubnetwork: {
      type:    Boolean,
      default: false
    },

    useIpAliases: {
      type:    Boolean,
      default: false
    },

    // whether or not network policy is enabled for the cluster
    // this toggles network policy only for the Master node
    networkPolicyConfig: {
      type:    Boolean,
      default: false
    },
    // config.networkPolicyEnabled
    // this toggles support for network policies accross nodes in the GKE cluster - a generic kubernetes concept
    networkPolicyEnabled: {
      type:    Boolean,
      default: false
    },
    // normanCluster.enableNetworkPolicy
    // this toggles 'Project Network Isolation' - a Rancher-specific feature
    enableNetworkPolicy: {
      type:    Boolean,
      default: false
    },

    clusterIpv4Cidr: {
      type:    String,
      default: ''
    },

    clusterSecondaryRangeName: {
      type:    String,
      default: ''
    },

    servicesSecondaryRangeName: {
      type:    String,
      default: ''
    },

    clusterIpv4CidrBlock: {
      type:    String,
      default: ''
    },

    servicesIpv4CidrBlock: {
      type:    String,
      default: ''
    },

    nodeIpv4CidrBlock: {
      type:    String,
      default: ''
    },

    subnetworkName: {
      type:    String,
      default: ''
    },

    enablePrivateEndpoint: {
      type:    Boolean,
      default: false
    },

    enablePrivateNodes: {
      type:    Boolean,
      default: false
    },

    masterIpv4CidrBlock: {
      type:    String,
      default: ''
    },

    enableMasterAuthorizedNetwork: {
      type:    Boolean,
      default: false
    },

    masterAuthorizedNetworkCidrBlocks: {
      type:    Array,
      default: () => []
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    }

  },

  created() {
    this.debouncedLoadGCPData = debounce(this.loadGCPData, 200);
    this.debouncedLoadGCPData();
  },

  data() {
    return {
      debouncedLoadGCPData: () => {},

      loadingNetworks:    false,
      loadingSubnetworks: false,
      showAdvanced:       false,

      networksResponse:          {} as getGKENetworksResponse,
      subnetworksResponse:       {} as getGKESubnetworksResponse,
      sharedSubnetworksResponse: {} as getGKESharedSubnetworksResponse
    };
  },

  watch: {
    cloudCredentialId() {
      this.debouncedLoadGCPData();
    },

    zone() {
      this.debouncedLoadGCPData();
    },

    region() {
      this.debouncedLoadGCPData();
    },

    projectId() {
      this.debouncedLoadGCPData();
    },

    networkOptions(neu) {
      if (neu && neu.length && !this.network) {
        const firstnetwork = neu.find((network: GKENetwork) => network.kind !== 'group');

        this.$emit('update:network', firstnetwork?.name);
      }
    },

    subnetworkOptions(neu) {
      if (neu && neu.length) {
        const firstSubnet = neu.find((sn: {label: string, name: string, secondaryIpRanges?: any[]}) => sn.name !== GKE_NONE_OPTION);

        if (firstSubnet?.name) {
          this.$emit('update:subnetwork', firstSubnet.name);
        }
      }
    },

    clusterSecondaryRangeOptions(neu = []) {
      const { servicesSecondaryRangeName, clusterSecondaryRangeName } = this;

      if (servicesSecondaryRangeName) {
        if (!neu.find((opt) => opt?.rangeName === servicesSecondaryRangeName)) {
          this.$emit('update:servicesSecondaryRangeName', '');
          this.$emit('update:servicesIpv4CidrBlock', '');
        }
      }
      if (clusterSecondaryRangeName) {
        if (!neu.find((opt) => opt.rangeName === clusterSecondaryRangeName)) {
          this.$emit('update:clusterSecondaryRangeName', '');
          this.$emit('update:clusterIpv4CidrBlock', '');
        }
      }
    },

    enablePrivateEndpoint(neu) {
      if (neu) {
        this.$emit('update:enableMasterAuthorizedNetwork', true);
      }
    },

    enablePrivateNodes(neu) {
      if (neu) {
        this.$emit('update:enableMasterAuthorizedNetwork', true);
      } else {
        this.$emit('update:enablePrivateEndpoint', false);
        this.$emit('update:masterIpv4CidrBlock', '');
      }
    },

    enableMasterAuthorizedNetwork(neu) {
      if (!neu) {
        this.$emit('update:masterAuthorizedNetworkCidrBlocks', []);
      }
    },

    subnetwork(neu) {
      if (neu) {
        this.$emit('update:createSubnetwork', false);
      } else {
        this.$emit('update:createSubnetwork', true);
      }
    }
  },

  methods: {
    // when credential/region/zone change, fetch dependent resources from gcp
    loadGCPData() {
      if (!this.isView) {
        this.loadingNetworks = true;
        this.loadingSubnetworks = true;
        this.getNetworks();
        this.getSubnetworks();
        this.getSharedSubnetworks();
      }
    },

    getNetworks() {
      getGKENetworks(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        this.networksResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getSubnetworks() {
      let { region, zone } = this;

      if (!region && !!zone) {
        region = `${ zone.split('-')[0] }-${ zone.split('-')[1] }`;
      }
      getGKESubnetworks(this.$store, this.cloudCredentialId, this.projectId, { region }).then((res) => {
        this.subnetworksResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    getSharedSubnetworks() {
      return getGKESharedSubnetworks(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        this.sharedSubnetworksResponse = res;
      }).catch((err) => {
        this.$emit('error', err);
      });
    },

    /**
     * https://github.com/rancher/rancher/issues/33026 tl;dr:
     * if networkPolicyEnabled is true, networkPolicyConfig must also be true
     * if enableNetworkPolicy (project network isolation) is true, networkPolicyEnabled must also be true
     * networkPolicyConfig does NOT require either enableNetworkPolicy nor networkPolicyEnabled to be true
     */
    updateNetworkPolicyEnabled(neu: boolean) {
      if (neu) {
        this.$emit('update:networkPolicyEnabled', true);
        this.$emit('update:networkPolicyConfig', true);
      } else {
        this.$emit('update:networkPolicyEnabled', false);
      }
    },

    updateEnableNetworkPolicy(neu: boolean) {
      if (neu) {
        this.$emit('update:enableNetworkPolicy', true);
        this.$emit('update:networkPolicyEnabled', true);
        this.$emit('update:networkPolicyConfig', true);
      } else {
        this.$emit('update:enableNetworkPolicy', false);
      }
    },

    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isView():boolean {
      return this.mode === _VIEW;
    },

    subnetworks() {
      return this.subnetworksResponse.items || [];
    },

    sharedNetworks(): {[key: string]: GKESubnetwork[]} {
      const allSharedSubnetworks = this.sharedSubnetworksResponse?.subnetworks || [];
      const networks = {} as any;

      allSharedSubnetworks.forEach((s) => {
        const network = (s.network).split('/').pop() || s.network;

        if (network && !networks[network]) {
          networks[network] = [];
        }
        networks[network].push(s);
      });

      return networks;
    },

    networkOptions() {
      const out = [];
      const unshared = (this.networksResponse?.items || []).map((n) => {
        const subnetworksAvailable = this.subnetworks.find((s) => s.network === n.selfLink);

        return { ...n, label: subnetworksAvailable ? `${ n.name } (${ this.t('gke.network.subnetworksAvailable') })` : n.name };
      });
      const shared = (Object.keys(this.sharedNetworks) || []).map((n) => {
        const firstSubnet = this.sharedNetworks[n][0];

        return {
          name: n, label: `${ n } (${ this.t('gke.network.subnetworksAvailable') })`, ...firstSubnet
        };
      });

      if (shared.length) {
        out.push({
          label:    this.t('gke.network.sharedvpc'),
          kind:     'group',
          disabled: true,
          name:     'shared'
        }, ...shared);
      } if (unshared.length) {
        out.push({
          label:    this.t('gke.network.vpc'),
          kind:     'group',
          disabled: true,
          name:     'unshared'
        }, ...unshared);
      }

      return out;
    },

    subnetworkOptions(): {label: string, name: string, secondaryIpRanges?: any[]}[] {
      const out = [] as any;
      const isShared = !!this.sharedNetworks[this.network];

      if (isShared) {
        out.push(...this.sharedNetworks[this.network]);
      } else {
        out.push(...(this.subnetworks.filter((s) => s.network.split('/').pop() === this.network) || []));
      }

      const labeled = out.map((sn: GKESubnetwork) => {
        const name = sn.name ? sn.name : (sn.subnetwork || '').split('/').pop();

        return {
          name, label: `${ name } (${ sn.ipCidrRange })`, ...sn
        };
      });

      if (this.useIpAliases) {
        labeled.unshift({ label: this.t('gke.subnetwork.auto'), name: GKE_NONE_OPTION });
      }

      return labeled;
    },

    clusterSecondaryRangeOptions(): {rangeName: string, ipCidrRange?: string, label: string}[] {
      if (this.selectedSubnetwork && this.selectedSubnetwork.name === GKE_NONE_OPTION) {
        return [{
          label:     this.t('generic.none'),
          rangeName: GKE_NONE_OPTION
        }];
      }

      const out: {rangeName: string, ipCidrRange?: string, label: string}[] = (this.selectedSubnetwork?.secondaryIpRanges || []).map(({ ipCidrRange, rangeName }) => {
        return {
          rangeName,
          ipCidrRange,
          label: `${ rangeName } (${ ipCidrRange })`
        };
      });

      out.unshift({
        label:     this.t('generic.none'),
        rangeName: GKE_NONE_OPTION
      });

      return out;
    },
    /**
     * Only the user-defined network and subnetwork names appear in the GKE config
     * selectedNetwork and selectedSubnetwork keep track of all the additional networking info from gcp api calls
     * eg subnets' ipCidrRange, to display alongside name in the dropdown
     */
    selectedNetwork: {
      get() {
        const { network } = this;

        if (this.isView) {
          return network;
        }
        if (!network) {
          return undefined;
        }

        return this.networkOptions.find((n) => n.name === network);
      },
      set(neu:{name:string}) {
        this.$emit('update:network', neu.name);
      }
    },

    selectedSubnetwork: {
      get(): {label: string, name: string, secondaryIpRanges?: any[]} | undefined | string {
        const { subnetwork } = this;

        if (this.isView) {
          return subnetwork;
        }
        if (!subnetwork || subnetwork === '') {
          return { label: this.t('gke.subnetwork.auto'), name: GKE_NONE_OPTION };
        }

        return this.subnetworkOptions.find((n) => n.name === subnetwork);
      },
      set(neu:{name:string}) {
        if (neu.name === GKE_NONE_OPTION) {
          this.$emit('update:subnetwork', '');
        } else {
          this.$emit('update:subnetwork', neu.name);
        }
      }
    },

    selectedClusterSecondaryRangeName: {
      get(): {rangeName: string, ipCidrRange?: string, label: string} | undefined | string {
        if (this.isView) {
          return this.clusterSecondaryRangeName || GKE_NONE_OPTION;
        }
        if (!this.clusterSecondaryRangeName) {
          return {
            label:     this.t('generic.none'),
            rangeName: GKE_NONE_OPTION
          };
        } else return this.clusterSecondaryRangeOptions.find((opt) => opt.rangeName === this.clusterSecondaryRangeName);
      },
      set(neu: {rangeName: string, ipCidrRange?: string, label: string} ) {
        if (neu.rangeName === GKE_NONE_OPTION) {
          this.$emit('update:clusterSecondaryRangeName', '');
          this.$emit('update:clusterIpv4CidrBlock', '');
        } else {
          this.$emit('update:clusterSecondaryRangeName', neu.rangeName);
          this.$emit('update:clusterIpv4CidrBlock', neu.ipCidrRange);
        }
      }
    },

    selectedServicesSecondaryRangeName: {
      get(): {rangeName: string, ipCidrRange?: string, label: string} | undefined | string {
        if (this.isView) {
          return this.servicesSecondaryRangeName || GKE_NONE_OPTION;
        }
        if (!this.servicesSecondaryRangeName) {
          return {
            label:     this.t('generic.none'),
            rangeName: GKE_NONE_OPTION
          };
        } else return this.clusterSecondaryRangeOptions.find((opt) => opt.rangeName === this.servicesSecondaryRangeName);
      },
      set(neu: {rangeName: string, ipCidrRange?: string, label: string}) {
        if (neu.rangeName === GKE_NONE_OPTION) {
          this.$emit('update:servicesSecondaryRangeName', '');
          this.$emit('update:servicesIpv4CidrBlock', '');
        } else {
          this.$emit('update:servicesSecondaryRangeName', neu.rangeName);
          this.$emit('update:servicesIpv4CidrBlock', neu.ipCidrRange);
        }
      }
    },
  }

});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :mode="mode"
          label-key="gke.clusterIpv4Cidr.label"
          :value="clusterIpv4Cidr"
          :placeholder="t('gke.clusterIpv4Cidr.placeholder')"
          :disabled="!isNewOrUnprovisioned"
          :rules="rules.clusterIpv4Cidr"
          @input="$emit('update:clusterIpv4Cidr', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model="selectedNetwork"
          :options="networkOptions"
          :mode="mode"
          label-key="gke.network.label"
          option-key="name"
          option-label="label"
          :disabled="!isNewOrUnprovisioned"
          data-testid="gke-networks-dropdown"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectedSubnetwork"
          :options="subnetworkOptions"
          option-key="name"
          option-label="label"
          :mode="mode"
          :label-key="useIpAliases ? 'gke.subnetwork.nodeLabel' : 'gke.subnetwork.label'"
          :disabled="!isNewOrUnprovisioned"
          data-testid="gke-subnetworks-dropdown"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-if="!!subnetwork"
          v-model="selectedClusterSecondaryRangeName"
          :mode="mode"
          :options="clusterSecondaryRangeOptions"
          label-key="gke.clusterSecondaryRangeName.label"
          :disabled="!isNewOrUnprovisioned"
          data-testid="gke-cluster-secondary-range-name-select"
        />
        <LabeledInput
          v-else
          :mode="mode"
          :value="subnetworkName"
          label-key="gke.subnetwork.name"
          :placeholder="t('gke.subnetwork.namePlaceholder')"
          :disabled="!isNewOrUnprovisioned"
          data-testid="gke-subnetwork-name-input"
          @input="$emit('update:subnetworkName', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="clusterIpv4CidrBlock"
          :mode="mode"
          label-key="gke.clusterIpv4CidrBlock.label"
          :placeholder="t('gke.clusterIpv4Cidr.placeholder')"
          :disabled="(!!selectedClusterSecondaryRangeName && !!selectedClusterSecondaryRangeName.ipCidrRange)|| !isNewOrUnprovisioned"
          :rules="rules.clusterIpv4CidrBlock"
          data-testid="gke-cluster-secondary-range-cidr-input"
          @input="$emit('update:clusterIpv4CidrBlock', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-if="!!subnetwork"
          v-model="selectedServicesSecondaryRangeName"
          :mode="mode"
          :options="clusterSecondaryRangeOptions"
          label-key="gke.servicesSecondaryRangeName.label"
          :disabled="!isNewOrUnprovisioned"
        />
        <LabeledInput
          v-else
          :mode="mode"
          :value="nodeIpv4CidrBlock"
          label-key="gke.nodeIpv4CidrBlock.label"
          :disabled="!isNewOrUnprovisioned"
          :rules="rules.nodeIpv4CidrBlock"
          @input="$emit('update:nodeIpv4CidrBlock', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="servicesIpv4CidrBlock"
          :mode="mode"
          label-key="gke.servicesIpv4CidrBlock.label"
          :placeholder="t('gke.clusterIpv4Cidr.placeholder')"
          :disabled="(!!selectedServicesSecondaryRangeName && !!selectedServicesSecondaryRangeName.ipCidrRange)|| !isNewOrUnprovisioned"
          :rules="rules.servicesIpv4CidrBlock"
          @input="$emit('update:servicesIpv4CidrBlock', $event)"
        />
      </div>
    </div>
    <Banner
      v-if="!useIpAliases"
      class="mb-10"
      label-key="gke.useIpAliases.warning"
      color="warning"
      data-testid="gke-use-ip-aliases-banner"
    />
    <div class="row mb-10">
      <div class="col span-6 checkbox-column">
        <Checkbox
          :value="useIpAliases"
          :mode="mode"
          :label="t('gke.useIpAliases.label')"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:useIpAliases', $event)"
        />
        <Checkbox
          :value="networkPolicyConfig"
          :mode="mode"
          :label="t('gke.networkPolicyConfig.label')"
          @input="$emit('update:networkPolicyConfig', $event)"
        />
        <Checkbox
          :value="networkPolicyEnabled"
          :mode="mode"
          :label="t('gke.networkPolicyEnabled.label')"
          :disabled="!isNewOrUnprovisioned"
          @input="e=>updateNetworkPolicyEnabled(e)"
        />
        <Checkbox
          :value="enableNetworkPolicy"
          :mode="mode"
          :label="t('gke.enableNetworkPolicy.label')"
          @input="e=>updateEnableNetworkPolicy(e)"
        />
      </div>
    </div>

    <div>
      <button
        type="button"
        class="btn role-link advanced-toggle"
        @click="toggleAdvanced"
      >
        {{ showAdvanced ? t('gke.hideAdvanced') : t('gke.showAdvanced') }}
      </button>
    </div>
    <template v-if="showAdvanced">
      <div class="row mb-10">
        <div class="col span-6 checkbox-column">
          <Checkbox
            :mode="mode"
            :label="t('gke.enablePrivateNodes.label')"
            :value="enablePrivateNodes"
            :disabled="!isNewOrUnprovisioned"
            @input="$emit('update:enablePrivateNodes', $event)"
          />
          <Checkbox
            :mode="mode"
            :label="t('gke.enablePrivateEndpoint.label')"
            :value="enablePrivateEndpoint"
            :disabled="!enablePrivateNodes || !isNewOrUnprovisioned"
            :tooltip="t('gke.enablePrivateEndpoint.tooltip')"
            data-testid="gke-enable-private-endpoint-checkbox"
            @input="$emit('update:enablePrivateEndpoint', $event)"
          />
          <Checkbox
            :mode="mode"
            :value="enableMasterAuthorizedNetwork"
            :label="t('gke.masterAuthorizedNetwork.enable.label')"
            :disabled="enablePrivateEndpoint || !isNewOrUnprovisioned"
            @input="$emit('update:enableMasterAuthorizedNetwork', $event)"
          />
        </div>
        <div class="col span-6">
          <KeyValue
            v-if="enableMasterAuthorizedNetwork"
            :label="t('gke.masterAuthorizedNetwork.cidrBlocks.label')"
            :mode="mode"
            :as-map="false"
            key-name="displayName"
            value-name="cidrBlock"
            :key-label="t('gke.masterAuthorizedNetwork.cidrBlocks.displayName')"
            :value-label="t('gke.masterAuthorizedNetwork.cidrBlocks.cidr')"
            :value-placeholder="t('gke.clusterIpv4Cidr.placeholder')"
            :value="masterAuthorizedNetworkCidrBlocks"
            :read-allowed="false"
            :add-label="t('gke.masterAuthorizedNetwork.cidrBlocks.add')"
            :initial-empty-row="true"
            :disabled="!isNewOrUnprovisioned"
            data-testid="gke-master-authorized-network-cidr-keyvalue"
            @input="$emit('update:masterAuthorizedNetworkCidrBlocks', $event)"
          />
        </div>
      </div>
      <Banner
        v-if="enablePrivateNodes"
        color="warning"
        label-key="gke.enablePrivateNodes.warning"
      />
      <div class="row mb-10">
        <div class="col span-3">
          <LabeledInput
            v-show="enablePrivateNodes"
            :mode="mode"
            :value="masterIpv4CidrBlock"
            label-key="gke.masterIpv4CidrBlock.label"
            :placeholder="t('gke.masterIpv4CidrBlock.placeholder')"
            :tooltip="t('gke.masterIpv4CidrBlock.tooltip')"
            :disabled="!isNewOrUnprovisioned"
            required
            :rules="rules.masterIpv4CidrBlock"
            data-testid="gke-master-ipv4-cidr-block-input"
            @input="$emit('update:masterIpv4CidrBlock', $event)"
          />
        </div>
      </div>
      <div class="row mb-10" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.advanced-toggle {
  padding-left: 0px;
  margin: 20px 0px 20px 0px;
}

.checkbox-column {
  display: flex;
  flex-direction: column;
  &>*{
    margin-top: 10px;
  }
}
</style>
