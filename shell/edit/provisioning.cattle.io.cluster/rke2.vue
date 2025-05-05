<script>
import difference from 'lodash/difference';
import throttle from 'lodash/throttle';
import isArray from 'lodash/isArray';
import merge from 'lodash/merge';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { normalizeName } from '@shell/utils/kube';

import {
  CAPI,
  MANAGEMENT,
  NAMESPACE,
  NORMAN,
  SCHEMA,
  DEFAULT_WORKSPACE,
  SECRET,
  HCI,
} from '@shell/config/types';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

import { findBy, removeObject, clear } from '@shell/utils/array';
import { createYaml } from '@shell/utils/create-yaml';
import {
  clone, diff, set, get, isEmpty, mergeWithReplace
} from '@shell/utils/object';
import { allHash } from '@shell/utils/promise';
import { getAllOptionsAfterCurrentVersion, filterOutDeprecatedPatchVersions, isHarvesterSatisfiesVersion, labelForAddon } from '@shell/utils/cluster';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import CruResource, { CONTEXT_HOOK_EDIT_YAML } from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

import { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor';
import semver from 'semver';

import { CLOUD_CREDENTIAL_OVERRIDE } from '@shell/models/nodedriver';
import { SETTING } from '@shell/config/settings';
import { base64Encode } from '@shell/utils/crypto';
import { CAPI as CAPI_ANNOTATIONS, CLUSTER_BADGE } from '@shell/config/labels-annotations';
import AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv';
import Labels from '@shell/edit/provisioning.cattle.io.cluster/Labels';
import MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool';
import SelectCredential from './SelectCredential';
import { ELEMENTAL_SCHEMA_IDS, KIND, ELEMENTAL_CLUSTER_PROVIDER } from '../../config/elemental-types';
import AgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration.vue';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { ExtensionPoint, TabLocation } from '@shell/core/types';
import MemberRoles from '@shell/edit/provisioning.cattle.io.cluster/tabs/MemberRoles';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/tabs/Basics';
import Etcd from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd';
import Networking from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking';
import Upgrade from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade';
import Registries from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries';
import AddOnConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnConfig';
import Advanced from '@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced';
import { DEFAULT_COMMON_BASE_PATH, DEFAULT_SUBDIRS } from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig';
import ClusterAppearance from '@shell/components/form/ClusterAppearance';
import AddOnAdditionalManifest from '@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnAdditionalManifest';
import VsphereUtils, { VMWARE_VSPHERE } from '@shell/utils/v-sphere';
import { mapGetters } from 'vuex';
import { SCHEDULING_CUSTOMIZATION } from '@shell/store/features';
const HARVESTER = 'harvester';
const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';
const NETBIOS_TRUNCATION_LENGTH = 15;

/**
 * Classes to be adopted by the node badges in Machine pools
 */
const NODE_TOTAL = {
  error: {
    color: 'bg-error',
    icon:  'icon-x',
  },
  warning: {
    color: 'bg-warning',
    icon:  'icon-warning',
  },
  success: {
    color: 'bg-success',
    icon:  'icon-checkmark'
  }
};
const CLUSTER_AGENT_CUSTOMIZATION = 'clusterAgentDeploymentCustomization';
const FLEET_AGENT_CUSTOMIZATION = 'fleetAgentDeploymentCustomization';

const REGISTRIES_TAB_NAME = 'registry';

const isAzureK8sUnsupported = (version) => semver.gte(version, '1.30.0');

export default {
  emits: ['update:value', 'input'],

  components: {
    AgentEnv,
    BadgeState,
    Banner,
    AgentConfiguration,
    CruResource,
    Labels,
    Loading,
    MachinePool,
    NameNsDescription,
    SelectCredential,
    Tab,
    Tabbed,
    MemberRoles,
    Basics,
    Etcd,
    Networking,
    Upgrade,
    Registries,
    AddOnConfig,
    Advanced,
    ClusterAppearance,
    AddOnAdditionalManifest
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

    providerConfig: {
      type:    Object,
      default: () => null
    }
  },

  async fetch() {
    await this.fetchRke2Versions();
    await this.initSpecs();
    await this.initAddons();
    await this.initRegistry();
    await this.initSchedulingCustomization();

    Object.entries(this.chartValues).forEach(([name, value]) => {
      const key = this.chartVersionKey(name);

      this.userChartValues[key] = value;
    });

    this.setAgentConfiguration();
  },

  data() {
    if (!this.value.spec.rkeConfig) {
      this.value.spec.rkeConfig = {};
    }

    if (!this.value.spec.rkeConfig.chartValues) {
      this.value.spec.rkeConfig.chartValues = {};
    }

    if (!this.value.spec.rkeConfig.upgradeStrategy) {
      this.value.spec.rkeConfig.upgradeStrategy = {
        controlPlaneConcurrency:  '1',
        controlPlaneDrainOptions: {},
        workerConcurrency:        '1',
        workerDrainOptions:       {},
      };
    }

    // default for dataDirectories configuration obj
    if (!this.value.spec.rkeConfig.dataDirectories) {
      this.value.spec.rkeConfig.dataDirectories = {
        systemAgent:  '',
        provisioning: '',
        k8sDistro:    '',
      };
    }

    // default for dataDirectories configuration systemAgent config
    if (!this.value.spec.rkeConfig.dataDirectories.systemAgent) {
      this.value.spec.rkeConfig.dataDirectories.systemAgent = '';
    }
    // default for dataDirectories configuration provisioning config
    if (!this.value.spec.rkeConfig.dataDirectories.provisioning) {
      this.value.spec.rkeConfig.dataDirectories.provisioning = '';
    }
    // default for dataDirectories configuration k8sDistro config
    if (!this.value.spec.rkeConfig.dataDirectories.k8sDistro) {
      this.value.spec.rkeConfig.dataDirectories.k8sDistro = '';
    }

    if (!this.value.spec.rkeConfig.machineGlobalConfig) {
      this.value.spec.rkeConfig.machineGlobalConfig = {};
    }

    if (!this.value.spec.rkeConfig.machineSelectorConfig?.length) {
      this.value.spec.rkeConfig.machineSelectorConfig = [{ config: {} }];
    }

    const truncateLimit = this.value.defaultHostnameLengthLimit || 0;

    return {
      loadedOnce:                      false,
      lastIdx:                         0,
      allPSAs:                         [],
      credentialId:                    '',
      credential:                      null,
      machinePools:                    null,
      rke2Versions:                    null,
      k3sVersions:                     null,
      defaultRke2:                     '',
      defaultK3s:                      '',
      s3Backup:                        false,
      /**
       * All info related to a specific version of the chart
       *
       * This includes chart itself, README and values
       *
       * { [chartName:string]: { chart: json, readme: string, values: json } }
       */
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
      fvFormRuleSets:                  [{
        path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
      }],
      harvesterVersionRange:                 {},
      cisOverride:                           false,
      truncateLimit,
      busy:                                  false,
      machinePoolValidation:                 {}, // map of validation states for each machine pool
      machinePoolErrors:                     {},
      addonConfigValidation:                 {}, // validation state of each addon config (boolean of whether codemirror's yaml lint passed)
      allNamespaces:                         [],
      extensionTabs:                         getApplicableExtensionEnhancements(this, ExtensionPoint.TAB, TabLocation.CLUSTER_CREATE_RKE2, this.$route, this),
      clusterAgentDeploymentCustomization:   null,
      schedulingCustomizationFeatureEnabled: false,
      clusterAgentDefaultPC:                 null,
      clusterAgentDefaultPDB:                null,
      activeTab:                             null,
      REGISTRIES_TAB_NAME,
      labelForAddon

    };
  },

  computed: {
    ...mapGetters({ features: 'features/get' }),
    isActiveTabRegistries() {
      return this.activeTab?.selectedName === REGISTRIES_TAB_NAME;
    },
    clusterName() {
      return this.value.metadata?.name || '';
    },
    showClusterAppearance() {
      return this.mode === _CREATE;
    },
    clusterBadgeAbbreviation() {
      return this.$store.getters['customisation/getPreviewCluster'];
    },
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    isElementalCluster() {
      return this.provider === ELEMENTAL_CLUSTER_PROVIDER || this.value?.machineProvider?.toLowerCase() === KIND.MACHINE_INV_SELECTOR_TEMPLATES.toLowerCase();
    },

    chartValues() {
      return this.value.spec.rkeConfig.chartValues;
    },

    kubernetesVersion() {
      return this.value.spec.kubernetesVersion;
    },

    rke2Charts() {
      const rke2Versions = this.rke2Versions || [];
      const kubernetesVersion = this.kubernetesVersion;

      const charts = rke2Versions
        .find((version) => version.id === kubernetesVersion)
        ?.charts ?? {};

      return Object.keys(charts);
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    agentConfig() {
      return this.value.agentConfig;
    },

    unsupportedSelectorConfig() {
      let global = 0;
      let kubeletOnly = 0;
      let other = 0;

      // The form supports one config that has no selector for all the main parts
      // And one or more configs that have a selector and exactly only kubelet-args.
      // If there are any other properties set, or multiple configs with no selector
      // show a warning that you're editing only part of the config in the UI.

      for (const conf of this.value.spec?.rkeConfig?.machineSelectorConfig) {
        if (conf.machineLabelSelector) {
          const keys = Object.keys(conf.config || {});

          if (keys.length === 0 || (keys.length === 1 && keys[0] === 'kubelet-arg')) {
            kubeletOnly++;
          } else {
            other++;
          }
        } else {
          global++;
        }
      }

      // eslint-disable-next-line no-console
      console.log(`Global: ${ global }, Kubelet Only: ${ kubeletOnly }, Other: ${ other }`);

      return (global > 1 || other > 0);
    },

    versionOptions() {
      const cur = this.liveValue?.spec?.kubernetesVersion || '';
      const existingRke2 = this.mode === _EDIT && cur.includes('rke2');
      const existingK3s = this.mode === _EDIT && cur.includes('k3s');
      const isAzure = this.agentConfig?.['cloud-provider-name'] === 'azure';

      let allValidRke2Versions = getAllOptionsAfterCurrentVersion(this.$store, this.rke2Versions, (existingRke2 ? cur : null), this.defaultRke2);
      let allValidK3sVersions = getAllOptionsAfterCurrentVersion(this.$store, this.k3sVersions, (existingK3s ? cur : null), this.defaultK3s);

      if (!this.showDeprecatedPatchVersions) {
        // Normally, we only want to show the most recent patch version
        // for each Kubernetes minor version. However, if the user
        // opts in to showing deprecated versions, we don't filter them.
        allValidRke2Versions = filterOutDeprecatedPatchVersions(allValidRke2Versions, cur);
        allValidK3sVersions = filterOutDeprecatedPatchVersions(allValidK3sVersions, cur);
      }

      if (isAzure) {
        allValidRke2Versions = allValidRke2Versions.filter((v) => !isAzureK8sUnsupported(v.value));
        allValidK3sVersions = allValidK3sVersions.filter((v) => !isAzureK8sUnsupported(v.value));
      }

      const showRke2 = allValidRke2Versions.length && !existingK3s;
      const showK3s = allValidK3sVersions.length && !existingRke2;
      const out = [];

      if (showRke2) {
        if (showK3s) {
          out.push({ kind: 'group', label: this.t('cluster.provider.rke2') });
        }

        out.push(...allValidRke2Versions);
      }

      if (showK3s) {
        if (showRke2) {
          out.push({ kind: 'group', label: this.t('cluster.provider.k3s') });
        }

        out.push(...allValidK3sVersions);
      }

      if (cur) {
        const existing = out.find((x) => x.value === cur);

        if (existing) {
          existing.disabled = false;
        }
      }

      return out;
    },

    /**
     * Kube Version
     */
    selectedVersion() {
      const str = this.value.spec.kubernetesVersion;

      if (!str) {
        return;
      }

      const out = findBy(this.versionOptions, 'value', str);

      // Adding the option 'none' to Container Network select (used in Basics component)
      // https://github.com/rancher/dashboard/issues/10338
      // there's an update loop on refresh that might include 'none'
      // multiple times... Prevent that
      if (out?.serverArgs?.cni?.options && !out.serverArgs?.cni?.options.includes('none')) {
        out.serverArgs.cni.options.push('none');
      }

      return out;
    },

    haveArgInfo() {
      return Boolean(this.selectedVersion?.serverArgs && this.selectedVersion?.agentArgs);
    },

    serverArgs() {
      return this.selectedVersion?.serverArgs || {};
    },

    agentArgs() {
      return this.selectedVersion?.agentArgs || {};
    },

    /**
     * The addons (kube charts) applicable for the selected kube version
     *
     * { [chartName:string]: { repo: string, version: string } }
     */
    chartVersions() {
      return this.selectedVersion?.charts || {};
    },

    needCredential() {
      // Check non-provider specific config
      if (
        this.provider === 'custom' ||
        this.provider === 'import' ||
        this.isElementalCluster || // Elemental cluster can make use of `cloud-credential`: false
        this.mode === _VIEW
      ) {
        return false;
      }

      // Check provider specific config
      if (this.cloudCredentialsOverride === true || this.cloudCredentialsOverride === false) {
        return this.cloudCredentialsOverride;
      }

      if (this.providerConfig?.spec?.builtin === false && this.providerConfig?.spec?.addCloudCredential === false) {
        return false;
      }

      return true;
    },

    /**
     * Override the native way of determining if cloud credentials are required (builtin ++ node driver spec.addCloudCredentials)
     *
     * 1) Override via extensions
     *    - `true` or actual component - return true
     *    - `false` - return false
     * 2) Override via hardcoded setting
     */
    cloudCredentialsOverride() {
      const cloudCredential = this.$plugin.getDynamic('cloud-credential', this.provider);

      if (cloudCredential === undefined) {
        return CLOUD_CREDENTIAL_OVERRIDE[this.provider];
      }

      return !!cloudCredential;
    },

    hasMachinePools() {
      if (this.provider === 'custom' || this.provider === 'import') {
        return false;
      }

      return true;
    },

    unremovedMachinePools() {
      return (this.machinePools || []).filter((x) => !x.remove);
    },

    /**
     * Extension provider where being provisioned by an extension
     */
    extensionProvider() {
      const extClass = this.$plugin.getDynamic('provisioner', this.provider);

      if (extClass) {
        return new extClass({
          dispatch: this.$store.dispatch,
          getters:  this.$store.getters,
          axios:    this.$store.$axios,
          $plugin:  this.$store.app.$plugin,
          $t:       this.t,
          isCreate: this.isCreate
        });
      }

      return undefined;
    },

    /**
     * Is a namespace needed? Only supported for providers from extensions, otherwise default is no
     */
    needsNamespace() {
      return this.extensionProvider ? !!this.extensionProvider.namespaced : false;
    },

    machineConfigSchema() {
      let schema;

      if (!this.hasMachinePools) {
        return null;
      } else if (this.isElementalCluster) {
        schema = ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES;
      } else {
        schema = `${ CAPI.MACHINE_CONFIG_GROUP }.${ this.provider }config`;
      }

      // If this is an extension provider then the extension can provide the schema
      const extensionSchema = this.extensionProvider?.machineConfigSchema;

      if (extensionSchema) {
        // machineConfigSchema can either be the schema name (string) or the schema itself (object)
        if (typeof extensionSchema === 'object') {
          return extensionSchema;
        }

        // Name of schema to use
        schema = extensionSchema;
      }

      return this.$store.getters['management/schemaFor'](schema);
    },

    nodeTotals() {
      const roles = ['etcd', 'controlPlane', 'worker'];
      const counts = {};
      const out = {
        color:   {},
        label:   {},
        icon:    {},
        tooltip: {},
      };

      for (const role of roles) {
        counts[role] = 0;
        out.color[role] = NODE_TOTAL.success.color;
        out.icon[role] = NODE_TOTAL.success.icon;
      }

      for (const row of this.machinePools || []) {
        if (row.remove) {
          continue;
        }

        const qty = parseInt(row.pool.quantity, 10);

        if (isNaN(qty)) {
          continue;
        }

        for (const role of roles) {
          counts[role] = counts[role] + (row.pool[`${ role }Role`] ? qty : 0);
        }
      }

      for (const role of roles) {
        out.label[role] = this.t(`cluster.machinePool.nodeTotals.label.${ role }`, { count: counts[role] });
        out.tooltip[role] = this.t(`cluster.machinePool.nodeTotals.tooltip.${ role }`, { count: counts[role] });
      }

      if (counts.etcd === 0) {
        out.color.etcd = NODE_TOTAL.error.color;
        out.icon.etcd = NODE_TOTAL.error.icon;
      } else if (counts.etcd === 1 || counts.etcd % 2 === 0 || counts.etcd > 7) {
        out.color.etcd = NODE_TOTAL.warning.color;
        out.icon.etcd = NODE_TOTAL.warning.icon;
      }

      if (counts.controlPlane === 0) {
        out.color.controlPlane = NODE_TOTAL.error.color;
        out.icon.controlPlane = NODE_TOTAL.error.icon;
      } else if (counts.controlPlane === 1) {
        out.color.controlPlane = NODE_TOTAL.warning.color;
        out.icon.controlPlane = NODE_TOTAL.warning.icon;
      }

      if (counts.worker === 0) {
        out.color.worker = NODE_TOTAL.error.color;
        out.icon.worker = NODE_TOTAL.error.icon;
      } else if (counts.worker === 1) {
        out.color.worker = NODE_TOTAL.warning.color;
        out.icon.worker = NODE_TOTAL.warning.icon;
      }

      return out;
    },

    showCni() {
      return !!this.serverArgs.cni;
    },

    showCloudProvider() {
      return !!this.agentArgs['cloud-provider-name'];
    },

    /**
     * The chart names of the addons applicable to the current kube version and selected cloud provider
     */
    addonNames() {
      const names = [];
      const cni = this.serverConfig.cni;

      if (typeof cni === 'string') {
        names.push(...cni.split(',').map((x) => `rke2-${ x }`));
      } else if (Array.isArray(cni)) {
        names.push(...cni.map((x) => `rke2-${ x }`));
      }

      if (this.showCloudProvider) { // Shouldn't be removed such that changes to it will re-trigger this watch
        if (this.agentConfig?.['cloud-provider-name'] === 'rancher-vsphere') {
          names.push('rancher-vsphere-cpi', 'rancher-vsphere-csi');
        }

        if (this.agentConfig?.['cloud-provider-name'] === HARVESTER) {
          names.push(HARVESTER_CLOUD_PROVIDER);
        }
      }

      return names;
    },

    /**
     * The charts of the addons applicable to the current kube version and selected cloud provider
     *
     * These are the charts themselves and do not include chart readme or values
     */
    addonVersions() {
      const versions = this.addonNames.map((name) => this.versionInfo[name]?.chart);

      return versions.filter((x) => !!x);
    },

    cloudProviderOptions() {
      const out = [{
        label:    this.$store.getters['i18n/t']('cluster.rke2.cloudProvider.defaultValue.label'),
        value:    '',
        disabled: this.canAzureMigrateOnEdit
      }];

      if (!!this.agentArgs['cloud-provider-name']?.options) {
        const preferred = this.$store.getters['plugins/cloudProviderForDriver'](this.provider);

        for (const opt of this.agentArgs['cloud-provider-name']?.options) {
          // If we don't have a preferred provider... show all options
          const showAllOptions = preferred === undefined;
          // If we have a preferred provider... only show default, preferred and external
          const isPreferred = opt === preferred;
          const isExternal = opt === 'external';
          const isAzure = opt === 'azure';

          let disabled = false;

          if ((this.isHarvesterExternalCredential || this.isHarvesterIncompatible) && isPreferred) {
            disabled = true;
          }

          if (isAzure && isAzureK8sUnsupported(this.value.spec.kubernetesVersion)) {
            disabled = true;
          }

          if (!isAzure && !isExternal && this.canAzureMigrateOnEdit) {
            disabled = true;
          }

          if (showAllOptions || isPreferred || isExternal) {
            out.push({
              label: this.$store.getters['i18n/withFallback'](`cluster.cloudProvider."${ opt }".label`, null, opt),
              value: opt,
              disabled,
            });
          }
        }
      }

      const cur = this.agentConfig?.['cloud-provider-name'];

      if (cur && !out.find((x) => x.value === cur)) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
    },

    isAzureProviderUnsupported() {
      const isAzureAvailable = !!this.cloudProviderOptions.find((p) => p.value === 'azure');
      const isAzureSelected = this.agentConfig['cloud-provider-name'] === 'azure';

      return isAzureAvailable && (isAzureK8sUnsupported(this.value.spec.kubernetesVersion) || isAzureSelected);
    },

    canAzureMigrateOnEdit() {
      if (!this.isEdit) {
        return false;
      }

      const isAzureLiveProvider = this.liveValue.agentConfig['cloud-provider-name'] === 'azure';

      return isAzureLiveProvider &&
        semver.gte(this.liveValue?.spec?.kubernetesVersion, '1.27.0') &&
        semver.lt(this.liveValue?.spec?.kubernetesVersion, '1.30.0');
    },

    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    isHarvesterDriver() {
      return this.$route.query.type === HARVESTER;
    },

    defaultVersion() {
      const all = this.versionOptions.filter((x) => !!x.value);
      const first = all[0]?.value;
      const preferred = all.find((x) => x.value === this.defaultRke2)?.value;

      const rke2 = getAllOptionsAfterCurrentVersion(this.$store, this.rke2Versions, null);
      const showRke2 = rke2.length;
      let out;

      if (this.isHarvesterDriver && showRke2) {
        const satisfiesVersion = rke2.filter((v) => {
          return isHarvesterSatisfiesVersion(v.value);
        }) || [];

        if (satisfiesVersion.length > 0) {
          out = satisfiesVersion[0]?.value;
        }
      }

      if (!out) {
        out = preferred || first;
      }

      return out;
    },

    appsOSWarning() {
      if (this.mode !== _EDIT) {
        return null;
      }
      const { linuxWorkerCount, windowsWorkerCount } = this.value?.mgmt?.status || {};

      if (!windowsWorkerCount) {
        if (!!this.machinePools?.find((pool) => {
          return pool?.config?.os === 'windows';
        })) {
          return this.t('cluster.banner.os', { newOS: 'Windows', existingOS: 'Linux' });
        }
      } else if (!linuxWorkerCount) {
        if (this.machinePools.find((pool) => {
          return pool?.config?.os === 'linux';
        })) {
          return this.t('cluster.banner.os', { newOS: 'Linux', existingOS: 'Windows' });
        }
      }

      return null;
    },

    showForm() {
      return !!this.credentialId || !this.needCredential;
    },

    isHarvesterExternalCredential() {
      return this.credential?.harvestercredentialConfig?.clusterType === 'external';
    },

    isHarvesterIncompatible() {
      let ccmRke2Version = (this.chartVersions['harvester-cloud-provider'] || {})['version'];
      let csiRke2Version = (this.chartVersions['harvester-csi-driver'] || {})['version'];

      const ccmVersion = this.harvesterVersionRange?.['harvester-cloud-provider'];
      const csiVersion = this.harvesterVersionRange?.['harvester-csi-provider'];

      if ((ccmRke2Version || '').endsWith('00')) {
        ccmRke2Version = ccmRke2Version.slice(0, -2);
      }

      if ((csiRke2Version || '').endsWith('00')) {
        csiRke2Version = csiRke2Version.slice(0, -2);
      }

      if (ccmVersion && csiVersion) {
        if (semver.satisfies(ccmRke2Version, ccmVersion) &&
          semver.satisfies(csiRke2Version, csiVersion)) {
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    },

    validationPassed() {
      const validRequiredPools = this.hasMachinePools ? this.hasRequiredNodes() : true;

      let base = (this.provider === 'custom' || this.isElementalCluster || !!this.credentialId || !this.needCredential);

      // and in all of the validation statuses for each machine pool
      Object.values(this.machinePoolValidation).forEach((v) => (base = base && v));

      const hasAddonConfigErrors = Object.values(this.addonConfigValidation).filter((v) => v === false).length > 0;

      return validRequiredPools && base && !hasAddonConfigErrors;
    },
    currentCluster() {
      if (this.mode === _EDIT) {
        return { ...this.value };
      } else {
        return this.$store.getters['customisation/getPreviewCluster'];
      }
    },
    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    }
  },

  watch: {
    clusterBadgeAbbreviation: {
      immediate: true,
      handler(neu) {
        if (!neu) {
          return;
        }

        if (Object.keys(neu.badge).length <= 0) {
          return { ...this.value };
        }

        const obj = {
          [CLUSTER_BADGE.ICON_TEXT]: neu.badge.iconText, [CLUSTER_BADGE.COLOR]: neu.badge.color, [CLUSTER_BADGE.TEXT]: neu.badge.text
        };

        this.value.metadata.annotations = {
          ...this.value.metadata.annotations,
          ...obj
        };
      }
    },

    credentialId(val) {
      if (val) {
        this.credential = this.$store.getters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, this.credentialId);

        if (this.isHarvesterDriver) {
          this.setHarvesterVersionRange();
        }
      } else {
        this.credential = null;
      }

      this.value.spec.cloudCredentialSecretName = val;
    },

    addonNames(neu, old) {
      // To catch the 'some addons' --> 'no addons' case also check array length (`difference([], [1,2,3]) === []`)
      const diff = old.length !== neu.length || difference(neu, old).length;

      if (diff) {
        // Allow time for addonNames to update... then fetch any missing addons
        this.$nextTick(() => this.initAddons());
      }
    },

    selectedVersion() {
      this.versionInfo = {}; // Invalidate cache such that version info relevent to selected kube version is updated

      // Allow time for addonNames to update... then fetch any missing addons
      this.$nextTick(() => this.initAddons());
      if (this.mode === _CREATE) {
        this.initServerAgentArgs();
      }
    },

    showCni(neu) {
      // Update `serverConfig.cni to recalculate addonNames...
      // ... which will eventually update `value.spec.rkeConfig.chartValues`
      if (neu) {
        // Type supports CNI, assign default if we can
        if (!this.serverConfig.cni) {
          const def = this.serverArgs.cni.default;

          this.serverConfig.cni = def;
        }
      } else {
        // Type doesn't support cni, clear `cni`
        this.serverConfig.cni = undefined;
      }
    },

    showCloudProvider(neu) {
      if (!neu) {
        // No cloud provider available? Then clear cloud provider setting. This will recalculate addonNames...
        // ... which will eventually update `value.spec.rkeConfig.chartValues`
        this.agentConfig['cloud-provider-name'] = undefined;
      }
    },
  },

  created() {
    this.registerBeforeHook(this.saveMachinePools, 'save-machine-pools', 1);
    this.registerBeforeHook(this.setRegistryConfig, 'set-registry-config');
    this.registerBeforeHook(this.handleVsphereCpiSecret, 'sync-vsphere-cpi');
    this.registerBeforeHook(this.handleVsphereCsiSecret, 'sync-vsphere-csi');
    this.registerAfterHook(this.cleanupMachinePools, 'cleanup-machine-pools');
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');

    // Register any hooks for this extension provider
    if (this.extensionProvider?.registerSaveHooks) {
      this.extensionProvider.registerSaveHooks(this.registerBeforeHook, this.registerAfterHook, this.value);
    }
  },

  methods: {
    set,

    async handleVsphereCpiSecret() {
      return VsphereUtils.handleVsphereCpiSecret(this);
    },

    async handleVsphereCsiSecret() {
      return VsphereUtils.handleVsphereCsiSecret(this);
    },

    /**
     * Initialize all the cluster specs
     */
    async initSpecs() {
      if (!this.value.spec) {
        this.value.spec = {};
      }

      if (!this.value.spec.machineSelectorConfig) {
        this.value.spec.machineSelectorConfig = [];
      }

      if (!this.value.spec.machineSelectorConfig.find((x) => !x.machineLabelSelector)) {
        this.value.spec.machineSelectorConfig.unshift({ config: {} });
      }

      if (this.value.spec.cloudCredentialSecretName) {
        await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
        this.credentialId = `${ this.value.spec.cloudCredentialSecretName }`;
      }

      if (!this.value.spec.kubernetesVersion) {
        this.value.spec.kubernetesVersion = this.defaultVersion;
      }

      if (this.rkeConfig.etcd?.s3?.bucket) {
        this.s3Backup = true;
      }

      if (!this.rkeConfig.etcd) {
        this.rkeConfig.etcd = {
          disableSnapshots:     false,
          s3:                   null,
          snapshotRetention:    5,
          snapshotScheduleCron: '0 */5 * * *',
        };
      } else if (typeof this.rkeConfig.etcd.disableSnapshots === 'undefined') {
        const disableSnapshots = !this.rkeConfig.etcd.snapshotRetention && !this.rkeConfig.etcd.snapshotScheduleCron;

        this.rkeConfig.etcd.disableSnapshots = disableSnapshots;
      }

      // Namespaces if required - this is mainly for custom provisioners via extensions that want
      // to allow creating their resources in a different namespace
      if (this.needsNamespace) {
        this.allNamespaces = await this.$store.dispatch('management/findAll', { type: NAMESPACE });
      }

      if (!this.machinePools) {
        await this.initMachinePools(this.value.spec.rkeConfig.machinePools);
        if (this.mode === _CREATE && !this.machinePools.length) {
          await this.addMachinePool();
        }
      }

      if (this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName === undefined) {
        this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName = '';
      }

      if ( isEmpty(this.value?.spec?.localClusterAuthEndpoint) ) {
        set(this.value, 'spec.localClusterAuthEndpoint', { enabled: false });
      }
    },

    /**
     * Fetch RKE versions and their configurations to be mapped to the form
     */
    async fetchRke2Versions() {
      if (!this.rke2Versions) {
        const hash = {
          rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
          k3sVersions:  this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }),
        };

        if (this.$store.getters['management/canList'](MANAGEMENT.PSA)) {
          hash.allPSAs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
        }

        // Get the latest versions from the global settings if possible
        const globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING) || [];
        const defaultRke2Setting = globalSettings.find((setting) => setting.id === 'rke2-default-version') || {};
        const defaultK3sSetting = globalSettings.find((setting) => setting.id === 'k3s-default-version') || {};

        let defaultRke2 = defaultRke2Setting?.value || defaultRke2Setting?.default;
        let defaultK3s = defaultK3sSetting?.value || defaultK3sSetting?.default;

        // RKE2: Use the channel if we can not get the version from the settings
        if (!defaultRke2) {
          hash.rke2Channels = this.$store.dispatch('management/request', { url: '/v1-rke2-release/channels' });
        }

        // K3S: Use the channel if we can not get the version from the settings
        if (!defaultK3s) {
          hash.k3sChannels = this.$store.dispatch('management/request', { url: '/v1-k3s-release/channels' });
        }

        const res = await allHash(hash);

        this.allPSAs = res.allPSAs || [];
        this.rke2Versions = res.rke2Versions.data || [];
        this.k3sVersions = res.k3sVersions.data || [];

        if (!defaultRke2) {
          const rke2Channels = res.rke2Channels.data || [];

          defaultRke2 = rke2Channels.find((x) => x.id === 'default')?.latest;
        }

        if (!defaultK3s) {
          const k3sChannels = res.k3sChannels.data || [];

          defaultK3s = k3sChannels.find((x) => x.id === 'default')?.latest;
        }

        if (!this.rke2Versions.length && !this.k3sVersions.length) {
          throw new Error('No version info found in KDM');
        }

        // Store default versions
        this.defaultRke2 = defaultRke2;
        this.defaultK3s = defaultK3s;
      }
    },

    async initSchedulingCustomization() {
      this.schedulingCustomizationFeatureEnabled = this.features(SCHEDULING_CUSTOMIZATION);
      try {
        this.clusterAgentDefaultPC = JSON.parse((await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS })).value) || null;
      } catch (e) {
        this.errors.push(e);
      }
      try {
        this.clusterAgentDefaultPDB = JSON.parse((await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.CLUSTER_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET })).value) || null;
      } catch (e) {
        this.errors.push(e);
      }

      if (this.schedulingCustomizationFeatureEnabled && this.mode === _CREATE && isEmpty(this.value?.spec?.clusterAgentDeploymentCustomization?.schedulingCustomization)) {
        set(this.value, 'spec.clusterAgentDeploymentCustomization.schedulingCustomization', { priorityClass: this.clusterAgentDefaultPC, podDisruptionBudget: this.clusterAgentDefaultPDB });
      }
    },

    setSchedulingCustomization(val) {
      if (val) {
        set(this.value, 'spec.clusterAgentDeploymentCustomization.schedulingCustomization', { priorityClass: this.clusterAgentDefaultPC, podDisruptionBudget: this.clusterAgentDefaultPDB });
      } else {
        delete this.value.spec.clusterAgentDeploymentCustomization.schedulingCustomization;
      }
    },

    cleanAgentConfiguration(model, key) {
      if (!model || !model[key]) {
        return;
      }

      const v = model[key];

      if (Array.isArray(v) && v.length === 0) {
        delete model[key];
      } else if (v && typeof v === 'object') {
        Object.keys(v).forEach((k) => {
          // delete these auxiliary props used in podAffinity and nodeAffinity that shouldn't be sent to the server
          if (k === '_namespaceOption' || k === '_namespaces' || k === '_anti' || k === '_id') {
            delete v[k];
          }

          // prevent cleanup of "namespaceSelector" when an empty object because it represents all namespaces in pod/node affinity
          // https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#podaffinityterm-v1-core
          if (k !== 'namespaceSelector') {
            this.cleanAgentConfiguration(v, k);
          }
        });

        if (Object.keys(v).length === 0) {
          delete model[key];
        }
      }
    },

    /**
     * Clean agent configuration objects, so we only send values when the user has configured something
     */
    agentConfigurationCleanup() {
      this.cleanAgentConfiguration(this.value.spec, CLUSTER_AGENT_CUSTOMIZATION);
      this.cleanAgentConfiguration(this.value.spec, FLEET_AGENT_CUSTOMIZATION);
    },

    /**
     * Ensure we have empty models for the two agent configurations
     */
    setAgentConfiguration() {
      // Cluster Agent Configuration
      if (!this.value.spec[CLUSTER_AGENT_CUSTOMIZATION]) {
        this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] = {};
      }

      // Fleet Agent Configuration
      if (!this.value.spec[FLEET_AGENT_CUSTOMIZATION]) {
        this.value.spec[FLEET_AGENT_CUSTOMIZATION] = {};
      }
    },

    /**
     * set instanceNameLimit to 15 to all pool machine if truncateHostnames checkbox is clicked
     */
    truncateHostname(neu) {
      if (neu) {
        this.value.defaultHostnameLengthLimit = NETBIOS_TRUNCATION_LENGTH;
        this.truncateLimit = NETBIOS_TRUNCATION_LENGTH;
      } else {
        this.truncateLimit = 0;
        this.value.removeDefaultHostnameLengthLimit();
      }
    },

    enableLocalClusterAuthEndpoint(neu) {
      this.localValue.spec.localClusterAuthEndpoint.enabled = neu;
      if (!neu) {
        delete this.localValue.spec.localClusterAuthEndpoint.caCerts;
        delete this.localValue.spec.localClusterAuthEndpoint.fqdn;
      } else {
        this.localValue.spec.localClusterAuthEndpoint.caCerts = '';
        this.localValue.spec.localClusterAuthEndpoint.fqdn = '';
      }
    },

    /**
     * Get machine pools from the cluster configuration
     * this.value.spec.rkeConfig.machinePools
     */
    async initMachinePools(existing) {
      const out = [];

      if (existing?.length) {
        for (const pool of existing) {
          let type;

          if (this.isElementalCluster) {
            type = ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES;
          } else {
            type = `${ CAPI.MACHINE_CONFIG_GROUP }.${ pool.machineConfigRef.kind.toLowerCase() }`;
          }

          let config;
          let configMissing = false;

          if (this.$store.getters['management/canList'](type)) {
            try {
              config = await this.$store.dispatch('management/find', {
                type,
                id: `${ this.value.metadata.namespace }/${ pool.machineConfigRef.name }`,
              });
            } catch (e) {
              // Some users can't see the config, that's ok.
              // we will display a banner for a 404 only for elemental
              if (e?.status === 404) {
                if (this.isElementalCluster) {
                  configMissing = true;
                }
              }
            }
          }

          // @TODO what if the pool is missing?
          const id = `pool${ ++this.lastIdx }`;

          out.push({
            id,
            remove: false,
            create: false,
            update: true,
            pool:   clone(pool),
            config: config ? await this.$store.dispatch('management/clone', { resource: config }) : null,
            configMissing
          });
        }
      }

      this.machinePools = out;
    },

    async addMachinePool(idx) {
      // this.machineConfigSchema is the schema for the Machine Pool's machine configuration for the given provider
      if (!this.machineConfigSchema) {
        return;
      }

      const numCurrentPools = this.machinePools.length || 0;

      let config;

      if (this.extensionProvider?.createMachinePoolMachineConfig) {
        config = await this.extensionProvider.createMachinePoolMachineConfig(idx, this.machinePools, this.value);
      } else {
        // Default - use the schema
        config = await this.$store.dispatch('management/createPopulated', {
          type:     this.machineConfigSchema.id,
          metadata: { namespace: DEFAULT_WORKSPACE }
        });

        // If there is no specific model, the applyDefaults does nothing by default
        config.applyDefaults(idx, this.machinePools);
      }

      const name = `pool${ ++this.lastIdx }`;

      const pool = {
        id:     name,
        config,
        remove: false,
        create: true,
        update: false,
        uid:    name,
        pool:   {
          name,
          etcdRole:             numCurrentPools === 0,
          controlPlaneRole:     numCurrentPools === 0,
          workerRole:           true,
          hostnamePrefix:       '',
          labels:               {},
          quantity:             1,
          unhealthyNodeTimeout: '0m',
          machineConfigRef:     {
            kind: this.machineConfigSchema.attributes?.kind,
            name: null,
          },
          drainBeforeDelete: true
        },
      };

      if (this.provider === VMWARE_VSPHERE) {
        pool.pool.machineOS = 'linux';
      }

      if (this.isElementalCluster) {
        pool.pool.machineConfigRef.apiVersion = `${ this.machineConfigSchema.attributes.group }/${ this.machineConfigSchema.attributes.version }`;
      }

      this.machinePools.push(pool);

      this.$nextTick(() => {
        if (this.$refs.pools?.select) {
          this.$refs.pools.select(name);
        }
      });
    },

    removeMachinePool(idx) {
      const entry = this.machinePools[idx];

      if (!entry) {
        return;
      }

      if (entry.create) {
        // If this is a new pool that isn't saved yet, it can just be dropped
        removeObject(this.machinePools, entry);
      } else {
        // Mark for removal on save
        entry.remove = true;
      }
    },

    async syncMachineConfigWithLatest(machinePool) {
      if (machinePool?.config?.id) {
        // Use management/request instead of management/find to avoid overwriting the current machine pool in the store
        const _latestConfig = await this.$store.dispatch('management/request', { url: `/v1/${ machinePool.config.type }s/${ machinePool.config.id }` });
        const latestConfig = await this.$store.dispatch('management/create', _latestConfig);

        const clonedCurrentConfig = await this.$store.dispatch('management/clone', { resource: machinePool.config });
        const clonedLatestConfig = await this.$store.dispatch('management/clone', { resource: latestConfig });

        // We don't allow the user to edit any of the fields in metadata from the UI so it's safe to override it with the
        // metadata defined by the latest backend value. This is primarily used to ensure the resourceVersion is up to date.
        delete clonedCurrentConfig.metadata;

        if (this.provider === VMWARE_VSPHERE) {
          machinePool.config = mergeWithReplace(clonedLatestConfig, clonedCurrentConfig, { mutateOriginal: true });
        } else {
          machinePool.config = merge(clonedLatestConfig, clonedCurrentConfig);
        }
      }
    },

    async saveMachinePools(hookContext) {
      if (hookContext === CONTEXT_HOOK_EDIT_YAML) {
        await new Promise((resolve, reject) => {
          this.$store.dispatch('cluster/promptModal', {
            component:      'GenericPrompt',
            componentProps: {
              title:     this.t('cluster.rke2.modal.editYamlMachinePool.title'),
              body:      this.t('cluster.rke2.modal.editYamlMachinePool.body'),
              applyMode: 'editAndContinue',
              confirm:   async(confirmed) => {
                if (confirmed) {
                  await this.validateMachinePool();

                  if (this.errors.length) {
                    reject(new Error('Machine Pool validation errors'));
                  }

                  resolve();
                } else {
                  reject(new Error('User Cancelled'));
                }
              }
            },
          });
        });
      }

      const finalPools = [];

      // If the extension provider wants to do this, let them
      if (this.extensionProvider?.saveMachinePoolConfigs) {
        return await this.extensionProvider.saveMachinePoolConfigs(this.machinePools, this.value);
      }

      for (const entry of this.machinePools) {
        if (entry.remove) {
          continue;
        }

        await this.syncMachineConfigWithLatest(entry);

        // Capitals and such aren't allowed;
        entry.pool.name = normalizeName(entry.pool.name) || 'pool';

        const prefix = `${ this.value.metadata.name }-${ entry.pool.name }`.substr(0, 50).toLowerCase();

        if (entry.create) {
          if (!entry.config.metadata?.name) {
            entry.config.metadata.generateName = `nc-${ prefix }-`;
          }

          const neu = await entry.config.save();

          entry.config = neu;
          entry.pool.machineConfigRef.name = neu.metadata.name;
          entry.create = false;
          entry.update = true;
        } else if (entry.update) {
          entry.config = await entry.config.save();
        }

        // Ensure Elemental clusters have a hostname prefix
        if (this.isElementalCluster && !entry.pool.hostnamePrefix) {
          entry.pool.hostnamePrefix = `${ prefix }-`;
        }

        finalPools.push(entry.pool);
      }

      this.value.spec.rkeConfig.machinePools = finalPools;
    },

    async cleanupMachinePools() {
      for (const entry of this.machinePools) {
        if (entry.remove && entry.config) {
          try {
            await entry.config.remove();
          } catch (e) { }
        }
      }
    },

    async saveRoleBindings() {
      await this.value.waitForMgmt();

      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.value.mgmt.id);
      }
    },

    /**
     * Ensure that all the existing node roles pool are at least 1 each
     */
    hasRequiredNodes() {
      return this.nodeTotals?.color && Object.values(this.nodeTotals.color).every((color) => color !== NODE_TOTAL.error.color);
    },

    cancelCredential() {
      if (this.$refs.cruresource) {
        this.$refs.cruresource.emitOrRoute();
      }
    },

    done() {
      let routeName = 'c-cluster-product-resource';

      if (this.mode === _CREATE && (this.provider === 'import' || this.provider === 'custom')) {
        // Go show the registration command
        routeName = 'c-cluster-product-resource-namespace-id';
      }

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

    showAddonConfirmation() {
      return new Promise((resolve, reject) => {
        this.$store.dispatch('cluster/promptModal', {
          component: 'AddonConfigConfirmationDialog',
          resources: [(value) => resolve(value)]
        });
      });
    },

    // Set busy before save and clear after save
    async saveOverride(btnCb) {
      this['busy'] = true;

      // If the provider is from an extension, let it do the provision step
      if (this.extensionProvider?.provision) {
        const errors = await this.extensionProvider?.provision(this.value, this.machinePools);
        const okay = (errors || []).length === 0;

        this.errors = errors;
        this['busy'] = false;

        btnCb(okay);

        if (okay) {
          // If saved okay, go to the done route
          return this.done();
        }
      }

      // Default save
      return this._doSaveOverride((done) => {
        this['busy'] = false;

        return btnCb(done);
      });
    },

    async _doSaveOverride(btnCb) {
      // We cannot use the hook, because it is triggered on YAML toggle without restore initialized data
      this.agentConfigurationCleanup();

      const isEditVersion = this.isEdit && this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion;

      if (isEditVersion) {
        const shouldContinue = await this.showAddonConfirmation();

        if (!shouldContinue) {
          return btnCb('cancelled');
        }
      }

      this.validateClusterName();

      await this.validateMachinePool();

      if (this.errors.length) {
        btnCb(false);

        return;
      }

      try {
        const clusterId = get(this.credential, 'decodedData.clusterId') || '';

        this.applyChartValues(this.value.spec.rkeConfig);

        const isUpgrade = this.isEdit && this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion;

        if (this.agentConfig?.['cloud-provider-name'] === HARVESTER && clusterId && (this.isCreate || isUpgrade)) {
          const namespace = this.machinePools?.[0]?.config?.vmNamespace;

          const res = await this.$store.dispatch('management/request', {
            url:    `/k8s/clusters/${ clusterId }/v1/harvester/kubeconfig`,
            method: 'POST',
            data:   {
              csiClusterRoleName: 'harvesterhci.io:csi-driver',
              clusterRoleName:    'harvesterhci.io:cloudprovider',
              namespace,
              serviceAccountName: this.value.metadata.name,
            },
          });

          const kubeconfig = res.data;

          const harvesterKubeconfigSecret = await this.createKubeconfigSecret(kubeconfig);

          this.agentConfig['cloud-provider-config'] = `secret://fleet-default:${ harvesterKubeconfigSecret?.metadata?.name }`;

          if (this.isCreate) {
            set(this.chartValues, `${ HARVESTER_CLOUD_PROVIDER }.global.cattle.clusterName`, this.value.metadata.name);
          }

          const distroSubdir = this.value?.spec?.kubernetesVersion?.includes('k3s') ? DEFAULT_SUBDIRS.K8S_DISTRO_K3S : DEFAULT_SUBDIRS.K8S_DISTRO_RKE2;
          const distroRoot = this.value?.spec?.rkeConfig?.dataDirectories?.k8sDistro?.length ? this.value?.spec?.rkeConfig?.dataDirectories?.k8sDistro : `${ DEFAULT_COMMON_BASE_PATH }/${ distroSubdir }`;

          set(this.chartValues, `${ HARVESTER_CLOUD_PROVIDER }.cloudConfigPath`, `${ distroRoot }/etc/config-files/cloud-provider-config`);
        }
      } catch (err) {
        this.errors.push(err);

        btnCb(false);

        return;
      }

      // Remove null profile on machineGlobalConfig - https://github.com/rancher/dashboard/issues/8480
      if (this.value.spec?.rkeConfig?.machineGlobalConfig?.profile === null) {
        delete this.value.spec.rkeConfig.machineGlobalConfig.profile;
      }

      // Store the current data for fleet and cluster agent so that we can re-apply it later if the save fails
      // The cleanup occurs before save with agentConfigurationCleanup()
      const clusterAgentDeploymentCustomization = this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] ? JSON.parse(JSON.stringify(this.value.spec[CLUSTER_AGENT_CUSTOMIZATION])) : null;
      const fleetAgentDeploymentCustomization = this.value.spec[FLEET_AGENT_CUSTOMIZATION] ? JSON.parse(JSON.stringify(this.value.spec[FLEET_AGENT_CUSTOMIZATION])) : null;

      await this.save(btnCb);

      // comes from createEditView mixin
      // if there are any errors saving, restore the agent config data
      if (this.errors?.length) {
        // Ensure the agent configuration is set back to the values before we changed (cleaned) it
        this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] = clusterAgentDeploymentCustomization;
        this.value.spec[FLEET_AGENT_CUSTOMIZATION] = fleetAgentDeploymentCustomization;
      }
    },

    async actuallySave(url) {
      if (this.extensionProvider?.saveCluster) {
        return await this.extensionProvider?.saveCluster(this.value, this.schema);
      }

      if (this.isCreate) {
        url = url || this.schema.linkFor('collection');
        const res = await this.value.save({ url });

        if (res) {
          Object.assign(this.value, res);
        }
      } else {
        await this.value.save();
      }
    },

    // create a secret to reference the harvester cluster kubeconfig in rkeConfig
    async createKubeconfigSecret(kubeconfig = '') {
      const clusterName = this.value.metadata.name;
      const secret = await this.$store.dispatch('management/create', {
        type:     SECRET,
        metadata: {
          namespace: 'fleet-default', generateName: 'harvesterconfig', annotations: { [CAPI_ANNOTATIONS.SECRET_AUTH]: clusterName, [CAPI_ANNOTATIONS.SECRET_WILL_DELETE]: 'true' }
        },
        data: { credential: base64Encode(kubeconfig) }
      });

      return secret.save({ url: '/v1/secrets', method: 'POST' });
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

    /**
     * Ensure all chart information required to show addons is available
     *
     * This basically means
     * 1) That the full chart relating to the addon is fetched (which includes core chart, readme and values)
     * 2) We're ready to cache any values the user provides for each addon
     */
    async initAddons() {
      this.addonConfigValidation = {};

      for (const chartName of this.addonNames) {
        const entry = this.chartVersions[chartName];

        // prevent fetching of addon config for 'none' CNI option
        // https://github.com/rancher/dashboard/issues/10338
        if (this.versionInfo[chartName] || chartName.includes('none')) {
          continue;
        }

        try {
          const res = await this.$store.dispatch('catalog/getVersionInfo', {
            repoType:    'cluster',
            repoName:    entry.repo,
            chartName,
            versionName: entry.version,
          });

          this.versionInfo[chartName] = res;
          const key = this.chartVersionKey(chartName);

          if (!this.userChartValues[key]) {
            this.userChartValues[key] = {};
          }
        } catch (e) {
          console.error(`Failed to fetch or process chart info for ${ chartName }`); // eslint-disable-line no-console
        }
      }
    },

    showAddons(key) {
      this.addonsRev++;
      this.addonNames.forEach((name) => {
        const chartValues = this.versionInfo[name]?.questions ? this.initYamlEditor(name) : {};

        this.userChartValuesTemp[name] = chartValues;
      });
      this.refreshComponentWithYamls(key);
    },
    refreshComponentWithYamls(key) {
      const component = this.$refs[key];

      if (Array.isArray(component) && component.length > 0) {
        this.refreshYamls(component[0].$refs);
      } else if (component) {
        this.refreshYamls(component.$refs);
      }
    },

    refreshYamls(refs) {
      const keys = Object.keys(refs).filter((x) => x.startsWith('yaml'));

      for (const k of keys) {
        const entry = refs[k];
        const list = isArray(entry) ? entry : [entry];

        for (const component of list) {
          component?.refresh(); // `yaml` ref can be undefined on switching from Basic to Addon tab (Azure --> Amazon --> addon)
        }
      }
    },

    updateValues(name, values) {
      this.userChartValuesTemp[name] = values;
      this.syncChartValues(name);
    },

    syncChartValues: throttle(function(name) {
      const fromChart = this.versionInfo[name]?.values;
      const fromUser = this.userChartValuesTemp[name];
      const different = diff(fromChart, fromUser);

      this.userChartValues[this.chartVersionKey(name)] = different;
    }, 250, { leading: true }),

    initYamlEditor(name) {
      const defaultChartValue = this.versionInfo[name];
      const key = this.chartVersionKey(name);

      return mergeWithReplace(defaultChartValue?.values, this.userChartValues[key]);
    },

    initServerAgentArgs() {
      for (const k in this.serverArgs) {
        if (this.serverConfig[k] === undefined) {
          const def = this.serverArgs[k].default;

          this.serverConfig[k] = (def !== undefined ? def : undefined);
        }
      }

      for (const k in this.agentArgs) {
        if (this.agentConfig?.[k] === undefined) {
          const def = this.agentArgs[k].default;

          this.agentConfig[k] = (def !== undefined ? def : undefined);
        }
      }

      if (!this.serverConfig?.profile) {
        this.serverConfig.profile = null;
      }
    },

    chartVersionKey(name) {
      const addonVersion = this.addonVersions.find((av) => av.name === name);

      return addonVersion ? `${ name }-${ addonVersion.version }` : name;
    },

    onMembershipUpdate(update) {
      this['membershipUpdate'] = update;
    },

    async initRegistry() {
      // Check for an existing cluster scoped registry
      const clusterRegistry = this.agentConfig?.['system-default-registry'] || '';

      // Check for the global registry
      this.systemRegistry = (await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.SYSTEM_DEFAULT_REGISTRY })).value || '';

      // The order of precedence is to use the cluster scoped registry
      // if it exists, then use the global scoped registry as a fallback
      if (clusterRegistry) {
        this.registryHost = clusterRegistry;
      } else {
        this.registryHost = this.systemRegistry;
      }

      let registrySecret = null;
      let regs = this.rkeConfig.registries;

      if (!regs) {
        regs = {};
        this.rkeConfig.registries = regs;
      }

      if (!regs.configs) {
        regs.configs = {};
      }

      if (!regs.mirrors) {
        regs.mirrors = {};
      }

      const config = regs.configs[this.registryHost];

      if (config) {
        registrySecret = config.authConfigSecretName;
      }

      this.registrySecret = registrySecret;

      const hasMirrorsOrAuthConfig = Object.keys(regs.configs).length > 0 || Object.keys(regs.mirrors).length > 0;

      if (this.registryHost || registrySecret || hasMirrorsOrAuthConfig) {
        this.showCustomRegistryInput = true;

        if (hasMirrorsOrAuthConfig) {
          this.showCustomRegistryAdvancedInput = true;
        }
      }
    },

    setRegistryConfig() {
      const hostname = (this.registryHost || '').trim();

      if (this.systemRegistry) {
        // Empty string overrides the system default to nothing
        this.agentConfig['system-default-registry'] = '';
      } else {
        // No need to set anything
        this.agentConfig['system-default-registry'] = undefined;
      }
      if (!hostname || hostname === this.systemRegistry) {
        // Undefined removes the key which uses the global setting without hardcoding it into the config
        this.agentConfig['system-default-registry'] = undefined;
      } else {
        this.agentConfig['system-default-registry'] = hostname;
      }

      if (hostname && this.registrySecret) {
        // For a registry with basic auth, but no mirrors,
        // add a single registry config with the basic auth secret.
        const basicAuthConfig = {
          [hostname]: {
            authConfigSecretName: this.registrySecret,
            caBundle:             null,
            insecureSkipVerify:   false,
            tlsSecretName:        null,
          }
        };

        const rkeConfig = this.value.spec.rkeConfig;

        if (!rkeConfig) {
          this.value.spec.rkeConfig = { registries: { configs: basicAuthConfig } };
        } else if (rkeConfig.registries.configs && Object.keys(rkeConfig.registries.configs).length > 0) {
          // If some existing authentication secrets are already configured
          // for registry mirrors, the basic auth is added to the existing ones.
          const existingConfigs = rkeConfig.registries.configs;

          this.value.spec.rkeConfig.registries.configs = { ...basicAuthConfig, ...existingConfigs };
        } else {
          const existingMirrorAndAuthConfig = this.value.spec.rkeConfig.registries;

          this.value.spec.rkeConfig.registries = {
            ...existingMirrorAndAuthConfig,
            configs: basicAuthConfig
          };
        }
      }
    },

    updateConfigs(configs) {
      // Update authentication configuration
      // for each mirror
      if (!this.value.spec?.rkeConfig) {
        this.value.spec.rkeConfig = { registries: {} };
      }
      this.value.spec.rkeConfig.registries.configs = configs;
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

    applyChartValues(rkeConfig) {
      rkeConfig.chartValues = {};
      const charts = [...this.addonNames, ...this.rke2Charts];

      charts.forEach((name) => {
        const key = this.chartVersionKey(name);
        const userValues = this.userChartValues[key];

        if (userValues) {
          rkeConfig.chartValues[name] = userValues;
        }
      });
    },
    get,

    setHarvesterDefaultCloudProvider() {
      if (this.isHarvesterDriver &&
        this.mode === _CREATE &&
        this.agentConfig &&
        !this.agentConfig['cloud-provider-name'] &&
        !this.isHarvesterExternalCredential &&
        !this.isHarvesterIncompatible
      ) {
        this.agentConfig['cloud-provider-name'] = HARVESTER;
      } else {
        this.agentConfig['cloud-provider-name'] = '';
      }
    },

    async setHarvesterVersionRange() {
      const clusterId = this.credential?.decodedData?.clusterId;
      const clusterType = this.credential?.decodedData?.clusterType;

      if (clusterId && clusterType === 'imported') {
        const url = `/k8s/clusters/${ clusterId }/v1`;
        const res = await this.$store.dispatch('cluster/request', { url: `${ url }/${ HCI.SETTING }s` });

        const version = (res?.data || []).find((s) => s.id === 'harvester-csi-ccm-versions');

        if (version) {
          this.harvesterVersionRange = JSON.parse(version.value || version.default || '{}');
        } else {
          this.harvesterVersionRange = {};
        }
      }
      this.setHarvesterDefaultCloudProvider();
    },
    toggleCustomRegistry(neu) {
      this.showCustomRegistryInput = neu;
      if (this.registryHost) {
        this.registryHost = null;
        this.registrySecret = null;
      } else {
        this.initRegistry();
      }
    },

    /**
     * Reset PSA on several input changes for given conditions
     */
    togglePsaDefault() {
      // This option is created from the server and is guaranteed to exist #8032
      const hardcodedTemplate = 'rancher-restricted';
      const cisValue = this.agentConfig?.profile || this.serverConfig?.profile;

      if (!this.cisOverride) {
        if (cisValue) {
          this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName = hardcodedTemplate;
        }
      }
    },

    handleCisChange() {
      this.togglePsaDefault();
      this.updateCisProfile();
    },

    updateCisProfile() {
      // If the user selects any Worker CIS Profile,
      // protect-kernel-defaults should be set to false
      // in the RKE2 worker/agent config.
      const selectedCisProfile = this.agentConfig?.profile;

      if (selectedCisProfile) {
        this.agentConfig['protect-kernel-defaults'] = true;
      } else {
        this.agentConfig['protect-kernel-defaults'] = false;
      }
    },
    updateAdditionalManifest(neu) {
      this.value.spec.rkeConfig.additionalManifest = neu;
    },

    /**
     * Handle k8s changes side effects, like PSA resets
     */
    handleKubernetesChange(value, old) {
      if (value) {
        this.togglePsaDefault();

        // If Harvester driver, reset cloud provider if not compatible
        if (this.isHarvesterDriver && this.mode === _CREATE && this.isHarvesterIncompatible) {
          this.setHarvesterDefaultCloudProvider();
        }
      }
    },

    handleShowDeprecatedPatchVersionsChanged(value) {
      this.showDeprecatedPatchVersions = value;
    },
    /**
     * Track Machine Pool validation status
     */
    machinePoolValidationChanged(id, value) {
      if (value === undefined) {
        delete this.machinePoolValidation[id];
      } else {
        this.machinePoolValidation[id] = value;
      }
    },
    handleEnabledSystemServicesChanged(val) {
      this.serverConfig.disable = val;
    },

    handleCiliumValuesChanged(neu) {
      if (neu === undefined) {
        return;
      }

      const name = this.chartVersionKey('rke2-cilium');

      this.userChartValues = {
        ...this.userChartValues,
        [name]: { ...neu }
      };
    },

    handleCisChanged() {
      this.handleCisChange();
    },

    handlePsaDefaultChanged() {
      this.cisOverride = !this.cisOverride;
      this.togglePsaDefault();
    },

    handleMachinePoolError(error) {
      this.machinePoolErrors = merge(this.machinePoolErrors, error);

      const errors = Object.entries(this.machinePoolErrors)
        .map((x) => {
          if (!x[1].length) {
            return;
          }

          const formattedFields = (() => {
            switch (x[1].length) {
            case 1:
              return x[1][0];
            case 2:
              return `${ x[1][0] } and ${ x[1][1] }`;
            default: {
              const [head, ...rest] = x[1];

              return `${ rest.join(', ') }, and ${ head }`;
            }
            }
          })();

          return this.t('cluster.banner.machinePoolError', {
            count: x[1].length, pool_name: x[0], fields: formattedFields
          }, true);
        })
        .filter((x) => x);

      if (!errors) {
        return;
      }

      this.errors = errors;
    },
    handleS3BackupChanged(neu) {
      this.s3Backup = neu;
      if (neu) {
        // We need to make sure that s3 doesn't already have an existing value otherwise when editing a cluster with s3 defined this will clear s3.
        if (isEmpty(this.rkeConfig.etcd?.s3)) {
          this.rkeConfig.etcd.s3 = {};
        }
      } else {
        this.rkeConfig.etcd.s3 = null;
      }
    },
    handleConfigEtcdExposeMetricsChanged(neu) {
      this.serverConfig['etcd-expose-metrics'] = neu;
    },
    handleRegistryHostChanged(neu) {
      this.registryHost = neu;
    },
    handleRegistrySecretChanged(neu) {
      this.registrySecret = neu;
    },
    validateClusterName() {
      if (!this.value.metadata.name && this.agentConfig?.['cloud-provider-name'] === HARVESTER) {
        this.errors.push(this.t('validation.required', { key: this.t('cluster.name.label') }, true));
      }
    },
    async validateMachinePool() {
      if (this.errors) {
        clear(this.errors);
      }
      if (this.value.cloudProvider === 'aws') {
        const missingProfileName = this.machinePools.some((mp) => !mp.config.iamInstanceProfile);

        if (missingProfileName) {
          this.errors.push(this.t('cluster.validation.iamInstanceProfileName', {}, true));
        }
      }

      for (const [index] of this.machinePools.entries()) { // validator machine config
        if (typeof this.$refs.pool[index]?.test === 'function') {
          try {
            const res = await this.$refs.pool[index].test();

            if (Array.isArray(res) && res.length > 0) {
              this.errors.push(...res);
            }
          } catch (e) {
            this.errors.push(e);
          }
        }
      }
    },

    addonConfigValidationChanged(configName, isValid) {
      this.addonConfigValidation[configName] = isValid;
    },

    handleTabChange(data) {
      this.activeTab = data;
    }
  }
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
    component-testid="rke2-custom-create"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="e => errors = e"
  >
    <div class="header-warnings">
      <Banner
        v-if="isEdit"
        color="warning"
        data-testid="edit-cluster-reprovisioning-documentation"
      >
        <span v-clean-html="t('cluster.banner.rke2-k3-reprovisioning', {}, true)" />
      </Banner>
    </div>
    <SelectCredential
      v-if="needCredential"
      v-model:value="credentialId"
      :mode="mode"
      :provider="provider"
      :cancel="cancelCredential"
      :showing-form="showForm"
      :default-on-cancel="true"
      data-testid="select-credential"
      class="mt-20"
    />

    <div
      v-if="showForm"
      data-testid="form"
      class="mt-20"
    >
      <NameNsDescription
        v-if="!isView"
        v-model:value="localValue"
        :mode="mode"
        :namespaced="needsNamespace"
        :namespace-options="allNamespaces"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{ name: fvGetAndReportPathRules('metadata.name') }"
        @update:value="$emit('input', $event)"
      >
        <template #customize>
          <ClusterAppearance
            :name="clusterName"
            :currentCluster="currentCluster"
            :mode="mode"
          />
        </template>
      </NameNsDescription>

      <Banner
        v-if="appsOSWarning"
        color="error"
      >
        {{ appsOSWarning }}
      </Banner>

      <!-- Pools Extras -->
      <template v-if="hasMachinePools">
        <div class="clearfix">
          <h2
            v-t="'cluster.tabs.machinePools'"
            class="pull-left"
          />
          <div
            v-if="!isView"
            class="pull-right"
          >
            <BadgeState
              v-clean-tooltip="nodeTotals.tooltip.etcd"
              :color="nodeTotals.color.etcd"
              :icon="nodeTotals.icon.etcd"
              :label="nodeTotals.label.etcd"
              class="mr-10"
            />
            <BadgeState
              v-clean-tooltip="nodeTotals.tooltip.controlPlane"
              :color="nodeTotals.color.controlPlane"
              :icon="nodeTotals.icon.controlPlane"
              :label="nodeTotals.label.controlPlane"
              class="mr-10"
            />
            <BadgeState
              v-clean-tooltip="nodeTotals.tooltip.worker"
              :color="nodeTotals.color.worker"
              :icon="nodeTotals.icon.worker"
              :label="nodeTotals.label.worker"
            />
          </div>
        </div>

        <!-- Extra Tabs for Machine Pool -->
        <Tabbed
          ref="pools"
          :side-tabs="true"
          :show-tabs-add-remove="!isView"
          @addTab="addMachinePool($event)"
          @removeTab="removeMachinePool($event)"
        >
          <template
            v-for="(obj, idx) in machinePools"
            :key="idx"
          >
            <Tab
              v-if="!obj.remove"
              :key="obj.id"
              :name="obj.id"
              :label="obj.pool.name || '(Not Named)'"
              :show-header="false"
              :error="!machinePoolValidation[obj.id]"
            >
              <MachinePool
                ref="pool"
                :value="obj"
                :cluster="value"
                :mode="mode"
                :provider="provider"
                :credential-id="credentialId"
                :idx="idx"
                :machine-pools="machinePools"
                :busy="busy"
                :pool-id="obj.id"
                :pool-create-mode="obj.create"
                @error="handleMachinePoolError"
                @validationChanged="v => machinePoolValidationChanged(obj.id, v)"
              />
            </Tab>
          </template>
          <div v-if="!unremovedMachinePools.length">
            {{ t('cluster.machinePool.noPoolsDisclaimer') }}
          </div>
        </Tabbed>
        <div class="spacer" />
      </template>

      <!-- Cluster Tabs -->
      <h2 v-t="'cluster.tabs.cluster'" />
      <Tabbed
        :side-tabs="true"
        class="min-height"
        @changed="handleTabChange"
      >
        <Tab
          name="basic"
          label-key="cluster.tabs.basic"
          :weight="11"
          @active="refreshComponentWithYamls('tab-Basics')"
        >
          <!-- Basic -->
          <Basics
            ref="tab-Basics"
            v-model:value="localValue"
            :live-value="liveValue"
            :mode="mode"
            :provider="provider"
            :user-chart-values="userChartValues"
            :credential="credential"
            :cis-override="cisOverride"
            :all-psas="allPSAs"
            :addon-versions="addonVersions"
            :show-deprecated-patch-versions="showDeprecatedPatchVersions"
            :selected-version="selectedVersion"
            :is-harvester-driver="isHarvesterDriver"
            :is-harvester-incompatible="isHarvesterIncompatible"
            :version-options="versionOptions"
            :is-elemental-cluster="isElementalCluster"
            :have-arg-info="haveArgInfo"
            :show-cni="showCni"
            :show-cloud-provider="showCloudProvider"
            :cloud-provider-options="cloudProviderOptions"
            :is-azure-provider-unsupported="isAzureProviderUnsupported"
            :can-azure-migrate-on-edit="canAzureMigrateOnEdit"
            @update:value="$emit('input', $event)"
            @cilium-values-changed="handleCiliumValuesChanged"
            @enabled-system-services-changed="handleEnabledSystemServicesChanged"
            @kubernetes-changed="handleKubernetesChange"
            @cis-changed="handleCisChanged"
            @psa-default-changed="handlePsaDefaultChanged"
            @show-deprecated-patch-versions-changed="handleShowDeprecatedPatchVersionsChanged"
          />
        </Tab>

        <!-- Member Roles -->
        <Tab
          v-if="canManageMembers"
          name="memberRoles"
          label-key="cluster.tabs.memberRoles"
          :weight="10"
        >
          <MemberRoles
            v-model:value="localValue"
            :mode="mode"
            :on-membership-update="onMembershipUpdate"
            @update:value="$emit('input', $event)"
          />
        </Tab>
        <!-- etcd -->
        <Tab
          name="etcd"
          label-key="cluster.tabs.etcd"
        >
          <Etcd
            v-model:value="localValue"
            :mode="mode"
            :s3-backup="s3Backup"
            :register-before-hook="registerBeforeHook"
            :selected-version="selectedVersion"
            @update:value="$emit('input', $event)"
            @s3-backup-changed="handleS3BackupChanged"
            @config-etcd-expose-metrics-changed="handleConfigEtcdExposeMetricsChanged"
          />
        </Tab>

        <!-- Networking -->
        <Tab
          v-if="haveArgInfo"
          name="networking"
          label-key="cluster.tabs.networking"
        >
          <Networking
            v-model:value="localValue"
            :mode="mode"
            :selected-version="selectedVersion"
            :truncate-limit="truncateLimit"
            @truncate-hostname-changed="truncateHostname"
            @cluster-cidr-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['cluster-cidr'] = val"
            @service-cidr-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['service-cidr'] = val"
            @cluster-domain-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['cluster-domain'] = val"
            @cluster-dns-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['cluster-dns'] = val"
            @service-node-port-range-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['service-node-port-range'] = val"
            @tls-san-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['tls-san'] = val"
            @local-cluster-auth-endpoint-changed="enableLocalClusterAuthEndpoint"
            @ca-certs-changed="(val)=>localValue.spec.localClusterAuthEndpoint.caCerts = val"
            @fqdn-changed="(val)=>localValue.spec.localClusterAuthEndpoint.fqdn = val"
          />
        </Tab>

        <!-- Upgrade -->
        <Tab
          name="upgrade"
          label-key="cluster.tabs.upgrade"
        >
          <Upgrade
            v-model:value="localValue"
            :mode="mode"
            @update:value="$emit('input', $event)"
          />
        </Tab>

        <!-- Registries -->
        <Tab
          :name="REGISTRIES_TAB_NAME"
          label-key="cluster.tabs.registry"
        >
          <Registries
            v-if="isActiveTabRegistries"
            v-model:value="localValue"
            :mode="mode"
            :register-before-hook="registerBeforeHook"
            :show-custom-registry-input="showCustomRegistryInput"
            :registry-host="registryHost"
            :registry-secret="registrySecret"
            :show-custom-registry-advanced-input="showCustomRegistryAdvancedInput"
            @update:value="$emit('input', $event)"
            @update-configs-changed="updateConfigs"
            @custom-registry-changed="toggleCustomRegistry"
            @registry-host-changed="handleRegistryHostChanged"
            @registry-secret-changed="handleRegistrySecretChanged"
          />
        </Tab>

        <!-- Add-on Configs -->
        <Tab
          v-for="v in addonVersions"
          :key="v.name"
          :name="v.name"
          :label="labelForAddon($store, v.name, false)"
          :weight="9"
          :showHeader="false"
          :error="addonConfigValidation[v.name]===false"
          @active="showAddons(v.name)"
        >
          <AddOnConfig
            :ref="v.name"
            v-model:value="localValue"
            :mode="mode"
            :version-info="versionInfo"
            :addon-version="v"
            :addons-rev="addonsRev"
            :user-chart-values-temp="userChartValuesTemp"
            :init-yaml-editor="initYamlEditor"
            @update:value="$emit('input', $event)"
            @update-questions="syncChartValues"
            @update-values="updateValues"
            @validationChanged="e => addonConfigValidationChanged(v.name, e)"
          />
        </Tab>

        <!-- Add-on Additional Manifest -->
        <Tab
          name="additionalmanifest"
          label-key="cluster.tabs.addOnAdditionalManifest"
          :showHeader="false"
          @active="refreshComponentWithYamls('additionalmanifest')"
        >
          <AddOnAdditionalManifest
            ref="additionalmanifest"
            :value="value"
            :mode="mode"
            @additional-manifest-changed="updateAdditionalManifest"
          />
        </Tab>

        <!-- Cluster Agent Configuration -->
        <Tab
          v-if="value.spec.clusterAgentDeploymentCustomization"
          name="clusteragentconfig"
          label-key="cluster.agentConfig.tabs.cluster"
        >
          <AgentConfiguration
            v-model:value="value.spec.clusterAgentDeploymentCustomization"
            data-testid="rke2-cluster-agent-config"
            type="cluster"
            :mode="mode"
            :scheduling-customization-feature-enabled="schedulingCustomizationFeatureEnabled"
            :default-p-c="clusterAgentDefaultPC"
            :default-p-d-b="clusterAgentDefaultPDB"
            @scheduling-customization-changed="setSchedulingCustomization"
          />
        </Tab>

        <!-- Fleet Agent Configuration -->
        <Tab
          name="fleetagentconfig"
          label-key="cluster.agentConfig.tabs.fleet"
        >
          <AgentConfiguration
            v-if="value.spec.fleetAgentDeploymentCustomization"
            v-model:value="value.spec.fleetAgentDeploymentCustomization"
            data-testid="rke2-fleet-agent-config"
            type="fleet"
            :mode="mode"
          />
        </Tab>

        <!-- Advanced -->
        <Tab
          v-if="haveArgInfo || agentArgs['protect-kernel-defaults']"
          name="advanced"
          label-key="cluster.tabs.advanced"
          :weight="-1"
        >
          <Advanced
            v-model:value="localValue"
            :mode="mode"
            :have-arg-info="haveArgInfo"
            :selected-version="selectedVersion"
            @update:value="$emit('input', $event)"
          />
        </Tab>

        <AgentEnv
          v-model:value="localValue"
          :mode="mode"
          @update:value="$emit('input', $event)"
        />
        <Labels
          v-model:value="localValue"
          :mode="mode"
          @update:value="$emit('input', $event)"
        />

        <!-- Extension tabs -->
        <Tab
          v-for="tab, i in extensionTabs"
          :key="`${tab.name}${i}`"
          :name="tab.name"
          :label="tab.label"
          :label-key="tab.labelKey"
          :weight="tab.weight"
          :tooltip="tab.tooltip"
          :show-header="tab.showHeader"
          :display-alert-icon="tab.displayAlertIcon"
          :error="tab.error"
          :badge="tab.badge"
        >
          <component
            :is="tab.component"
            :resource="value"
          />
        </Tab>
      </Tabbed>
    </div>

    <Banner
      v-if="unsupportedSelectorConfig"
      color="warning"
      :label="t('cluster.banner.warning')"
    />

    <template
      v-if="needCredential && !credentialId"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
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
