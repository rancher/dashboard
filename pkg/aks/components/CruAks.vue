<script lang='ts'>
import { defineComponent } from 'vue';
import semver from 'semver';
import { mapGetters } from 'vuex';

import { randomStr } from '@shell/utils/string';
import { isArray, removeObject } from '@shell/utils/array';
import { _CREATE } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { SETTING } from '@shell/config/settings';
import { parseAzureError } from '@shell/cloud-credential/azure.vue';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Labels from '@shell/components/form/Labels.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';

import type { AKSDiskType, AKSNodePool, AKSPoolMode, AKSConfig } from '../types/index';
import { diffUpstreamSpec, getAKSOptions } from '@pkg/aks/util/aks';
import {
  requiredInCluster,
  clusterNameChars,
  clusterNameStartEnd,
  clusterNameLength,
  resourceGroupChars,
  resourceGroupEnd,
  resourceGroupLength,
  ipv4WithOrWithoutCidr,
  ipv4WithCidr,
} from '@pkg/aks/util/validators';

import Accordion from '@pkg/aks/components/Accordion.vue';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';

const defaultNodePool = {
  availabilityZones:     ['1', '2', '3'],
  count:                 1,
  enableAutoScaling:     false,
  maxPods:               110,
  maxSurge:              '1',
  mode:                  'System' as AKSPoolMode,
  name:                  'agentpool',
  nodeLabels:            { },
  nodeTaints:            [],
  orchestratorVersion:   '',
  osDiskSizeGB:          128,
  osDiskType:            'Managed' as AKSDiskType,
  osType:                'Linux',
  vmSize:                'Standard_DS2_v2',
  _isNewOrUnprovisioned: true,
};

const defaultAksConfig = {
  clusterName:        '',
  imported:           false,
  linuxAdminUsername: 'azureuser',
  loadBalancerSku:    'Standard',
  networkPlugin:      'kubenet',
  nodePools:          [{ ...defaultNodePool }],
  privateCluster:     false,
  tags:               {}
};

const defaultCluster = {
  dockerRootDir:           '/var/lib/docker',
  enableClusterAlerting:   false,
  enableClusterMonitoring: false,
  enableNetworkPolicy:     false,
  labels:                  {},
  windowsPreferedCluster:  false,
  aksConfig:               defaultAksConfig
};

const DEFAULT_REGION = 'eastus';

const _NONE = 'none';

