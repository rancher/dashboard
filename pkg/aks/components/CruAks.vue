<script lang='ts'>
// todo nb aksClusterConfig not properly deleted? Do we need to delete the norman aks cluster?
import { defineComponent } from 'vue';

import semver from 'semver';

import { addParams, QueryParams } from '@shell/utils/url';
import { randomStr } from '@shell/utils/string';
import { isArray, removeObject } from '@shell/utils/array';
import { _CREATE } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';

import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import FormValidation from '@shell/mixins/form-validation';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Labels from '@shell/components/form/Labels.vue';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import CreateEditView from '@shell/mixins/create-edit-view';

import type { AKSDiskType, AKSNodePool, AKSPoolMode } from '../types/index';

import { SETTING } from 'config/settings';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { clone, get } from '@shell/utils/object';
import { diffUpstreamSpec } from '@pkg/aks/util/aks';
import { mapGetters } from 'vuex';

const defaultNodePool = {
  availabilityZones:   ['1', '2', '3'],
  count:               1,
  enableAutoScaling:   false,
  maxPods:             110,
  maxSurge:            '1',
  mode:                'System' as AKSPoolMode,
  name:                'agentpool',
  nodeLabels:          { },
  nodeTaints:          [],
  orchestratorVersion: '',
  osDiskSizeGB:        128,
  osDiskType:          'Managed' as AKSDiskType,
  osType:              'Linux',
  vmSize:              'Standard_DS2_v2',
  _isNew:              true,
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
    Labels
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    if (this.value.id) {
      this.normanCluster = await this.value.findNormanCluster();
      this.originalVersion = this.normanCluster?.aksConfig?.kubernetesVersion;
      // on edit, only values which have been changed will be sent in PUT request so we need to track the original spec
      this.originalCluster = clone(this.normanCluster);
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
    this.containerMonitoring = (this.config.logAnalyticsWorkspaceGroup || this.config.logAnalyticsWorkspaceName);
    this.setAuthorizedIPRanges = !!(this.config?.authorizedIpRanges || []).length;
    this.normanCluster.spec.aksConfig.nodePools.forEach((pool: AKSNodePool) => this.$set(pool, '_id', randomStr()));
  },

  data() {
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      normanCluster:    { name: '' } as any,
      nodePools:        [] as AKSNodePool[],
      // todo nb aksConfig type?
      config:           { } as any,
      membershipUpdate: {} as any,
      originalVersion:  '',
      originalCluster:  {} as any,

      supportedVersionRange,
      locationOptions:       [] as string[],
      allAksVersions:        [] as string[],
      vmSizeOptions:         [] as string[],
      virtualNetworkOptions: [] as any[],
      defaultVmSize:         defaultNodePool.vmSize as string,

      // TODO nb translations
      networkPluginOptions: [
        { value: 'kubenet', label: 'Kubenet' }, { value: 'azure', label: 'Azure CNI' }
      ],

      loadingLocations:       false,
      loadingVersions:        false,
      loadingVmSizes:         false,
      loadingVirtualNetworks: false,
      containerMonitoring:    false,
      setAuthorizedIPRanges:  false,
      fvFormRuleSets:         [{
        path:  'name',
        rules: ['nameRequired'],
      },
      {
        path:  'resourceGroup',
        rules: ['resourceGroupRequired'],
      },
      {
        path:  'nodeResourceGroup',
        rules: ['nodeResourceGroupRequired'],
      },
      {
        path:  'dnsPrefix',
        rules: ['dnsPrefixRequired'],
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

    fvExtraRules() {
      const requiredTranslation = (labelKey = 'Value') => {
        return this.t('validation.required', { key: this.t(labelKey) });
      };

      const labeledRequired = (labelKey: string, clusterKey: string) => {
        return () => {
          console.log('calculating required rule for key', clusterKey);

          return clusterKey && !get(this.normanCluster, clusterKey) ? requiredTranslation(labelKey) : undefined;
        };
      };

      return {
        nameRequired:              labeledRequired('nameNsDescription.name.label', 'name'),
        locationRequired:          labeledRequired('aks.location.label', 'aksConfig.location'),
        resourceGroupRequired:     labeledRequired('aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupRequired: labeledRequired('aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        dnsPrefixRequired:         labeledRequired('aks.dnsPrefix.label', 'aksConfig.dnsPrefix')

      };
    },

    // todo nb allow edit when no upstream cluster created yet
    // todo nb is this bad ux? Form will abruptly become largely un-editable
    isNew() {
      return this.mode === _CREATE;
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
          // todo nb localize
          label = `${ v }(current)`;
        }

        return {
          value: v,
          label,
          sort:  sortable(v)
        };
      });

      return sortBy(filteredAndSortable, 'sort:desc');
    },

    canEditLoadBalancerSKU() {
      const poolsWithAZ = this.nodePools.filter((pool) => pool.availabilityZones && pool.availabilityZones.length);

      return !poolsWithAZ.length && this.isNew;
    },

    hasAzureCNI() {
      return this.config.networkPlugin === 'azure';
    },

    // todo nb translate none option
    networkPolicyOptions() {
      return [{
        value: _NONE,
        label: 'None'
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
      set(neu) {
        if (neu === _NONE) {
          this.$set(this.config, 'networkPolicy', null);
        } else {
          this.$set(this.config, 'networkPolicy', neu);
        }
      }
    },

    canEditPrivateCluster() {
      return this.isNew && !this.setAuthorizedIPRanges;
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

    // todo nb clear addr ranges? Old UI doesn't do this: oversight?
    hasAzureCNI(neu) {
      if (!neu) {
        if (this.config.networkPolicy === 'azure') {
          this.$set(this.config, 'networkPolicy', undefined);
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
        this.getLocations();
      }
    },

    'config.resourceLocation'(neu) {
      if (neu) {
        this.getAksVersions();
        this.getVmSizes();
        this.getVirtualNetworks();
      }
    }

  },

  methods: {
    // todo nb move aks requests to utils for easier testing
    aksUrlFor(path: string, useRegion = true): string | null {
      const { azureCredentialSecret, resourceLocation } = this.config;

      if (!azureCredentialSecret) {
        return null;
      }
      const params: QueryParams = { cloudCredentialId: azureCredentialSecret };

      if (useRegion) {
        params.region = resourceLocation;
      }
      if (this.clusterId) {
        params.clusterId = this.clusterId;
      }

      return addParams(`/meta/${ path }`, params );
    },

    getLocations() {
      this.loadingLocations = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksLocations', false) }).then((res: any[]) => {
        console.log('aks regions: ', res);
        this.locationOptions = res;
        if (!this.config?.resourceLocation) {
          if (res.find((r) => r.name === DEFAULT_REGION)) {
            this.$set(this.config, 'resourceLocation', DEFAULT_REGION);
          } else {
            this.$set(this.config, 'resourceLocation', res[0]?.name);
          }
        }
        this.loadingLocations = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    getAksVersions() {
      this.loadingVersions = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVersions') }).then((res: string[]) => {
        console.log('aks k8s versions: ', res);
        this.allAksVersions = res;

        if (!this.config.kubernetesVersion) {
          this.$set(this.config, 'kubernetesVersion', this.aksVersionOptions[0]);
        }
        this.loadingVersions = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    // todo nb sort
    getVmSizes() {
      this.loadingVmSizes = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVMSizes') }).then((res: string[]) => {
        console.log('aks vm sizes: ', res);
        if (isArray(res)) {
          this.vmSizeOptions = res.sort();

          if (!this.vmSizeOptions.includes(this.defaultVmSize)) {
            this.defaultVmSize = '';
          }
        }

        this.loadingVmSizes = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    getVirtualNetworks() {
      this.loadingVirtualNetworks = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVirtualNetworks') }).then((res: any) => {
        console.log('aks virtual networks: ', res);
        if (res && isArray(res)) {
          this.virtualNetworkOptions = res;
        }

        this.loadingVirtualNetworks = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    addPool() {
      let poolName = `pool${ this.nodePools.length }`;
      let mode: AKSPoolMode = 'User';

      if (!this.nodePools.length) {
        poolName = 'agentPool';
        mode = 'System' as AKSPoolMode;
      }

      this.nodePools.push({
        ...defaultNodePool, name: poolName, _id: randomStr(), mode, vmSize: this.defaultVmSize
      });
    },

    removePool(pool: AKSNodePool) {
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

    cleanPoolsForSave() {
      this.nodePools.forEach((pool) => {
        delete pool._id;
        delete pool._isNew;
      });
    },

    // only save values that differ from upstream
    // todo nb remove null?
    removeUnchangedConfigFields() {
      const upstreamConfig = this.normanCluster?.status?.aksStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.$set(this.normanCluster, 'aksConfig', diff);
      }
    },

    // todo nb fetch prov clusters so cluster list populated right away
    async actuallySave(cb) {
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
        :mode="isNew ? 'create' : 'view'"
        provider="azure"
        :default-on-cancel="true"
        :showing-form="true"
        class="mt-20"
      />
    </div>
    <div v-if="showForm">
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            :value="normanCluster.name"
            :mode="mode"
            label="name"
            required
            :rules="fvGetAndReportPathRules('name')"
            @input="setClusterName"
          />
        </div>
      </div>
      <div class="row mb-10">
        <ClusterMembershipEditor
          v-if="canManageMembers"
          :mode="mode"
          :parent-id="normanCluster.id ? normanCluster.id : null"
          @membership-update="onMembershipUpdate"
        />
      </div>
      <div class="row mb-10">
        <Labels
          v-model="normanCluster"
          :mode="mode"
        />
      </div>
      <div class="row mb-10">
        <div
          v-if="locationOptions.length"
          class="col span-4"
        >
          <!-- //TODO nb warn when changing if dependent vals have been changed -->
          <LabeledSelect
            v-model="config.resourceLocation"
            :mode="mode"
            :options="locationOptions"
            option-label="displayName"
            option-key="name"
            label="Location"
            :reduce="opt=>opt.name"
            :loading="loadingLocations"
            required
            :disabled="!isNew"
          />
        </div>
      </div>

      <template v-if="config.resourceLocation && config.resourceLocation.length">
        <!-- cluster config -->
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledSelect
              v-model="config.kubernetesVersion"
              :mode="mode"
              :options="aksVersionOptions"
              label="kubernetes version"
              option-key="value"
              option-label="label"
              :loading="loadingVersions"
              required
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="config.linuxAdminUsername"
              :mode="mode"
              label="linux admin username"
              :disabled="!isNew"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledInput
              v-model="config.resourceGroup"
              :mode="mode"
              label="cluster resource group"
              :disabled="!isNew"
              :rules="fvGetAndReportPathRules('resourceGroup')"
              :required="true"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="config.nodeResourceGroup"
              :mode="mode"
              label="node resource group"
              :disabled="!isNew"
              :rules="fvGetAndReportPathRules('nodeResourceGroup')"
              :required="true"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-4">
            <Checkbox
              v-model="containerMonitoring"
              :mode="mode"
              label="configure container monitoring"
            />
          </div>
          <template v-if="containerMonitoring">
            <div class="col span-4">
              <LabeledInput
                v-model="config.logAnalyticsWorkspaceGroup"
                :mode="mode"
                label="log analytics workspace resource group"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                v-model="config.logAnalyticsWorkspaceName"
                :mode="mode"
                label="log analytics workspace name"
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
                label="SSH public key"
                type="multiline"
              />
              <FileSelector
                :mode="mode"
                label="read from a file"
                class="role-tertiary"
                @selected="e=>$set(config, 'sshPublicKey', e)"
              />
            </div>
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-12">
            <KeyValue
              v-model="config.tags"
              :mode="mode"
              title="tags"
            />
          </div>
        </div>

        <!-- networking -->
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledSelect
              v-model="config.loadBalancerSku"
              label="loadbalancer sku"
              tooltip="load balancer sku must be 'standard' if availability zones have been selected"
              :disabled="!canEditLoadBalancerSKU || !isNew"
              :options="['Standard', 'Basic']"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledSelect
              v-model="networkPolicy"
              :mode="mode"
              :options="networkPolicyOptions"
              label="network policy"
              option-key="value"
              :reduce="opt=>opt.value"
              tooltip="azure is only available when azure has been selected as the network plugin"
              :disabled="!isNew"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="config.dnsPrefix"
              :mode="mode"
              label="dns prefix"
              :disabled="!isNew"
              :required="true"
              :rules="fvGetAndReportPathRules('dnsPrefix')"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledSelect
              v-model="config.networkPlugin"
              :mode="mode"
              :options="networkPluginOptions"
              label="network plugin"
              :disabled="!isNew"
            />
          </div>
        </div>
        <!-- azure cni configuration -->
        <template v-if="hasAzureCNI">
          <div class="row mb-10">
            <div class="col span-4">
              <!-- //todo nb nicer display -->
              <LabeledSelect
                :value="config.virtualNetwork"
                label="virtual network"
                :mode="mode"
                :options="virtualNetworkOptions"
                :loading="loadingVirtualNetworks"
                option-label="name"
                :disabled="!isNew"
                @selecting="selectNetwork($event)"
              />
            </div>
          </div>
          <div class="row mb-10">
            <div class="col span-3">
              <LabeledInput
                v-model="config.serviceCidr"
                :mode="mode"
                label="kubernetes service address range"
                :disabled="!isNew"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="config.podCidr"
                :mode="mode"
                label="kubernetes pod address range"
                :disabled="!isNew"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="config.dnsServiceIp"
                :mode="mode"
                label="kubernetes dns service ip range"
                :disabled="!isNew"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="config.dockerBridgeCidr"
                :mode="mode"
                label="docker bridge address"
                :disabled="!isNew"
              />
            </div>
          </div>
        </template>
        <div class="row mb-10">
          <div class="col span-3">
            <Checkbox
              v-model="value.enableNetworkPolicy"
              :mode="mode"
              label="project network isolation"
              :disabled="!isNew"
            />
          </div>
          <div class="col span-3">
            <Checkbox
              v-model="config.httpApplicationRouting"
              :mode="mode"
              label="http application routing"
            />
          </div>
          <div class="col span-3">
            <Checkbox
              v-model="setAuthorizedIPRanges"
              :mode="mode"
              label="set authorized ip ranges"
              :disabled="config.privateCluster"
            />
          </div>

          <div class="col span-3">
            <Checkbox
              v-model="config.privateCluster"
              :mode="mode"
              label="enable private cluster"
              :disabled="!canEditPrivateCluster"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-6">
            <ArrayList
              v-model="config.authorizedIpRanges"
              :mode="mode"
              label="authorized ip ranges"
            />
          </div>
        </div>

        <!-- node pools -->
        <div
          v-for="(pool, i) in nodePools"
          :key="pool._id"
          class="mb-10"
        >
          <AksNodePool
            :mode="mode"
            :region="config.resourceLocation"
            :pool="pool"
            :vm-size-options="vmSizeOptions"
            :loading-vm-sizes="loadingVmSizes"
            :isPrimaryPool="i===0"
            @remove="removePool(pool)"
          />
        </div>
        <div>
          <button
            type="button"
            class="btn role-tertiary"
            @click="addPool"
          >
            add node pool
          </button>
        </div>
      </template>
    </div>
  </CruResource>
</template>
