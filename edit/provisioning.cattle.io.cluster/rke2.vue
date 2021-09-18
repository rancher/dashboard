<script>
import difference from 'lodash/difference';
import throttle from 'lodash/throttle';
import isArray from 'lodash/isArray';
import merge from 'lodash/merge';
import { mapGetters } from 'vuex';

import CreateEditView from '@/mixins/create-edit-view';

import { CAPI, MANAGEMENT, NORMAN } from '@/config/types';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';

import { findBy, removeObject, clear } from '@/utils/array';
import {
  clone, diff, isEmpty, set, get
} from '@/utils/object';
import { allHash } from '@/utils/promise';
import { sortBy } from '@/utils/sort';
import { camelToTitle, nlToBr } from '@/utils/string';
import { compare, sortable } from '@/utils/version';

import ArrayList from '@/components/form/ArrayList';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Loading from '@/components/Loading';
import MatchExpressions from '@/components/form/MatchExpressions';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import UnitInput from '@/components/form/UnitInput';
import YamlEditor from '@/components/YamlEditor';
import Questions from '@/components/Questions';

import { normalizeName } from '@/components/form/NameNsDescription.vue';
import ClusterMembershipEditor from '@/components/form/Members/ClusterMembershipEditor';
import SelectOrCreateAuthSecret from '@/components/form/SelectOrCreateAuthSecret';
import { LEGACY } from '@/store/features';
import semver from 'semver';
import { canViewClusterMembershipEditor } from '@/components/form/Members/ClusterMembershipEditor.vue';
import { SETTING } from '@/config/settings';
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

  mixins: [CreateEditView],

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

      const res = await allHash(hash);

      this.allPSPs = res.allPSPs || [];
      this.rke2Versions = res.rke2Versions.data || [];
      this.k3sVersions = res.k3sVersions.data || [];

      if ( !this.rke2Versions.length && !this.k3sVersions.length ) {
        throw new Error('No version info found in KDM');
      }
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
      const option = this.versionOptions.find(x => !!x.value);
      const rke2 = this.filterAndMap(this.rke2Versions, null);
      const showRke2 = rke2.length;

      if (this.isHarvesterDriver && showRke2) {
        this.setHarvesterK8sDefaultVersion();
      } else {
        set(this.value.spec, 'kubernetesVersion', option.value);
      }
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

    if (this.isHarvesterDriver && this.mode === _CREATE) {
      this.agentConfig['cloud-provider-name'] = HARVESTER;
    }

    await this.initAddons();
    await this.initRegistry();

    this.loadedOnce = true;
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
        controlPlaneConcurrency:  '10%',
        controlPlaneDrainOptions: {},
        workerConcurrency:        '10%',
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
      loadedOnce:       false,
      lastIdx:          0,
      allPSPs:          null,
      nodeComponent:    null,
      credentialId:     null,
      credential:       null,
      machinePools:     null,
      rke2Versions:     null,
      k3sVersions:      null,
      s3Backup:         false,
      chartVersionInfo: null,
      versionInfo:      {},
      membershipUpdate: {},
      systemRegistry:   null,
      registryHost:     null,
      registryMode:     null,
      registrySecret:   null,
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

    chartValues() {
      return this.value.spec.rkeConfig.chartValues;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    agentConfig() {
      // The one we want is the first one with no selector.
      // If there are multiple with no selector, that will fall under the unsupported message below.
      return this.value.spec.rkeConfig.machineSelectorConfig.find(x => !x.machineLabelSelector).config;
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
      function filterAndMap(versions, minVersion, currentVersion) {
        const out = (versions || []).filter(obj => !!obj.serverArgs).map((obj) => {
          let disabled = false;

          if ( minVersion ) {
            disabled = compare(obj.id, minVersion) < 0;
          }

          return {
            label:      obj.id,
            value:      obj.id,
            sort:       sortable(obj.id),
            serverArgs: obj.serverArgs,
            agentArgs:  obj.agentArgs,
            charts:     obj.charts,
            disabled,
          };
        });

        const sorted = sortBy(out, 'sort:desc');
        const versionMap = {};

        return sorted.filter((version) => {
          // Always show pre-releases
          if (semver.prerelease(version.value)) {
            return true;
          }

          const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

          // Always show current version, else show if we haven't shown anything for this major.minor version yet
          if (version === currentVersion || !versionMap[majorMinor]) {
            versionMap[majorMinor] = true;

            return true;
          }

          return false;
        });
      }

      const cur = this.originalValue?.spec?.kubernetesVersion || '';
      const existingRke2 = this.mode === _EDIT && cur.includes('rke2');
      const existingK3s = this.mode === _EDIT && cur.includes('k3s');
      const rke2 = filterAndMap(this.rke2Versions, (existingRke2 ? cur : null), cur);
      const k3s = filterAndMap(this.k3sVersions, (existingK3s ? cur : null), cur);
      const showRke2 = rke2.length && !existingK3s;
      const showK3s = k3s.length && !existingRke2;
      const out = [];

      if ( showRke2 ) {
        if ( showK3s ) {
          out.push({ kind: 'group', label: this.t('cluster.provider.rke2') });
        }

        out.push(...rke2);
      }

      if ( showK3s ) {
        if ( showRke2 ) {
          out.push({ kind: 'group', label: this.t('cluster.provider.k3s') });
        }

        out.push(...k3s);
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
        if ( (!preferred && opt !== HARVESTER) || opt === preferred || opt === 'external' || preferred === HARVESTER) {
          out.push({
            label: this.$store.getters['i18n/withFallback'](`cluster.cloudProvider."${ opt }".label`, null, opt),
            value: opt,
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

    addonNames() {
      const names = [];
      const cni = this.serverConfig.cni;

      if ( cni ) {
        const parts = cni.split('+').map(x => `rke2-${ x }`);

        names.push(...parts);
      }

      if ( this.agentConfig['cloud-provider-name'] === 'rancher-vsphere' ) {
        names.push('rancher-vsphere-cpi', 'rancher-vsphere-csi');
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
  },

  watch: {
    s3Backup(neu) {
      if ( neu ) {
        set(this.rkeConfig.etcd, 's3', {});
      } else {
        set(this.rkeConfig.etcd, 's3', null);
      }
    },

    credentialId(val) {
      if ( val ) {
        this.credential = this.$store.getters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, this.credentialId);
      } else {
        this.credential = null;
      }

      this.value.spec.cloudCredentialSecretName = val;
    },

    addonNames(neu, old) {
      const diff = difference(neu, old);

      if (!this.$fetchState.pending && diff.length ) {
        this.$fetch();
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

      this.machinePools.push({
        id:      name,
        config,
        remove: false,
        create:  true,
        update: false,
        pool:    {
          name,
          etcdRole:         numCurrentPools === 0,
          controlPlaneRole: numCurrentPools === 0,
          workerRole:       true,
          hostnamePrefix:   '',
          labels:           {},
          quantity:         1,
          machineConfigRef:    {
            kind:       this.machineConfigSchema.attributes.kind,
            name:       null,
          },
        },
      });

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

    async saveMachinePools() {
      const finalPools = [];

      for ( const entry of this.machinePools ) {
        if ( entry.remove ) {
          continue;
        }

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

    async saveOverride(btnCb) {
      if ( this.errors ) {
        clear(this.errors);
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

      if (this.agentConfig['cloud-provider-name'] === HARVESTER && clusterId) {
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

        set(this.agentConfig, 'cloud-provider-config', res.data);
      }

      await this.save(btnCb);
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

        this.versionInfo[v.name] = res;

        const fromChart = res.values || {};
        const fromUser = this.chartValues[v.name] || this.value.spec.rkeConfig.chartValues[v.name] || {};

        const merged = merge(merge({}, fromChart), fromUser);

        set(this.chartValues, v.name, merged);
      }
    },

    labelForAddon(name) {
      const fallback = `${ camelToTitle(name.replace(/^(rke|rke2|rancher)-/, '')) } Configuration`;

      return this.$store.getters['i18n/withFallback'](`cluster.addonChart."${ name }"`, null, fallback);
    },

    refreshYamls() {
      const keys = Object.keys(this.$refs).filter(x => x.startsWith('yaml'));

      for ( const k of keys ) {
        const entry = this.$refs[k];
        const list = isArray(entry) ? entry : [entry];

        for ( const component of list ) {
          component.refresh();
        }
      }
    },

    updateValues(name, values) {
      set(this.chartValues, name, values);
      this.syncChartValues();
    },

    syncChartValues: throttle(function() {
      const out = {};

      for ( const k of this.addonNames ) {
        const fromChart = this.versionInfo[k].values;
        const fromUser = this.chartValues[k];
        const different = diff(fromChart, fromUser);

        if ( isEmpty(different) ) {
          out[k] = {};
        } else {
          out[k] = different;
        }
      }

      set(this.value.spec.rkeConfig, 'chartValues', out);
    }, 250, { leading: true }),

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

    filterAndMap(versions, minVersion) {
      const out = (versions || []).filter(obj => !!obj.serverArgs).map((obj) => {
        let disabled = false;

        if ( minVersion ) {
          disabled = compare(obj.id, minVersion) < 0;
        }

        return {
          label:      obj.id,
          value:      obj.id,
          sort:       sortable(obj.id),
          serverArgs: obj.serverArgs,
          agentArgs:  obj.agentArgs,
          charts:     obj.charts,
          disabled,
        };
      });

      return sortBy(out, 'sort:desc');
    },

    setHarvesterK8sDefaultVersion() {
      const rke2 = this.filterAndMap(this.rke2Versions, null);

      const satisfiesVersion = rke2.filter((v) => {
        const rkeVersion = v.value.replace(/.+rke2r/i, '');

        return semver.satisfies(semver.coerce(v.value), '>=v1.21.4+rke2r4') && Number(rkeVersion) >= 4;
      }) || [];

      if (satisfiesVersion.length > 0) {
        set(this.value.spec, 'kubernetesVersion', satisfiesVersion[0]?.value);
      } else {
        const option = this.versionOptions.find(x => !!x.value);

        set(this.value.spec, 'kubernetesVersion', option.value);
      }
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
    :validation-passed="validationPassed()"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="e=>errors = e"
  >
    <SelectCredential
      v-if="needCredential"
      v-model="credentialId"
      :mode="mode"
      :provider="provider"
      :cancel="cancelCredential"
    />

    <div v-if="credentialId || !needCredential" class="mt-20">
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="false"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
      />

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
          <template v-for="obj in machinePools">
            <Tab v-if="!obj.remove" :key="obj.id" :name="obj.id" :label="obj.pool.name || '(Not Named)'" :show-header="false">
              <MachinePool
                ref="pool"
                :value="obj"
                :mode="mode"
                :provider="provider"
                :credential-id="credentialId"
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
          <div class="row">
            <div class="col" :class="{'span-4': showCni, 'span-6': !showCni}">
              <LabeledSelect
                v-model="value.spec.kubernetesVersion"
                :mode="mode"
                :options="versionOptions"
                label-key="cluster.kubernetesVersion.label"
              />
            </div>
            <div v-if="showCni" class="col span-4">
              <LabeledSelect
                v-model="serverConfig.cni"
                :mode="mode"
                :options="serverArgs.cni.options"
                label="Container Network Provider"
              />
            </div>
            <div v-if="agentArgs['cloud-provider-name']" class="col" :class="{'span-4': showCni, 'span-6': !showCni}">
              <LabeledSelect
                v-model="agentConfig['cloud-provider-name']"
                :mode="mode"
                :options="cloudProviderOptions"
                label="Cloud Provider"
              />
            </div>
          </div>

          <template v-if="showVsphereNote">
            <Banner color="warning" label-key="cluster.cloudProvider.rancher-vsphere.note" />
          </template>
          <template v-else-if="showCloudConfigYaml">
            <div class="spacer" />

            <div class="col span-12">
              <h3>Cloud Provider Config</h3>
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

          <h3>Security</h3>
          <div class="row">
            <div class="col span-6">
              <LabeledSelect
                v-if="pspOptions"
                v-model="value.spec.defaultPodSecurityPolicyTemplateName"
                :mode="mode"
                :options="pspOptions"
                label="Default Pod Security Policy"
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
              <Checkbox v-model="value.spec.enableNetworkPolicy" :mode="mode" label="Project Network Isolation" />
              <Checkbox v-if="agentArgs.selinux" v-model="agentConfig.selinux" :mode="mode" label="SELinux" />
            </div>
          </div>

          <div class="spacer" />

          <div v-if="serverArgs.disable" class="row">
            <div class="col span-12">
              <div><h3>System Services</h3></div>
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
                label="Automatic Snapshots"
                :labels="['Disable','Enable']"
                :mode="mode"
              />
            </div>
          </div>
          <div v-if="rkeConfig.etcd.disableSnapshots !== true" class="row">
            <div class="col span-6">
              <LabeledInput v-model="rkeConfig.etcd.snapshotScheduleCron" :mode="mode" label="Cron Schedule" />
            </div>
            <div class="col span-6">
              <UnitInput
                v-model="rkeConfig.etcd.snapshotRetention"
                :mode="mode"
                label="Keep the last"
                :suffix="t('cluster.rke2.snapshots.suffix')"
              />
            </div>
          </div>

          <template v-if="false && rkeConfig.etcd.disableSnapshots !== true">
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
              v-if="rkeConfig.etcd.s3"
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
                label="Metrics"
                :labels="['Only available inside the cluster','Exposed to the public interface']"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>

        <Tab v-if="haveArgInfo" name="networking" label-key="cluster.tabs.networking">
          <h3>Addressing</h3>
          <div class="row mb-20">
            <div v-if="serverArgs['cluster-cidr']" class="col span-6">
              <LabeledInput v-model="serverConfig['cluster-cidr']" :mode="mode" label="Cluster CIDR" />
            </div>
            <div v-if="serverArgs['service-cidr']" class="col span-6">
              <LabeledInput v-model="serverConfig['service-cidr']" :mode="mode" label="Service CIDR" />
            </div>
          </div>

          <div class="row mb-20">
            <div v-if="serverArgs['cluster-dns']" class="col span-6">
              <LabeledInput v-model="serverConfig['cluster-dns']" :mode="mode" label="Cluster DNS" />
            </div>
            <div v-if="serverArgs['cluster-domain']" class="col span-6">
              <LabeledInput v-model="serverConfig['cluster-domain']" :mode="mode" label="Cluster Domain" />
            </div>
          </div>

          <div v-if="serverArgs['service-node-port-range']" class="row mb-20">
            <div class="col span-6">
              <LabeledInput v-model="serverConfig['service-node-port-range']" :mode="mode" label="NodePort Service Port Range" />
            </div>
          </div>

          <div v-if="serverArgs['tls-san']" class="row mb-20">
            <div class="col span-6">
              <ArrayList v-model="serverConfig['tls-san']" :protip="false" :mode="mode" title="TLS Alternate Names" />
            </div>
          </div>

          <ACE v-model="value" :mode="mode" />
        </Tab>

        <Tab name="upgrade" label-key="cluster.tabs.upgrade">
          <div class="row">
            <div class="col span-6">
              <h3>Control Plane</h3>
              <LabeledInput v-model="rkeConfig.upgradeStrategy.controlPlaneConcurrency" :mode="mode" label="Control Plane Concurrency" tooltip="This can be either a fixed number of nodes (e.g. 1) at a time of a percentage (e.g. 10%)" />
              <div class="spacer" />
              <DrainOptions v-model="rkeConfig.upgradeStrategy.controlPlaneDrainOptions" :mode="mode" />
            </div>
            <div class="col span-6">
              <h3>Worker Nodes</h3>
              <LabeledInput v-model="rkeConfig.upgradeStrategy.workerConcurrency" :mode="mode" label="Worker Concurrency" tooltip="This can be either a fixed number of nodes (e.g. 1) at a time of a percentage (e.g. 10%)" />
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
              :register-before-hook="registerBeforeHook"
            />
          </template>
        </Tab>

        <Tab name="addons" label-key="cluster.tabs.addons" @active="refreshYamls">
          <div v-if="addonVersions.length">
            <div v-for="v in addonVersions" :key="v._key">
              <h3>{{ labelForAddon(v.name) }}</h3>
              <Questions
                v-if="versionInfo[v.name] && versionInfo[v.name].questions"
                v-model="chartValues[v.name]"
                in-store="management"
                :mode="mode"
                :tabbed="false"
                :source="versionInfo[v.name]"
                :target-namespace="value.metadata.namespace"
              />
              <YamlEditor
                v-else
                ref="yaml-values"
                :value="chartValues[v.name]"
                :scrolling="true"
                :initial-yaml-values="versionInfo[v.name] ? versionInfo[v.name].values : ''"
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
              Additional Manifest
              <i v-tooltip="'Additional Kubernetes Manifet YAML to be applied to the cluster on startup.'" class="icon icon-info" />
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

        <Tab name="advanced" label-key="cluster.tabs.advanced" :weight="-1" @active="refreshYamls">
          <template v-if="haveArgInfo">
            <h3>Additional Kubelet Args</h3>
            <ArrayListGrouped
              v-if="agentArgs['kubelet-arg']"
              v-model="rkeConfig.machineSelectorConfig"
              class="mb-20"
              add-label="Add Machine Selector"
              :can-remove="canRemoveKubeletRow"
              :default-add-value="{machineLabelSelector: { matchExpressions: [], matchLabels: {} }, config: {'kubelet-arg': []}}"
            >
              <template #default="{row}">
                <template v-if="row.value.machineLabelSelector">
                  <h3>For machines with labels matching:</h3>
                  <MatchExpressions
                    v-model="row.value.machineLabelSelector"
                    class="mb-20"
                    :mode="mode"
                    :show-remove="false"
                    :initial-empty-row="true"
                  />
                  <h3>Use the Kubelet args:</h3>
                </template>
                <h3 v-else>
                  For <span v-if="rkeConfig.machineSelectorConfig.length > 1">any</span><span v-else>all</span> machines, use the Kubelet args:
                </h3>

                <ArrayList
                  v-model="row.value.config['kubelet-arg']"
                  :mode="mode"
                  add-label="Add Argument"
                  :initial-empty-row="!!row.value.machineLabelSelector"
                />
              </template>
            </ArrayListGrouped>
            <Banner v-if="rkeConfig.machineSelectorConfig.length > 1" color="info" label="Note: The last selector that matches wins and only args from it will be used.  Args from other matches above will not combined together or merged." />

            <ArrayList v-if="serverArgs['kube-controller-manager-arg']" v-model="serverConfig['kube-controller-manager-arg']" :mode="mode" title="Additional Controller Manager Args" class="mb-20" />
            <ArrayList v-if="serverArgs['kube-apiserver-arg']" v-model="serverConfig['kube-apiserver-arg']" :mode="mode" title="Additional API Server Args" class="mb-20" />
            <ArrayList v-if="serverArgs['kube-scheduler-arg']" v-model="serverConfig['kube-scheduler-arg']" :mode="mode" title="Additional Scheduler Args" />
          </template>
          <template v-if="agentArgs['protect-kernel-defaults']">
            <div class="spacer" />

            <div class="row">
              <div class="col span-12">
                <Checkbox v-model="agentConfig['protect-kernel-defaults']" :mode="mode" label="Raise error if kernel parameters are different than the expected kubelet defaults" />
              </div>
            </div>
          </template>
        </Tab>

        <AgentEnv v-model="value" :mode="mode" />
        <Labels v-model="value" :mode="mode" />
      </Tabbed>
    </div>

    <Banner v-if="unsupportedSelectorConfig" color="warning" label="This cluster contains a machineSelectorConfig which this form does not fully support; use the YAML editor to manage the full configuration." />

    <template v-if="needCredential && !credentialId" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
