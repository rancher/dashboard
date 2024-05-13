<script lang='ts'>
import semver from 'semver';
import { mapGetters, Store } from 'vuex';
import { defineAsyncComponent, defineComponent } from 'vue';
import cloneDeep from 'lodash/cloneDeep';

import { randomStr } from '@shell/utils/string';
import { isArray, removeObject } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { SETTING } from '@shell/config/settings';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
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
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';

import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import type { GKEConfig, GKENodePool } from '../types';
import AccountAccess from './AccountAccess.vue';
import AdvancedOptions from './AdvancedOptions.vue';
import Networking from './Networking.vue';
import GKENodePoolComponent from './GKENodePool.vue';
import Config from './Config.vue';
import { DEFAULT_GCP_ZONE, imageTypes, getGKEMachineTypes } from '../util/gcp';
import type { getGKEMachineTypesResponse } from '../types/gcp.d.ts';
import debounce from 'lodash/debounce';

const defaultMachineType = 'n1-standard-2';

const defaultDiskType = 'pd-standard';

const defaultNodePool = {
  autoscaling: { enabled: false },
  config:      {
    diskSizeGb:    100,
    diskType:      defaultDiskType,
    imageType:     imageTypes[0],
    labels:        {},
    localSsdCount: 0,
    machineType:   defaultMachineType,
    oauthScopes:   [
      'https://www.googleapis.com/auth/devstorage.read_only',
      'https://www.googleapis.com/auth/logging.write',
      'https://www.googleapis.com/auth/monitoring',
      'https://www.googleapis.com/auth/servicecontrol',
      'https://www.googleapis.com/auth/service.management.readonly',
      'https://www.googleapis.com/auth/trace.append'
    ],
    preemptible: false,
    taints:      null,
    tags:        null
  },
  initialNodeCount: 3,
  management:       {
    autoRepair:  true,
    autoUpgrade: true
  },
  maxPodsConstraint: 110,
  name:              '',
  isNew:             true,
};

// TODO nb make sure all of these nested fields are available on edit
const defaultGkeConfig = {
  imported:      false,
  clusterAddons: {
    horizontalPodAutoscaling: true,
    httpLoadBalancing:        true,
    networkPolicyConfig:      false
  },
  clusterIpv4Cidr:        '',
  clusterName:            '',
  description:            '',
  enableKubernetesAlpha:  false,
  googleCredentialSecret: '',
  ipAllocationPolicy:     {
    clusterIpv4CidrBlock:       '',
    clusterSecondaryRangeName:  null,
    createSubnetwork:           false,
    nodeIpv4CidrBlock:          null,
    servicesIpv4CidrBlock:      '',
    servicesSecondaryRangeName: null,
    subnetworkName:             null,
    useIpAliases:               true,
    clusterIpv4Cidr:            ''
  },
  kubernetesVersion:        '',
  labels:                   {},
  locations:                [],
  loggingService:           'logging.googleapis.com/kubernetes',
  maintenanceWindow:        '',
  masterAuthorizedNetworks: { enabled: false, cidrBlocks: [] },
  monitoringService:        'monitoring.googleapis.com/kubernetes',
  network:                  '',
  networkPolicyEnabled:     false,
  privateClusterConfig:     {
    enablePrivateEndpoint: false,
    enablePrivateNodes:    false,
    masterIpv4CidrBlock:   null
  },
  // TODO nb remove
  projectID: process.env.VUE_APP_PROJECT,

  region:     '',
  subnetwork: '',
  zone:       DEFAULT_GCP_ZONE
};

const defaultCluster = {
  dockerRootDir:           '/var/lib/docker',
  enableClusterAlerting:   false,
  enableClusterMonitoring: false,
  enableNetworkPolicy:     false,
  labels:                  {},
  windowsPreferedCluster:  false,
};

const _NONE = 'none';

