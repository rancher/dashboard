<script lang='ts'>
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';
import cloneDeep from 'lodash/cloneDeep';

import { randomStr } from '@shell/utils/string';
import { removeObject } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import Labels from '@shell/components/form/Labels.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading.vue';

import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import type { GKEConfig, GKENodePool } from '../types';
import AccountAccess from './AccountAccess.vue';
import AdvancedOptions from './AdvancedOptions.vue';
import Networking from './Networking.vue';
import GKENodePoolComponent from './GKENodePool.vue';
import Config from './Config.vue';
import Import from './Import.vue';

import {
  DEFAULT_GCP_ZONE, DEFAULT_GCP_SERVICE_ACCOUNT, GKEImageTypes, getGKEMachineTypes, getGKEServiceAccounts
} from '../util/gcp';
import type { getGKEMachineTypesResponse, getGKEServiceAccountsResponse } from '../types/gcp.d.ts';
import type { GKEMachineTypeOption } from '../types/index.d.ts';
import debounce from 'lodash/debounce';
import {
  clusterNameChars, clusterNameStartEnd, requiredInCluster, ipv4WithCidr, ipv4oripv6WithCidr, GKEInitialCount
} from '../util/validators';
import { diffUpstreamSpec, syncUpstreamConfig } from '@shell/utils/kontainer';
import { CREATOR_PRINCIPAL_ID } from '@shell/config/labels-annotations';

const defaultMachineType = 'n1-standard-2';

const defaultDiskType = 'pd-standard';

