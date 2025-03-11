<script>
import { set } from '@shell/utils/object';
import { mapGetters } from 'vuex';
import { defineComponent } from 'vue';
import { allHash } from '@shell/utils/promise';
import isEmpty from 'lodash/isEmpty';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import Labels from '@shell/components/form/Labels.vue';
import Basics from '@pkg/imported/components/Basics.vue';
import ACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE';
import { NORMAN, MANAGEMENT, CAPI, HCI } from '@shell/config/types';
import KeyValue from '@shell/components/form/KeyValue';
import { Checkbox } from '@components/Form/Checkbox';
import { NAME as HARVESTER_MANAGER } from '@shell/config/harvester-manager-types';
import { HARVESTER as HARVESTER_FEATURE, mapFeature, SCHEDULING_CUSTOMIZATION } from '@shell/store/features';
import { HIDE_DESC, mapPref } from '@shell/store/prefs';
import { addObject } from '@shell/utils/array';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import genericImportedClusterValidators from '../util/validators';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { SETTING } from '@shell/config/settings';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT } from '@shell/config/labels-annotations';
import cloneDeep from 'lodash/cloneDeep';
import { VERSION_MANAGEMENT_DEFAULT } from '@pkg/imported/util/shared.ts';
import SchedulingCustomization from '@shell/components/form/SchedulingCustomization';

const HARVESTER_HIDE_KEY = 'cm-harvester-import';
const defaultCluster = {
  agentEnvVars:   [],
  labels:         {},
  annotations:    {},
  importedConfig: { privateRegistryURL: null }
};

