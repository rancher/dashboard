<script>
import difference from 'lodash/difference';
import differenceBy from 'lodash/differenceBy';
import { mapGetters } from 'vuex';

import { CAPI, MANAGEMENT, SECRET } from '@/config/types';
import { _CREATE, _EDIT } from '@/config/query-params';

import { camelToTitle, nlToBr } from '@/utils/string';
import { clone, set } from '@/utils/object';
import { compare, sortable } from '@/utils/version';
import { sortBy } from '@/utils/sort';
import { findBy, removeObject } from '@/utils/array';

import CreateEditView from '@/mixins/create-edit-view';
import ArrayList from '@/components/form/ArrayList';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import UnitInput from '@/components/form/UnitInput';
import YamlEditor from '@/components/YamlEditor';
import Questions from '@/components/Questions';

import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';

import { allHash } from '@/utils/promise';
import isArray from 'lodash/isArray';
import ACE from './ACE';
import AgentEnv from './AgentEnv';
import DrainOptions from './DrainOptions';
import Labels from './Labels';
import MachinePool from './MachinePool';
import RegistryConfigs from './RegistryConfigs';
import RegistryMirrors from './RegistryMirrors';
import S3Config from './S3Config';
import SelectCredential from './SelectCredential';

export default {
  components: {
    ACE,
    AgentEnv,
    ArrayList,
    BadgeState,
    Banner,
    Checkbox,
    CruResource,
    DrainOptions,
    LabeledInput,
    LabeledSelect,
    Labels,
    Loading,
    MachinePool,
    NameNsDescription,
    Questions,
    RadioGroup,
    RegistryConfigs,
    RegistryMirrors,
    S3Config,
    SelectCredential,
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
    if ( !this.allSecrets ) {
      const hash = {
        allSecrets:   this.$store.dispatch('management/findAll', { type: SECRET }),
        rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
        k3sVersions:  this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }),
      };

      if ( this.$store.getters['management/schemaFor'](MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE) ) {
        hash.allPSPs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE });
      }

      const res = await allHash(hash);

      this.allSecrets = res.allSecrets;
      this.rke2Versions = res.rke2Versions.data;
      this.k3sVersions = res.k3sVersions.data;
    }

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }

    if ( this.value.spec.cloudCredentialSecretName ) {
      this.credentialId = `${ this.value.metadata.namespace }/${ this.value.spec.cloudCredentialSecretName }`;
    }

    if ( !this.value.spec.kubernetesVersion ) {
      set(this.value.spec, 'kubernetesVersion', this.versionOptions.find(x => !!x.value).value);
    }

    for ( const k in this.serverArgs ) {
      set(this.serverConfig, k, this.serverConfig[k] || this.serverArgs[k].default || undefined);
    }

    for ( const k in this.agentArgs ) {
      set(this.agentConfig, k, this.agentConfig[k] || this.agentArgs[k].default || undefined);
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
        snapshotScheduleCron: '* */5 * * *',
      });
    }

    if ( !this.machinePools ) {
      await this.initMachinePools(this.value.spec.rkeConfig.machinePools);
      if ( this.mode === _CREATE && !this.machinePools.length ) {
        await this.addMachinePool();
      }
    }

    if ( !this.versionInfo ) {
      this.versionInfo = {};
    }

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

      if ( !this.chartValues[v.name] ) {
        set(this.chartValues, v.name, res.values || {});
      }
    }
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

    if ( !this.value.spec.rkeConfig.controlPlaneConfig ) {
      set(this.value.spec, 'rkeConfig.controlPlaneConfig', {});
    }

    if ( !this.value.spec.rkeConfig.workerConfig?.length ) {
      set(this.value.spec, 'rkeConfig.workerConfig', [{}]);
    }

    if ( !this.value.spec.defaultPodSecurityPolicyTemplateName ) {
      set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', null);
    }

    return {
      lastIdx:          0,
      allSecrets:       null,
      allPSPs:          null,
      nodeComponent:    null,
      credentialId:     null,
      credential:       null,
      machinePools:     null,
      rke2Versions:     null,
      k3sVersions:      null,
      s3Backup:         false,
      chartVersionInfo: null,
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),

    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.controlPlaneConfig;
    },

    agentConfig() {
      return this.value.spec.rkeConfig.workerConfig[0];
    },

    chartValues() {
      return this.value.spec.rkeConfig.chartValues;
    },

    multipleAgentConfigs() {
      return this.value.spec.rkeConfig.workerConfig.length > 1;
    },

    unsupportedAgentConfig() {
      return !!this.agentConfig.machineLabelSelector;
    },

    versionOptions() {
      function filterAndMap(versions, minVersion) {
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
      }

      const cur = this.value?.spec?.kubernetesVersion || '';
      const existingRke2 = this.mode === _EDIT && cur.includes('rke2');
      const existingK3s = this.mode === _EDIT && cur.includes('k3s');
      const rke2 = filterAndMap(this.rke2Versions, (existingRke2 ? cur : null));
      const k3s = filterAndMap(this.k3sVersions, (existingK3s ? cur : null));
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
          out.push({ label: `${ cur } (current)`, value: cur });
        }
      }

      return out;
    },

    profileOptions() {
      const out = (this.agentArgs.profile?.options || []).map((x) => {
        return { label: x, value: x };
      });

      out.unshift({ label: '(None)', value: null });

      return out;
    },

    pspOptions() {
      const out = [{ label: '(None)', value: null }];

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
          label: this.$store.getters['i18n/withFallback'](`cluster.rke2.systemService."${ value }"`, null, value.replace(/^rke2-/, '')),
          value,
        };
      });
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

    needCredential() {
      if ( this.provider === 'custom' || this.provider === 'import' ) {
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
      default: return true;
      }
    },

    showCni() {
      return !!this.serverArgs.cni;
    },

    addonVersions() {
      const names = [];
      const cni = this.serverConfig.cni;

      if ( cni ) {
        const parts = cni.split('+');

        names.push(...parts);
      }

      if ( this.agentConfig['cloud-provider-name'] === 'vsphere' ) {
        names.push('vsphere-cpi', 'vpshere-csi');
      }

      return names.map(name => this.chartVersionFor(name)).filter(x => !!x);
    },
  },

  watch: {
    credentialId(val) {
      if ( val ) {
        this.credential = this.$store.getters['management/byId'](SECRET, this.credentialId);

        if ( this.credential ) {
          this.value.spec.cloudCredentialSecretName = this.credential.metadata.name;
        } else {
          this.value.spec.cloudCredentialSecretName = null;
        }
      }
    },

    addonVersions(neu, old) {
      if (!this.$fetchState.pending && differenceBy(neu, old, 'name').length ) {
        this.$fetch();
      }
    },
  },

  mounted() {
    window.rke = this;
  },

  created() {
    this.registerBeforeHook(this.saveMachinePools, 'save-machine-pools');
    this.registerAfterHook(this.cleanupMachinePools, 'cleanup-machine-pools');
  },

  methods: {
    nlToBr,

    async initMachinePools(existing) {
      const out = [];

      if ( existing?.length ) {
        for ( const pool of existing ) {
          const config = await this.$store.dispatch('management/find', {
            type: `${ CAPI.MACHINE_CONFIG_GROUP }.${ pool.machineConfigRef.kind.toLowerCase() }`,
            id:   `${ this.value.metadata.namespace }/${ pool.machineConfigRef.name }`,
          });

          // @TODO what if the pool is missing?
          const id = `pool${ ++this.lastIdx }`;

          out.push({
            id,
            remove: false,
            create:  false,
            pool:    clone(pool),
            config:  await this.$store.dispatch('management/clone', { resource: config }),
          });
        }
      }

      this.machinePools = out;
    },

    async addMachinePool() {
      if ( !this.machineConfigSchema ) {
        return;
      }

      const numCurrentPools = this.machinePools.length || 0;

      const config = await this.$store.dispatch('management/createPopulated', {
        type:     this.machineConfigSchema.id,
        metadata: { namespace: DEFAULT_WORKSPACE }
      });

      config.applyDefaults();

      const name = `pool${ ++this.lastIdx }`;

      this.machinePools.push({
        id:      name,
        config,
        remove: false,
        create:  true,
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
        const prefix = `${ this.value.metadata.name }-${ (entry.pool.name || 'pool') }`.substr(0, 50).toLowerCase();

        if ( entry.create ) {
          if ( !entry.config.metadata?.name ) {
            entry.config.metadata.generateName = `nc-${ prefix }-`;
          }

          const neu = await entry.config.save();

          entry.config = neu;
          entry.pool.machineConfigRef.name = neu.metadata.name;
          entry.create = false;
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
        if ( entry.remove ) {
          await entry.config.remove();
          entry.remove = false;
        }
      }
    },

    validationPassed() {
      return this.provider === 'custom' || !!this.credentialId;
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

    chartVersionFor(feature) {
      const chartName = `rke2-${ feature }`;
      const entry = this.chartVersions[chartName];

      if ( !entry ) {
        return null;
      }

      const out = this.$store.getters['catalog/version']({
        repoType:    'cluster',
        repoName:    (feature === 'multus' ? 'rancher-rke2-charts' : entry.repo), // @TODO remove when KDM is fixed
        chartName,
        versionName: entry.version,
      });

      return out;
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
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    ref="cruresource"
    :mode="mode"
    :validation-passed="validationPassed()"
    :resource="value"
    :errors="errors"
    :done-event="true"
    :cancel-event="true"
    @done="done"
    @finish="save"
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
          @addTab="addMachinePool"
          @removeTab="removeMachinePool($event)"
        >
          <Tab v-for="obj in machinePools" :key="obj.id" :name="obj.id" :label="obj.pool.name || '(Not Named)'" :show-header="false">
            <MachinePool
              :value="obj"
              :mode="mode"
              :provider="provider"
              :credential-id="credentialId"
              @error="e=>errors = e"
            />
          </Tab>
        </Tabbed>
        <div class="spacer" />
      </template>

      <h2 v-t="'cluster.tabs.cluster'" />
      <Tabbed :side-tabs="true">
        <Tab name="basic" label-key="cluster.tabs.basic" :weight="10" @active="refreshYamls">
          <Banner v-if="!haveArgInfo" color="warning" label="Configuration information is not available for the selected Kubernetes version.  The options available in this screen will be limited, you may want to use the YAML editor." />

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
                :options="agentArgs['cloud-provider-name'].options"
                label="Cloud Provider"
              />
            </div>
          </div>

          <template v-if="showCloudConfigYaml">
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
                v-model="value.spec.defaultPodSecurityPolicyTemplateName"
                :mode="mode"
                :options="pspOptions"
                label="Default Pod Security Policy"
              />
            </div>
            <div class="col span-6 mt-5">
              <div v-if="serverArgs['secrets-encryption']">
                <Checkbox v-model="serverConfig['secrets-encryption']" :mode="mode" label="Encrypt Secrets" />
              </div>
              <div><Checkbox v-model="value.spec.enableNetworkPolicy" :mode="mode" label="Project Network Isolation" /></div>
              <div v-if="agentArgs.selinux">
                <Checkbox v-model="agentConfig.selinux" :mode="mode" label="SELinux" />
              </div>
            </div>
          </div>
          <div class="row">
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

        <Tab name="etcd" label-key="cluster.tabs.etcd" :weight="9">
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
                suffix="Snapshots"
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
                label="Metrics"
                :labels="['Only available inside the cluster','Exposed to the public interface']"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>

        <Tab v-if="haveArgInfo" name="networking" label-key="cluster.tabs.networking" :weight="8">
          <div v-if="serverArgs['service-node-port-range']" class="row mb-20">
            <div class="col span-6">
              <LabeledInput v-model="serverConfig['service-node-port-range']" :mode="mode" label="NodePort Service Port Range" />
            </div>
          </div>

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

          <div v-if="serverArgs['tls-san']" class="row mb-20">
            <div class="col span-6">
              <ArrayList :mode="mode" :value="serverConfig['tls-san']" title="TLS Alternate Names" />
            </div>
          </div>
        </Tab>

        <Tab name="upgrade" label-key="cluster.tabs.upgrade" :weight="7">
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

        <Tab name="registry" label-key="cluster.tabs.registry" :weight="6">
          <RegistryMirrors
            v-model="value"
            :mode="mode"
          />

          <RegistryConfigs
            v-model="value"
            class="mt-20"
            :mode="mode"
            :register-before-hook="registerBeforeHook"
          />
        </Tab>

        <Tab name="advanced" label-key="cluster.tabs.advanced" :weight="-1" @active="refreshYamls">
          <template v-if="serverArgs.profile || agentArgs.profile">
            <h3>CIS Profile Validation</h3>
            <div class="row">
              <div v-if="serverArgs.profile" class="col span-6">
                <LabeledSelect
                  v-model="serverConfig.profile"
                  :mode="mode"
                  :options="profileOptions"
                  label="Server CIS Profile"
                />
              </div>
              <div v-if="agentArgs.profile" class="col span-6">
                <LabeledSelect
                  v-model="agentConfig.profile"
                  :mode="mode"
                  :options="profileOptions"
                  label="Worker CIS Profile"
                />
              </div>
            </div>

            <div class="spacer" />
          </template>

          <template v-if="agentArgs['protect-kernel-defaults']">
            <div class="row">
              <div class="col span-12">
                <Checkbox v-model="agentConfig['protect-kernel-defaults']" :mode="mode" label="Raise error if kernel parameters are different than the expected kubelet defaults." />
              </div>
            </div>

            <div class="spacer" />
          </template>

          <template v-if="haveArgInfo">
            <div class="row">
              <div class="col span-6">
                <ArrayList v-if="agentArgs['kubelet-arg']" :mode="mode" :value="agentConfig['kubelet-arg']" title="Additional Kubelet Args" class="mb-20" />
                <ArrayList v-if="serverArgs['kube-controller-manager-arg']" :mode="mode" :value="serverConfig['kube-controller-manager-arg']" title="Additional Controller Manager Args" class="mb-20" />
              </div>
              <div class="col span-6">
                <ArrayList v-if="serverArgs['kube-apiserver-arg']" :mode="mode" :value="serverConfig['kube-apiserver-arg']" title="Additional API Server Args" class="mb-20" />
                <ArrayList v-if="serverArgs['kube-scheduler-arg']" :mode="mode" :value="serverConfig['kube-scheduler-arg']" title="Additional Scheduler Args" />
              </div>
            </div>

            <div class="spacer" />
          </template>

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

          <div v-if="addonVersions.length">
            <div v-for="v in addonVersions" :key="v._key">
              <div class="spacer" />
              <h3>{{ labelForAddon(v.name) }}</h3>
              <Questions
                v-if="versionInfo[v.name].questions"
                v-model="chartValues[v.name]"
                :mode="mode"
                :chart-version="versionInfo[v.name]"
                :target-namespace="value.metadata.namespace"
              />
              <YamlEditor
                v-else
                ref="yaml-values"
                v-model="chartValues[v.name]"
                :scrolling="true"
                :initial-yaml-values="versionInfo[v.name].values"
                :as-object="true"
                :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
                :hide-preview-buttons="true"
              />
            </div>
          </div>
        </Tab>

        <ACE v-model="value" :mode="mode" />
        <AgentEnv v-model="value" :mode="mode" />
        <Labels v-model="value" :mode="mode" />
      </Tabbed>
    </div>

    <Banner v-if="multipleAgentConfigs" color="warning" label="This cluster has multiple workerConfigs. This form does only manages the first one; use the YAML editor to manage the full configuration." />
    <Banner v-if="unsupportedAgentConfig" color="warning" label="This cluster contains a workerConfig which this form does not fully support; use the YAML editor to manage the full configuration." />

    <template v-if="needCredential && !credentialId" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