const defaultNodePool = {
  autoscaling: { enabled: false },
  config:      {
    diskSizeGb:     100,
    diskType:       defaultDiskType,
    imageType:      GKEImageTypes[0],
    labels:         {},
    localSsdCount:  0,
    machineType:    defaultMachineType,
    serviceAccount: null,
    oauthScopes:    [
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

const defaultGkeConfig = {
  imported:      false,
  clusterAddons: {
    horizontalPodAutoscaling: true,
    httpLoadBalancing:        true,
    networkPolicyConfig:      false
  },
  clusterIpv4Cidr:       '',
  clusterName:           '',
  description:           '',
  enableKubernetesAlpha: false,
  // googleCredentialSecret: '',
  ipAllocationPolicy:    {
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
  locations:                [DEFAULT_GCP_ZONE],
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
  projectID: '',

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
  annotations:             {},
  windowsPreferedCluster:  false,
};

const defaultImportedCluster = {
  dockerRootDir:          '/var/lib/docker',
  enableNetworkPolicy:    false,
  windowsPreferedCluster: false,
  name:                   '',
  gkeConfig:              {
    imported:               true,
    clusterName:            '',
    zone:                   DEFAULT_GCP_ZONE,
    googleCredentialSecret: '',
    projectID:              '',
    region:                 '',
  },
  labels: {}
};

export default defineComponent({
  name: 'CruGKE',

  components: {
    CruResource,
    AccountAccess,
    AdvancedOptions,
    Networking,
    GKENodePoolComponent,
    Config,
    ClusterMembershipEditor,
    Labels,
    Tabbed,
    Tab,
    Accordion,
    Banner,
    Loading,
    Import
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
      if (this.isImport) {
        this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...cloneDeep(defaultImportedCluster) }, { root: true });
      } else {
        this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
      }
      if (!this.$store.getters['auth/principalId'].includes('local://')) {
        this.normanCluster.annotations[CREATOR_PRINCIPAL_ID] = this.$store.getters['auth/principalId'];
      }
    }
    // ensure any fields editable through this UI that have been altered in aws are shown here - see syncUpstreamConfig jsdoc for details
    if (!this.isNewOrUnprovisioned) {
      syncUpstreamConfig('gke', this.normanCluster);
    }

    if (!this.isImport) {
      if (!this.normanCluster.gkeConfig) {
        this.normanCluster['gkeConfig'] = cloneDeep(defaultGkeConfig);
      }
      if (!this.normanCluster.gkeConfig.nodePools) {
        this.normanCluster.gkeConfig['nodePools'] = [{ ...cloneDeep(defaultNodePool), name: 'group-1' }];
      }
      if (!this.normanCluster.gkeConfig.ipAllocationPolicy) {
        this.normanCluster.gkeConfig['ipAllocationPolicy'] = cloneDeep(defaultGkeConfig.ipAllocationPolicy);
      }
      if (!this.normanCluster.gkeConfig.clusterAddons) {
        this.normanCluster.gkeConfig['clusterAddons'] = cloneDeep(defaultGkeConfig.clusterAddons);
      }
      if (!this.normanCluster.gkeConfig.privateClusterConfig) {
        this.normanCluster.gkeConfig['privateClusterConfig'] = cloneDeep(defaultGkeConfig.privateClusterConfig);
      }
      this.nodePools = this.normanCluster.gkeConfig.nodePools;

      this.nodePools.forEach((pool) => {
        pool['_id'] = randomStr();
        pool['_isNewOrUnprovisioned'] = this.isNewOrUnprovisioned;
        if (!pool.management) {
          pool['management'] = {};
        }
        if (!pool.autoscaling) {
          pool['autoscaling'] = {};
        }
      });
    }

    this.config = this.normanCluster.gkeConfig;
  },

  data() {
    const store = this.$store as Store<any>;
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;
    const isImport = this.$route?.query?.mode === 'import';

    return {
      isImport,
      normanCluster:    { name: '' } as any,
      nodePools:        [] as GKENodePool[],
      config:           { } as GKEConfig,
      membershipUpdate: {} as any,
      originalVersion:  '',
      defaultImageType: GKEImageTypes[0],
      supportedVersionRange,

      loadingMachineTypes:     false,
      loadingServiceAccounts:  false,
      machineTypesResponse:    {} as getGKEMachineTypesResponse,
      serviceAccountsResponse: {} as getGKEServiceAccountsResponse,

      fvFormRuleSets: isImport ? [{
        path:  'clusterName',
        rules: ['nameRequired', 'clusterNameChars', 'clusterNameStartEnd']
      }, {
        path:  'importName',
        rules: ['importNameRequired']
      }] : [
        {
          path:  'diskSizeGb',
          rules: ['diskSizeGb']
        },
        {
          path:  'initialNodeCount',
          rules: ['initialNodeCount']
        },
        {
          path:  'ssdCount',
          rules: ['ssdCount']
        },
        {
          path:  'nodeGeneral',
          rules: ['minMaxNodeCount', 'nodePoolNameUnique']
        },
        {
          path:  'poolName',
          rules: ['poolNameRequired']
        },
        {
          path:  'masterIpv4CidrBlock',
          rules: ['masterIpv4CidrBlockRequired', 'masterIpv4CidrBlockFormat']
        },
        {
          path:  'clusterName',
          rules: ['nameRequired', 'clusterNameChars', 'clusterNameStartEnd']
        },
        {
          path:  'clusterIpv4CidrBlock',
          rules: ['clusterIpv4CidrBlockFormat']
        },
        {
          path:  'nodeIpv4CidrBlock',
          rules: ['nodeIpv4CidrBlockFormat']
        },
        {
          path:  'servicesIpv4CidrBlock',
          rules: ['servicesIpv4CidrBlockFormat']
        },
        {
          path:  'clusterIpv4Cidr',
          rules: ['clusterIpv4CidrFormat']
        },
      ],
      isAuthenticated: false,

      debouncedLoadGCPData: () => {}

    };
  },

  created() {
    const registerBeforeHook = this.registerBeforeHook as Function;
    const registerAfterHook = this.registerAfterHook as Function;

    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');

    this.debouncedLoadGCPData = debounce(this.loadGCPData, 500);

    if (!this.isImport) {
      if (!this.nodePools.length) {
        this.addPool();
      }
      registerBeforeHook(this.cleanPoolsForSave);
      registerBeforeHook(this.removeUnchangedConfigFields);
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    /**
     * fv mixin accepts a rootObject in rules but doesn't seem to like that the norman cluster isn't yet defined when the rule set is defined so we're ignoring that and passing in the key we want validated here
     * entire context is passed in so validators can check if a credential is selected and only run when the rest of the form is shown + use the i18n/t getter + get the norman cluster
     *  */

    fvExtraRules() {
      return {
        clusterNameChars:    clusterNameChars(this),
        clusterNameStartEnd: clusterNameStartEnd(this),
        nameRequired:        requiredInCluster(this, 'nameNsDescription.name.label', 'name'),
        importNameRequired:  requiredInCluster(this, 'nameNsDescription.name.label', 'gkeConfig.clusterName'),

        masterIpv4CidrBlockRequired: () => {
          if (!this.isAuthenticated) {
            return;
          }
          const msg = this.t('validation.required', { key: this.t('gke.masterIpv4CidrBlock.label') });

          return this.config.privateClusterConfig?.enablePrivateNodes && !this.config.privateClusterConfig?.masterIpv4CidrBlock ? msg : null;
        },

        masterIpv4CidrBlockFormat:   ipv4WithCidr(this, 'gke.masterIpv4CidrBlock.label', 'gkeConfig.privateClusterConfig.masterIpv4CidrBlock'),
        clusterIpv4CidrBlockFormat:  ipv4WithCidr(this, 'gke.clusterIpv4CidrBlock.label', 'gkeConfig.ipAllocationPolicy.clusterIpv4CidrBlock'),
        nodeIpv4CidrBlockFormat:     ipv4WithCidr(this, 'gke.nodeIpv4CidrBlock.label', 'gkeConfig.ipAllocationPolicy.nodeIpv4CidrBlock'),
        servicesIpv4CidrBlockFormat: ipv4WithCidr(this, 'gke.servicesIpv4CidrBlock.label', 'gkeConfig.ipAllocationPolicy.servicesIpv4CidrBlock'),
        clusterIpv4CidrFormat:       ipv4oripv6WithCidr(this, 'gke.clusterIpv4Cidr.label', 'gkeConfig.clusterIpv4Cidr'),
        initialNodeCount:            GKEInitialCount(this),
        /**
         * The nodepool validators below are performing double duty. When passed directly to an input, the val argument is provided and validated - this generates the error icon in the input component.
         * otherwise they're run in the fv mixin and ALL nodepools are validated - this disables the cruresource create button
         */
        diskSizeGb:                  (val: number) => {
          if (!this.isAuthenticated) {
            return;
          }
          const valid = (input: number) => input >= 10;

          if (val || val === 0) {
            return !valid(val) ? this.t('gke.errors.diskSizeGb') : null;
          }

          return !!this.nodePools.find((pool: GKENodePool) => !valid(pool.config.diskSizeGb || 0) ) ? this.t('gke.errors.diskSizeGb') : null;
        },

        ssdCount: (val: number) => {
          if (!this.isAuthenticated) {
            return;
          }
          const valid = (input: number) => input >= 0;

          if (val || val === 0) {
            return !valid(val) ? this.t('gke.errors.ssdCount') : null;
          }

          return !!this.nodePools.find((pool: GKENodePool) => !valid(pool.config.localSsdCount || 0) ) ? this.t('gke.errors.ssdCount') : null;
        },

        minNodeCount: (val: number) => {
          if (!this.isAuthenticated) {
            return;
          }
          const valid = (input: number) => input >= 1;

          if (val || val === 0) {
            return !valid(val) ? this.t('gke.errors.minNodeCount') : null;
          }

          return !!this.nodePools.find((pool: GKENodePool) => !valid(pool.autoscaling.minNodeCount || 0) ) ? this.t('gke.errors.minNodeCount') : null;
        },

        /**
         * The following validators involve multiple fields on nodepools  and wont be applied as 'rules' props to input components as the above np validators are.
         * They set a field on the nodepool object (removed before save) so the tab component can display an error icon when the pool is in error.
         * The error message, as it is not fed to fvGetAndReportPathRules, will appear as a banner at the top of the form.
         */
        minMaxNodeCount: () => {
          if (!this.isAuthenticated) {
            return;
          }
          const valid = (p: GKENodePool) => (p.autoscaling.minNodeCount || 0) <= (p.autoscaling.maxNodeCount || 0);
          let msg = null;

          this.nodePools.forEach((p) => {
            if (!valid(p)) {
              p._minMaxValid = false;
              msg = this.t('gke.errors.minMaxNodeCount');
            } else {
              p._minMaxValid = true;
            }
          });

          return msg;
        },

        nodePoolNameUnique: () => {
          if (!this.isAuthenticated) {
            return;
          }
          let msg = null;
          const allPoolNames: string[] = this.nodePools.map((p) => p.name);

          this.nodePools.forEach((p) => {
            if (allPoolNames.filter((n) => n === p.name).length > 1) {
              p._nameUnique = false;
              msg = this.t('gke.errors.poolNamesUnique');
            } else {
              p._nameUnique = true;
            }
          });

          return msg;
        },

        poolNameRequired: (name:string) => {
          if (!this.isAuthenticated) {
            return;
          }
          let msg = null;
          const valid = (n: string) => !!n;

          if (name || name === '') {
            return !valid(name) ? this.t('validation.required', { key: this.t('gke.groupName.label') }) : null;
          }
          this.nodePools.forEach((p) => {
            if (!valid(p.name)) {
              msg = this.t('validation.required', { key: this.t('gke.groupName.label') });
            }
          });

          return msg;
        }

      };
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in gke
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

    machineTypeOptions(): GKEMachineTypeOption[] {
      const allTypes = this.machineTypesResponse?.items;
      const out: GKEMachineTypeOption[] = [];

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
            kind:     'group',
            name:     group,
          });
        }
        out.push( {
          value: type.name,
          label: type.description ? `${ type.name } - ${ type.description }` : type.name,
          ...type
        });
      });

      return out;
    },

    serviceAccountOptions(): {label: string, value: string | null}[] {
      const allAccounts = this.serviceAccountsResponse?.accounts || [];

      return allAccounts.reduce((opts, acct) => {
        if (acct.displayName === DEFAULT_GCP_SERVICE_ACCOUNT) {
          return opts;
        } else {
          opts.push({
            label: acct.displayName,
            value: acct.email
          });
        }

        return opts;
      }, [{ label: this.t('gke.serviceAccount.default.label'), value: null }] as {label: string, value: string | null}[] );
    }

  },

  watch: {
    defaultImageType(neu) {
      if (this.mode === _CREATE) {
        this.nodePools.forEach((pool) => (pool['config.imageType'] = neu));
      }
    },
    isAuthenticated() {
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
    loadGCPData() {
      if (this.mode !== _VIEW) {
        this['errors'] = [];
        if (this.config.projectID && this.config.googleCredentialSecret) {
          this.getMachineTypes();
          this.getServiceAccounts();
        }
      }
    },

    async getMachineTypes() {
      this.loadingMachineTypes = true;
      const zone = this.config.zone || this.config.locations?.[0];

      try {
        const res = await getGKEMachineTypes(this.$store, this.config.googleCredentialSecret, this.config.projectID, { zone, region: this.config.region });

        this.machineTypesResponse = res;
      } catch (err: any) {
        const errors: string[] = this.errors;

        errors.push(err);
      }
      this.loadingMachineTypes = false;
    },

    async getServiceAccounts() {
      this.loadingServiceAccounts = true;
      const zone = this.config.zone || this.config.locations?.[0];

      try {
        const res = await getGKEServiceAccounts(this.$store, this.config.googleCredentialSecret, this.config.projectID, { zone, region: this.config.region });

        this.serviceAccountsResponse = res;
      } catch (err:any) {
        const errors: string[] = this.errors;

        errors.push(err);
      }
      this.loadingServiceAccounts = false;
    },

    addPool(): void {
      const poolName = `group-${ this.nodePools.length + 1 }`;
      const _id = randomStr();
      const neu = {
        ...cloneDeep(defaultNodePool), name: poolName, _id, _isNewOrUnprovisioned: true, version: this.config.kubernetesVersion
      };

      neu.config.imageType = this.defaultImageType;
      this.nodePools.push(neu);

      this.$nextTick(() => {
        const pools = this.$refs.pools as any as typeof Tabbed;

        if ( pools && pools.select ) {
          pools.select(poolName);
        }
      });
    },

    removePool(idx: number): void {
      const pool = this.nodePools[idx];

      removeObject(this.nodePools, pool);
    },

    setClusterName(name: string): void {
      this.normanCluster['name'] = name;
      if (!this.isImport) {
        this.config['clusterName'] = name;
      }
    },

    setClusterDescription(decription: string): void {
      this.normanCluster['description'] = decription;
      this.config['decription'] = decription;
    },

    onMembershipUpdate(update: any): void {
      this['membershipUpdate'] = update;
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
    removeUnchangedConfigFields(): void {
      const upstreamConfig = this.normanCluster?.status?.gkeStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.normanCluster['gkeConfig'] = diff;
      }
    },

    async actuallySave(): Promise<void> {
      await this.normanCluster.save();

      return await this.normanCluster.waitForCondition('InitialRolesPopulated');
    },

    // fires when the 'cancel' button is pressed while the user is creating a new cloud credential
    cancelCredential(): void {
      const cruresource = this.$refs.cruresource as any as typeof CruResource;

      if ( cruresource ) {
        cruresource.emitOrRoute();
      }
    },
  },

});
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    ref="cruresource"
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid && isAuthenticated"
    @error="e=>errors=e"
    @finish="save"
  >
    <div>
      <AccountAccess
        v-model:credential="config.googleCredentialSecret"
        v-model:project="config.projectID"
        v-model:is-authenticated="isAuthenticated"
        :mode="mode"
        @error="e=>errors.push(e)"
        @cancel-credential="cancelCredential"
      />

      <div
        v-if="isAuthenticated"
        data-testid="crugke-form"
      >
        <Config
          v-model:kubernetes-version="config.kubernetesVersion"
          v-model:zone="config.zone"
          v-model:region="config.region"
          v-model:locations="config.locations"
          v-model:default-image-type="defaultImageType"
          v-model:labels="config.labels"
          :mode="mode"
          :cloud-credential-id="config.googleCredentialSecret"
          :project-id="config.projectID"
          :is-new-or-unprovisioned="isNewOrUnprovisioned"
          :original-version="originalVersion"
          :cluster-id="normanCluster.id"
          :cluster-name="normanCluster.name"
          :cluster-description="normanCluster.description"
          :rules="{
            clusterName: fvGetAndReportPathRules('clusterName')
          }"
          :is-import="isImport"
          @update:clusterName="setClusterName"
          @update:clusterDescription="setClusterDescription"
        />

        <Accordion
          v-if="isImport"
          class="mb-20"
          :title="t('gke.accordion.import')"
          :open-initially="true"
        >
          <Import
            v-model:enable-network-policy="normanCluster.enableNetworkPolicy"
            :credential="config.googleCredentialSecret"
            :project="config.projectID"
            :zone="config.zone"
            :region="config.region"
            :mode="mode"
            :cluster-name="config.clusterName"
            :rules="{
              importName: fvGetAndReportPathRules('importName')
            }"
            @error="e=>errors.push(e)"
            @update:clusterName="e=>config.clusterName=e"
          />
        </Accordion>

        <template v-else>
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
              v-for="(pool) in nodePools"
              :key="pool._id"
              :name="pool._id || pool.name"
              :label="pool.name || t('gke.notNamed')"
              :error="pool._minMaxValid===false || pool._nameUnique===false"
            >
              <GKENodePoolComponent
                v-model:version="pool.version"
                v-model:image-type="pool.config.imageType"
                v-model:machine-type="pool.config.machineType"
                v-model:service-account="pool.config.serviceAccount"
                v-model:disk-type="pool.config.diskType"
                v-model:disk-size-gb="pool.config.diskSizeGb"
                v-model:local-ssd-count="pool.config.localSsdCount"
                v-model:preemptible="pool.config.preemptible"
                v-model:taints="pool.config.taints"
                v-model:labels="pool.config.labels"
                v-model:tags="pool.config.tags"
                v-model:name="pool.name"
                v-model:initial-node-count="pool.initialNodeCount"
                v-model:max-pods-constraint="pool.maxPodsConstraint"
                v-model:autoscaling="pool.autoscaling.enabled"
                v-model:min-node-count="pool.autoscaling.minNodeCount"
                v-model:max-node-count="pool.autoscaling.maxNodeCount"
                v-model:auto-repair="pool.management.autoRepair"
                v-model:auto-upgrade="pool.management.autoUpgrade"
                v-model:oauth-scopes="pool.config.oauthScopes"
                :rules="{
                  diskSizeGb: fvGetAndReportPathRules('diskSizeGb'),
                  initialNodeCount: fvGetAndReportPathRules('initialNodeCount'),
                  ssdCount: fvGetAndReportPathRules('ssdCount'),
                  poolName: fvGetAndReportPathRules('poolName'),
                }"
                :mode="mode"
                :cluster-kubernetes-version="config.kubernetesVersion"
                :machine-type-options="machineTypeOptions"
                :service-account-options="serviceAccountOptions"
                :loading-machine-types="loadingMachineTypes"
                :loading-service-accounts="loadingServiceAccounts"
                :is-new="pool._isNewOrUnprovisioned"
              />
            </Tab>
          </Tabbed>
          <Accordion
            class="mb-20"
            :title="t('gke.accordion.networking')"
          >
            <Networking
              v-model:kubernetes-version="config.kubernetesVersion"
              v-model:network="config.network"
              v-model:subnetwork="config.subnetwork"
              v-model:create-subnetwork="config.ipAllocationPolicy.createSubnetwork"
              v-model:use-ip-aliases="config.ipAllocationPolicy.useIpAliases"
              v-model:network-policy-config="config.clusterAddons.networkPolicyConfig"
              v-model:enable-network-policy="normanCluster.enableNetworkPolicy"
              v-model:network-policy-enabled="config.networkPolicyEnabled"
              v-model:cluster-ipv4-cidr="config.clusterIpv4Cidr"
              v-model:cluster-secondary-range-name="config.ipAllocationPolicy.clusterSecondaryRangeName"
              v-model:services-secondary-range-name="config.ipAllocationPolicy.servicesSecondaryRangeName"
              v-model:cluster-ipv4-cidr-block="config.ipAllocationPolicy.clusterIpv4CidrBlock"
              v-model:services-ipv4-cidr-block="config.ipAllocationPolicy.servicesIpv4CidrBlock"
              v-model:node-ipv4-cidr-block="config.ipAllocationPolicy.nodeIpv4CidrBlock"
              v-model:subnetwork-name="config.ipAllocationPolicy.subnetworkName"
              v-model:enable-private-endpoint="config.privateClusterConfig.enablePrivateEndpoint"
              v-model:enable-private-nodes="config.privateClusterConfig.enablePrivateNodes"
              v-model:master-ipv4-cidr-block="config.privateClusterConfig.masterIpv4CidrBlock"
              v-model:enable-master-authorized-network="config.masterAuthorizedNetworks.enabled"
              v-model:master-authorized-network-cidr-blocks="config.masterAuthorizedNetworks.cidrBlocks"
              :rules="{
                masterIpv4CidrBlock: fvGetAndReportPathRules('masterIpv4CidrBlock'),
                clusterIpv4CidrBlock: fvGetAndReportPathRules('clusterIpv4CidrBlock'),
                nodeIpv4CidrBlock: fvGetAndReportPathRules('nodeIpv4CidrBlock'),
                servicesIpv4CidrBlock: fvGetAndReportPathRules('servicesIpv4CidrBlock'),
                clusterIpv4Cidr: fvGetAndReportPathRules('clusterIpv4Cidr')
              }"
              :mode="mode"
              :zone="config.zone"
              :region="config.region"
              :cloud-credential-id="config.googleCredentialSecret"
              :project-id="config.projectID"
              :original-version="originalVersion"
              :cluster-id="normanCluster.id"
              :cluster-name="config.clusterName"
              :is-new-or-unprovisioned="isNewOrUnprovisioned"
            />
          </Accordion>
          <Accordion
            class="mb-20"
            :title="t('gke.accordion.advanced')"
          >
            <AdvancedOptions
              v-model:logging-service="config.loggingService"
              v-model:monitoring-service="config.monitoringService"
              v-model:maintenance-window="config.maintenanceWindow"
              v-model:http-load-balancing="config.clusterAddons.httpLoadBalancing"
              v-model:horizontal-pod-autoscaling="config.clusterAddons.horizontalPodAutoscaling"
              v-model:enable-kubernetes-alpha="config.enableKubernetesAlpha"
              :mode="mode"
              :is-new-or-unprovisioned="isNewOrUnprovisioned"
            />
          </Accordion>
        </template>

        <Accordion
          class="mb-20"
          :title="t('members.memberRoles')"
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
          <Labels
            v-model:value="normanCluster"
            :mode="mode"
          />
        </Accordion>
      </div>
    </div>
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