export default defineComponent({
  name: 'CruImported',

  components: {
    Basics, ACE, LabeledInput, Loading, CruResource, KeyValue, NameNsDescription, Accordion, Banner, ClusterMembershipEditor, Labels, Checkbox, SchedulingCustomization
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
    const store = this.$store;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
      this.config = this.normanCluster.rke2Config || this.normanCluster.k3sConfig;
      if ( this.normanCluster && isEmpty(this.normanCluster.localClusterAuthEndpoint) ) {
        set(this.normanCluster, 'localClusterAuthEndpoint', { enabled: false });
      }
      if ( this.normanCluster && !this.normanCluster?.agentEnvVars) {
        this.normanCluster.agentEnvVars = [];
      }
      if ( this.normanCluster && !this.normanCluster?.importedConfig) {
        this.normanCluster.importedConfig = {};
      }

      this.showPrivateRegistryInput = !!this.normanCluster?.importedConfig?.privateRegistryURL;
      this.getVersions();
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...cloneDeep(defaultCluster) }, { root: true });
    }
    if (!this.isRKE1) {
      await this.initVersionManagement();
    }
    if (!this.isLocal) {
      // The rancher agent that runs on the local cluster is embedded in the rancher pods that are run in the local cluster, so this is not needed.
      await this.initSchedulingCustomization();
    }
  },

  data() {
    return {
      showPrivateRegistryInput:              false,
      normanCluster:                         { name: '', importedConfig: { privateRegistryURL: null } },
      loadingVersions:                       false,
      membershipUpdate:                      {},
      config:                                null,
      allVersions:                           [],
      defaultVersion:                        '',
      versionManagementGlobalSetting:        false,
      versionManagementOld:                  VERSION_MANAGEMENT_DEFAULT,
      schedulingCustomizationFeatureEnabled: false,
      clusterAgentDefaultPC:                 null,
      clusterAgentDefaultPDB:                null,
      // When disabling clusterAgentDeploymentCustomization, we need to replace the whole object
      needsReplace:                          false,
      fvFormRuleSets:                        [{
        path:  'name',
        rules: ['clusterNameRequired', 'clusterNameChars', 'clusterNameStartEnd', 'clusterNameLength'],
      }, {
        path:  'workerConcurrency',
        rules: ['workerConcurrencyRule']
      }, {
        path:  'controlPlaneConcurrency',
        rules: ['controlPlaneConcurrencyRule']
      }, {
        path:  'normanCluster.importedConfig.privateRegistryURL',
        rules: ['registryUrl']
      }
      ],
    };
  },

  created() {
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    ...mapGetters({ t: 'i18n/t', features: 'features/get' }),
    fvExtraRules() {
      return {
        clusterNameRequired:         genericImportedClusterValidators.clusterNameRequired(this),
        clusterNameChars:            genericImportedClusterValidators.clusterNameChars(this),
        clusterNameStartEnd:         genericImportedClusterValidators.clusterNameStartEnd(this),
        clusterNameLength:           genericImportedClusterValidators.clusterNameLength(this),
        workerConcurrencyRule:       genericImportedClusterValidators.workerConcurrency(this),
        controlPlaneConcurrencyRule: genericImportedClusterValidators.controlPlaneConcurrency(this),
      };
    },

    upgradeStrategy: {
      get() {
        if ( this.normanCluster?.rke2Config ) {
          return this.normanCluster.rke2Config?.rke2upgradeStrategy;
        }

        return this.normanCluster?.k3sConfig?.k3supgradeStrategy;
      },
      set(newValue) {
        if ( this.normanCluster?.rke2Config ) {
          this.normanCluster.rke2Config.rke2upgradeStrategy = newValue;
        }

        this.normanCluster.k3sConfig.k3supgradeStrategy = newValue;
      }

    },
    versionManagement: {
      get() {
        return this.normanCluster.annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT];
      },
      set(newValue) {
        this.normanCluster.annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT] = newValue;
      }

    },

    isEdit() {
      return this.mode === _EDIT;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
    isK3s() {
      return !!this.value.isK3s;
    },
    isRKE1() {
      return !!this.value.isRke1;
    },
    isRke2() {
      return !!this.value.isRke2;
    },
    enableNetworkPolicySupported() {
      // https://github.com/rancher/rancher/pull/33070/files
      return !this.isK3s && !this.isRke2;
    },
    isLocal() {
      return !!this.value.isLocal;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    providerTabKey() {
      if (this.isK3s) {
        return this.t('imported.accordions.k3sOptions');
      } else if (this.isRke2) {
        return this.t('imported.accordions.rke2Options');
      } else {
        return this.t('imported.accordions.basics');
      }
    },

    showBasics() {
      return this.isCreate || !!this.config || !!this.normanCluster.annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT];
    },
    enableInstanceDescription() {
      return this.isLocal || this.isCreate;
    },
    hideDescriptions: mapPref(HIDE_DESC),

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),

    harvesterLocation() {
      return this.isCreate && !this.hideDescriptions.includes(HARVESTER_HIDE_KEY) && this.harvesterEnabled ? {
        name:   `c-cluster-product-resource`,
        params: {
          product:  HARVESTER_MANAGER,
          resource: HCI.CLUSTER,
        }
      } : null;
    },
    clusterAgentDeploymentCustomization() {
      return this.normanCluster.clusterAgentDeploymentCustomization || {};
    },
    schedulingCustomizationVisible() {
      return !this.isLocal && (this.schedulingCustomizationFeatureEnabled || (this.isEdit && this.normanCluster.clusterAgentDeploymentCustomization?.schedulingCustomization ));
    },
  },

  methods: {

    onMembershipUpdate(update) {
      this.membershipUpdate = update;
    },
    async saveRoleBindings() {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },
    async actuallySave() {
      if (this.isEdit) {
        return await this.normanCluster.save({ replace: this.needsReplace });
      } else {
        await this.normanCluster.save();

        return await this.normanCluster.waitForProvisioning();
      }
    },

    async getVersions() {
      this.loadingVersions = true;
      this.versionOptions = [];

      try {
        const globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING) || [];
        let hash = {};

        if (this.isK3s) {
          hash = { versions: this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }) };

          const defaultK3sSetting = globalSettings.find((setting) => setting.id === 'k3s-default-version') || {};

          this.defaultVersion = defaultK3sSetting?.value || defaultK3sSetting?.default;

          // Use the channel if we can not get the version from the settings
          if (!this.defaultVersion) {
            hash.channels = this.$store.dispatch('management/request', { url: '/v1-k3s-release/channels' });
          }
        } else {
          hash = { versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }) };

          const defaultRke2Setting = globalSettings.find((setting) => setting.id === 'rke2-default-version') || {};

          this.defaultVersion = defaultRke2Setting?.value || defaultRke2Setting?.default;

          if (!this.defaultVersion) {
            hash.channels = this.$store.dispatch('management/request', { url: '/v1-rke2-release/channels' });
          }
        }
        const res = await allHash(hash);

        this.allVersions = res.versions?.data || [];
        if (!this.defaultVersion) {
          const channels = res.channels?.data || [];

          this.defaultVersion = channels.find((x) => x.id === 'default')?.latest;
        }

        this.loadingVersions = false;
      } catch (err) {
        this.loadingVersions = false;
        const errors = this.errors;

        errors.push(this.t('imported.errors.kubernetesVersions', { e: err.error || err }));
      }
    },

    kubernetesVersionChanged(val) {
      if ( !this.isK3s ) {
        this.normanCluster.rke2Config.kubernetesVersion = val;
      } else {
        this.normanCluster.k3sConfig.kubernetesVersion = val;
      }
    },
    enableLocalClusterAuthEndpoint(neu) {
      this.normanCluster.localClusterAuthEndpoint.enabled = neu;
      if (!!neu) {
        this.normanCluster.localClusterAuthEndpoint.caCerts = '';
        this.normanCluster.localClusterAuthEndpoint.fqdn = '';
      } else {
        delete this.normanCluster.localClusterAuthEndpoint.caCerts;
        delete this.normanCluster.localClusterAuthEndpoint.fqdn;
      }
    },
    async done() {
      if (this.isCreate) {
        return this.$router.replace({
          name:   'c-cluster-product-resource-namespace-id',
          params: {
            resource:  CAPI.RANCHER_CLUSTER,
            namespace: this.value.metadata.namespace,
            id:        this.normanCluster.id,
          },
        });
      } else {
        if ( !this.doneRoute ) {
          return;
        }

        this.$router.replace({
          name:   this.doneRoute,
          params: this.doneParams || { resource: this.value.type }
        });
      }
    },

    hideHarvesterNotice() {
      const neu = this.hideDescriptions.slice();

      addObject(neu, HARVESTER_HIDE_KEY);

      this.hideDescriptions = neu;
    },
    async initVersionManagement() {
      this.versionManagementGlobalSetting = (await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.IMPORTED_CLUSTER_VERSION_MANAGEMENT })).value === 'true' || false;
      if (!this.normanCluster.annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT]) {
        this.normanCluster.annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT] = VERSION_MANAGEMENT_DEFAULT;
      }
      this.versionManagementOld = this.normanCluster.annotations[IMPORTED_CLUSTER_VERSION_MANAGEMENT];
    },
    async initSchedulingCustomization() {
      this.schedulingCustomizationFeatureEnabled = this.features(SCHEDULING_CUSTOMIZATION);
      this.clusterAgentDefaultPC = JSON.parse((await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS })).value) || null;
      this.clusterAgentDefaultPDB = JSON.parse((await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.CLUSTER_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET })).value) || null;

      if (this.schedulingCustomizationFeatureEnabled && this.mode === _CREATE && isEmpty(this.normanCluster?.clusterAgentDeploymentCustomization?.schedulingCustomization)) {
        set(this.normanCluster, 'clusterAgentDeploymentCustomization.schedulingCustomization', { priorityClass: this.clusterAgentDefaultPC, podDisruptionBudget: this.clusterAgentDefaultPDB });
      }
    },
    setSchedulingCustomization(val) {
      if (val) {
        this.needsReplace = false;
        set(this.normanCluster, 'clusterAgentDeploymentCustomization.schedulingCustomization', { priorityClass: this.clusterAgentDefaultPC, podDisruptionBudget: this.clusterAgentDefaultPDB });
      } else {
        this.needsReplace = true;
        delete this.normanCluster.clusterAgentDeploymentCustomization.schedulingCustomization;
      }
    },
  },

  watch: {
    showCustomRegistryInput(value) {
      if (!value) {
        this.normanCluster.importedConfig.privateRegistryURL = null;
      }
    }
  }

});
</script>

