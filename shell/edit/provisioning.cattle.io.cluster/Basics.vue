<script>
import difference from 'lodash/difference';
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import { _EDIT } from '@shell/config/query-params';

import { findBy } from '@shell/utils/array';
import { set, get } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';

import { compare, sortable } from '@shell/utils/version';
import { isHarvesterSatisfiesVersion } from '@shell/utils/cluster';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor from '@shell/components/YamlEditor';
import { LEGACY } from '@shell/store/features';
import semver from 'semver';
import { KIND, ELEMENTAL_CLUSTER_PROVIDER } from '@shell/config/elemental-types';

const HARVESTER = 'harvester';

export default {
  components: {
    Banner,
    Checkbox,
    LabeledSelect,
    YamlEditor,
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

    psps: {
      type:     Object,
      default:  null,
      required: false
    },

    versionInfo: {
      type:     Object,
      required: true
    },
    credential: {
      type:     Object,
      default:  null,
      required: false
    },

    harvesterVersionRange: {
      type:     Object,
      required: true
    },
    userChartValues: {
      type:     Object,
      required: true
    },
    cisOverride: {
      type:     Boolean,
      required: true
    },
    previousKubernetesVersion: {
      type:     String,
      default:  '',
      required: false
    },
    cisPsaChangeBanner: {
      type:     Boolean,
      required: true
    },
    allPSPs: {
      type:     Array,
      required: false,
      default:  null
    },
    allPSAs: {
      type:     Array,
      required: true
    },
    rke2Versions: {
      type:     Array,
      required: false,
      default:  null
    },
    k3sVersions: {
      type:     Array,
      required: false,
      default:  null
    },
    defaultRke2: {
      type:     String,
      required: false,
      default:  ''
    },
    defaultK3s: {
      type:     String,
      required: false,
      default:  ''
    },
    addonVersions: {
      type:     Array,
      required: false,
      default:  null
    }

  },

  data() {
    return {
      showDeprecatedPatchVersions: false,
      clusterIsAlreadyCreated:     !!this.value.id,
      initialCloudProvider:        this.value?.agentConfig?.['cloud-provider-name'],
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    ...mapGetters(['currentCluster']),
    ...mapGetters({ features: 'features/get' }),
    ...mapGetters(['namespaces']),

    /**
     * Check presence of PSPs as template or CLI creation
     */

    hasPsps() {
      return !!this.psps?.count;
    },

    isElementalCluster() {
      return this.provider === ELEMENTAL_CLUSTER_PROVIDER || this.value?.machineProvider?.toLowerCase() === KIND.MACHINE_INV_SELECTOR_TEMPLATES.toLowerCase();
    },

    chartValues() {
      return this.value.spec.rkeConfig.chartValues;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    agentConfig() {
      return this.value.agentConfig;
    },

    /**
     * Define introduction of PSA and return need of PSA templates based on min k8s version
     */
    needsPSA() {
      const release = this.value?.spec?.kubernetesVersion || '';
      const version = release.match(/\d+/g);
      const isRequiredVersion = version?.length ? +version[0] > 1 || +version[1] >= 23 : false;

      return isRequiredVersion;
    },

    /**
     * Define PSP deprecation and restrict use of PSP based on min k8s version
     */
    needsPSP() {
      return this.getNeedsPSP();
    },

    /**
     * Define introduction of Rancher defined PSA templates
     */
    hasPsaTemplates() {
      return !this.needsPSP;
    },

    versionOptions() {
      const cur = this.liveValue?.spec?.kubernetesVersion || '';
      const existingRke2 = this.mode === _EDIT && cur.includes('rke2');
      const existingK3s = this.mode === _EDIT && cur.includes('k3s');

      let allValidRke2Versions = this.getAllOptionsAfterCurrentVersion(this.rke2Versions, (existingRke2 ? cur : null), this.defaultRke2);
      let allValidK3sVersions = this.getAllOptionsAfterCurrentVersion(this.k3sVersions, (existingK3s ? cur : null), this.defaultK3s);

      if (!this.showDeprecatedPatchVersions) {
        // Normally, we only want to show the most recent patch version
        // for each Kubernetes minor version. However, if the user
        // opts in to showing deprecated versions, we don't filter them.
        allValidRke2Versions = this.filterOutDeprecatedPatchVersions(allValidRke2Versions, cur);
        allValidK3sVersions = this.filterOutDeprecatedPatchVersions(allValidK3sVersions, cur);
      }

      const showRke2 = allValidRke2Versions.length && !existingK3s;
      const showK3s = allValidK3sVersions.length && !existingRke2;
      const out = [];

      if ( showRke2 ) {
        if ( showK3s ) {
          out.push({ kind: 'group', label: this.t('cluster.provider.rke2') });
        }

        out.push(...allValidRke2Versions);
      }

      if ( showK3s ) {
        if ( showRke2 ) {
          out.push({ kind: 'group', label: this.t('cluster.provider.k3s') });
        }

        out.push(...allValidK3sVersions);
      }

      if ( cur ) {
        const existing = out.find((x) => x.value === cur);

        if ( existing ) {
          existing.disabled = false;
        }
      }

      return out;
    },

    isK3s() {
      return (this.value?.spec?.kubernetesVersion || '').includes('k3s');
    },

    profileOptions() {
      const out = (this.agentArgs?.profile?.options || []).map((x) => {
        return { label: x, value: x };
      });

      out.unshift({
        label: this.$store.getters['i18n/t']('cluster.rke2.cisProfile.option'),
        value: ''
      });

      return out;
    },

    /**
     * Allow to display override if PSA is needed and profile is set
     */
    hasCisOverride() {
      return (this.serverConfig?.profile || this.agentConfig?.profile) && this.needsPSA &&
        // Also check other cases on when to display the override
        this.hasPsaTemplates && this.showCisProfile && this.isCisSupported;
    },

    pspOptions() {
      if ( this.isK3s ) {
        return null;
      }
      const out = [{
        label: this.$store.getters['i18n/t']('cluster.rke2.defaultPodSecurityPolicyTemplateName.option'),
        value: ''
      }];

      if ( this.allPSPs ) {
        for ( const pspt of this.allPSPs ) {
          out.push({
            label: pspt.nameDisplay,
            value: pspt.id,
          });
        }
      }
      const cur = this.value.spec.defaultPodSecurityPolicyTemplateName;

      if ( cur && !out.find((x) => x.value === cur) ) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
    },

    /**
     * Disable PSA if CIS hardening is enabled, except override
     */
    isPsaDisabled() {
      const cisValue = this.agentConfig?.profile || this.serverConfig?.profile;

      return !(!cisValue || this.cisOverride) && this.hasPsaTemplates && this.isCisSupported;
    },

    /**
     * Get the default label for the PSA template option
     */
    defaultPsaOptionLabel() {
      const optionCase = !this.needsPSP && !this.isK3s ? 'default' : 'none';

      return this.$store.getters['i18n/t'](`cluster.rke2.defaultPodSecurityAdmissionConfigurationTemplateName.option.${ optionCase }`);
    },

    /**
     * Convert PSA templates into options, sorting and flagging if any selected
     */
    psaOptions() {
      if ( !this.needsPSA ) {
        return [];
      }
      const out = [{
        label: this.defaultPsaOptionLabel,
        value: ''
      }];

      if ( this.allPSAs ) {
        for ( const psa of this.allPSAs ) {
          out.push({
            label: psa.nameDisplay,
            value: psa.id,
          });
        }
      }
      const cur = this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName;

      if ( cur && !out.find((x) => x.value === cur) ) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
    },

    /**
     * Check if current CIS profile is required and listed in the options
     */
    isCisSupported() {
      const cisProfile = this.serverConfig.profile || this.agentConfig.profile;

      return !cisProfile || this.profileOptions.map((option) => option.value).includes(cisProfile);
    },

    disableOptions() {
      return this.serverArgs.disable.options.map((value) => {
        return {
          label: this.$store.getters['i18n/withFallback'](`cluster.${ this.isK3s ? 'k3s' : 'rke2' }.systemService."${ value }"`, null, value.replace(/^(rke2|rancher)-/, '')),
          value,
        };
      });
    },

    cloudProviderOptions() {
      const out = [{
        label: this.$store.getters['i18n/t']('cluster.rke2.cloudProvider.defaultValue.label'),
        value: '',
      }];
      const preferred = this.$store.getters['plugins/cloudProviderForDriver'](this.provider);

      for ( const opt of this.agentArgs['cloud-provider-name'].options ) {
        // If we don't have a preferred provider... show all options
        const showAllOptions = preferred === undefined;
        // If we have a preferred provider... only show default, preferred and external
        const isPreferred = opt === preferred;
        const isExternal = opt === 'external';
        let disabled = false;

        if ((this.isHarvesterExternalCredential || this.isHarvesterIncompatible) && isPreferred) {
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
      const cur = this.agentConfig['cloud-provider-name'];

      if ( cur && !out.find((x) => x.value === cur) ) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
    },

    selectedVersion() {
      const str = this.value.spec.kubernetesVersion;

      if ( !str ) {
        return;
      }

      const out = findBy(this.versionOptions, 'value', str);

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

    chartVersions() {
      return this.selectedVersion?.charts || {};
    },

    showCisProfile() {
      return (this.provider === 'custom' || this.isElementalCluster) && ( this.serverArgs?.profile || this.agentArgs?.profile );
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

    enabledSystemServices: {
      get() {
        const out = difference(this.serverArgs.disable.options, this.serverConfig.disable || []);

        return out;
      },

      set(neu) {
        const out = difference(this.serverArgs.disable.options, neu);

        this.$emit('enabledSystemServicesChanged', out);
      },
    },

    showCloudConfigYaml() {
      if ( !this.agentArgs['cloud-provider-name'] ) {
        return false;
      }

      const name = this.agentConfig['cloud-provider-name'];

      if ( !name ) {
        return false;
      }

      switch ( name ) {
      case 'none': return false;
      case 'aws': return false;
      case 'rancher-vsphere': return false;
      case HARVESTER: return false;
      default: return true;
      }
    },

    showVsphereNote() {
      if ( !this.agentArgs['cloud-provider-name'] ) {
        return false;
      }

      const name = this.agentConfig['cloud-provider-name'];

      return name === 'rancher-vsphere';
    },

    showCni() {
      return !!this.serverArgs.cni;
    },

    showCloudProvider() {
      return this.agentArgs['cloud-provider-name'];
    },

    showk8s21LegacyWarning() {
      const isLegacyEnabled = this.features(LEGACY);

      if (!isLegacyEnabled) {
        return false;
      }
      const selectedVersion = semver.coerce(this.value.spec.kubernetesVersion);

      return semver.satisfies(selectedVersion, '>=1.21.0');
    },

    isHarvesterDriver() {
      return this.$route.query.type === HARVESTER;
    },

    defaultVersion() {
      const all = this.versionOptions.filter((x) => !!x.value);
      const first = all[0]?.value;
      const preferred = all.find((x) => x.value === this.defaultRke2)?.value;

      const rke2 = this.getAllOptionsAfterCurrentVersion(this.rke2Versions, null);
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

      if ( !out ) {
        out = preferred || first;
      }

      return out;
    },

    ciliumIpv6: {
      get() {
        // eslint-disable-next-line no-unused-vars
        const cni = this.serverConfig.cni; // force this property to recalculate if cni was changed away from cilium and chartValues['rke-cilium'] deleted

        return this.userChartValues[this.chartVersionKey('rke2-cilium')]?.cilium?.ipv6?.enabled || false;
      },
      set(val) {
        this.$emit('ciliumIpv6Changed', val);
      }
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
    unsupportedCloudProvider() {
      // The current cloud provider
      const cur = this.initialCloudProvider;

      const provider = cur && this.cloudProviderOptions.find((x) => x.value === cur);

      return !!provider?.unsupported;
    },

    canNotEditCloudProvider() {
      const canNotEdit = this.clusterIsAlreadyCreated && !this.unsupportedCloudProvider;

      return canNotEdit;
    }
  },

  mounted() {
    window.rke = this;
  },

  created() {
    // Register any hooks for this extension provider
    if (this.extensionProvider?.registerSaveHooks) {
      this.extensionProvider.registerSaveHooks(this.registerBeforeHook, this.registerAfterHook, this.value);
    }
  },

  methods: {
    set,

    /**
     * Define PSP deprecation and restrict use of PSP based on min k8s version and current/edited mode
     */
    getNeedsPSP(value = this.value) {
      const release = value?.spec?.kubernetesVersion || '';
      const version = release.match(/\d+/g);
      const isRequiredVersion = version?.length ? +version[0] === 1 && +version[1] < 25 : false;

      return isRequiredVersion;
    },

    chartVersionKey(name) {
      const addonVersion = this.addonVersions.find((av) => av.name === name);

      return addonVersion ? `${ name }-${ addonVersion.version }` : name;
    },

    getAllOptionsAfterCurrentVersion(versions, currentVersion, defaultVersion) {
      const out = (versions || []).filter((obj) => !!obj.serverArgs).map((obj) => {
        let disabled = false;
        let experimental = false;
        let isCurrentVersion = false;
        let label = obj.id;

        if ( currentVersion ) {
          disabled = compare(obj.id, currentVersion) < 0;
          isCurrentVersion = compare(obj.id, currentVersion) === 0;
        }

        if ( defaultVersion ) {
          experimental = compare(defaultVersion, obj.id) < 0;
        }

        if (isCurrentVersion) {
          label = `${ label } ${ this.t('cluster.kubernetesVersion.current') }`;
        }

        if (experimental) {
          label = `${ label } ${ this.t('cluster.kubernetesVersion.experimental') }`;
        }

        return {
          label,
          value:      obj.id,
          sort:       sortable(obj.id),
          serverArgs: obj.serverArgs,
          agentArgs:  obj.agentArgs,
          charts:     obj.charts,
          disabled,
        };
      });

      if (currentVersion && !out.find((obj) => obj.value === currentVersion)) {
        out.push({
          label: `${ currentVersion } ${ this.t('cluster.kubernetesVersion.current') }`,
          value: currentVersion,
          sort:  sortable(currentVersion),
        });
      }

      const sorted = sortBy(out, 'sort:desc');

      const mostRecentPatchVersions = this.getMostRecentPatchVersions(sorted);

      const sortedWithDeprecatedLabel = sorted.map((optionData) => {
        const majorMinor = `${ semver.major(optionData.value) }.${ semver.minor(optionData.value) }`;

        if (mostRecentPatchVersions[majorMinor] === optionData.value) {
          return optionData;
        }

        return {
          ...optionData,
          label: `${ optionData.label } ${ this.t('cluster.kubernetesVersion.deprecated') }`
        };
      });

      return sortedWithDeprecatedLabel;
    },

    getMostRecentPatchVersions(sortedVersions) {
      // Get the most recent patch version for each Kubernetes minor version.
      const versionMap = {};

      sortedVersions.forEach((version) => {
        const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

        if (!versionMap[majorMinor]) {
          // Because we start with a sorted list of versions, we know the
          // highest patch version is first in the list, so we only keep the
          // first of each minor version in the list.
          versionMap[majorMinor] = version.value;
        }
      });

      return versionMap;
    },

    filterOutDeprecatedPatchVersions(allVersions, currentVersion) {
      // Get the most recent patch version for each Kubernetes minor version.
      const mostRecentPatchVersions = this.getMostRecentPatchVersions(allVersions);

      const filteredVersions = allVersions.filter((version) => {
        // Always show pre-releases
        if (semver.prerelease(version.value)) {
          return true;
        }

        const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

        // Always show current version, else show if we haven't shown anything for this major.minor version yet
        if (version.value === currentVersion || mostRecentPatchVersions[majorMinor] === version.value) {
          return true;
        }

        return false;
      });

      return filteredVersions;
    },
    get,
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="!haveArgInfo"
      color="warning"
      :label="t('cluster.banner.haveArgInfo')"
    />
    <Banner
      v-if="showk8s21LegacyWarning"
      color="warning"
      :label="t('cluster.legacyWarning')"
    />
    <Banner
      v-if="isHarvesterDriver && isHarvesterIncompatible && showCloudProvider"
      color="warning"
    >
      <span
        v-clean-html="t('cluster.harvester.warning.cloudProvider.incompatible', null, true)"
      />
    </Banner>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.spec.kubernetesVersion"
          :mode="mode"
          :options="versionOptions"
          label-key="cluster.kubernetesVersion.label"
          @input="$emit('kubernetesChanged', $event)"
        />
        <Checkbox
          v-model="showDeprecatedPatchVersions"
          :label="t('cluster.kubernetesVersion.deprecatedPatches')"
          :tooltip="t('cluster.kubernetesVersion.deprecatedPatchWarning')"
          class="patch-version"
        />
      </div>
      <div
        v-if="showCloudProvider"
        class="col span-6"
      >
        <LabeledSelect
          v-model="agentConfig['cloud-provider-name']"
          :mode="mode"
          :disabled="canNotEditCloudProvider"
          :options="cloudProviderOptions"
          :label="t('cluster.rke2.cloudProvider.label')"
        />
      </div>
    </div>
    <div
      v-if="showCni"
      :style="{'align-items':'center'}"
      class="row"
    >
      <div class="col span-6">
        <LabeledSelect
          v-model="serverConfig.cni"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :options="serverArgs.cni.options"
          :label="t('cluster.rke2.cni.label')"
        />
      </div>
      <div
        v-if="serverConfig.cni === 'cilium' || serverConfig.cni === 'multus,cilium'"
        class="col"
      >
        <Checkbox
          v-model="ciliumIpv6"
          :mode="mode"
          :label="t('cluster.rke2.address.ipv6.enable')"
        />
      </div>
    </div>
    <template v-if="showVsphereNote">
      <Banner
        color="warning"
        label-key="cluster.cloudProvider.rancher-vsphere.note"
      />
    </template>
    <template v-else-if="showCloudConfigYaml">
      <div class="spacer" />

      <div class="col span-12">
        <Banner
          v-if="unsupportedCloudProvider"
          class="error mt-5"
        >
          {{ t('cluster.rke2.cloudProvider.unsupported') }}
        </Banner>
        <h3>
          {{ t('cluster.rke2.cloudProvider.header') }}
        </h3>
        <YamlEditor
          ref="yaml"
          v-model="agentConfig['cloud-provider-config']"
          :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
          initial-yaml-values="# Cloud Provider Config"
          class="yaml-editor"
        />
      </div>
    </template>

    <div class="spacer" />

    <h3>
      {{ t('cluster.rke2.security.header') }}
    </h3>
    <Banner
      v-if="isEdit && !needsPSP && hasPsps"
      color="warning"
      :label="t('cluster.banner.invalidPsps')"
    />
    <Banner
      v-else-if="isCreate && !needsPSP"
      color="info"
      :label="t('cluster.banner.removedPsp')"
    />
    <Banner
      v-else-if="isCreate && hasPsps"
      color="info"
      :label="t('cluster.banner.deprecatedPsp')"
    />

    <Banner
      v-if="showCisProfile && !isCisSupported && isEdit"
      color="info"
    >
      <p v-clean-html="t('cluster.rke2.banner.cisUnsupported', {cisProfile: serverConfig.profile || agentConfig.profile}, true)" />
    </Banner>

    <div class="row mb-10">
      <div
        v-if="pspOptions && needsPSP"
        class="col span-6"
      >
        <!-- PSP template selector -->
        <LabeledSelect
          v-model="value.spec.defaultPodSecurityPolicyTemplateName"
          data-testid="rke2-custom-edit-psp"
          :mode="mode"
          :options="pspOptions"
          :label="t('cluster.rke2.defaultPodSecurityPolicyTemplateName.label')"
          @input="$emit('pspChanged', $event)"
        />
      </div>

      <div
        v-if="showCisProfile"
        class="col span-6"
      >
        <LabeledSelect
          v-if="serverArgs && serverArgs.profile"
          v-model="serverConfig.profile"
          :mode="mode"
          :options="profileOptions"
          :label="t('cluster.rke2.cis.sever')"
          @input="$emit('cisChanged')"
        />
        <LabeledSelect
          v-else-if="agentArgs && agentArgs.profile"
          v-model="agentConfig.profile"
          data-testid="rke2-custom-edit-cis-agent"
          :mode="mode"
          :options="profileOptions"
          :label="t('cluster.rke2.cis.agent')"
          @input="$emit('cisChanged')"
        />
      </div>
    </div>

    <template v-if="hasCisOverride">
      <Checkbox
        v-model="cisOverride"
        :mode="mode"
        :label="t('cluster.rke2.cis.override')"
        @input="$emit('psaDefaultChanged')"
      />

      <Banner
        v-if="cisOverride"
        color="warning"
        :label="t('cluster.rke2.banner.cisOverride')"
      />
      <Banner
        v-if="cisPsaChangeBanner && !cisOverride"
        color="info"
        :label="t('cluster.rke2.banner.psaChange')"
      />
    </template>

    <div
      v-if="needsPSA"
      class="row mb-10 mt-10"
    >
      <div class="col span-6">
        <!-- PSA template selector -->
        <LabeledSelect
          v-model="value.spec.defaultPodSecurityAdmissionConfigurationTemplateName"
          :mode="mode"
          data-testid="rke2-custom-edit-psa"
          :options="psaOptions"
          :disabled="isPsaDisabled"
          :label="t('cluster.rke2.defaultPodSecurityAdmissionConfigurationTemplateName.label')"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-12 mt-20">
        <Checkbox
          v-if="serverArgs['secrets-encryption']"
          v-model="serverConfig['secrets-encryption']"
          :mode="mode"
          :label="t('cluster.rke2.secretEncryption.label')"
        />
        <Checkbox
          v-model="value.spec.enableNetworkPolicy"
          :mode="mode"
          :label="t('cluster.rke2.enableNetworkPolicy.label')"
        />
      </div>
    </div>

    <div
      v-if="serverConfig.cni === 'cilium' && value.spec.enableNetworkPolicy"
      class="row"
    >
      <div class="col span-12">
        <Banner
          color="info"
          :label="t('cluster.rke2.enableNetworkPolicy.warning')"
        />
      </div>
    </div>

    <div class="spacer" />

    <div
      v-if="serverArgs.disable"
      class="row"
    >
      <div class="col span-12">
        <div>
          <h3>
            {{ t('cluster.rke2.systemService.header') }}
          </h3>
        </div>
        <Checkbox
          v-for="opt in disableOptions"
          :key="opt.value"
          v-model="enabledSystemServices"
          :mode="mode"
          :label="opt.label"
          :value-when-true="opt.value"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .patch-version {
    margin-top: 5px;
  }
</style>