export default defineComponent({
  name: 'CruAKS',

  components: {
    SelectCredential,
    CruResource,
    LabeledSelect,
    AksNodePool,
    LabeledInput,
    Checkbox,
    FileSelector,
    KeyValue,
    ArrayList,
    ClusterMembershipEditor,
    Labels,
    Tabbed,
    Tab,
    Accordion
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // provisioning cluster object
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  // AKS provisioning needs to use the norman API - a provisioning cluster resource will be created byt he BE when the norman cluster is made but v2 prov clusters don't contain the relevant aks configuration fields
  async fetch() {
    if (this.value.id) {
      this.normanCluster = await this.value.findNormanCluster();
      // track original version on edit to ensure we don't offer k8s downgrades
      this.originalVersion = this.normanCluster?.aksConfig?.kubernetesVersion;
    } else {
      this.normanCluster = await this.$store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
    }
    if (!this.normanCluster.aksConfig) {
      this.$set(this.normanCluster, 'aksConfig', defaultAksConfig);
    }
    if (!this.normanCluster.aksConfig.nodePools) {
      this.$set(this.normanCluster.aksConfig, 'nodePools', [{ ...defaultNodePool }]);
    }
    this.config = this.normanCluster.aksConfig;
    this.nodePools = this.normanCluster.aksConfig.nodePools;
    this.containerMonitoring = !!(this.config.logAnalyticsWorkspaceGroup || this.config.logAnalyticsWorkspaceName);
    this.setAuthorizedIPRanges = !!(this.config?.authorizedIpRanges || []).length;
    this.nodePools.forEach((pool: AKSNodePool) => {
      this.$set(pool, '_id', randomStr());
      this.$set(pool, '_isNewOrUnprovisioned', this.isNewOrUnprovisioned);
    });
  },

  data() {
    // This setting is used by RKE1 AKS GKE and EKS - rke2/k3s have a different mechanism for fetching supported versions
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;
    const t = this.$store.getters['i18n/t'];

    return {
      normanCluster:    { name: '' } as any,
      nodePools:        [] as AKSNodePool[],
      config:           { } as AKSConfig,
      membershipUpdate: {} as any,
      originalVersion:  '',

      supportedVersionRange,
      locationOptions:       [] as string[],
      allAksVersions:        [] as string[],
      vmSizeOptions:         [] as string[],
      virtualNetworkOptions: [] as any[],
      defaultVmSize:         defaultNodePool.vmSize as string,

      // if the user changes these then switches to a region without them, show a fv error
      // if they change region without having touched these, just update the (default) value
      touchedVersion:        false,
      touchedVmSize:         false,
      touchedVirtualNetwork: false,

      networkPluginOptions: [
        { value: 'kubenet', label: t('aks.networkPlugin.options.kubenet') }, { value: 'azure', label: t('aks.networkPlugin.options.azure') }
      ],

      loadingLocations:       false,
      loadingVersions:        false,
      loadingVmSizes:         false,
      loadingVirtualNetworks: false,
      containerMonitoring:    false,
      setAuthorizedIPRanges:  false,
      fvFormRuleSets:         [{
        path:  'name',
        rules: ['nameRequired', 'clusterNameChars', 'clusterNameStartEnd', 'clusterNameLength'],
      },
      {
        path:  'resourceGroup',
        rules: ['resourceGroupRequired', 'resourceGroupLength', 'resourceGroupChars', 'resourceGroupEnd'],
      },
      {
        path:  'nodeResourceGroup',
        rules: ['nodeResourceGroupChars', 'nodeResourceGroupLength', 'nodeResourceGroupEnd'],
      },
      {
        path:  'dnsPrefix',
        rules: ['dnsPrefixRequired'],
      },
      {
        path:  'vmSize',
        rules: ['vmSizeAvailable']
      },
      {
        path:  'kubernetesVersion',
        rules: ['k8sVersionAvailable']
      },
      {
        path:  'networkPolicy',
        rules: ['networkPolicyAvailable']
      },
      {
        path:  'nodePools',
        rules: ['systemPoolRequired']
      },
      {
        path:  'authorizedIpRanges',
        rules: ['ipv4WithOrWithoutCidr']
      },
      {
        path:  'serviceCidr',
        rules: ['serviceCidr']
      },
      {
        path:  'podCidr',
        rules: ['podCidr']
      },
      {
        path:  'dockerBridgeCidr',
        rules: ['dockerBridgeCidr']
      },
      ],
    };
  },

  created() {
    this.registerBeforeHook(this.cleanPoolsForSave);
    this.registerBeforeHook(this.removeUnchangedConfigFields);
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    /**
     * fv mixin accepts a rootObject in rules but doesn't seem to like that the norman cluster isn't yet defined when the rule set is defined so we're ignoring that and passing in the key we want validated here
     * entire context is passed in so validators can check if a credential is selected and only run when the rest of the form is shown + use the i18n/t getter + get the norman cluster
     *  */

    fvExtraRules() {
      return {
        nameRequired:            requiredInCluster(this, 'nameNsDescription.name.label', 'name'),
        locationRequired:        requiredInCluster(this, 'aks.location.label', 'aksConfig.location'),
        resourceGroupRequired:   requiredInCluster(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        dnsPrefixRequired:       requiredInCluster(this, 'aks.dnsPrefix.label', 'aksConfig.dnsPrefix'),
        clusterNameChars:        clusterNameChars(this),
        clusterNameStartEnd:     clusterNameStartEnd(this),
        clusterNameLength:       clusterNameLength(this),
        resourceGroupChars:      resourceGroupChars(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupChars:  resourceGroupChars(this, 'aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        resourceGroupLength:     resourceGroupLength(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupLength: resourceGroupLength(this, 'aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        resourceGroupEnd:        resourceGroupEnd(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupEnd:    resourceGroupEnd(this, 'aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        ipv4WithOrWithoutCidr:   ipv4WithOrWithoutCidr(this, 'aks.authirizedIpRanges.label', 'aksConfig.authorizedIpRanges'),
        serviceCidr:             ipv4WithCidr(this, 'aks.serviceCidr.label', 'aksConfig.serviceCidr'),
        podCidr:                 ipv4WithCidr(this, 'aks.podCidr.label', 'aksConfig.podCidr'),
        dockerBridgeCidr:        ipv4WithCidr(this, 'aks.dockerBridgeCidr.label', 'aksConfig.dockerBridgeCidr'),

        vmSizeAvailable: () => {
          if (this.touchedVmSize) {
            let allAvailable = true;
            const badPools = [] as string[];

            this.nodePools.forEach((pool) => {
              if (!this.vmSizeOptions.find((opt) => opt === pool.vmSize)) {
                this.$set(pool, '_validSize', false);
                badPools.push(pool.name);
                allAvailable = false;
              } else {
                this.$set(pool, '_validSize', true);
              }
            });
            if (!allAvailable) {
              return this.t('aks.nodePools.vmSize.notAvailableInRegion', { pool: badPools[0], count: badPools.length });
            }
          }

          return undefined;
        },
        k8sVersionAvailable: () => {
          if (this.touchedVersion) {
            if (!this.aksVersionOptions.find((v: any) => v.value === this.config.kubernetesVersion)) {
              return this.t('aks.kubernetesVersion.notAvailableInRegion');
            }
          }

          return undefined;
        },
        networkPolicyAvailable: () => {
          if (this.touchedVirtualNetwork) {
            if (!this.virtualNetworkOptions.find((vn) => {
              return ( vn.name === this.config.virtualNetwork && vn.resourceGroup === this.config.virtualNetworkResourceGroup);
            })) {
              return this.t('aks.virtualNetwork.notAvailableInRegion');
            }
          }

          return undefined;
        },
        systemPoolRequired: () => {
          const systemPool = this.nodePools.find((pool) => pool.mode === 'System');

          return systemPool ? undefined : this.t('aks.nodePools.mode.systemRequired');
        },

      };
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned() {
      return this.mode === _CREATE || !this.normanCluster?.aksStatus?.upstreamSpec;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    showForm() {
      return this.config?.azureCredentialSecret;
    },

    // filter out versions outside ui-k8s-supported-versions-range global setting and versions < current version
    // sort versions, descending
    aksVersionOptions() {
      const filteredAndSortable = this.allAksVersions.filter((v: string) => {
        if (this.supportedVersionRange && !semver.satisfies(v, this.supportedVersionRange)) {
          return false;
        }
        if (this.originalVersion && semver.gt(this.originalVersion, v)) {
          return false;
        }

        return true;
      }).map((v: string) => {
        let label = v;

        if (v === this.originalVersion) {
          label = this.t('aks.kubernetesVersion.current', { version: v });
        }

        return {
          value: v,
          label,
          sort:  sortable(v)
        };
      });

      const sorted = sortBy(filteredAndSortable, 'sort:desc');

      if (!this.config.kubernetesVersion) {
        this.$set(this.config, 'kubernetesVersion', sorted[0]?.value);
      }

      return sorted;
    },

    canEditLoadBalancerSKU() {
      const poolsWithAZ = this.nodePools.filter((pool) => pool.availabilityZones && pool.availabilityZones.length);

      return !poolsWithAZ.length && this.isNewOrUnprovisioned;
    },

    hasAzureCNI() {
      return this.config.networkPlugin === 'azure';
    },

    networkPolicyOptions() {
      return [{
        value: _NONE,
        label: this.t('generic.none')
      }, {
        value: 'calico',
        label: 'Calico',
      },
      {
        value:    'azure',
        label:    'Azure',
        disabled: !this.hasAzureCNI
      }
      ];
    },

    networkPolicy: {
      get() {
        return this.config?.networkPolicy || _NONE;
      },
      set(neu: string) {
        if (neu === _NONE) {
          this.$set(this.config, 'networkPolicy', null);
        } else {
          this.$set(this.config, 'networkPolicy', neu);
        }
      }
    },

    canEditPrivateCluster() {
      return this.isNewOrUnprovisioned && !this.setAuthorizedIPRanges;
    },

    clusterId() {
      return this.value?.id || null;
    },

    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    }
  },

  watch: {
    canEditLoadBalancerSKU(neu) {
      if (!neu) {
        this.$set(this.config, 'loadBalancerSku', 'Standard');
      }
    },

    hasAzureCNI(neu) {
      if (!neu) {
        if (this.config.networkPolicy === 'azure') {
          this.$set(this.config, 'networkPolicy', undefined);
          this.touchedVirtualNetwork = false;
        }
        delete this.config.virtualNetwork;
        delete this.config.virtualNetworkResourceGroup;
      }
    },

    setAuthorizedIpRanges(neu) {
      if (neu) {
        this.$set(this.config, 'privateCluster', false);
      }
    },

    'config.azureCredentialSecret'(neu) {
      if (neu) {
        this.resetCredentialDependentProperties();
        this.getLocations();
      }
    },

    'config.resourceLocation'(neu) {
      if (neu) {
        this.getAksVersions();
        this.getVmSizes();
        this.getVirtualNetworks();
      }
    },

    // a validation error is shown if the region is changed and the below two fields are no longer valid - if the user hasn't set them we should just update to a valid default and not show the error
    'config.virtualNetwork'(neu) {
      if (neu) {
        this.touchedVirtualNetwork = true;
      }
    },

    'config.kubernetesVersion'(neu, old) {
      if (neu && old) {
        this.touchedVersion = true;
      }
    },
  },

  methods: {
    // reset properties dependent on AKS queries so if they're lodaded with a valid credential then an invalid credential is selected, they're cleared
    resetCredentialDependentProperties() {
      this.locationOptions = [];
      this.allAksVersions = [];
      this.vmSizeOptions = [];
      this.virtualNetworkOptions = [];
      delete this.config?.kubernetesVersion;
      this.errors = [];
    },

    getLocations() {
      this.loadingLocations = true;
      // this will force the resourceLocation watcher to re-run every time new locations are fetched even if the default one selected hasn't changed
      this.$set(this.config, 'resourceLocation', '');

      const { azureCredentialSecret, resourceLocation } = this.config;

      getAKSOptions(this, azureCredentialSecret, resourceLocation, this.clusterId, 'aksLocations')
        .then((res: any[]) => {
          this.locationOptions = res;
          if (!this.config?.resourceLocation) {
            if (res.find((r) => r.name === DEFAULT_REGION)) {
              this.$set(this.config, 'resourceLocation', DEFAULT_REGION);
            } else {
              this.$set(this.config, 'resourceLocation', res[0]?.name);
            }
          }
          this.loadingLocations = false;
        }).catch((err: any) => {
          this.loadingLocations = false;
          const parsedError = parseAzureError(err.error || '');

          this.errors.push(this.t('aks.errors.regions', { e: parsedError || err }));
        });
    },

    getAksVersions() {
      this.loadingVersions = true;
      this.allAksVersions = [];
      const { azureCredentialSecret, resourceLocation } = this.config;

      getAKSOptions(this, azureCredentialSecret, resourceLocation, this.clusterId, 'aksVersions')
        .then((res: string[]) => {
        // the default version is set once these are filtered and sorted in computed prop
          this.allAksVersions = res;
          this.loadingVersions = false;
        }).catch((err: any) => {
          this.loadingVersions = false;

          const parsedError = parseAzureError(err.error || '');

          this.errors.push(this.t('aks.errors.kubernetesVersions', { e: parsedError || err }));
        });
    },

    getVmSizes() {
      this.loadingVmSizes = true;
      this.vmSizeOptions = [];
      const { azureCredentialSecret, resourceLocation } = this.config;

      getAKSOptions(this, azureCredentialSecret, resourceLocation, this.clusterId, 'aksVMSizes')
        .then((res: string[]) => {
          if (isArray(res)) {
            this.vmSizeOptions = res.sort();

            if (!this.vmSizeOptions.includes(this.defaultVmSize)) {
              this.defaultVmSize = '';
            }
          }

          this.loadingVmSizes = false;
        }).catch((err: any) => {
          this.loadingVmSizes = false;

          const parsedError = parseAzureError(err.error || '');

          this.errors.push(this.t('aks.errors.vmSizes', { e: parsedError || err }));
        });
    },

    getVirtualNetworks() {
      this.loadingVirtualNetworks = true;
      this.virtualNetworkOptions = [];
      const { azureCredentialSecret, resourceLocation } = this.config;

      getAKSOptions(this, azureCredentialSecret, resourceLocation, this.clusterId, 'aksVirtualNetworks')
        .then((res: any) => {
          if (res && isArray(res)) {
            this.virtualNetworkOptions = res;
          }

          this.loadingVirtualNetworks = false;
        }).catch((err: any) => {
          const parsedError = parseAzureError(err.error || '');

          this.loadingVirtualNetworks = false;
          this.errors.push(this.t('aks.errors.virtualNetworks', { e: parsedError || err }));
        });
    },

    addPool() {
      let poolName = `pool${ this.nodePools.length }`;
      let mode: AKSPoolMode = 'User';
      const _id = randomStr();

      if (!this.nodePools.length) {
        poolName = 'agentPool';
        // there must be at least one System pool so if it's the first pool, default to that
        mode = 'System' as AKSPoolMode;
      }

      this.nodePools.push({
        ...defaultNodePool, name: poolName, _id, mode, vmSize: this.defaultVmSize
      });

      this.$nextTick(() => {
        if ( this.$refs.pools?.select ) {
          this.$refs.pools.select(poolName);
        }
      });
    },

    removePool(idx: number) {
      const pool = this.nodePools[idx];

      removeObject(this.nodePools, pool);
    },

    selectNetwork(network: any) {
      this.$set(this.config, 'virtualNetwork', network.name);
      this.$set(this.config, 'virtualNetworkResourceGroup', network.resourceGroup);
    },

    setClusterName(name: string) {
      this.$set(this.normanCluster, 'name', name);
      this.$set(this.config, 'clusterName', name);
    },

    onMembershipUpdate(update: any) {
      this.$set(this, 'membershipUpdate', update);
    },

    async saveRoleBindings() {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // these fields are used purely in UI, to track individual nodepool components
    cleanPoolsForSave() {
      this.nodePools.forEach((pool) => {
        delete pool._id;
        delete pool._isNewOrUnprovisioned;
        delete pool._validSize;
      });
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    removeUnchangedConfigFields() {
      const upstreamConfig = this.normanCluster?.status?.aksStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.$set(this.normanCluster, 'aksConfig', diff);
      }
    },

    async actuallySave() {
      await this.normanCluster.save();
    }
  },

});
</script>

<template>
  <CruResource
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
  >
    <div class="mb-20">
      <SelectCredential
        v-model="config.azureCredentialSecret"
        :mode="isNewOrUnprovisioned ? 'create' : 'view'"
        provider="azure"
        :default-on-cancel="true"
        :showing-form="true"
        class="mt-20"
      />
    </div>
    <div v-if="showForm">
      <div class="row mb-10">
        <div class="col span-4">
          <LabeledInput
            :value="normanCluster.name"
            :mode="mode"
            label-key="generic.name"
            required
            :rules="fvGetAndReportPathRules('name')"
            @input="setClusterName"
          />
        </div>
        <div

          class="col span-4"
        >
          <LabeledSelect
            v-model="config.resourceLocation"
            :mode="mode"
            :options="locationOptions"
            option-label="displayName"
            option-key="name"
            label-key="aks.location.label"
            :reduce="opt=>opt.name"
            :loading="loadingLocations"
            required
            :disabled="!isNewOrUnprovisioned"
          />
        </div>
        <div
          class="col span-4"
        >
          <LabeledSelect
            v-model="config.kubernetesVersion"
            :mode="mode"
            :options="aksVersionOptions"
            label-key="aks.kubernetesVersion.label"
            option-key="value"
            option-label="label"
            :loading="loadingVersions"
            required
            :rules="fvGetAndReportPathRules('kubernetesVersion')"
          />
        </div>
      </div>
      <template v-if="config.resourceLocation && config.resourceLocation.length">
        <div><h4>{{ t('aks.nodePools.title') }}</h4></div>
        <Tabbed
          ref="pools"
          :side-tabs="true"
          :show-tabs-add-remove="mode !== 'view'"
          :rules="fvGetAndReportPathRules('vmSize')"
          class="mb-10"
          @addTab="addPool($event)"
          @removeTab="removePool($event)"
        >
          <Tab
            v-for="(pool, i) in nodePools"
            :key="pool._id"
            :name="pool.name"
            :label="pool.name || t('aks.nodePools.notNamed')"
            :error="pool._validSize === false"
          >
            <AksNodePool
              :mode="mode"
              :region="config.resourceLocation"
              :pool="pool"
              :vm-size-options="vmSizeOptions"
              :loading-vm-sizes="loadingVmSizes"
              :isPrimaryPool="i===0"
              :rules="fvGetAndReportPathRules('minCount', 'maxCount')"
              @remove="removePool(pool)"
              @vmSizeSet="touchedVmSize = true"
            />
          </Tab>
        </Tabbed>

        <Accordion
          :open-initially="true"
          class="mb-10"
          title-key="aks.accordions.basics"
        >
          <div
            :style="{'display': 'flex', 'align-items':'center'}"
            class="row mb-10"
          >
            <div class="col span-3">
              <LabeledInput
                v-model="config.linuxAdminUsername"
                :mode="mode"
                label-key="aks.linuxAdminUsername.label"
                :disabled="!isNewOrUnprovisioned"
                placeholder-key="aks.linuxAdminUsername.placeholder"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="config.resourceGroup"
                :mode="mode"
                label-key="aks.clusterResourceGroup.label"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('resourceGroup')"
                :required="true"
                placeholder-key="aks.clusterResourceGroup.placeholder"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="config.nodeResourceGroup"
                :mode="mode"
                label-key="aks.nodeResourceGroup.label"
                :rules="fvGetAndReportPathRules('nodeResourceGroup')"
                :disabled="!isNewOrUnprovisioned"
                placeholder-key="aks.nodeResourceGroup.placeholder"
              />
            </div>
            <div class="col span-3">
              <Checkbox
                v-model="containerMonitoring"
                :mode="mode"
                label-key="aks.containerMonitoring.label"
              />
            </div>
          </div>

          <div class="row mb-10">
            <template v-if="containerMonitoring">
              <div class="col span-3">
                <LabeledInput
                  v-model="config.logAnalyticsWorkspaceGroup"
                  :mode="mode"
                  label-key="aks.logAnalyticsWorkspaceGroup.label"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  v-model="config.logAnalyticsWorkspaceName"
                  :mode="mode"
                  label-key="aks.logAnalyticsWorkspaceName.label"
                />
              </div>
            </template>
          </div>
          <div class="row mb-10">
            <div class="col span-6">
              <div class="ssh-key">
                <LabeledInput
                  v-model="config.sshPublicKey"
                  :mode="mode"
                  label-key="aks.sshPublicKey.label"
                  type="multiline"
                  placeholder-key="aks.sshPublicKey.placeholder"
                />
                <FileSelector
                  :mode="mode"
                  :label="t('aks.sshPublicKey.readFromFile')"
                  class="role-tertiary mt-10"
                  @selected="e=>$set(config, 'sshPublicKey', e)"
                />
              </div>
            </div>
            <div class="col span-6">
              <KeyValue
                v-model="config.tags"
                :mode="mode"
                :title="t('aks.tags.label')"
                :add-label="t('aks.tags.addLabel')"
              >
                <template #title>
                  <div class="text-label">
                    {{ t('aks.tags.label') }}
                  </div>
                </template>
              </KeyValue>
            </div>
          </div>
        </Accordion>
        <Accordion
          class="mb-10"
          title-key="aks.accordions.networking"
          :open-initially="true"
        >
          <div class="row mb-10">
            <div class="col span-3">
              <LabeledSelect
                v-model="config.loadBalancerSku"
                label-key="aks.loadBalancerSku.label"
                :tooltip="t('aks.loadBalancerSku.tooltip')"
                :disabled="!canEditLoadBalancerSKU || !isNewOrUnprovisioned"
                :options="['Standard', 'Basic']"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="config.dnsPrefix"
                :mode="mode"
                label-key="aks.dns.label"
                :disabled="!isNewOrUnprovisioned"
                :required="true"
                :rules="fvGetAndReportPathRules('dnsPrefix')"
                placeholder-key="aks.dns.placeholder"
              />
            </div>
          </div>
          <div class="row mb-10">
            <div class="col span-3">
              <LabeledSelect
                v-model="config.networkPlugin"
                :mode="mode"
                :options="networkPluginOptions"
                label-key="aks.networkPlugin.label"
                :disabled="!isNewOrUnprovisioned"
              />
            </div>
            <div class="col span-3">
              <LabeledSelect
                v-model="networkPolicy"
                :mode="mode"
                :options="networkPolicyOptions"
                label-key="aks.networkPolicy.label"
                option-key="value"
                :reduce="opt=>opt.value"
                tooltip-key="aks.networkPolicy.tooltip"
                :disabled="!isNewOrUnprovisioned"
              />
            </div>
            <template v-if="hasAzureCNI">
              <div
                class="col span-3"
              >
                <LabeledSelect
                  :value="config.virtualNetwork"
                  label-key="aks.virtualNetwork.label"
                  :mode="mode"
                  :options="virtualNetworkOptions"
                  :loading="loadingVirtualNetworks"
                  option-label="name"
                  :disabled="!isNewOrUnprovisioned"
                  :rules="fvGetAndReportPathRules('networkPolicy')"
                  @selecting="selectNetwork($event)"
                />
              </div>
            </template>
          </div>

          <!-- azure cni configuration -->
          <template v-if="hasAzureCNI">
            <div class="row mb-10">
              <div class="col span-3">
                <LabeledInput
                  v-model="config.serviceCidr"
                  :mode="mode"
                  label-key="aks.serviceCidr.label"
                  :tooltip="t('aks.serviceCidr.tooltip')"
                  :disabled="!isNewOrUnprovisioned"
                  :rules="fvGetAndReportPathRules('serviceCidr')"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  v-model="config.podCidr"
                  :mode="mode"
                  label-key="aks.podCidr.label"
                  :disabled="!isNewOrUnprovisioned"
                  :rules="fvGetAndReportPathRules('podCidr')"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  v-model="config.dnsServiceIp"
                  :mode="mode"
                  label-key="aks.dnsServiceIp.label"
                  :tooltip="t('aks.dnsServiceIp.tooltip')"
                  :disabled="!isNewOrUnprovisioned"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  v-model="config.dockerBridgeCidr"
                  :mode="mode"
                  label-key="aks.dockerBridgeCidr.label"
                  :tooltip="t('aks.dockerBridgeCidr.tooltip')"
                  :disabled="!isNewOrUnprovisioned"
                  :rules="fvGetAndReportPathRules('dockerBridgeCidr')"
                />
              </div>
            </div>
          </template>
          <div class="row mb-10">
            <div class="networking-checkboxes col span-6">
              <Checkbox
                v-model="value.enableNetworkPolicy"
                :mode="mode"
                label-key="aks.enableNetworkPolicy.label"
                :disabled="!isNewOrUnprovisioned"
              />
              <Checkbox
                v-model="config.httpApplicationRouting"
                :mode="mode"
                label-key="aks.httpApplicationRouting.label"
              />
              <Checkbox
                v-model="config.privateCluster"
                :mode="mode"
                label-key="aks.privateCluster.label"
                :disabled="!canEditPrivateCluster"
              />
              <Checkbox
                v-model="setAuthorizedIPRanges"
                :mode="mode"
                label-key="aks.setAuthorizedIPRanges.label"
                :disabled="config.privateCluster"
              />
            </div>
            <div
              v-if="setAuthorizedIPRanges"
              class="col span-6"
            >
              <ArrayList
                v-model="config.authorizedIpRanges"
                :mode="mode"
                :initial-empty-row="true"
                value-placeholder="10.0.0.0/14"
                :label="t('aks.authorizedIpRanges.label')"
                :rules="fvGetAndReportPathRules('authorizedIpRanges')"
                @input="$emit('validationChanged')"
              >
                <template #title>
                  <div class="text-label">
                    {{ t('aks.authorizedIpRanges.label') }}
                  </div>
                </template>
              </ArrayList>
            </div>
          </div>
        </Accordion>
        <Accordion
          class="mb-10"
          title-key="aks.accordions.clusterMembers"
        >
          <ClusterMembershipEditor
            v-if="canManageMembers"
            :mode="mode"
            :parent-id="normanCluster.id ? normanCluster.id : null"
            @membership-update="onMembershipUpdate"
          />
        </Accordion>
        <Accordion
          class="mb-10"
          title-key="aks.accordions.labels"
        >
          <Labels
            v-model="normanCluster"
            :mode="mode"
          />
        </Accordion>
      </template>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
  .networking-checkboxes {
    display: flex;
    flex-direction: column;

    &>*{
      margin-bottom: 10px;
    }
  }

  .node-pool {
    // border: 1px solid var(--subtle-border);
    padding: 10px;
  }
</style>