<template>
  <CruResource
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="errors"
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
  >
    <Loading
      v-if="$fetchState.pending"
      mode="relative"
    />
    <div v-else>
      <div>
        <Banner
          v-if="harvesterLocation"
          color="info"
          :closable="true"
          class="mb-20"
          @close="hideHarvesterNotice"
        >
          {{ t('cluster.harvester.importNotice') }}
          <router-link :to="harvesterLocation">
            {{ t('product.harvesterManager') }}
          </router-link>
        </Banner>
        <NameNsDescription
          v-if="!isView"
          v-model:value="normanCluster"
          :mode="mode"
          :namespaced="false"
          :nameEditable="!isEdit"
          :descriptionDisabled="!enableInstanceDescription"
          nameKey="name"
          descriptionKey="description"
          name-label="cluster.name.label"
          name-placeholder="cluster.name.placeholder"
          description-label="cluster.description.label"
          description-placeholder="cluster.description.placeholder"
          :rules="{name: fvGetAndReportPathRules('name')}"
        />
      </div>
      <Accordion
        v-if="showBasics"
        :title="providerTabKey"
        :open-initially="true"
        class="mb-20 accordion"
      >
        <Basics
          :value="normanCluster"
          :mode="mode"
          :config="config"
          :upgrade-strategy="upgradeStrategy"
          :versions="allVersions"
          :default-version="defaultVersion"
          :loading-versions="loadingVersions"
          :show-version-management="!isRKE1"
          :version-management-global-setting="versionManagementGlobalSetting"
          :version-management="versionManagement"
          :version-management-old="versionManagementOld"
          :rules="{workerConcurrency: fvGetAndReportPathRules('workerConcurrency'), controlPlaneConcurrency: fvGetAndReportPathRules('controlPlaneConcurrency') }"
          @kubernetes-version-changed="kubernetesVersionChanged"
          @drain-server-nodes-changed="(val)=>upgradeStrategy.drainServerNodes = val"
          @drain-worker-nodes-changed="(val)=>upgradeStrategy.drainWorkerNodes = val"
          @server-concurrency-changed="(val)=>upgradeStrategy.serverConcurrency = val"
          @worker-concurrency-changed="(val)=>upgradeStrategy.workerConcurrency = val"
          @version-management-changed="(val)=>versionManagement=val"
        />
      </Accordion>
      <Accordion
        class="mb-20 accordion"
        title-key="members.memberRoles"
        :open-initially="true"
      >
        <Banner
          v-if="isLocal"
          color="warning"
          label-key="imported.memberRoles.localBanner"
        />
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
        v-if="schedulingCustomizationVisible"
        class="mb-20 accordion"
        title-key="cluster.agentConfig.tabs.cluster"
        :open-initially="false"
      >
        <h3>
          {{ t('cluster.agentConfig.groups.schedulingCustomization') }}
        </h3>
        <SchedulingCustomization
          :value="clusterAgentDeploymentCustomization.schedulingCustomization"
          :mode="mode"
          :feature="schedulingCustomizationFeatureEnabled"
          :default-p-c="clusterAgentDefaultPC"
          :default-p-d-b="clusterAgentDefaultPDB"
          @scheduling-customization-changed="setSchedulingCustomization"
        />
      </Accordion>
      <Accordion
        class="mb-20 accordion"
        title-key="imported.accordions.labels"
        :open-initially="false"
      >
        <Labels
          v-model:value="normanCluster"
          :mode="mode"
        />
      </Accordion>
      <Accordion
        v-if="isEdit"
        class="mb-20 accordion"
        title-key="imported.accordions.networking"
        data-testid="network-accordion"
        :open-initially="false"
      >
        <div
          v-if="enableNetworkPolicySupported"
          class="mb-20"
        >
          <Banner
            v-if="!!normanCluster.enableNetworkPolicy"
            color="info"
            label-key="imported.network.banner"
          />
          <Checkbox
            v-model:value="normanCluster.enableNetworkPolicy"
            :mode="mode"
            :label="t('cluster.rke2.enableNetworkPolicy.label')"
          />
        </div>
        <h3 v-t="'cluster.tabs.ace'" />
        <ACE
          v-model:value="normanCluster.localClusterAuthEndpoint"
          :mode="mode"
          @local-cluster-auth-endpoint-changed="enableLocalClusterAuthEndpoint"
          @ca-certs-changed="(val)=>normanCluster.localClusterAuthEndpoint.caCerts = val"
          @fqdn-changed="(val)=>normanCluster.localClusterAuthEndpoint.fqdn = val"
        />
      </Accordion>
      <Accordion
        v-if="isEdit && !isRKE1"
        class="mb-20 accordion"
        title-key="imported.accordions.registries"
        data-testid="registries-accordion"
        :open-initially="false"
      >
        <Banner
          color="info"
          class="mt-0"
        >
          {{ t('cluster.privateRegistry.importedDescription') }}
        </Banner>
        <Checkbox
          v-model:value="showPrivateRegistryInput"
          class="mb-20"
          :label="t('cluster.privateRegistry.label')"
          data-testid="private-registry-enable-checkbox"
        />
        <LabeledInput
          v-if="showPrivateRegistryInput"
          v-model:value="normanCluster.importedConfig.privateRegistryURL"
          :mode="mode"
          :disabled="!isEdit"
          :rules="fvGetAndReportPathRules('normanCluster.importedConfig.privateRegistryURL')"
          label-key="catalog.chart.registry.custom.inputLabel"
          data-testid="private-registry-url"
          :placeholder="t('catalog.chart.registry.custom.placeholder')"
        />
      </Accordion>
      <Accordion
        class="mb-20 accordion"
        title-key="imported.accordions.advanced"
        :open-initially="false"
      >
        <h3>
          {{ t('imported.agentEnv.header') }}
        </h3>
        <KeyValue
          v-model:value="normanCluster.agentEnvVars"
          :mode="mode"
          key-name="name"
          :as-map="false"
          :preserve-keys="['valueFrom']"
          :supported="(row) => typeof row.valueFrom === 'undefined'"
          :read-allowed="true"
          :value-can-be-empty="true"
          :key-label="t('cluster.agentEnvVars.keyLabel')"
          :parse-lines-from-file="true"
        />
      </Accordion>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
    .accordion {
        border-radius: 16px;
    }
</style>
