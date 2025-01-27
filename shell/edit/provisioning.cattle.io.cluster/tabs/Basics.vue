<script>
import difference from 'lodash/difference';
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import { set, get } from '@shell/utils/object';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import YamlEditor from '@shell/components/YamlEditor';
import { LEGACY } from '@shell/store/features';
import semver from 'semver';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const HARVESTER = 'harvester';

export default {
  emits: ['enabled-system-services-changed', 'cilium-values-changed', 'kubernetes-changed', 'show-deprecated-patch-versions-changed', 'cis-changed', 'psa-default-changed'],

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

    credential: {
      type:     Object,
      default:  null,
      required: false
    },

    userChartValues: {
      type:     Object,
      required: true
    },
    cisOverride: {
      type:     Boolean,
      required: true
    },

    allPsas: {
      type:     Array,
      required: true
    },

    addonVersions: {
      type:     Array,
      required: false,
      default:  null
    },

    selectedVersion: {
      type:     Object,
      required: true
    },
    versionOptions: {
      type:     Array,
      required: true
    },
    isHarvesterDriver: {
      type:     Boolean,
      required: true
    },
    isHarvesterIncompatible: {
      type:     Boolean,
      required: true
    },
    showDeprecatedPatchVersions: {
      type:     Boolean,
      required: true
    },
    isElementalCluster: {
      type:     Boolean,
      required: true
    },
    haveArgInfo: {
      type:     Boolean,
      required: true
    },
    showCni: {
      type:     Boolean,
      required: true
    },
    showCloudProvider: {
      type:     Boolean,
      required: true
    },
    cloudProviderOptions: {
      type:     Array,
      required: true
    },
    isAzureProviderUnsupported: {
      type:     Boolean,
      required: true
    },
    canAzureMigrateOnEdit: {
      type:     Boolean,
      required: true
    }
  },

  watch: {
    selectedVersion(neu, old) {
      if (neu?.value !== old?.value && this.ciliumIpv6) {
        // Re-assign so that the setter updates the structure for the new k8s version if needed
        this.ciliumIpv6 = !!this.ciliumIpv6;
      }
    }
  },

  computed: {
    ...mapGetters({ features: 'features/get' }),

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    showCniNoneBanner() {
      return this.serverConfig?.cni === 'none';
    },

    showCiliumIpv6Controls() {
      return this.serverConfig?.cni === 'cilium' || this.serverConfig?.cni === 'multus,cilium';
    },

    showNetworkPolicyWarningBanner() {
      return this.serverConfig?.cni === 'cilium' && this.value?.spec?.enableNetworkPolicy;
    },

    agentConfig() {
      return this.value.agentConfig;
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
      return (this.serverConfig?.profile || this.agentConfig?.profile) &&
        // Also check other cases on when to display the override
        this.showCisProfile && this.isCisSupported;
    },

    /**
     * Disable PSA if CIS hardening is enabled, except override
     */
    isPsaDisabled() {
      const cisValue = this.agentConfig?.profile || this.serverConfig?.profile;

      return !(!cisValue || this.cisOverride) && this.isCisSupported;
    },

    /**
     * Get the default label for the PSA template option
     */
    defaultPsaOptionLabel() {
      const optionCase = !this.value.isK3s ? 'default' : 'none';

      return this.$store.getters['i18n/t'](`cluster.rke2.defaultPodSecurityAdmissionConfigurationTemplateName.option.${ optionCase }`);
    },

    /**
     * Convert PSA templates into options, sorting and flagging if any selected
     */
    psaOptions() {
      const out = [{
        label: this.defaultPsaOptionLabel,
        value: ''
      }];

      if ( this.allPsas ) {
        for ( const psa of this.allPsas ) {
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
      const cisProfile = this.serverConfig?.profile || this.agentConfig?.profile;

      return !cisProfile || this.profileOptions.map((option) => option.value).includes(cisProfile);
    },

    disableOptions() {
      return (this.serverArgs.disable.options || []).map((value) => {
        return {
          label: this.$store.getters['i18n/withFallback'](`cluster.${ this.value.isK3s ? 'k3s' : 'rke2' }.systemService."${ value }"`, null, value.replace(/^(rke2|rancher)-/, '')),
          value,
        };
      });
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

    showCisProfile() {
      return (this.provider === 'custom' || this.isElementalCluster) && ( this.serverArgs?.profile || this.agentArgs?.profile );
    },

    enabledSystemServices: {
      get() {
        const out = difference(this.serverArgs.disable.options, this.serverConfig.disable || []);

        return out;
      },

      set(neu) {
        const out = difference(this.serverArgs.disable.options, neu);

        this.$emit('enabled-system-services-changed', out);
      },
    },

    showCloudConfigYaml() {
      if ( !this.agentArgs['cloud-provider-name'] ) {
        return false;
      }

      const name = this.agentConfig?.['cloud-provider-name'];

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

      const name = this.agentConfig?.['cloud-provider-name'];

      return name === 'rancher-vsphere';
    },

    showk8sLegacyWarning() {
      const isLegacyEnabled = this.features(LEGACY);

      if (!isLegacyEnabled) {
        return false;
      }
      const selectedVersion = semver.coerce(this.value.spec.kubernetesVersion);

      return semver.satisfies(selectedVersion, '>=1.21.0');
    },

    ciliumIpv6: {
      get() {
        // eslint-disable-next-line no-unused-vars
        const cni = this.serverConfig.cni; // force this property to recalculate if cni was changed away from cilium and chartValues['rke-cilium'] deleted

        const chart = this.userChartValues[this.chartVersionKey('rke2-cilium')];

        return chart?.cilium?.ipv6?.enabled || chart?.ipv6?.enabled || false;
      },
      set(neu) {
        const name = this.chartVersionKey('rke2-cilium');
        const values = this.userChartValues[name];

        // RKE2 older than 1.23.5 uses different Helm chart values structure - need to take that into account
        const version = this.selectedVersion.value;
        let ciliumValues = {};

        if (semver.gt(version, '1.23.5')) {
          // New style
          ciliumValues = {
            ...values,
            ipv6: {
              ...values?.ipv6,
              enabled: neu
            }
          };

          delete ciliumValues.cilium;
        } else {
          // Old style
          ciliumValues = {
            ...values,
            cilium: {
              ...values?.cilium,
              ipv6: {
                ...values?.cilium?.ipv6,
                enabled: neu
              }
            }
          };

          delete ciliumValues.ipv6;
        }

        this.$emit('cilium-values-changed', ciliumValues);
      }
    },

    ciliumBandwidthManager: {
      get() {
        // eslint-disable-next-line no-unused-vars
        const cni = this.serverConfig.cni; // force this property to recalculate if cni was changed away from cilium and chartValues['rke-cilium'] deleted

        return this.userChartValues[this.chartVersionKey('rke2-cilium')]?.bandwidthManager?.enabled || false;
      },
      set(neu) {
        const name = this.chartVersionKey('rke2-cilium');
        const values = this.userChartValues[name];

        const ciliumValues = {
          ...values,
          bandwidthManager: {
            ...values?.bandwidthManager,
            enabled: neu
          }
        };

        this.$emit('cilium-values-changed', ciliumValues);
      }
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    canNotEditCloudProvider() {
      if (!this.isEdit) {
        return false;
      }

      return !this.canAzureMigrateOnEdit;
    },

    /**
     * Display warning about additional configuration needed for cloud provider Amazon if kube >= 1.27
     */
    showCloudProviderAmazonAdditionalConfigWarning() {
      return !!semver.gte(this.value.spec.kubernetesVersion, 'v1.27.0') && this.agentConfig?.['cloud-provider-name'] === 'aws';
    },

    /**
     * Display warning about unsupported Azure provider if k8s >= 1.30
     */
    showCloudProviderUnsupportedAzureWarning() {
      return this.showCloudProvider && this.mode === _CREATE && this.isAzureProviderUnsupported;
    },

    /**
     * Display warning about Azure provider migration from k8s versions >= 1.27 to External provider
     */
    showCloudProviderMigrateAzureWarning() {
      return this.showCloudProvider && this.mode === _EDIT && this.canAzureMigrateOnEdit;
    }
  },

  methods: {
    set,

    chartVersionKey(name) {
      const addonVersion = this.addonVersions.find((av) => av.name === name);

      return addonVersion ? `${ name }-${ addonVersion.version }` : name;
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
      v-if="showk8sLegacyWarning"
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
    <Banner
      v-if="showCloudProviderUnsupportedAzureWarning"
      color="warning"
      data-testid="clusterBasics__showCloudProviderUnsupportedAzureWarning"
    >
      <span v-clean-html="t('cluster.banner.cloudProviderUnsupportedAzure', {}, true)" />
    </Banner>
    <Banner
      v-if="showCloudProviderMigrateAzureWarning"
      color="warning"
      data-testid="clusterBasics__showCloudProviderMigrateAzureWarning"
    >
      <span v-clean-html="t('cluster.banner.cloudProviderMigrateAzure', {}, true)" />
    </Banner>
    <Banner
      v-if="showCloudProviderAmazonAdditionalConfigWarning"
      color="warning"
    >
      <span v-clean-html="t('cluster.banner.cloudProviderAddConfig', {}, true)" />
    </Banner>
    <Banner
      v-if="showCniNoneBanner"
      color="warning"
      data-testid="clusterBasics__noneOptionSelectedForCni"
    >
      <span v-clean-html="t('cluster.rke2.cni.cniNoneBanner', {}, true)" />
    </Banner>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.spec.kubernetesVersion"
          :mode="mode"
          :options="versionOptions"
          data-testid="clusterBasics__kubernetesVersions"
          label-key="cluster.kubernetesVersion.label"
          @update:value="$emit('kubernetes-changed', $event)"
        />
        <Checkbox
          :value="showDeprecatedPatchVersions"
          :label="t('cluster.kubernetesVersion.deprecatedPatches')"
          :tooltip="t('cluster.kubernetesVersion.deprecatedPatchWarning')"
          class="patch-version"
          @update:value="$emit('show-deprecated-patch-versions-changed', $event)"
        />
      </div>
      <div
        v-if="showCloudProvider"
        class="col span-6"
      >
        <LabeledSelect
          v-if="agentConfig"
          v-model:value="agentConfig['cloud-provider-name']"
          data-testid="clusterBasics__cloudProvider"
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
          v-model:value="serverConfig.cni"
          data-testid="cluster-rke2-cni-select"
          :mode="mode"
          :disabled="isEdit"
          :options="serverArgs.cni.options"
          :label="t('cluster.rke2.cni.label')"
        />
      </div>
      <div
        v-if="showCiliumIpv6Controls"
        class="col"
      >
        <Checkbox
          v-model:value="ciliumIpv6"
          data-testid="cluster-rke2-cni-ipv6-checkbox"
          :mode="mode"
          :label="t('cluster.rke2.address.ipv6.enable')"
        />
        <Checkbox
          v-model:value="ciliumBandwidthManager"
          data-testid="cluster-rke2-cni-cilium-bandwidth-manager-checkbox"
          :mode="mode"
          :label="t('cluster.rke2.cni.cilium.BandwidthManager.enable')"
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
        <h3>
          {{ t('cluster.rke2.cloudProvider.header') }}
        </h3>
        <YamlEditor
          v-if="agentConfig"
          ref="yaml"
          v-model:value="agentConfig['cloud-provider-config']"
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
      v-if="showCisProfile && !isCisSupported && isEdit"
      color="info"
    >
      <p v-clean-html="t('cluster.rke2.banner.cisUnsupported', {cisProfile: serverConfig.profile || agentConfig.profile}, true)" />
    </Banner>

    <div class="row mb-10">
      <div
        v-if="showCisProfile"
        class="col span-6"
      >
        <LabeledSelect
          v-if="serverArgs && serverArgs.profile && serverConfig"
          v-model:value="serverConfig.profile"
          :mode="mode"
          :options="profileOptions"
          :label="t('cluster.rke2.cis.sever')"
          @update:value="$emit('cis-changed')"
        />
        <LabeledSelect
          v-else-if="agentArgs && agentArgs.profile && agentConfig"
          v-model:value="agentConfig.profile"
          data-testid="rke2-custom-edit-cis-agent"
          :mode="mode"
          :options="profileOptions"
          :label="t('cluster.rke2.cis.agent')"
          @update:value="$emit('cis-changed')"
        />
      </div>
    </div>

    <template v-if="hasCisOverride">
      <Checkbox
        :value="cisOverride"
        :mode="mode"
        :label="t('cluster.rke2.cis.override')"
        @update:value="$emit('psa-default-changed')"
      />

      <Banner
        v-if="cisOverride"
        color="warning"
        :label="t('cluster.rke2.banner.cisOverride')"
      />
      <Banner
        v-if="!cisOverride"
        color="info"
        :label="t('cluster.rke2.banner.psaChange')"
      />
    </template>

    <div
      class="row mb-10 mt-10"
    >
      <div class="col span-6">
        <!-- PSA template selector -->
        <LabeledSelect
          v-model:value="value.spec.defaultPodSecurityAdmissionConfigurationTemplateName"
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
          v-model:value="serverConfig['secrets-encryption']"
          :mode="mode"
          :label="t('cluster.rke2.secretEncryption.label')"
        />
        <Checkbox
          v-model:value="value.spec.enableNetworkPolicy"
          :mode="mode"
          :label="t('cluster.rke2.enableNetworkPolicy.label')"
        />
      </div>
    </div>

    <div
      v-if="showNetworkPolicyWarningBanner"
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
          v-for="(opt, i) in disableOptions"
          :key="i"
          v-model:value="enabledSystemServices"
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
