<script lang='ts'>
import semver from 'semver';
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';

import { randomStr } from '@shell/utils/string';
import { _CREATE, _EDIT, _VIEW, _IMPORT } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { parseAzureError } from '@shell/utils/azure';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Labels from '@shell/components/form/Labels.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading.vue';
import Config from './Config.vue';
import Import from './Import.vue';

import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import type { AKSDiskType, AKSNodePool, AKSPoolMode, AKSConfig } from '../types/index';
import {
  getAKSRegions
  , regionsWithAvailabilityZones
} from '../util/aks';

import { diffUpstreamSpec, syncUpstreamConfig } from '@shell/utils/kontainer';
import {
  requiredInCluster,
  clusterNameChars,
  clusterNameStartEnd,
  clusterNameLength,
} from '../util/validators';
import { CREATOR_PRINCIPAL_ID } from '@shell/config/labels-annotations';
import cloneDeep from 'lodash/cloneDeep';

const DEFAULT_REGION = 'eastus';

export const defaultNodePool = {
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
  _validation:           {}
};

const importedDefaultAksConfig = {
  clusterName:      '',
  imported:         true,
  resourceGroup:    '',
  resourceLocation: DEFAULT_REGION,
};

export const defaultAksConfig = {
  clusterName:        '',
  imported:           false,
  linuxAdminUsername: 'azureuser',
  loadBalancerSku:    'Standard',
  networkPlugin:      'kubenet',
  privateCluster:     false,
  tags:               {},
  outboundType:       'LoadBalancer',
  serviceCidr:        '10.0.0.0/16',
  dockerBridgeCidr:   '172.17.0.1/16',
  dnsServiceIp:       '10.0.0.10',
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

export const NETWORKING_AUTH_MODES = {
  MANAGED_IDENTITY:  'managedIdentity',
  SERVICE_PRINCIPAL: 'servicePrincipal' // this is an arbitrary value that UI uses only to show a radio group, it won't be sent along with the config object
};

export default defineComponent({
  name: 'CruAKS',

  emits: ['validationChanged'],

  components: {
    SelectCredential,
    CruResource,
    LabeledSelect,
    LabeledInput,
    ClusterMembershipEditor,
    Labels,
    Accordion,
    Banner,
    Loading,
    Config,
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

  // AKS provisioning needs to use the norman API - a provisioning cluster resource will be created by the BE when the norman cluster is made but v2 prov clusters don't contain the relevant aks configuration fields
  async fetch() {
    const store = this.$store as Store<any>;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });

      // ensure any fields editable through this UI that have been altered in azure portal are shown here - see syncUpstreamConfig jsdoc for details
      if (!this.isNewOrUnprovisioned) {
        // to prevent syncUpstreamConfig from setting 'managedIdentity' to true when it's null
        if (this.normanCluster?.aksConfig?.managedIdentity === null) {
          this.normanCluster.aksConfig.managedIdentity = false;
        }

        syncUpstreamConfig('aks', this.normanCluster);
      }

      // track original version on edit to ensure we don't offer k8s downgrades
      const kubernetesVersion = semver.coerce(this.normanCluster?.aksConfig?.kubernetesVersion)?.version;

      this.originalVersion = kubernetesVersion || '';
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });

      if (!this.$store.getters['auth/principalId'].includes('local://')) {
        this.normanCluster.annotations[CREATOR_PRINCIPAL_ID] = this.$store.getters['auth/principalId'];
      }
    }
    if (this.isImport) {
      this.normanCluster.aksConfig = cloneDeep(importedDefaultAksConfig);
      this.config = this.normanCluster.aksConfig;
    } else {
      if (!this.normanCluster.aksConfig) {
        this.normanCluster['aksConfig'] = { ...defaultAksConfig };
      }
      if (!this.normanCluster.aksConfig.nodePools) {
        this.normanCluster.aksConfig['nodePools'] = [{ ...defaultNodePool }];
      }
      this.config = this.normanCluster.aksConfig;
      this.nodePools = this.normanCluster.aksConfig.nodePools;

      this.nodePools.forEach((pool: AKSNodePool) => {
        pool['_id'] = randomStr();
        pool['_isNewOrUnprovisioned'] = this.isNewOrUnprovisioned;
        pool['_validation'] = {};
      });
    }
  },

  data() {
    const store = this.$store as Store<any>;
    // This setting is used by RKE1 AKS GKE and EKS - rke2/k3s have a different mechanism for fetching supported versions
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {

      NETWORKING_AUTH_MODES,
      normanCluster:    { name: '' } as any,
      nodePools:        [] as AKSNodePool[],
      config:           { } as AKSConfig,
      membershipUpdate: {} as any,
      originalVersion:  '',

      supportedVersionRange,
      locationOptions: [] as string[],

      configUnreportedErrors: [],
      configIsValid:          true,

      loadingLocations: false,

      fvFormRuleSets: this.isImport ? [{
        path:  'name',
        rules: ['nameRequired', 'clusterNameChars', 'clusterNameStartEnd', 'clusterNameLength'],
      },
      {
        path:  'clusterName',
        rules: ['importedName']
      }
      ] : [{
        path:  'name',
        rules: ['nameRequired', 'clusterNameChars', 'clusterNameStartEnd', 'clusterNameLength'],
      }],
    };
  },

  created() {
    const registerBeforeHook = this.registerBeforeHook as Function;
    const registerAfterHook = this.registerAfterHook as Function;

    if (!this.isImport) {
      registerBeforeHook(this.removeUnchangedConfigFields);
    }
    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isImport() {
      return this.$route?.query?.mode === _IMPORT;
    },
    /**
     * fv mixin accepts a rootObject in rules but doesn't seem to like that the norman cluster isn't yet defined when the rule set is defined so we're ignoring that and passing in the key we want validated here
     * entire context is passed in so validators can check if a credential is selected and only run when the rest of the form is shown + use the i18n/t getter + get the norman cluster
     *  */

    fvExtraRules() {
      return {
        nameRequired:        requiredInCluster(this, 'nameNsDescription.name.label', 'normanCluster.name'),
        clusterNameChars:    clusterNameChars(this),
        clusterNameStartEnd: clusterNameStartEnd(this),
        clusterNameLength:   clusterNameLength(this),
        importedName:        requiredInCluster(this, 'aks.clusterToRegister', 'config.clusterName'),
      };
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned() {
      return this.mode === _CREATE || !this.normanCluster?.aksStatus?.upstreamSpec;
    },

    isEdit() {
      return this.mode === _CREATE || this.mode === _EDIT;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    hasCredential() {
      return !!this.config?.azureCredentialSecret;
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
  },

  watch: {

    'config.azureCredentialSecret'(neu) {
      if (neu) {
        this.resetCredentialDependentProperties();
        this.getLocations();
      }
    },

  },

  methods: {
    // reset properties dependent on AKS queries so if they're lodaded with a valid credential then an invalid credential is selected, they're cleared
    resetCredentialDependentProperties(): void {
      this.locationOptions = [];
      this['errors'] = [];
    },

    async getLocations(): Promise<void> {
      if (!this.isNewOrUnprovisioned) {
        return;
      }
      this.loadingLocations = true;

      const { azureCredentialSecret } = this.config;

      try {
        const res = await getAKSRegions(this.$store, azureCredentialSecret, this.clusterId);

        // sort by availability zone support
        const withAZ = [] as Array<any>;
        const withoutAZ = [] as Array<any>;

        res.forEach((region: any) => {
          if (regionsWithAvailabilityZones[region.name]) {
            withAZ.push(region);
          } else {
            withoutAZ.push(region);
          }
        });
        this.locationOptions = [{ displayName: this.t('aks.location.withAZ'), kind: 'group' }, ...withAZ, { displayName: this.t('aks.location.withoutAZ'), kind: 'group' }, ...withoutAZ];
        // TODO nb import
        if (!this.config?.resourceLocation) {
          if (res.find((r: any) => r.name === DEFAULT_REGION)) {
            this.config['resourceLocation'] = DEFAULT_REGION;
          } else {
            this.config['resourceLocation'] = res[0]?.name;
          }
        }
        this.loadingLocations = false;
      } catch (err: any) {
        this.loadingLocations = false;
        const parsedError = parseAzureError(err.error || '');
        const errors = this.errors as Array<string>;

        errors.push(this.t('aks.errors.regions', { e: parsedError || err }));
      }
    },

    setClusterName(name: string): void {
      this.normanCluster['name'] = name;

      if (!this.isImport) {
        this.config['clusterName'] = name;
      }
    },

    onMembershipUpdate(update: any): void {
      this['membershipUpdate'] = update;
    },

    async saveRoleBindings(): Promise<void> {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    removeUnchangedConfigFields(): void {
      const upstreamConfig = this.normanCluster?.status?.aksStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.normanCluster['aksConfig'] = diff;
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
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    ref="cruresource"
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="[...fvUnreportedValidationErrors, ...configUnreportedErrors]"
    :validation-passed="fvFormIsValid && ( configIsValid || isImport)"
    @error="e=>errors=e"
    @finish="save"
  >
    <SelectCredential
      v-model:value="config.azureCredentialSecret"
      data-testid="cruaks-select-credential"
      :mode="mode === VIEW ? VIEW : CREATE"
      provider="azure"
      :default-on-cancel="true"
      :showing-form="hasCredential"
      class="mt-20"
      :cancel="cancelCredential"
    />
    <div
      v-if="hasCredential"
      class="mt-10"
      data-testid="cruaks-form"
    >
      <div class="row mb-10">
        <div
          class="col"
          :class="{'span-6': isImport, 'span-4': !isImport}"
        >
          <LabeledInput
            :value="normanCluster.name"
            :mode="mode"
            label-key="generic.name"
            required
            :rules="fvGetAndReportPathRules('name')"
            @update:value="setClusterName"
          />
        </div>
        <div
          class="col"
          :class="{'span-6': isImport, 'span-4': !isImport}"
        >
          <LabeledInput
            v-model:value="normanCluster.description"
            :mode="mode"
            label-key="nameNsDescription.description.label"
            :placeholder="t('nameNsDescription.description.placeholder')"
          />
        </div>
        <div
          v-if="!isImport"
          class="col span-4"
        >
          <LabeledSelect
            v-model:value="config.resourceLocation"
            data-testid="cruaks-resourcelocation"
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
      </div>
      <Import
        v-if="isImport"
        v-model:cluster-name="config.clusterName"
        v-model:resource-group="config.resourceGroup"

        v-model:resource-location="config.resourceLocation"
        v-model:enable-network-policy="normanCluster.enableNetworkPolicy"
        data-testid="cruaks-import"
        :azure-credential-secret="config.azureCredentialSecret"
        :rules="{clusterName: fvGetAndReportPathRules('clusterName')}"
        :mode="mode"
        @error="e=>errors.push(e)"
      />
      <Config
        v-else
        v-model:config="config"
        v-model:config-unreported-errors="configUnreportedErrors"
        v-model:config-is-valid="configIsValid"
        v-model:enable-network-policy="normanCluster.enableNetworkPolicy"
        :value="value"
        :mode="mode"
        :original-version="originalVersion"
        :is-new-or-unprovisioned="isNewOrUnprovisioned"
      />
      <Accordion
        class="mb-20"
        title-key="members.memberRoles"
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
        title-key="aks.accordions.labels"
      >
        <Labels
          v-model:value="normanCluster"
          :mode="mode"
        />
      </Accordion>
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
  .networking-checkboxes {
    display: flex;
    flex-direction: column;

    &>*{
      margin-bottom: 10px;
    }
  }

  .node-pool {
    padding: 10px;
  }

  .center-inputs {
    display: flex;
    align-items: center;
  }

</style>
