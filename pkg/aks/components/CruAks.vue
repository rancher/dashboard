<script lang='ts'>
import { defineComponent } from 'vue';

import semver from 'semver';

import { addParams, QueryParams } from '@shell/utils/url';
import { randomStr } from '@shell/utils/string';
import { isArray, removeObject } from '@shell/utils/array';
import { _CREATE } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';

import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';

import type { AKSDiskType, AKSNodePool, AKSPoolMode } from '../types/index';

import { SETTING } from 'config/settings';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';

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
  // todo nb default from available opts?
  vmSize:              'Standard_DS2_v2',
  _isNew:              true,
};

const defaultAksConfig = {
  clusterName:        'nb-aks-3',
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
    ClusterMembershipEditor
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

  // todo nb fetch norman cluster on edit/clone
  async fetch() {
    if (this.value.id) {
      this.normanCluster = await this.value.findNormanCluster();
      this.credentialId = this.normanCluster?.aksConfig?.azureCredentialSecret;
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
    this.containerMonitoring = (this.config.logAnalyticsWorkspaceGroup || this.config.logAnalyticsWorkspaceName);
    this.setAuthorizedIPRanges = !!(this.config?.authorizedIpRanges || []).length;
    this.normanCluster.spec.aksConfig.nodePools.forEach((pool: AKSNodePool) => this.$set(pool, '_id', randomStr()));
    // if (this.credentialId && this.region) {
    //   this.getAksVersions();
    //   this.getVmSizes();
    //   this.getVirtualNetworks();
    // }
  },

  data() {
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      normanCluster:    {} as any,
      nodePools:        [] as AKSNodePool[],
      // todo nb aksConfig type?
      config:           {} as any,
      membershipUpdate: {} as any,
      originalVersion:  '',

      supportedVersionRange,
      locationOptions:       [],
      allAksVersions:        [],
      vmSizeOptions:         [],
      virtualNetworkOptions: [],
      defaultVmSize:         '',

      // TODO nb translations
      networkPluginOptions: [
        { value: 'kubenet', label: 'Kubenet' }, { value: 'azure', label: 'Azure CNI' }
      ],

      loadingLocations:       false,
      loadingVersions:        false,
      loadingVmSizes:         false,
      loadingVirtualNetworks: false,
      containerMonitoring:    false,
      setAuthorizedIPRanges:  false

    };
  },

  created() {
    this.registerBeforeHook(this.cleanPoolsForSave);
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    // todo nb allow edit when no upstream cluster created yet
    isNew() {
      return this.mode === _CREATE;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },
    showForm() {
      return this.config?.azureCredentialSecret;
    },

    // todo nb sort
    // todo nb do not allow downgrade
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
        return {
          value: v,
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

    networkPolicyOptions() {
      return [{
        value: undefined,
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
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksLocations', false) }).then((res) => {
        console.log('aks regions: ', res);
        this.locationOptions = res;
        this.loadingLocations = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    getAksVersions() {
      this.loadingVersions = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVersions') }).then((res) => {
        console.log('aks k8s versions: ', res);
        this.allAksVersions = res;

        if (!this.config.kubernetesVersion) {
          this.config.kubernetesVersion = this.aksVersionOptions[0];
        }
        this.loadingVersions = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    getVmSizes() {
      this.loadingVmSizes = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVMSizes') }).then((res) => {
        console.log('aks vm sizes: ', res);

        this.vmSizeOptions = res;
        // todo nb more intelligent default size
        // todo nb set size on default node pool
        this.defaultPoolSize = this.vmSizeOptions[0];
        this.loadingVmSizes = false;
      }).catch((err) => {
        // TODO nb formatting
        this.errors.push(err);
      });
    },

    getVirtualNetworks() {
      this.loadingVirtualNetworks = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVirtualNetworks') }).then((res) => {
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

      // TODO nb default size
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

    cleanPoolsForSave() {
      this.nodePools.forEach((pool) => {
        delete pool._id;
        delete pool._isNew;
      });
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
        // todo nb prov id?
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

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
            @input="setClusterName"
          />
        </div>
      </div>
      //TODO labels/annotations from rke2 component -->
      <div class="row mb-10">
        <ClusterMembershipEditor
          v-if="canManageMembers"
          :mode="mode"
          :parent-id="normanCluster.id ? normanCluster.id : null"
          @membership-update="onMembershipUpdate"
        />
      </div>
      <div class="row mb-10">
        <div
          v-if="locationOptions.length"
          class="col span-4"
        >
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
              option-label="value"
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
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="config.nodeResourceGroup"
              :mode="mode"
              label="node resource group"
              :disabled="!isNew"
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
              v-model="config.networkPolicy"
              :mode="mode"
              :options="networkPolicyOptions"
              label="network policy"
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
            :region="region"
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