export default defineComponent({
  name: 'CruGKE',

  components: {
    CruResource,
    AccountAccess,
    AdvancedOptions,
    Networking,
    GKENodePoolComponent,
    Config,
    LabeledSelect,
    LabeledInput,
    Checkbox,
    FileSelector,
    KeyValue,
    ArrayList,
    ClusterMembershipEditor,
    Labels,
    Tabbed,
    Tab,
    Accordion,
    Banner
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

  async fetch() {
    const store = this.$store as Store<any>;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
      this.originalVersion = this.normanCluster?.gkeConfig?.kubernetesVersion;
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
    }
    if (!this.normanCluster.gkeConfig) {
      this.$set(this.normanCluster, 'gkeConfig', { ...defaultGkeConfig });
    }
    if (!this.normanCluster.gkeConfig.nodePools) {
      this.$set(this.normanCluster.gkeConfig, 'nodePools', [{ ...cloneDeep(defaultNodePool), name: 'group-1' }]);
    }
    this.config = this.normanCluster.gkeConfig;
    this.nodePools = this.normanCluster.gkeConfig.nodePools;

    this.nodePools.forEach((pool) => {
      this.$set(pool, '_id', randomStr());
      this.$set(pool, '_isNewOrUnprovisioned', this.isNewOrUnprovisioned);
    });
  },

  data() {
    const store = this.$store as Store<any>;
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;
    const t = store.getters['i18n/t'];

    return {
      normanCluster:    { name: '' } as any,
      nodePools:        [] as GKENodePool[],
      config:           { } as GKEConfig,
      membershipUpdate: {} as any,
      originalVersion:  '',
      defaultImageType: imageTypes[0],
      supportedVersionRange,

      loadingMachineTypes:  false,
      machineTypesResponse: {} as getGKEMachineTypesResponse,

      fvFormRuleSets:  [],
      isAuthenticated: false,

      debouncedLoadGCPData: () => {}

    };
  },

  created() {
    if (!this.nodePools.length) {
      this.addPool();
    }
    const registerBeforeHook = this.registerBeforeHook as Function;
    const registerAfterHook = this.registerAfterHook as Function;

    registerBeforeHook(this.cleanPoolsForSave);
    registerBeforeHook(this.removeUnchangedConfigFields);
    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');

    this.debouncedLoadGCPData = debounce(this.loadGCPData, 500);
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    /**
     * fv mixin accepts a rootObject in rules but doesn't seem to like that the norman cluster isn't yet defined when the rule set is defined so we're ignoring that and passing in the key we want validated here
     * entire context is passed in so validators can check if a credential is selected and only run when the rest of the form is shown + use the i18n/t getter + get the norman cluster
     *  */

    fvExtraRules() {
      return [];
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned() {
      return this.mode === _CREATE || !this.normanCluster?.gkeStatus?.upstreamSpec;
    },

    isEdit() {
      return this.mode === _CREATE || this.mode === _EDIT;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    hasCredential() {
      return !!this.config?.googleCredentialSecret;
    },

    clusterId(): String | null {
      return this.value?.id || null;
    },

    canManageMembers(): Boolean {
      return canViewClusterMembershipEditor(this.$store);
    },

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

    machineTypeOptions(): {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}[] {
      const allTypes = this.machineTypesResponse?.items;
      const out = [] as {label: string, kind?: string, value?: string, disabled?: boolean, [key: string]: any}[];

      if (!allTypes) {
        return out;
      }

      allTypes.forEach((type, i) => {
        const group = (type.name || '').split('-').shift();
        const lastGroup = (allTypes[i - 1]?.name || '').split('-').shift();

        if (group && group !== lastGroup) {
          out.push({
            label:    group,
            disabled: true,
            kind:     'group'
          });
        }
        out.push( {
          value: type.name,
          label: type.description ? `${ type.name } - ${ type.description }` : type.name,
          ...type
        });
      });

      return out;
    }

  },

  watch: {
    defaultImageType(neu) {
      if (this.mode === _CREATE) {
        this.nodePools.forEach((pool) => this.$set(pool, 'config.imageType', neu));
      }
    },
    'config.googleCredentialSecret'() {
      this.debouncedLoadGCPData();
    },
    'config.projectID'() {
      this.debouncedLoadGCPData();
    },
    'config.zone'() {
      this.debouncedLoadGCPData();
    },
    'config.region'() {
      this.debouncedLoadGCPData();
    },
  },

  methods: {
    // TODO nb move all gcp api calls here?
    loadGCPData() {
      this.errors = [];
      this.getMachineTypes();
    },

    getMachineTypes() {
      this.loadingMachineTypes = true;
      const zone = this.config.zone || this.config.locations?.[0];

      getGKEMachineTypes(this.$store, this.config.googleCredentialSecret, this.config.projectID, { zone, region: this.config.region }).then((res) => {
        this.machineTypesResponse = res;
        this.loadingMachineTypes = false;
      }).catch((err) => {
        this.errors.push(err);
        this.loadingMachineTypes = false;
      });
    },

    addPool(): void {
      const poolName = `group-${ this.nodePools.length + 1 }`;
      const _id = randomStr();
      const neu = {
        ...cloneDeep(defaultNodePool), name: poolName, _id, _isNewOrUnprovisioned: true
      };

      neu.config.imageType = this.defaultImageType;
      this.nodePools.push(neu);

      this.$nextTick(() => {
        if ( this.$refs.pools?.select ) {
          this.$refs.pools.select(poolName);
        }
      });
    },

    removePool(idx: number): void {
      const pool = this.nodePools[idx];

      removeObject(this.nodePools, pool);
    },

    setClusterName(name: string): void {
      this.$set(this.normanCluster, 'name', name);
      this.$set(this.config, 'clusterName', name);
    },

    setClusterDescription(decription: string): void {
      this.$set(this.normanCluster, 'description', decription);
      this.$set(this.config, 'decription', decription);
    },

    onMembershipUpdate(update: any): void {
      this.$set(this, 'membershipUpdate', update);
    },

    async saveRoleBindings(): Promise<void> {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // these fields are used purely in UI, to track individual nodepool components
    cleanPoolsForSave(): void {
      this.nodePools.forEach((pool: GKENodePool) => {
        Object.keys(pool).forEach((key: string) => {
          if (key.startsWith('_')) {
            delete pool[key as keyof GKENodePool];
          }
        });
      });
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    // TODO nb gke exceptions?
    removeUnchangedConfigFields(): void {
      const upstreamConfig = this.normanCluster?.status?.gkeStatus?.upstreamSpec;

      if (upstreamConfig) {
        // const diff = diffUpstreamSpec(upstreamConfig, this.config);

        // this.$set(this.normanCluster, 'gkeConfig', diff);
      }
    },

    async actuallySave(): Promise<void> {
      await this.normanCluster.save();

      return await this.normanCluster.waitForCondition('InitialRolesPopulated');
    },
    // fires when the 'cancel' button is pressed while the user is creating a new cloud credential
    cancelCredential(): void {
      if ( this.$refs.cruresource ) {
        (this.$refs.cruresource as any).emitOrRoute();
      }
    },
  },

});
</script>

<template>
  <CruResource
    ref="cruresource"
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
  >
    <template>
      <AccountAccess
        :mode="mode"
        :credential.sync="config.googleCredentialSecret"
        :project.sync="config.projectID"
        :is-authenticated.sync="isAuthenticated"
        @error="e=>errors.push(e)"
      />

      <div
        v-if="isAuthenticated"
        class="mt-10"
        data-testid="crugke-form"
      >
        <div
          class="row mb-10"
        >
          <div class="col span-6">
            <LabeledInput
              :value="normanCluster.name"
              :mode="mode"
              label-key="generic.name"
              required
              @input="setClusterName"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              :value="normanCluster.description"
              :mode="mode"
              label-key="nameNsDescription.description.label"
              :placeholder="t('nameNsDescription.description.placeholder')"
              @input="setClusterDescription"
            />
          </div>
        </div>
        <div><h3>{{ t('gke.accordion.nodePools') }}</h3></div>
        <Tabbed
          ref="pools"
          :side-tabs="true"
          :show-tabs-add-remove="mode !== 'view'"
          class="mb-20"
          @addTab="addPool($event)"
          @removeTab="removePool($event)"
        >
          <Tab
            v-for="(pool, i) in nodePools"
            :key="pool._id"
            :name="pool.name"
            :label="pool.name || t('gke.nodePools.notNamed')"
          >
            <GKENodePoolComponent
              :mode="mode"
              :cluster-kubernetes-version="config.kubernetesVersion"
              :machine-type-options="machineTypeOptions"
              :loading-machine-types="loadingMachineTypes"
              :version.sync="pool.version"
              :image-type.sync="pool.config.imageType"
              :machine-type.sync="pool.config.machineType"
              :disk-type.sync="pool.config.diskType"
              :disk-size-gb.sync="pool.config.diskSizeGb"
              :local-ssd-count.sync="pool.config.localSsdCount"
              :preemptible.sync="pool.config.preemptible"
              :taints.sync="pool.config.taints"
              :labels.sync="pool.config.labels"
              :tags.sync="pool.config.tags"
              :name.sync="pool.name"
              :initial-node-count.sync="pool.initialNodeCount"
              :max-pods-constraint.sync="pool.maxPodsConstraint"
              :autoscaling.sync="pool.autoscaling.enabled"
              :min-node-count.sync="pool.autoscaling.minNodeCount"
              :auto-repair.sync="pool.management.autoRepair"
              :auto-upgrade.sync="pool.management.autoUpgrade"
              :oauth-scopes.sync="pool.config.oauthScopes"
              :is-new="pool._isNewOrUnprovisioned"
            />
          </Tab>
        </Tabbed>
        <Accordion
          class="mb-20"
          :title="t('gke.accordion.config')"
          :open-initially="true"
        >
          <Config
            :mode="mode"
            :cloud-credential-id="config.googleCredentialSecret"
            :project-id="config.projectID"
            :is-new-or-unprovisioned="isNewOrUnprovisioned"
            :original-version="originalVersion"
            :cluster-id="normanCluster.id"
            :cluster-name="config.clusterName"
            :kubernetes-version.sync="config.kubernetesVersion"
            :zone.sync="config.zone"
            :region.sync="config.region"
            :locations.sync="config.locations"
            :default-image-type.sync="defaultImageType"
          />
        </Accordion>
        <Accordion
          class="mb-20"
          :title="t('gke.accordion.networking')"
        >
          <Networking
            :mode="mode"
            :zone="config.zone"
            :region="config.region"
            :cloud-credential-id="config.googleCredentialSecret"
            :project-id="config.projectID"
            :original-version="originalVersion"
            :cluster-id="normanCluster.id"
            :cluster-name="config.clusterName"
            :kubernetes-version.sync="config.kubernetesVersion"
            :network.sync="config.network"
            :subnetwork.sync="config.subnetwork"
            :use-ip-aliases.sync="config.ipAllocationPolicy.useIpAliases"
            :network-policy-config.sync="config.clusterAddons.networkPolicyConfig"
            :enable-network-policy.sync="normanCluster.enableNetworkPolicy"
            :network-policy-enabled.sync="config.networkPolicyEnabled"
            :cluster-ipv4-cidr.sync="config.clusterIpv4Cidr"
            :cluster-secondary-range-name.sync="config.ipAllocationPolicy.clusterSecondaryRangeName"
            :services-secondary-range-name.sync="config.ipAllocationPolicy.servicesSecondaryRangeName"
            :cluster-ipv4-cidr-block.sync="config.ipAllocationPolicy.clusterIpv4CidrBlock"
            :services-ipv4-cidr-block.sync="config.ipAllocationPolicy.servicesIpv4CidrBlock"
            :node-ipv4-cidr-block.sync="config.ipAllocationPolicy.nodeIpv4CidrBlock"
            :subnetwork-name.sync="config.ipAllocationPolicy.subnetworkName"
            :enable-private-endpoint.sync="config.privateClusterConfig.enablePrivateEndpoint"
            :enable-private-nodes.sync="config.privateClusterConfig.enablePrivateNodes"
            :master-ipv4-cidr-block.sync="config.privateClusterConfig.masterIpv4CidrBlock"
            :enable-master-authorized-network.sync="config.masterAuthorizedNetworks.enabled"
            :master-authorized-network-cidr-blocks.sync="config.masterAuthorizedNetworks.cidrBlocks"
            :is-new-or-unprovisioned="isNewOrUnprovisioned"
          />
        </Accordion>
        <Accordion
          class="mb-20"
          :title="t('gke.accordion.advanced')"
        >
          <AdvancedOptions
            :mode="mode"
            :logging-service.sync="config.loggingService"
            :monitoring-service.sync="config.monitoringService"
            :maintenance-window.sync="config.maintenanceWindow"
            :http-load-balancing.sync="config.clusterAddons.httpLoadBalancing"
            :horizontal-pod-autoscaling.sync="config.clusterAddons.horizontalPodAutoscaling"
            :enable-kubernetes-alpha.sync="config.enableKubernetesAlpha"
            :is-new-or-unprovisioned="isNewOrUnprovisioned"
          />
        </Accordion>

        <Accordion
          class="mb-20"
          :title="t('gke.accordion.members')"
        >
          <Banner
            v-if="isEdit"
            color="info"
          >
            {{ t('cluster.memberRoles.removeMessage') }}
          </Banner>
          <ClusterMembershipEditor
            v-if="canManageMembers"
            :mode="mode"
            :parent-id="normanCluster.id ? normanCluster.id : null"
            @membership-update="onMembershipUpdate"
          />
        </Accordion>
        <Accordion
          class="mb-20"
          :title="t('gke.accordion.labels')"
        >
          //TODO nb config.labels in addition
          <Labels
            v-model="normanCluster"
            :mode="mode"
          />
        </Accordion>
      </div>
    </template>
    <template
      v-if="!hasCredential"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>

  .center-inputs {
    display: flex;
    align-items: center;
  }
</style>
