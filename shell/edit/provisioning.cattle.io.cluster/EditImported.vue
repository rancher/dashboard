<script>

import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import MemberRolesTab from '@shell/edit/provisioning.cattle.io.cluster/MemberRolesTab';
import { Banner } from '@components/Banner';
import { CAPI, SCHEMA } from '@shell/config/types';
import {
  clone, diff, set, get, isEmpty
} from '@shell/utils/object';
import Labels from './Labels';

import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { ExtensionPoint, TabLocation } from '@shell/core/types';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor';
import BasicsTab from '@shell/edit/provisioning.cattle.io.cluster/BasicsTab';
import { createYaml } from '@shell/utils/create-yaml';

const PUBLIC = 'public';
const PRIVATE = 'private';
const ADVANCED = 'advanced';
const HARVESTER = 'harvester';
const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';

const NETBIOS_TRUNCATION_LENGTH = 15;

export default {
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    Tab,
    Tabbed,
    MemberRolesTab,
    Banner,
    Labels,
    BasicsTab
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    // this.psps = await this.getPsps();
    // await this.fetchRke2Versions();
    // await this.initSpecs();
    // await this.initAddons();
    // await this.initRegistry();

    // Object.entries(this.chartValues).forEach(([name, value]) => {
    //   const key = this.chartVersionKey(name);

    //   this.userChartValues[key] = value;
    // });

    // this.setAgentConfiguration();
  },

  data() {
    if ( !this.value.spec.rkeConfig ) {
      set(this.value.spec, 'rkeConfig', {});
    }

    if ( !this.value.spec.rkeConfig.chartValues ) {
      set(this.value.spec.rkeConfig, 'chartValues', {});
    }

    if ( !this.value.spec.rkeConfig.upgradeStrategy ) {
      set(this.value.spec.rkeConfig, 'upgradeStrategy', {
        controlPlaneConcurrency:  '1',
        controlPlaneDrainOptions: {},
        workerConcurrency:        '1',
        workerDrainOptions:       {},
      });
    }

    if ( !this.value.spec.rkeConfig.machineGlobalConfig ) {
      set(this.value.spec, 'rkeConfig.machineGlobalConfig', {});
    }

    if ( !this.value.spec.rkeConfig.machineSelectorConfig?.length ) {
      set(this.value.spec, 'rkeConfig.machineSelectorConfig', [{ config: {} }]);
    }

    // Store the initial PSP template name, so we can set it back if needed
    const lastDefaultPodSecurityPolicyTemplateName = this.value.spec.defaultPodSecurityPolicyTemplateName;
    const previousKubernetesVersion = this.value.spec.kubernetesVersion;

    const truncateLimit = this.value.defaultHostnameLengthLimit;

    return {
      loadedOnce:                      false,
      lastIdx:                         0,
      allPSPs:                         null,
      allPSAs:                         [],
      nodeComponent:                   null,
      credentialId:                    '',
      credential:                      null,
      machinePools:                    null,
      rke2Versions:                    null,
      k3sVersions:                     null,
      defaultRke2:                     '',
      defaultK3s:                      '',
      s3Backup:                        false,
      versionInfo:                     {},
      membershipUpdate:                {},
      showDeprecatedPatchVersions:     false,
      systemRegistry:                  null,
      registryHost:                    null,
      showCustomRegistryInput:         false,
      showCustomRegistryAdvancedInput: false,
      registrySecret:                  null,
      userChartValues:                 {},
      userChartValuesTemp:             {},
      addonsRev:                       0,
      clusterIsAlreadyCreated:         !!this.value.id,
      fvFormRuleSets:                  [{
        path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
      }],
      harvesterVersionRange: {},
      lastDefaultPodSecurityPolicyTemplateName, // Used for reset on k8s version changes
      previousKubernetesVersion,
      cisOverride:           false,
      cisPsaChangeBanner:    false,
      psps:                  null, // List of policies if any
      truncateHostnames:     truncateLimit === NETBIOS_TRUNCATION_LENGTH,
      truncateLimit,
      busy:                  false,
      machinePoolValidation: {}, // map of validation states for each machine pool
      allNamespaces:         [],
      extensionTabs:         getApplicableExtensionEnhancements(this, ExtensionPoint.TAB, TabLocation.CLUSTER_CREATE_RKE2, this.$route, this),
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    ...mapGetters(['currentCluster']),
    ...mapGetters({ features: 'features/get' }),
    ...mapGetters(['namespaces']),

    PUBLIC:   () => PUBLIC,
    PRIVATE:  () => PRIVATE,
    ADVANCED: () => ADVANCED,

    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    showForm() {
      return !!this.credentialId || !this.needCredential;
    },
    /**
     * Is a namespace needed? Only supported for providers from extensions, otherwise default is no
     */
    needsNamespace() {
      return this.extensionProvider ? !!this.extensionProvider.namespaced : false;
    },
    // canManageMembers() {
    //   return canViewClusterMembershipEditor(this.$store);
    // },
    hasMachinePools() {
      if ( this.provider === 'custom' || this.provider === 'import' ) {
        return false;
      }

      return true;
    },
    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },
    addonNames() {
      const names = [];

      console.log(`this.serverConfig: ${ this.serverConfig } this.serverConfig.cni: ${ this.serverConfig.cni } `);
      const cni = this.serverConfig.cni;

      if ( cni ) {
        const parts = cni.split(',').map((x) => `rke2-${ x }`);

        names.push(...parts);
      }

      if (this.showCloudProvider) { // Shouldn't be removed such that changes to it will re-trigger this watch
        if ( this.agentConfig['cloud-provider-name'] === 'rancher-vsphere' ) {
          names.push('rancher-vsphere-cpi', 'rancher-vsphere-csi');
        }

        if ( this.agentConfig['cloud-provider-name'] === HARVESTER ) {
          names.push(HARVESTER_CLOUD_PROVIDER);
        }
      }

      return names;
    },
  },

  watch: {},

  mounted() {
    window.rke = this;
  },

  created() {
    this.registerBeforeHook(this.saveMachinePools, 'save-machine-pools');
    this.registerBeforeHook(this.setRegistryConfig, 'set-registry-config');
    this.registerAfterHook(this.cleanupMachinePools, 'cleanup-machine-pools');
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');

    // Register any hooks for this extension provider
    if (this.extensionProvider?.registerSaveHooks) {
      this.extensionProvider.registerSaveHooks(this.registerBeforeHook, this.registerAfterHook, this.value);
    }
  },

  methods: {
    // nlToBr,
    set,

    /**
     * Initialize all the cluster specs
     */
    async initSpecs() {
    },

    done() {
      const routeName = 'c-cluster-product-resource';

      this.$router.push({
        name:   routeName,
        params: {
          cluster:   this.$route.params.cluster,
          product:   this.$store.getters['productId'],
          resource:  CAPI.RANCHER_CLUSTER,
          namespace: this.value.metadata.namespace,
          id:        this.value.metadata.name,
        },
      });
    },
    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
    },

    // Set busy before save and clear after save
    async saveOverride(btnCb) {
      this.$set(this, 'busy', true);

      // If the provider is from an extension, let it do the provision step
      if (this.extensionProvider?.provision) {
        const errors = await this.extensionProvider?.provision(this.value, this.machinePools);
        const okay = (errors || []).length === 0;

        this.errors = errors;
        this.$set(this, 'busy', false);

        btnCb(okay);

        if (okay) {
          // If saved okay, go to the done route
          return this.done();
        }
      }

      // Default save
      return this._doSaveOverride((done) => {
        this.$set(this, 'busy', false);

        return btnCb(done);
      });
    },
    applyChartValues(rkeConfig) {
      rkeConfig.chartValues = {};
      this.addonNames.forEach((name) => {
        const key = this.chartVersionKey(name);
        const userValues = this.userChartValues[key];

        if (userValues) {
          set(rkeConfig.chartValues, name, userValues);
        }
      });
    },

    generateYaml() {
      const resource = this.value;
      const inStore = this.$store.getters['currentStore'](resource);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const clonedResource = clone(resource);

      this.applyChartValues(clonedResource.spec.rkeConfig);

      const out = createYaml(schemas, resource.type, clonedResource);

      return out;
    },

    cancel() {
      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
          resource: CAPI.RANCHER_CLUSTER,
        },
      });
    },
    validationPassed() {
      const validRequiredPools = this.hasMachinePools ? this.hasRequiredNodes() : true;

      let base = (this.provider === 'custom' || this.isElementalCluster || !!this.credentialId || !this.needCredential);

      // and in all of the validation statuses for each machine pool
      Object.values(this.machinePoolValidation).forEach((v) => (base = base && v));

      return validRequiredPools && base;
    },

    get
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending && !loadedOnce" />
  <Banner
    v-else-if="$fetchState.error"
    color="error"
    :label="$fetchState.error"
  />
  <CruResource
    v-else
    ref="cruresource"
    :mode="mode"
    :validation-passed="validationPassed && fvFormIsValid"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    :generate-yaml="generateYaml"
    class="rke2"
    component-testid="custom-edit"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="fvUnreportedValidationErrors"
  >
    <div class="header-warnings">
      <Banner
        v-if="isEdit"
        color="warning"
      >
        <span v-clean-html="t('cluster.banner.rke2-k3-reprovisioning', {}, true)" />
      </Banner>
    </div>
    <div
      v-if="showForm"
      class="mt-20"
    >
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="needsNamespace"
        :namespace-options="allNamespaces"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{name:fvGetAndReportPathRules('metadata.name')}"
      />

      <!-- Cluster Tabs -->
      <h2 v-t="'cluster.tabs.cluster'" />
      <Tabbed
        :side-tabs="true"
        class="min-height"
      >
        <BasicsTab
          v-model="value"
          :mode="mode"
          :provider="provider"
          :onMembershipUpdate="onMembershipUpdate"
        />
        <MemberRolesTab
          v-model="value"
          :mode="mode"
          :onMembershipUpdate="onMembershipUpdate"
        />
        <Labels
          v-model="value"
          :mode="mode"
        />
      </Tabbed>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
  .min-height {
    min-height: 40em;
  }
  .patch-version {
    margin-top: 5px;
  }
  .header-warnings .banner {
    margin-bottom: 0;
  }
</style>
