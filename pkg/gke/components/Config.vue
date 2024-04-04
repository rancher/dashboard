<script lang="ts">
import semver from 'semver';

import { mapGetters } from 'vuex';
import { _CREATE } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

import {
  getGKEVersions, getGKENetworks, getGKESubnetworks, getGKEClusters, getGKESharedSubnetworks,
  imageTypes
} from '../util/gcp';
import type { getGKEVersionsResponse, getGKEClustersResponse, getGKESubnetworksResponse, getGKESharedSubnetworksResponse } from '../types/gcp.d.ts';
import { debounce } from 'lodash';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getGKENetworksResponse, GKESubnetwork } from '../types/gcp';
import Banner from '@components/Banner/Banner.vue';

const GKE_NONE_OPTION = 'none';

export default defineComponent({
  name: 'GKEConfig',

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

    originalVersion: {
      type:    String,
      default: ''
    },

    clusterId: {
      type:    String,
      default: ''
    },

    clusterName: {
      type:    String,
      default: ''
    },

    kubernetesVersion: {
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

    defaultImageType: {
      type:    String,
      default: ''
    }
  },

  created() {
    this.debouncedLoadGCPData = debounce(this.loadGCPData, 200);
    this.debouncedLoadGCPData();
  },

  data() {
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      debouncedLoadGCPData: () => {},

      loadingVersions:    false,
      loadingNetworks:    false,
      loadingSubnetworks: false,
      showAdvanced:       false,

      supportedVersionRange,
      versionsResponse:          {} as getGKEVersionsResponse,
      /**
       * these are NOT cluster objects in the Rancher cluster (management.cattle.io.cluster provisioning.cattle.io.cluster etc)
       * this is a list of clusters in the user's GCP project, which, on edit, will include the current cluster
       * on edit, this gcp representation of the cluster is checked for a release channel to determine which k8s versions to offer
       */
      clustersResponse:          {} as getGKEClustersResponse,
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

    versionOptions(neu) {
      if (neu && neu.length && !this.kubernetesVersion) {
        this.$emit('update:kubernetesVersion', this.versionOptions[0].value);
      }
    },

    networkOptions(neu) {
      if (neu && neu.length && !this.network) {
        const firstnetwork = neu.find((network) => network.kind !== 'group');

        this.$emit('update:network', firstnetwork?.name);
      }
    },

    subnetworkOptions(neu) {
      if (neu && neu.length) {
        const firstSubnet = neu[0];

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
    }

  },

  methods: {
    // when credential/region/zone change, fetch dependent resources from gcp
    loadGCPData() {
      this.loadingVersions = true;
      this.loadingNetworks = true;
      this.loadingSubnetworks = true;
      this.getVersions();
      this.getNetworks();
      this.getSubnetworks();
      this.getSharedSubnetworks();
      // gcp clusters are fetched on edit to check this cluster's release channel & offer appropriate k8s versions
      if (this.mode !== _CREATE) {
        this.getClusters();
      }
    },

    getVersions() {
      getGKEVersions(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }).then((res) => {
        this.versionsResponse = res;
        if (res.defaultImageType) {
          this.$emit('update:defaultImageType', res.defaultImageType);
        }
      }).catch((err) => {
        this.$emit('error', err);
      });
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

    getClusters() {
      getGKEClusters(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }, this.clusterId).then((res) => {
        this.clustersResponse = res;
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

    isCreate(): boolean {
      return this.mode === _CREATE;
    },

    releaseChannel(): string | undefined {
      const cluster = (this.clustersResponse?.clusters || []).find((c) => c.name === this.clusterName);

      return cluster?.releaseChannel?.channel;
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

    // if editing an existing cluster use versions from relevant release channel
    // filter based off supported version range
    // if current cluster version is outside of supported range, show it anyway
    // disable versions more than one minor version away from the current version
    versionOptions(): {label: string, value: string, disabled?:boolean}[] {
      let out: {label: string, value: string, disabled?:boolean}[] = [];
      let versions: string[] = [];
      const { supportedVersionRange, originalVersion } = this;
      const originalMinorVersion = !!originalVersion ? semver.parse(originalVersion).minor : null;

      if (!!this.releaseChannel) {
        versions = (this.versionsResponse?.channels || []).find((ch) => ch.channel === this.releaseChannel)?.validVersions || [];
      }
      if (!versions || !versions.length) {
        versions = this.versionsResponse?.validMasterVersions || [];
      }

      out = versions.reduce((opts, v) => {
        if (supportedVersionRange && !semver.satisfies(semver.coerce(v), supportedVersionRange)) {
          return opts;
        }
        if (originalVersion && !semver.gte(v, originalVersion)) {
          return opts;
        }
        if (v === originalVersion) {
          opts.push({ label: `${ v } (${ this.t('gke.version.current') })`, value: v });
        } else if (originalMinorVersion && originalMinorVersion < (semver.parse(v, { includePrerelease: true }).minor - 1)) {
          opts.push({
            label: v, value: v, disabled: true
          });
        } else {
          opts.push({ label: v, value: v });
        }

        return opts;
      }, [] as {label: string, value: string, disabled?:boolean}[]);

      if (originalVersion && !semver.satisfies(semver.coerce(originalVersion), supportedVersionRange)) {
        out.push({ label: `${ originalVersion } (${ this.t('gke.version.current') })`, value: originalVersion });
      }

      return out;
    },

    networkOptions() {
      const out = [];
      const unshared = (this.networksResponse?.items || []).map((n) => {
        const subnetworksAvailable = this.subnetworks.find((s) => s.network === n.selfLink);

        return { ...n, label: subnetworksAvailable ? `${ n.name } (${ this.t('gke.network.subnetworksAvailable') })` : n.name };
      });
      const shared = (Object.keys(this.sharedNetworks) || []).map((n) => {
        const firstSubnet = this.sharedNetworks[n][0];
        // const displayName = n.split('/').pop();

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

      const labeled = out.map((sn) => {
        const name = sn.name ? sn.name : (sn.subnetwork || '').split('/').pop();

        return {
          name, label: `${ name } (${ sn.ipCidrRange })`, ...sn
        };
      });

      labeled.unshift({ label: this.t('gke.subnetwork.auto'), name: GKE_NONE_OPTION });

      return labeled;
    },

    clusterSecondaryRangeOptions(): {rangeName: string, ipCidrRange?: string, label: string}[] {
      if (this.selectedSubnetwork && this.selectedSubnetwork.name === GKE_NONE_OPTION) {
        return [{
          label:     this.t('generic.none'),
          rangeName: GKE_NONE_OPTION
        }];
      }

      // TODO nb none option
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
    // TODO nb if nothing in networkOptions matches network, error
    selectedNetwork: {
      get() {
        const { network } = this;

        if (!network) {
          return null;
        }

        return this.networkOptions.find((n) => n.name === network);
      },
      set(neu:{name:string}) {
        this.$emit('update:network', neu.name);
      }
    },

    selectedSubnetwork: {
      get(): {label: string, name: string, secondaryIpRanges?: any[]} | undefined {
        const { subnetwork } = this;

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
      get() {
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
      get() {
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
        <LabeledSelect
          :options="versionOptions"
          label-key="gke.version.label"
          :value="kubernetesVersion"
          :tooltip="isCreate? '' :t('gke.version.tooltip')"
          @selecting="$emit('update:kubernetesVersion', $event.value)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :mode="mode"
          label-key="gke.clusterIpv4Cidr.label"
          :value="clusterIpv4Cidr"
          :placeholder="t('gke.clusterIpv4Cidr.placeholder')"
          :disabled="!isNewOrUnprovisioned"
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
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-if="clusterSecondaryRangeOptions.length>1"
          v-model="selectedClusterSecondaryRangeName"
          :mode="mode"
          :options="clusterSecondaryRangeOptions"
          label-key="gke.clusterSecondaryRangeName.label"
          :disabled="!isNewOrUnprovisioned"
        />
        <LabeledInput
          v-else
          :mode="mode"
          :value="subnetworkName"
          label-key="gke.subnetwork.name"
          :placeholder="t('gke.subnetwork.namePlaceholder')"
          :disabled="!isNewOrUnprovisioned"
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
          @input="$emit('update:clusterIpv4CidrBlock'), $event"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-if="clusterSecondaryRangeOptions.length>1"
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
          @input="$emit('update:servicesIpv4CidrBlock'), $event"
        />
      </div>
    </div>
    <Banner
      v-if="!useIpAliases"
      class="mb-10"
      label-key="gke.useIpAliases.warning"
      color="warning"
    />
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          :value="useIpAliases"
          :mode="mode"
          :label="t('gke.useIpAliases.label')"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:useIpAliases', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :value="networkPolicyConfig"
          :mode="mode"
          :label="t('gke.networkPolicyConfig.label')"
          @input="$emit('update:networkPolicyConfig', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :value="networkPolicyEnabled"
          :mode="mode"
          :label="t('gke.networkPolicyEnabled.label')"
          :disabled="!isNewOrUnprovisioned"
          @input="e=>updateNetworkPolicyEnabled(e)"
        />
      </div>
      <div class="col span-3">
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
        <div class="col span-3">
          <Checkbox
            :mode="mode"
            :label="t('gke.enablePrivateNodes.label')"
            :value="enablePrivateNodes"
            :disabled="!isNewOrUnprovisioned"
            @input="$emit('update:enablePrivateNodes', $event)"
          />
        </div>
        <div class="col span-3">
          <Checkbox
            :mode="mode"
            :label="t('gke.enablePrivateEndpoint.label')"
            :value="enablePrivateEndpoint"
            :disabled="!enablePrivateNodes || !isNewOrUnprovisioned"
            :tooltip="t('gke.enablePrivateEndpoint.tooltip')"
            @input="$emit('update:enablePrivateEndpoint', $event)"
          />
        </div>
        <div class="col span-3">
          <Checkbox
            :mode="mode"
            :value="enableMasterAuthorizedNetwork"
            :label="t('gke.masterAuthorizedNetwork.enable.label')"
            :disabled="enablePrivateEndpoint || !isNewOrUnprovisioned"
            @input="$emit('update:enableMasterAuthorizedNetwork', $event)"
          />
        </div>
      </div>
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
            @input="$emit('update:masterIpv4CidrBlock', $event)"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-12">
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
            @input="$emit('update:masterAuthorizedNetworkCidrBlocks', $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
.advanced-toggle {
  padding-left: 0px;
  margin: 20px 0px 20px 0px;
}

</style>
