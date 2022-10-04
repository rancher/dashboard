<script>
import difference from 'lodash/difference';
import throttle from 'lodash/throttle';
import isArray from 'lodash/isArray';
import merge from 'lodash/merge';
import { mapGetters } from 'vuex';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import {
  CAPI,
  MANAGEMENT,
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
  clone, diff, set, get, isEmpty
} from '@shell/utils/object';
import { allHash } from '@shell/utils/promise';
import { sortBy } from '@shell/utils/sort';
import { camelToTitle, nlToBr } from '@shell/utils/string';
import { compare, sortable } from '@shell/utils/version';
import { isHarvesterSatisfiesVersion } from '@shell/utils/cluster';

import ArrayList from '@shell/components/form/ArrayList';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { RadioGroup } from '@components/Form/Radio';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import UnitInput from '@shell/components/form/UnitInput';
import YamlEditor from '@shell/components/YamlEditor';
import Questions from '@shell/components/Questions';

import { normalizeName } from '@shell/components/form/NameNsDescription.vue';
import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { LEGACY } from '@shell/store/features';
import semver from 'semver';
import { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import { SETTING } from '@shell/config/settings';
import { base64Encode } from '@shell/utils/crypto';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import ACE from './ACE';
import AgentEnv from './AgentEnv';
import DrainOptions from './DrainOptions';
import Labels from './Labels';
import MachinePool from './MachinePool';
import RegistryConfigs from './RegistryConfigs';
import RegistryMirrors from './RegistryMirrors';
import S3Config from './S3Config';
import SelectCredential from './SelectCredential';

const PUBLIC = 'public';
const PRIVATE = 'private';
const ADVANCED = 'advanced';

const HARVESTER = 'harvester';
const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';

export default {
  components: {
    ACE,
    AgentEnv,
    ArrayList,
    ArrayListGrouped,
    BadgeState,
    Banner,
    Checkbox,
    ClusterMembershipEditor,
    CruResource,
    DrainOptions,
    LabeledInput,
    LabeledSelect,
    Labels,
    Loading,
    MachinePool,
    MatchExpressions,
    NameNsDescription,
    Questions,
    RadioGroup,
    RegistryConfigs,
    RegistryMirrors,
    S3Config,
    SelectCredential,
    SelectOrCreateAuthSecret,
    Tab,
    Tabbed,
    UnitInput,
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
  },

  async fetch() {
    if ( !this.rke2Versions ) {
      const hash = {
        rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
        k3sVersions:  this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }),
      };

      if ( this.$store.getters['management/canList'](MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE) ) {
        hash.allPSPs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE });
      }

      // Get the latest versions from the global settings if possible
      const globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING) || [];
      const defaultRke2Setting = globalSettings.find(setting => setting.id === 'rke2-default-version') || {};
      const defaultK3sSetting = globalSettings.find(setting => setting.id === 'k3s-default-version') || {};

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

      this.allPSPs = res.allPSPs || [];
      this.rke2Versions = res.rke2Versions.data || [];
      this.k3sVersions = res.k3sVersions.data || [];

      if (!defaultRke2) {
        const rke2Channels = res.rke2Channels.data || [];

        defaultRke2 = rke2Channels.find(x => x.id === 'default')?.latest;
      }

      if (!defaultK3s) {
        const k3sChannels = res.k3sChannels.data || [];

        defaultK3s = k3sChannels.find(x => x.id === 'default')?.latest;
      }

      if ( !this.rke2Versions.length && !this.k3sVersions.length ) {
        throw new Error('No version info found in KDM');
      }

      // Store default versions
      this.defaultRke2 = defaultRke2;
      this.defaultK3s = defaultK3s;
    }

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }

    if ( !this.value.spec.machineSelectorConfig ) {
      set(this.value.spec, 'machineSelectorConfig', []);
    }

    if ( !this.value.spec.machineSelectorConfig.find(x => !x.machineLabelSelector) ) {
      this.value.spec.machineSelectorConfig.unshift({ config: {} });
    }

    if ( this.value.spec.cloudCredentialSecretName ) {
      await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
      this.credentialId = `${ this.value.spec.cloudCredentialSecretName }`;
    }

    if ( !this.value.spec.kubernetesVersion ) {
      set(this.value.spec, 'kubernetesVersion', this.defaultVersion);
    }

    for ( const k in this.serverArgs ) {
      if ( this.serverConfig[k] === undefined ) {
        const def = this.serverArgs[k].default;

        set(this.serverConfig, k, (def !== undefined ? def : undefined));
      }
    }

    for ( const k in this.agentArgs ) {
      if ( this.agentConfig[k] === undefined ) {
        const def = this.agentArgs[k].default;

        set(this.agentConfig, k, (def !== undefined ? def : undefined));
      }
    }

    if ( !this.serverConfig.profile ) {
      set(this.serverConfig, 'profile', null);
    }

    if ( this.rkeConfig.etcd?.s3?.bucket ) {
      this.s3Backup = true;
    }

    if ( !this.rkeConfig.etcd ) {
      set(this.rkeConfig, 'etcd', {
        disableSnapshots:     false,
        s3:                   null,
        snapshotRetention:    5,
        snapshotScheduleCron: '0 */5 * * *',
      });
    } else if (typeof this.rkeConfig.etcd.disableSnapshots === 'undefined') {
      const disableSnapshots = !this.rkeConfig.etcd.snapshotRetention && !this.rkeConfig.etcd.snapshotScheduleCron;

      set(this.rkeConfig.etcd, 'disableSnapshots', disableSnapshots);
    }

    if ( !this.machinePools ) {
      await this.initMachinePools(this.value.spec.rkeConfig.machinePools);
      if ( this.mode === _CREATE && !this.machinePools.length ) {
        await this.addMachinePool();
      }
    }

    if ( this.value.spec.defaultPodSecurityPolicyTemplateName === undefined ) {
      set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', '');
    }

    await this.initAddons();
    await this.initRegistry();

    Object.entries(this.chartValues).forEach(([name, value]) => {
      const key = this.chartVersionKey(name);

      this.userChartValues[key] = value;
    });
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

    return {
      loadedOnce:                  false,
      lastIdx:                     0,
      allPSPs:                     null,
      nodeComponent:               null,
      credentialId:                null,
      credential:                  null,
      machinePools:                null,
      rke2Versions:                null,
      k3sVersions:                 null,
      defaultRke2:                 '',
      defaultK3s:                  '',
      s3Backup:                    false,
      versionInfo:                 {},
      membershipUpdate:            {},
      showDeprecatedPatchVersions: false,
      systemRegistry:              null,
      registryHost:                null,
      registryMode:                null,
      registrySecret:              null,
      userChartValues:             {},
      userChartValuesTemp:         {},
      addonsRev:                   0,
      clusterIsAlreadyCreated:     !!this.value.id,
      fvFormRuleSets:              [{
        path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
      }],
      harvesterVersionRange: {},
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    ...mapGetters({ features: 'features/get' }),

    PUBLIC:   () => PUBLIC,
    PRIVATE:  () => PRIVATE,
    ADVANCED: () => ADVANCED,

    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    advancedTitleAlt() {
      const machineSelectorLength = this.rkeConfig.machineSelectorConfig.length;

      return this.t('cluster.advanced.argInfo.machineSelector.titleAlt', { count: machineSelectorLength });
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

    showK3sTechPreviewWarning() {
      const selectedVersion = this.value?.spec?.kubernetesVersion || 'none';

      return !!this.k3sVersions.find(v => v.version === selectedVersion);
    },

    // kubeletConfigs() {
    //   return this.value.spec.rkeConfig.machineSelectorConfig.filter(x => !!x.machineLabelSelector);
    // },

    unsupportedSelectorConfig() {
      let global = 0;
      let kubeletOnly = 0;
      let other = 0;

      // The form supports one config that has no selector for all the main parts
      // And one or more configs that have a selector and exactly only kubelet-args.
      // If there are any other properties set, or multiple configs with no selector
      // show a warning that you're editing only part of the config in the UI.

      for ( const conf of this.value.spec?.rkeConfig?.machineSelectorConfig ) {
        if ( conf.machineLabelSelector ) {
          const keys = Object.keys(conf.config || {});

          if ( keys.length === 0 || (keys.length === 1 && keys[0] === 'kubelet-arg') ) {
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

      return ( global > 1 || other > 0 );
    },

    versionOptions() {
      const cur = this.liveValue?.spec?.kubernetesVersion || '';
      const existingRke2 = this.mode === _EDIT && cur.includes('rke2');
      const existingK3s = this.mode === _EDIT && cur.includes('k3s');

      let allValidRke2Versions = this.getAllOptionsAfterMinVersion(this.rke2Versions, (existingRke2 ? cur : null), this.defaultRke2);
      let allValidK3sVersions = this.getAllOptionsAfterMinVersion(this.k3sVersions, (existingK3s ? cur : null), this.defaultK3s);

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
          out.push({
            kind:  'group',
            label: this.t('cluster.provider.k3s'),
            badge: this.t('generic.techPreview')
          });
        }

        out.push(...allValidK3sVersions);
      }

      if ( cur ) {
        const existing = out.find(x => x.value === cur);

        if ( existing ) {
          existing.disabled = false;
        } else {
          out.unshift({ label: `${ cur } (current)`, value: cur });
        }
      }

      return out;
    },

    isK3s() {
      return (this.value?.spec?.kubernetesVersion || '').includes('k3s');
    },

    profileOptions() {
      const out = (this.agentArgs.profile?.options || []).map((x) => {
        return { label: x, value: x };
      });

      out.unshift({ label: '(None)', value: '' });

      return out;
    },

    pspOptions() {
      if ( this.isK3s ) {
        return null;
      }

      const out = [{ label: 'RKE2 Default', value: '' }];

      if ( this.allPSPs ) {
        for ( const pspt of this.allPSPs ) {
          out.push({
            label: pspt.nameDisplay,
            value: pspt.id,
          });
        }
      }

      const cur = this.value.spec.defaultPodSecurityPolicyTemplateName;

      if ( cur && !out.find(x => x.value === cur) ) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
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
      const out = [{ label: '(None)', value: '' }];

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

      if ( cur && !out.find(x => x.value === cur) ) {
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
      if ( this.selectedVersion?.serverArgs && this.selectedVersion?.agentArgs ) {
        return true;
      }

      return false;
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
      return this.provider === 'custom' && ( this.serverArgs.profile || this.agentArgs.profile );
    },

    registryOptions() {
      return [PUBLIC, PRIVATE, ADVANCED].map((opt) => {
        return {
          label: this.$store.getters['i18n/withFallback'](`cluster.privateRegistry.mode."${ opt }"`, null, opt),
          value: opt,
        };
      });
    },

    needCredential() {
      if ( this.provider === 'custom' || this.provider === 'import' || this.mode === _VIEW ) {
        return false;
      }

      return true;
    },

    hasMachinePools() {
      if ( this.provider === 'custom' || this.provider === 'import' ) {
        return false;
      }

      return true;
    },

    unremovedMachinePools() {
      return this.machinePools.filter(x => !x.remove);
    },

    machineConfigSchema() {
      if ( !this.hasMachinePools ) {
        return null;
      }

      const schema = this.$store.getters['management/schemaFor'](`${ CAPI.MACHINE_CONFIG_GROUP }.${ this.provider }config`);

      return schema;
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

      for ( const role of roles ) {
        counts[role] = 0;
        out.color[role] = 'bg-success';
        out.icon[role] = 'icon-checkmark';
      }

      for ( const row of this.machinePools ) {
        if ( row.remove ) {
          continue;
        }

        const qty = parseInt(row.pool.quantity, 10);

        if ( isNaN(qty) ) {
          continue;
        }

        for ( const role of roles ) {
          counts[role] = counts[role] + (row.pool[`${ role }Role`] ? qty : 0);
        }
      }

      for ( const role of roles ) {
        out.label[role] = this.t(`cluster.machinePool.nodeTotals.label.${ role }`, { count: counts[role] });
        out.tooltip[role] = this.t(`cluster.machinePool.nodeTotals.tooltip.${ role }`, { count: counts[role] });
      }

      if ( counts.etcd === 0 ) {
        out.color.etcd = 'bg-error';
        out.icon.etcd = 'icon-x';
      } else if ( counts.etcd === 1 || counts.etcd % 2 === 0 || counts.etcd > 7 ) {
        out.color.etcd = 'bg-warning';
        out.icon.etcd = 'icon-warning';
      }

      if ( counts.controlPlane === 0 ) {
        out.color.controlPlane = 'bg-error';
        out.icon.controlPlane = 'icon-x';
      } else if ( counts.controlPlane === 1 ) {
        out.color.controlPlane = 'bg-warning';
        out.icon.controlPlane = 'icon-warning';
      }

      if ( counts.worker === 0 ) {
        out.color.worker = 'bg-error';
        out.icon.worker = 'icon-x';
      } else if ( counts.worker === 1 ) {
        out.color.worker = 'bg-warning';
        out.icon.worker = 'icon-warning';
      }

      return out;
    },

    enabledSystemServices: {
      get() {
        const out = difference(this.serverArgs.disable.options, this.serverConfig.disable || []);

        return out;
      },

      set(neu) {
        const out = difference(this.serverArgs.disable.options, neu);

        set(this.serverConfig, 'disable', out);
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

    addonNames() {
      const names = [];
      const cni = this.serverConfig.cni;

      if ( cni ) {
        const parts = cni.split(',').map(x => `rke2-${ x }`);

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

    addonVersions() {
      const versions = this.addonNames.map(name => this.chartVersionFor(name));

      return versions.filter(x => !!x);
    },

    showk8s21LegacyWarning() {
      const isLegacyEnabled = this.features(LEGACY);

      if (!isLegacyEnabled) {
        return false;
      }
      const selectedVersion = semver.coerce(this.value.spec.kubernetesVersion);

      return semver.satisfies(selectedVersion, '>=1.21.0');
    },

    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    isHarvesterDriver() {
      return this.$route.query.type === HARVESTER;
    },

    defaultVersion() {
      const all = this.versionOptions.filter(x => !!x.value);
      const first = all[0]?.value;
      const preferred = all.find(x => x.value === this.defaultRke2)?.value;

      const rke2 = this.getAllOptionsAfterMinVersion(this.rke2Versions, null);
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
        const name = this.chartVersionKey('rke2-cilium');
        const values = this.userChartValues[name];

        set(this, 'userChartValues', {
          ...this.userChartValues,
          [name]: {
            ...values,
            cilium: {
              ...values?.cilium,
              ipv6: {
                ...values?.cilium?.ipv6,
                enabled: val
              }
            }
          }
        });
      }
    },

    showIpv6Warning() {
      const clusterCIDR = this.serverConfig['cluster-cidr'] || '';
      const serviceCIDR = this.serverConfig['service-cidr'] || '';

      return clusterCIDR.includes(':') || serviceCIDR.includes(':');
    },

    appsOSWarning() {
      if (this.mode !== _EDIT ) {
        return null;
      }
      const { linuxWorkerCount, windowsWorkerCount } = this.value?.mgmt?.status || {};

      if (!windowsWorkerCount) {
        if (!!this.machinePools.find((pool) => {
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
  },

  watch: {
    s3Backup(neu) {
      if ( neu ) {
        // We need to make sure that s3 doesn't already have an existing value otherwise when editing a cluster with s3 defined this will clear s3.
        if (isEmpty(this.rkeConfig.etcd?.s3)) {
          set(this.rkeConfig.etcd, 's3', {});
        }
      } else {
        set(this.rkeConfig.etcd, 's3', null);
      }
    },

    credentialId(val) {
      if ( val ) {
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
      const diff = old.length !== neu.length || difference(neu, old).length ;

      if (diff) {
        // Allow time for addonNames to update... then fetch any missing addons
        this.$nextTick(() => this.initAddons());
      }
    },

    selectedVersion() {
      this.versionInfo = {}; // Invalidate cache such that version info relevent to selected kube version is updated

      // Allow time for addonNames to update... then fetch any missing addons
      this.$nextTick(() => this.initAddons());
    },

    showCni(neu) {
      // Update `serverConfig.cni to recalculate addonNames...
      // ... which will eventually update `value.spec.rkeConfig.chartValues`
      if (neu) {
        // Type supports CNI, assign default if we can
        if (!this.serverConfig.cni) {
          const def = this.serverArgs.cni.default;

          set(this.serverConfig, 'cni', def);
        }
      } else {
        // Type doesn't support cni, clear `cni`
        set(this.serverConfig, 'cni', undefined);
      }
    },

    showCloudProvider(neu) {
      if (!neu) {
        // No cloud provider available? Then clear cloud provider setting. This will recalculate addonNames...
        // ... which will eventually update `value.spec.rkeConfig.chartValues`
        set(this.agentConfig, 'cloud-provider-name', undefined);
      }
    },

  },

  mounted() {
    window.rke = this;
  },

  created() {
    this.registerBeforeHook(this.saveMachinePools, 'save-machine-pools');
    this.registerBeforeHook(this.setRegistryConfig, 'set-registry-config');
    this.registerAfterHook(this.cleanupMachinePools, 'cleanup-machine-pools');
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  methods: {
    nlToBr,
    set,

    async initMachinePools(existing) {
      const out = [];

      if ( existing?.length ) {
        for ( const pool of existing ) {
          const type = `${ CAPI.MACHINE_CONFIG_GROUP }.${ pool.machineConfigRef.kind.toLowerCase() }`;
          let config;

          if ( this.$store.getters['management/canList'](type) ) {
            try {
              config = await this.$store.dispatch('management/find', {
                type,
                id: `${ this.value.metadata.namespace }/${ pool.machineConfigRef.name }`,
              });
            } catch (e) {
              // Some users can't see the config, that's ok.
            }
          }

          // @TODO what if the pool is missing?
          const id = `pool${ ++this.lastIdx }`;

          out.push({
            id,
            remove: false,
            create:  false,
            update: true,
            pool:    clone(pool),
            config:  config ? await this.$store.dispatch('management/clone', { resource: config }) : null,
          });
        }
      }

      this.machinePools = out;
    },

    async addMachinePool(idx) {
      if ( !this.machineConfigSchema ) {
        return;
      }

      const numCurrentPools = this.machinePools.length || 0;

      const config = await this.$store.dispatch('management/createPopulated', {
        type:     this.machineConfigSchema.id,
        metadata: { namespace: DEFAULT_WORKSPACE }
      });

      config.applyDefaults(idx, this.machinePools);

      const name = `pool${ ++this.lastIdx }`;
      const pool = {
        id:      name,
        config,
        remove: false,
        create:  true,
        update: false,
        pool:    {
          name,
          etcdRole:             numCurrentPools === 0,
          controlPlaneRole:     numCurrentPools === 0,
          workerRole:           true,
          hostnamePrefix:       '',
          labels:               {},
          quantity:             1,
          unhealthyNodeTimeout: '0m',
          machineConfigRef:     {
            kind:       this.machineConfigSchema.attributes.kind,
            name:       null,
          },
        },
      };

      if (this.provider === 'vmwarevsphere') {
        pool.pool.machineOS = 'linux';
      }
      this.machinePools.push(pool);

      this.$nextTick(() => {
        if ( this.$refs.pools?.select ) {
          this.$refs.pools.select(name);
        }
      });
    },

    removeMachinePool(idx) {
      const entry = this.machinePools[idx];

      if ( !entry ) {
        return;
      }

      if ( entry.create ) {
        // If this is a new pool that isn't saved yet, it can just be dropped
        removeObject(this.machinePools, entry);
      } else {
        // Mark for removal on save
        entry.remove = true;
      }
    },

    async syncMachineConfigWithLatest(machinePool) {
      if (machinePool?.config?.id) {
        const latestConfig = await this.$store.dispatch('management/find', {
          type: machinePool.config.type,
          id:   machinePool.config.id,
          opt:  { force: true },
        });
        const clonedCurrentConfig = await this.$store.dispatch('management/clone', { resource: machinePool.config });
        const clonedLatestConfig = await this.$store.dispatch('management/clone', { resource: latestConfig });

        // We don't allow the user to edit any of the fields in metadata from the UI so it's safe to override it with the
        // metadata defined by the latest backend value. This is primarily used to ensure the resourceVersion is up to date.
        delete clonedCurrentConfig.metadata;
        machinePool.config = merge(clonedLatestConfig, clonedCurrentConfig);
      }
    },

    async saveMachinePools() {
      const finalPools = [];

      for ( const entry of this.machinePools ) {
        if ( entry.remove ) {
          continue;
        }

        await this.syncMachineConfigWithLatest(entry);

        // Capitals and such aren't allowed;
        set(entry.pool, 'name', normalizeName(entry.pool.name) || 'pool');

        const prefix = `${ this.value.metadata.name }-${ entry.pool.name }`.substr(0, 50).toLowerCase();

        if ( entry.create ) {
          if ( !entry.config.metadata?.name ) {
            entry.config.metadata.generateName = `nc-${ prefix }-`;
          }

          const neu = await entry.config.save();

          entry.config = neu;
          entry.pool.machineConfigRef.name = neu.metadata.name;
          entry.create = false;
          entry.update = true;
        } else if ( entry.update ) {
          entry.config = await entry.config.save();
        }

        if ( !entry.pool.hostnamePrefix ) {
          entry.pool.hostnamePrefix = `${ prefix }-`;
        }

        finalPools.push(entry.pool);
      }

      this.value.spec.rkeConfig.machinePools = finalPools;
    },

    async cleanupMachinePools() {
      for ( const entry of this.machinePools ) {
        if ( entry.remove && entry.config ) {
          try {
            await entry.config.remove();
          } catch (e) {}
        }
      }
    },

    async saveRoleBindings() {
      await this.value.waitForMgmt();

      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.value.mgmt.id);
      }
    },

    validationPassed() {
      return (this.provider === 'custom' || !!this.credentialId);
    },

    cancelCredential() {
      if ( this.$refs.cruresource ) {
        this.$refs.cruresource.emitOrRoute();
      }
    },

    done() {
      let routeName = 'c-cluster-product-resource';

      if ( this.mode === _CREATE && (this.provider === 'import' || this.provider === 'custom') ) {
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
        this.$store.dispatch('cluster/promptModal', { component: 'AddonConfigConfirmationDialog', resources: [value => resolve(value)] });
      });
    },

    async saveOverride(btnCb) {
      if ( this.errors ) {
        clear(this.errors);
      }

      if (this.isEdit && this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion) {
        const shouldContinue = await this.showAddonConfirmation();

        if (!shouldContinue) {
          return btnCb('cancelled');
        }
      }

      if (this.value.cloudProvider === 'aws') {
        const missingProfileName = this.machinePools.some(mp => !mp.config.iamInstanceProfile);

        if (missingProfileName) {
          this.errors.push(this.t('cluster.validation.iamInstanceProfileName', {}, true));
        }
      }

      for (const [index] of this.machinePools.entries()) { // validator machine config
        if ( typeof this.$refs.pool[index]?.test === 'function' ) {
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

      if (!this.value.metadata.name && this.agentConfig['cloud-provider-name'] === HARVESTER) {
        this.errors.push(this.t('validation.required', { key: this.t('cluster.name.label') }, true));
      }

      if (this.errors.length) {
        btnCb(false);

        return;
      }

      const clusterId = get(this.credential, 'decodedData.clusterId') || '';

      this.applyChartValues(this.value.spec.rkeConfig);

      const isUpgrade = this.isEdit && this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion;

      if (this.agentConfig['cloud-provider-name'] === HARVESTER && clusterId && (this.isCreate || isUpgrade)) {
        const namespace = this.machinePools?.[0]?.config?.vmNamespace;

        const res = await this.$store.dispatch('management/request', {
          url:                  `/k8s/clusters/${ clusterId }/v1/harvester/kubeconfig`,
          method:               'POST',
          data:                 {
            clusterRoleName:    'harvesterhci.io:cloudprovider',
            namespace,
            serviceAccountName: this.value.metadata.name,
          },
        });

        const kubeconfig = res.data;

        const harvesterKubeconfigSecret = await this.createKubeconfigSecret(kubeconfig);

        set(this.agentConfig, 'cloud-provider-config', `secret://fleet-default:${ harvesterKubeconfigSecret?.metadata?.name }`);
        set(this.chartValues, `${ HARVESTER_CLOUD_PROVIDER }.clusterName`, this.value.metadata.name);
        set(this.chartValues, `${ HARVESTER_CLOUD_PROVIDER }.cloudConfigPath`, '/var/lib/rancher/rke2/etc/config-files/cloud-provider-config');
      }

      await this.save(btnCb);
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

    chartVersionFor(chartName) {
      const entry = this.chartVersions[chartName];

      if ( !entry ) {
        return null;
      }

      const out = this.$store.getters['catalog/version']({
        repoType:    'cluster',
        repoName:    entry.repo,
        chartName,
        versionName: entry.version,
      });

      return out;
    },

    async initAddons() {
      for ( const v of this.addonVersions ) {
        if ( this.versionInfo[v.name] ) {
          continue;
        }

        const res = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:    'cluster',
          repoName:    v.repoName,
          chartName:   v.name,
          versionName: v.version
        });

        set(this.versionInfo, v.name, res);
        const key = this.chartVersionKey(v.name);

        if (!this.userChartValues[key]) {
          this.userChartValues[key] = {};
        }
      }
    },

    labelForAddon(name) {
      const fallback = `${ camelToTitle(name.replace(/^(rke|rke2|rancher)-/, '')) } Configuration`;

      return this.$store.getters['i18n/withFallback'](`cluster.addonChart."${ name }"`, null, fallback);
    },

    showAddons() {
      this.addonsRev++;
      this.addonNames.forEach((name) => {
        const chartValues = this.versionInfo[name]?.questions ? this.initYamlEditor(name) : {};

        set(this.userChartValuesTemp, name, chartValues);
      });
      this.refreshYamls();
    },

    refreshYamls() {
      const keys = Object.keys(this.$refs).filter(x => x.startsWith('yaml'));

      for ( const k of keys ) {
        const entry = this.$refs[k];
        const list = isArray(entry) ? entry : [entry];

        for ( const component of list ) {
          component?.refresh(); // `yaml` ref can be undefined on switching from Basic to Addon tab (Azure --> Amazon --> addon)
        }
      }
    },

    updateValues(name, values) {
      set(this.userChartValuesTemp, name, values);
      this.syncChartValues(name);
    },

    syncChartValues: throttle(function(name) {
      const fromChart = this.versionInfo[name]?.values;
      const fromUser = this.userChartValuesTemp[name];
      const different = diff(fromChart, fromUser);

      this.userChartValues[this.chartVersionKey(name)] = different;
    }, 250, { leading: true }),

    updateQuestions(name) {
      this.syncChartValues(name);
    },

    initQuestions(name) {
      const defaultChartValue = this.versionInfo[name];
      const startingChartValue = this.initYamlEditor(name);

      return {
        ...defaultChartValue,
        values: startingChartValue,
      };
    },

    initYamlEditor(name) {
      const defaultChartValue = this.versionInfo[name];
      const key = this.chartVersionKey(name);

      return merge({}, defaultChartValue?.values || {}, this.userChartValues[key] || {});
    },

    chartVersionKey(name) {
      const addonVersion = this.addonVersions.find(av => av.name === name);

      return addonVersion ? `${ name }-${ addonVersion.version }` : name;
    },

    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
    },

    canRemoveKubeletRow(row, idx) {
      return idx !== 0;
    },

    async initRegistry() {
      let registryMode = PUBLIC;
      let registryHost = this.agentConfig?.['system-default-registry'] || '';
      let registrySecret = null;
      let regs = this.rkeConfig.registries;

      this.systemRegistry = (await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.SYSTEM_DEFAULT_REGISTRY })).value || '';

      if ( !regs ) {
        regs = {};
        set(this.rkeConfig, 'registries', regs);
      }

      if ( !regs.configs ) {
        set(regs, 'configs', {});
      }

      if ( !regs.mirrors ) {
        set(regs, 'mirrors', {});
      }

      if ( registryHost ) {
        registryMode = PRIVATE;
      } else if ( this.systemRegistry ) {
        registryHost = this.systemRegistry;
        registryMode = PRIVATE;
      }

      if ( Object.keys(regs.mirrors || {}).length || Object.keys(regs.configs || {}).length > 1 ) {
        registryMode = ADVANCED;
      } else {
        const hostname = Object.keys(regs.configs)[0];
        const config = regs.configs[hostname];

        if ( config ) {
          if ( hostname !== registryHost || config.caBundle || config.insecureSkipVerify || config.tlsSecretName ) {
            registryMode = ADVANCED;
          } else {
            registryMode = PRIVATE;
            registrySecret = config.authConfigSecretName;
          }
        }
      }

      this.registryHost = registryHost;
      this.registryMode = registryMode;
      this.registrySecret = registrySecret;
    },

    setRegistryConfig() {
      const hostname = (this.registryHost || '').trim();

      if ( this.registryMode === PUBLIC ) {
        if ( this.systemRegistry ) {
          // Empty string overrides the system default to nothing
          set(this.agentConfig, 'system-default-registry', '');
        } else {
          // No need to set anything
          set(this.agentConfig, 'system-default-registry', undefined);
        }
      } else if ( !hostname || hostname === this.systemRegistry ) {
        // Undefined removes the key which uses the global setting without hardcoding it into the config
        set(this.agentConfig, 'system-default-registry', undefined);
      } else {
        set(this.agentConfig, 'system-default-registry', hostname);
      }

      if ( this.registryMode === ADVANCED ) {
        // Leave it alone...
      } else if ( this.registryMode === PRIVATE ) {
        set(this.rkeConfig.registries, 'mirrors', {});

        if ( this.registrySecret ) {
          set(this.rkeConfig.registries, 'configs', {
            [hostname]: {
              authConfigSecretName: this.registrySecret,
              caBundle:             null,
              insecureSkipVerify:   false,
              tlsSecretName:        null,
            }
          });
        } else {
          set(this.rkeConfig.registries, 'configs', {});
        }
      } else {
        set(this.rkeConfig.registries, 'configs', {});
        set(this.rkeConfig.registries, 'mirrors', {});
      }
    },

    getAllOptionsAfterMinVersion(versions, minVersion, defaultVersion) {
      const out = (versions || []).filter(obj => !!obj.serverArgs).map((obj) => {
        let disabled = false;
        let experimental = false;

        if ( minVersion ) {
          disabled = compare(obj.id, minVersion) < 0;
        }

        if ( defaultVersion ) {
          experimental = compare(defaultVersion, obj.id) < 0;
        }

        return {
          label:      obj.id + (experimental ? ` (${ this.t('cluster.kubernetesVersion.experimental') })` : ''),
          value:      obj.id,
          sort:       sortable(obj.id),
          serverArgs: obj.serverArgs,
          agentArgs:  obj.agentArgs,
          charts:     obj.charts,
          disabled,
        };
      });
      const sorted = sortBy(out, 'sort:desc');

      const mostRecentPatchVersions = this.getMostRecentPatchVersions(sorted);

      const sortedWithDeprecatedLabel = sorted.map((optionData) => {
        const majorMinor = `${ semver.major(optionData.value) }.${ semver.minor(optionData.value) }`;

        if (mostRecentPatchVersions[majorMinor] === optionData.value) {
          return optionData;
        }

        return {
          ...optionData,
          label: `${ optionData.label } (${ this.t('cluster.kubernetesVersion.deprecated') })`
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
        if (version === currentVersion || mostRecentPatchVersions[majorMinor] === version.value) {
          return true;
        }

        return false;
      });

      return filteredVersions;
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
      this.addonNames.forEach((name) => {
        const key = this.chartVersionKey(name);
        const userValues = this.userChartValues[key];

        if (userValues) {
          set(rkeConfig.chartValues, name, userValues);
        }
      });
    },
    get,

    setHarvesterDefaultCloudProvider() {
      if (this.isHarvesterDriver &&
        this.mode === _CREATE &&
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

        const version = (res?.data || []).find(s => s.id === 'harvester-csi-ccm-versions');

        if (version) {
          this.harvesterVersionRange = JSON.parse(version.value || version.default || '{}');
        } else {
          this.harvesterVersionRange = {};
        }
      }
      this.setHarvesterDefaultCloudProvider();
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending && !loadedOnce" />
  <Banner v-else-if="$fetchState.error" color="error" :label="$fetchState.error" />
  <CruResource
    v-else
    ref="cruresource"
    :mode="mode"
    :validation-passed="validationPassed() && fvFormIsValid"
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
    @error="fvUnreportedValidationErrors"
  >
    <Banner
      v-if="isEdit"
      color="warning"
    >
      <span v-html="t('cluster.banner.rke2-k3-reprovisioning', {}, true)" />
    </Banner>
    <SelectCredential
      v-if="needCredential"
      v-model="credentialId"
      :mode="mode"
      :provider="provider"
      :cancel="cancelCredential"
      :showing-form="showForm"
    />

    <div v-if="showForm" class="mt-20">
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="false"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{name:fvGetAndReportPathRules('metadata.name')}"
      />

      <Banner v-if="appsOSWarning" color="error">
        {{ appsOSWarning }}
      </Banner>

      <template v-if="hasMachinePools">
        <div class="clearfix">
          <h2 v-t="'cluster.tabs.machinePools'" class="pull-left" />
          <div v-if="!isView" class="pull-right">
            <BadgeState
              v-tooltip="nodeTotals.tooltip.etcd"
              :color="nodeTotals.color.etcd"
              :icon="nodeTotals.icon.etcd"
              :label="nodeTotals.label.etcd"
              class="mr-10"
            />
            <BadgeState
              v-tooltip="nodeTotals.tooltip.controlPlane"
              :color="nodeTotals.color.controlPlane"
              :icon="nodeTotals.icon.controlPlane"
              :label="nodeTotals.label.controlPlane"
              class="mr-10"
            />
            <BadgeState
              v-tooltip="nodeTotals.tooltip.worker"
              :color="nodeTotals.color.worker"
              :icon="nodeTotals.icon.worker"
              :label="nodeTotals.label.worker"
            />
          </div>
        </div>

        <Tabbed
          ref="pools"
          :side-tabs="true"
          :show-tabs-add-remove="!isView"
          @addTab="addMachinePool($event)"
          @removeTab="removeMachinePool($event)"
        >
          <template v-for="(obj, idx) in machinePools">
            <Tab v-if="!obj.remove" :key="obj.id" :name="obj.id" :label="obj.pool.name || '(Not Named)'" :show-header="false">
              <MachinePool
                ref="pool"
                :value="obj"
                :cluster="value"
                :mode="mode"
                :provider="provider"
                :credential-id="credentialId"
                :idx="idx"
                :machine-pools="machinePools"
                @error="e=>errors = e"
              />
            </Tab>
          </template>
          <div v-if="!unremovedMachinePools.length">
            You do not have any machine pools defined, click the plus to add one.
          </div>
        </Tabbed>
        <div class="spacer" />
      </template>

      <h2 v-t="'cluster.tabs.cluster'" />
      <Tabbed :side-tabs="true">
        <Tab name="basic" label-key="cluster.tabs.basic" :weight="11" @active="refreshYamls">
          <Banner v-if="!haveArgInfo" color="warning" label="Configuration information is not available for the selected Kubernetes version.  The options available in this screen will be limited, you may want to use the YAML editor." />
          <Banner v-if="showk8s21LegacyWarning" color="warning" :label="t('cluster.legacyWarning')" />
          <Banner
            v-if="isHarvesterDriver && isHarvesterIncompatible && showCloudProvider"
            color="warning"
          >
            <span
              v-html="t('cluster.harvester.warning.cloudProvider.incompatible', null, true)"
            />
          </Banner>
          <div class="row mb-10">
            <div class="col span-6">
              <LabeledSelect
                v-model="value.spec.kubernetesVersion"
                :mode="mode"
                :options="versionOptions"
                label-key="cluster.kubernetesVersion.label"
              />
              <Checkbox
                v-model="showDeprecatedPatchVersions"
                :label="t('cluster.kubernetesVersion.deprecatedPatches')"
                :tooltip="t('cluster.kubernetesVersion.deprecatedPatchWarning')"
                class="patch-version"
              />
              <div v-if="showK3sTechPreviewWarning" class="k3s-tech-preview-info">
                {{ t('cluster.k3s.techPreview') }}
              </div>
            </div>
            <div v-if="showCloudProvider" class="col span-6">
              <LabeledSelect
                v-model="agentConfig['cloud-provider-name']"
                :mode="mode"
                :disabled="clusterIsAlreadyCreated"
                :options="cloudProviderOptions"
                :label="t('cluster.rke2.cloudProvider.label')"
              />
            </div>
          </div>
          <div v-if="showCni" :style="{'align-items':'center'}" class="row">
            <div class="col span-6">
              <LabeledSelect
                v-model="serverConfig.cni"
                :mode="mode"
                :disabled="clusterIsAlreadyCreated"
                :options="serverArgs.cni.options"
                :label="t('cluster.rke2.cni.label')"
              />
            </div>
            <div v-if="serverConfig.cni === 'cilium' || serverConfig.cni === 'multus,cilium'" class="col">
              <Checkbox v-model="ciliumIpv6" :mode="mode" :label="t('cluster.rke2.address.ipv6.enable')" />
            </div>
          </div>
          <template v-if="showVsphereNote">
            <Banner color="warning" label-key="cluster.cloudProvider.rancher-vsphere.note" />
          </template>
          <template v-else-if="showCloudConfigYaml">
            <div class="spacer" />

            <div class="col span-12">
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
          <div class="row">
            <div class="col span-6">
              <LabeledSelect
                v-if="pspOptions"
                v-model="value.spec.defaultPodSecurityPolicyTemplateName"
                :mode="mode"
                :options="pspOptions"
                :label="t('cluster.rke2.defaultPodSecurityPolicyTemplateName.label')"
              />
            </div>
            <div v-if="showCisProfile" class="col span-6">
              <LabeledSelect
                v-if="serverArgs.profile"
                v-model="serverConfig.profile"
                :mode="mode"
                :options="profileOptions"
                label="Server CIS Profile"
              />
              <LabeledSelect
                v-else-if="agentArgs.profile"
                v-model="agentConfig.profile"
                :mode="mode"
                :options="profileOptions"
                label="Worker CIS Profile"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-12 mt-20">
              <Checkbox v-if="serverArgs['secrets-encryption']" v-model="serverConfig['secrets-encryption']" :mode="mode" label="Encrypt Secrets" />
              <Checkbox v-model="value.spec.enableNetworkPolicy" :mode="mode" :label="t('cluster.rke2.enableNetworkPolicy.label')" />
              <!-- <Checkbox v-if="agentArgs.selinux" v-model="agentConfig.selinux" :mode="mode" label="SELinux" /> -->
            </div>
          </div>

          <div v-if="serverConfig.cni === 'cilium' && value.spec.enableNetworkPolicy" class="row">
            <div class="col span-12">
              <Banner color="info" :label="t('cluster.rke2.enableNetworkPolicy.warning')" />
            </div>
          </div>

          <div class="spacer" />

          <div v-if="serverArgs.disable" class="row">
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
        </Tab>

        <Tab v-if="canManageMembers" name="memberRoles" label-key="cluster.tabs.memberRoles" :weight="10">
          <Banner v-if="isEdit" color="info">
            {{ t('cluster.memberRoles.removeMessage') }}
          </Banner>
          <ClusterMembershipEditor :mode="mode" :parent-id="value.mgmt ? value.mgmt.id : null" @membership-update="onMembershipUpdate" />
        </Tab>

        <Tab name="etcd" label-key="cluster.tabs.etcd">
          <div class="row">
            <div class="col span-6">
              <RadioGroup
                v-model="rkeConfig.etcd.disableSnapshots"
                name="etcd-disable-snapshots"
                :options="[true, false]"
                :label="t('cluster.rke2.etcd.disableSnapshots.label')"
                :labels="[t('generic.disable'), t('generic.enable')]"
                :mode="mode"
              />
            </div>
          </div>
          <div v-if="rkeConfig.etcd.disableSnapshots !== true" class="row">
            <div class="col span-6">
              <LabeledInput
                v-model="rkeConfig.etcd.snapshotScheduleCron"
                type="cron"
                placeholder="0 * * * *"
                :mode="mode"
                :label="t('cluster.rke2.etcd.snapshotScheduleCron.label')"
              />
            </div>
            <div class="col span-6">
              <UnitInput
                v-model="rkeConfig.etcd.snapshotRetention"
                :mode="mode"
                :label="t('cluster.rke2.etcd.snapshotRetention.label')"
                :suffix="t('cluster.rke2.snapshots.suffix')"
              />
            </div>
          </div>

          <template v-if="rkeConfig.etcd.disableSnapshots !== true">
            <div class="spacer" />

            <RadioGroup
              v-model="s3Backup"
              name="etcd-s3"
              :options="[false, true]"
              label="Backup Snapshots to S3"
              :labels="['Disable','Enable']"
              :mode="mode"
            />

            <S3Config
              v-if="s3Backup"
              v-model="rkeConfig.etcd.s3"
              :namespace="value.metadata.namespace"
              :register-before-hook="registerBeforeHook"
              :mode="mode"
            />
          </template>

          <div class="spacer" />

          <div class="row">
            <div class="col span-6">
              <RadioGroup
                v-if="serverArgs['etcd-expose-metrics']"
                v-model="serverConfig['etcd-expose-metrics']"
                name="etcd-expose-metrics"
                :options="[false, true]"
                :label="t('cluster.rke2.etcd.exportMetric.label')"
                :labels="[t('cluster.rke2.etcd.exportMetric.false'), t('cluster.rke2.etcd.exportMetric.true')]"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>

        <Tab v-if="haveArgInfo" name="networking" label-key="cluster.tabs.networking">
          <h3>
            {{ t('cluster.rke2.address.header') }}
            <i v-tooltip="t('cluster.rke2.address.tooltip')" class="icon icon-info" />
          </h3>
          <Banner v-if="showIpv6Warning" color="warning">
            {{ t('cluster.rke2.address.ipv6.warning') }}
          </Banner>
          <div class="row mb-20">
            <div v-if="serverArgs['cluster-cidr']" class="col span-6">
              <LabeledInput
                v-model="serverConfig['cluster-cidr']"
                :mode="mode"
                :disabled="clusterIsAlreadyCreated"
                :label="t('cluster.rke2.address.clusterCidr.label')"
              />
            </div>
            <div v-if="serverArgs['service-cidr']" class="col span-6">
              <LabeledInput
                v-model="serverConfig['service-cidr']"
                :mode="mode"
                :disabled="clusterIsAlreadyCreated"
                :label="t('cluster.rke2.address.serviceCidr.label')"
              />
            </div>
          </div>

          <div class="row mb-20">
            <div v-if="serverArgs['cluster-dns']" class="col span-6">
              <LabeledInput
                v-model="serverConfig['cluster-dns']"
                :mode="mode"
                :disabled="clusterIsAlreadyCreated"
                :label="t('cluster.rke2.address.dns.label')"
              />
            </div>
            <div v-if="serverArgs['cluster-domain']" class="col span-6">
              <LabeledInput
                v-model="serverConfig['cluster-domain']"
                :mode="mode"
                :disabled="clusterIsAlreadyCreated"
                :label="t('cluster.rke2.address.domain.label')"
              />
            </div>
          </div>

          <div v-if="serverArgs['service-node-port-range']" class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="serverConfig['service-node-port-range']"
                :mode="mode"
                :label="t('cluster.rke2.address.nodePortRange.label')"
              />
            </div>
          </div>

          <div v-if="serverArgs['tls-san']" class="row mb-20">
            <div class="col span-6">
              <ArrayList
                v-model="serverConfig['tls-san']"
                :protip="false"
                :mode="mode"
                :title="t('cluster.rke2.address.tlsSan.label')"
              />
            </div>
          </div>

          <ACE v-model="value" :mode="mode" />
        </Tab>

        <Tab name="upgrade" label-key="cluster.tabs.upgrade">
          <Banner v-if="get(rkeConfig, 'upgradeStrategy.controlPlaneDrainOptions.deleteEmptyDirData')" color="warning">
            {{ t('cluster.rke2.deleteEmptyDir', {}, true) }}
          </Banner>
          <div class="row">
            <div class="col span-6">
              <h3>Control Plane</h3>
              <LabeledInput
                v-model="rkeConfig.upgradeStrategy.controlPlaneConcurrency"
                :mode="mode"
                :label="t('cluster.rke2.controlPlaneConcurrency.label')"
                :tooltip="t('cluster.rke2.controlPlaneConcurrency.toolTip')"
              />
              <div class="spacer" />
              <DrainOptions v-model="rkeConfig.upgradeStrategy.controlPlaneDrainOptions" :mode="mode" />
            </div>
            <div class="col span-6">
              <h3>
                {{ t('cluster.rke2.workNode.label') }}
              </h3>
              <LabeledInput
                v-model="rkeConfig.upgradeStrategy.workerConcurrency"
                :mode="mode"
                :label="t('cluster.rke2.workerConcurrency.label')"
                :tooltip="t('cluster.rke2.workerConcurrency.toolTip')"
              />
              <div class="spacer" />
              <DrainOptions v-model="rkeConfig.upgradeStrategy.workerDrainOptions" :mode="mode" />
            </div>
          </div>
        </Tab>

        <Tab name="registry" label-key="cluster.tabs.registry">
          <RadioGroup
            v-model="registryMode"
            name="registry-mode"
            :options="registryOptions"
            :mode="mode"
          />

          <LabeledInput
            v-if="registryMode !== PUBLIC"
            v-model="registryHost"
            class="mt-20"
            :mode="mode"
            :required="true"
            :label="t('cluster.privateRegistry.systemDefaultRegistry.label')"
          />

          <SelectOrCreateAuthSecret
            v-if="registryMode === PRIVATE"
            v-model="registrySecret"
            :register-before-hook="registerBeforeHook"
            :hook-priority="1"
            :mode="mode"
            in-store="management"
            :allow-ssh="false"
            :allow-rke="true"
            :vertical="true"
            :namespace="value.metadata.namespace"
            generate-name="registryconfig-auth-"
          />
          <template v-else-if="registryMode === ADVANCED">
            <RegistryMirrors
              v-model="value"
              class="mt-20"
              :mode="mode"
            />

            <RegistryConfigs
              v-model="value"
              class="mt-20"
              :mode="mode"
              :cluster-register-before-hook="registerBeforeHook"
            />
          </template>
        </Tab>

        <Tab name="addons" label-key="cluster.tabs.addons" @active="showAddons">
          <Banner
            v-if="isEdit"
            color="warning"
          >
            {{ t('cluster.addOns.dependencyBanner') }}
          </Banner>
          <div v-if="versionInfo && addonVersions.length" :key="addonsRev">
            <div v-for="v in addonVersions" :key="v._key">
              <h3>{{ labelForAddon(v.name) }}</h3>
              <Questions
                v-if="versionInfo[v.name] && versionInfo[v.name].questions && v.name && userChartValuesTemp[v.name]"
                v-model="userChartValuesTemp[v.name]"
                :emit="true"
                in-store="management"
                :mode="mode"
                :tabbed="false"
                :source="versionInfo[v.name]"
                :target-namespace="value.metadata.namespace"
                @updated="updateQuestions(v.name)"
              />
              <YamlEditor
                v-else
                ref="yaml-values"
                :value="initYamlEditor(v.name)"
                :scrolling="true"
                :as-object="true"
                :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
                :hide-preview-buttons="true"
                @input="data => updateValues(v.name, data)"
              />
              <div class="spacer" />
            </div>
          </div>

          <div>
            <h3>
              {{ t('cluster.addOns.additionalManifest.title') }}
              <i
                v-tooltip="t('cluster.addOns.additionalManifest.tooltip')"
                class="icon icon-info"
              />
            </h3>
            <YamlEditor
              ref="yaml-additional"
              v-model="rkeConfig.additionalManifest"
              :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
              initial-yaml-values="# Additional Manifest YAML"
              class="yaml-editor"
            />
          </div>
        </Tab>

        <Tab
          v-if="haveArgInfo || agentArgs['protect-kernel-defaults']"
          name="advanced"
          label-key="cluster.tabs.advanced"
          :weight="-1"
          @active="refreshYamls"
        >
          <template v-if="haveArgInfo">
            <h3>{{ t('cluster.advanced.argInfo.title') }}</h3>
            <ArrayListGrouped
              v-if="agentArgs['kubelet-arg']"
              v-model="rkeConfig.machineSelectorConfig"
              class="mb-20"
              :add-label="t('cluster.advanced.argInfo.machineSelector.label')"
              :can-remove="canRemoveKubeletRow"
              :default-add-value="{machineLabelSelector: { matchExpressions: [], matchLabels: {} }, config: {'kubelet-arg': []}}"
            >
              <template #default="{row}">
                <template v-if="row.value.machineLabelSelector">
                  <h3>{{ t('cluster.advanced.argInfo.machineSelector.title') }}</h3>
                  <MatchExpressions
                    v-model="row.value.machineLabelSelector"
                    class="mb-20"
                    :mode="mode"
                    :show-remove="false"
                    :initial-empty-row="true"
                  />
                  <h3>{{ t('cluster.advanced.argInfo.machineSelector.subTitle') }}</h3>
                </template>
                <h3 v-else>
                  {{ advancedTitleAlt }}
                </h3>

                <ArrayList
                  v-model="row.value.config['kubelet-arg']"
                  :mode="mode"
                  :add-label="t('cluster.advanced.argInfo.machineSelector.listLabel')"
                  :initial-empty-row="!!row.value.machineLabelSelector"
                />
              </template>
            </ArrayListGrouped>
            <Banner
              v-if="rkeConfig.machineSelectorConfig.length > 1"
              color="info"
              :label="t('cluster.advanced.argInfo.machineSelector.bannerLabel')"
            />

            <ArrayList
              v-if="serverArgs['kube-controller-manager-arg']"
              v-model="serverConfig['kube-controller-manager-arg']"
              :mode="mode"
              :title="t('cluster.advanced.argInfo.machineSelector.kubeControllerManagerTitle')"
              class="mb-20"
            />
            <ArrayList
              v-if="serverArgs['kube-apiserver-arg']"
              v-model="serverConfig['kube-apiserver-arg']"
              :mode="mode"
              :title="t('cluster.advanced.argInfo.machineSelector.kubeApiServerTitle')"
              class="mb-20"
            />
            <ArrayList
              v-if="serverArgs['kube-scheduler-arg']"
              v-model="serverConfig['kube-scheduler-arg']"
              :mode="mode"
              :title="t('cluster.advanced.argInfo.machineSelector.kubeSchedulerTitle')"
            />
          </template>
          <template v-if="agentArgs['protect-kernel-defaults']">
            <div class="spacer" />

            <div class="row">
              <div class="col span-12">
                <Checkbox
                  v-model="agentConfig['protect-kernel-defaults']"
                  :mode="mode"
                  :label="t('cluster.advanced.agentArgs.label')"
                />
              </div>
            </div>
          </template>
        </Tab>

        <AgentEnv v-model="value" :mode="mode" />
        <Labels v-model="value" :mode="mode" />
      </Tabbed>
    </div>

    <Banner
      v-if="unsupportedSelectorConfig"
      color="warning"
      :label="t('cluster.banner.warning')"
    />

    <template v-if="needCredential && !credentialId" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  .k3s-tech-preview-info {
    color: var(--error);
    padding-top: 10px;
  }
  .patch-version {
    margin-top: 5px;
  }
</style>
