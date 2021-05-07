<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Banner from '@/components/Banner';
import YamlEditor from '@/components/YamlEditor';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ArrayList from '@/components/form/ArrayList';
import Checkbox from '@/components/form/Checkbox';
import NameNsDescription from '@/components/form/NameNsDescription';
import BadgeState from '@/components/BadgeState';
import { MANAGEMENT, SECRET } from '@/config/types';
import { nlToBr } from '@/utils/string';
import { clone, set } from '@/utils/object';
import { sortable } from '@/utils/version';
import { sortBy } from '@/utils/sort';
import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';
import { _CREATE } from '@/config/query-params';
import { findBy, removeObject } from '@/utils/array';
import difference from 'lodash/difference';
import SelectCredential from './SelectCredential';
import NodePool from './NodePool';
import Labels from './Labels';
import AgentEnv from './AgentEnv';
import ACE from './ACE';
import DrainOptions from './DrainOptions';

export default {
  components: {
    NameNsDescription,
    CruResource,
    Loading,
    Tabbed,
    Tab,
    Banner,
    YamlEditor,
    ArrayList,
    Checkbox,
    SelectCredential,
    LabeledSelect,
    NodePool,
    BadgeState,
    ACE,
    DrainOptions,
    AgentEnv,
    Labels,
    LabeledInput
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
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });

    if ( this.value.spec.cloudCredentialSecretName ) {
      this.credentialId = `${ this.value.metadata.namespace }/${ this.value.spec.cloudCredentialSecretName }`;
    }

    if ( this.$store.getters['management/schemaFor'](MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE) ) {
      this.allPSPs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE });
    }

    this.rke2Versions = (await this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' })).data;
    this.k3sVersions = (await this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' })).data;

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }

    if ( !this.value.spec.kubernetesVersion ) {
      set(this.value.spec, 'kubernetesVersion', this.versionOptions.find(x => !!x.value).value);
    }

    if ( !this.value.spec.rkeConfig ) {
      set(this.value.spec, 'rkeConfig', {});
    }

    if ( !this.value.spec.rkeConfig.upgradeStrategy ) {
      set(this.value.spec.rkeConfig, 'upgradeStrategy', {
        controlPlaneConcurrency:  '10%',
        controlPlaneDrainOptions: {},
        workerConcurrency:        '10%',
        workerDrainOptions:       {},
      });
    }

    if ( !this.value.spec.rkeConfig?.controlPlaneConfig ) {
      set(this.value.spec, 'rkeConfig.controlPlaneConfig', {});
    }

    if ( !this.value.spec.rkeConfig?.workerConfig?.length ) {
      set(this.value.spec, 'rkeConfig.workerConfig', [{}]);
    }

    if ( !this.value.spec.defaultPodSecurityPolicyTemplateName ) {
      set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', null);
    }

    if ( this.selectedVersion ) {
      for ( const k in this.selectedVersion.serverArgs ) {
        set(this.serverConfig, k, this.serverConfig[k] || this.selectedVersion.serverArgs[k].default || undefined);
      }
      for ( const k in this.selectedVersion.agentArgs ) {
        set(this.agentConfig, k, this.agentConfig[k] || this.selectedVersion.agentArgs[k].default || undefined);
      }
    }

    await this.initNodePools(this.value.spec.rkeConfig.nodePools);
    if ( this.mode === _CREATE && !this.nodePools.length ) {
      await this.addNodePool();
    }
  },

  data() {
    return {
      lastIdx:               0,
      allSecrets:            null,
      allPSPs:               null,
      nodeComponent:         null,
      credentialId:          null,
      credential:            null,
      nodePools:             null,
      rke2Versions:          null,
      k3sVersions:           null,
    };
  },

  computed: {
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.controlPlaneConfig;
    },

    agentConfig() {
      return this.value.spec.rkeConfig.workerConfig[0];
    },

    multipleAgentConfigs() {
      return this.value.spec.rkeConfig.workerConfig.length > 1;
    },

    unsupportedAgentConfig() {
      return !!this.agentConfig.machineLabelSelector;
    },

    versionOptions() {
      function filterAndMap(versions) {
        const out = (versions || []).filter(obj => !!obj.serverArgs).map((obj) => {
          return {
            label:      obj.id,
            value:      obj.id,
            sort:       sortable(obj.id),
            serverArgs: obj.serverArgs,
            agentArgs:  obj.agentArgs,
          };
        });

        return sortBy(out, 'sort:desc');
      }

      const rke2 = filterAndMap(this.rke2Versions);
      const k3s = filterAndMap(this.k3sVersions);
      const cur = this.value?.spec?.kubernetesVersion;
      const out = [];

      if ( cur ) {
        let existing = rke2.find(x => x.value === cur);

        if ( !existing ) {
          existing = k3s.find(x => x.value === cur);
        }

        if ( !existing ) {
          out.push({ label: `${ cur } (current)`, value: cur });
        }
      }

      if ( rke2.length ) {
        out.push({ kind: 'group', label: this.t('cluster.provider.rke2') });
        out.push(...rke2);
      }

      if ( k3s.length ) {
        out.push({ kind: 'group', label: this.t('cluster.provider.k3s') });
        out.push(...k3s);
      }

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
      return this.selectedVersion.serverArgs.disable.options.map((value) => {
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

    serverArgs() {
      return this.selectedVersion?.serverArgs;
    },

    agentArgs() {
      return this.selectedVersion?.agentArgs;
    },

    needCredential() {
      if ( this.provider === 'custom' || this.provider === 'import' ) {
        return false;
      }

      return true;
    },

    hasNodePools() {
      if ( this.provider === 'custom' || this.provider === 'import' ) {
        return false;
      }

      return true;
    },

    nodeConfigSchema() {
      if ( !this.hasNodePools ) {
        return null;
      }

      const schema = this.$store.getters['management/schemaFor'](`provisioning.cattle.io.${ this.provider }config`);

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

      for ( const row of this.nodePools ) {
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
        out.label[role] = this.t(`cluster.nodePool.nodeTotals.label.${ role }`, { count: counts[role] });
        out.tooltip[role] = this.t(`cluster.nodePool.nodeTotals.tooltip.${ role }`, { count: counts[role] });
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
        const out = difference(this.selectedVersion.serverArgs.disable.options, this.serverConfig.disable || []);

        return out;
      },

      set(neu) {
        const out = difference(this.selectedVersion.serverArgs.disable.options, neu);

        set(this.serverConfig, 'disable', out);
      },
    },

    showCloudConfigYaml() {
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
      return !!this.selectedVersion.serverArgs.cni;
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
  },

  mounted() {
    window.rke = this;
  },

  created() {
    this.registerBeforeHook(this.saveNodePools);
    this.registerAfterHook(this.cleanupNodePools);
  },

  methods: {
    nlToBr,

    async initNodePools(existing) {
      const out = [];

      if ( existing?.length ) {
        for ( const pool of existing ) {
          const config = await this.$store.dispatch('management/find', {
            type: `provisioning.cattle.io.${ pool.nodeConfigRef.kind.toLowerCase() }`,
            id:   `${ this.value.metadata.namespace }/${ pool.nodeConfigRef.name }`,
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

      this.nodePools = out;
    },

    async addNodePool() {
      if ( !this.nodeConfigSchema ) {
        return;
      }

      const numCurrentPools = this.nodePools.length || 0;

      const config = await this.$store.dispatch('management/createPopulated', {
        type:     this.nodeConfigSchema.id,
        metadata: { namespace: DEFAULT_WORKSPACE }
      });

      config.applyDefaults();

      const name = `pool${ ++this.lastIdx }`;

      this.nodePools.push({
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
          nodeConfigRef:    {
            kind:       this.nodeConfigSchema.attributes.kind,
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

    removeNodePool(idx) {
      const entry = this.nodePools[idx];

      if ( !entry ) {
        return;
      }

      if ( entry.create ) {
        // If this is a new pool that isn't saved yet, it can just be dropped
        removeObject(this.nodePools, entry);
      } else {
        // Mark for removal on save
        entry.remove = true;
      }
    },

    async saveNodePools() {
      const finalPools = [];

      for ( const entry of this.nodePools ) {
        const prefix = `${ this.value.metadata.name }-${ (entry.pool.name || 'pool') }`.substr(0, 50);

        if ( entry.create ) {
          if ( !entry.config.metadata?.name && !entry.config.metadata?.generateName ) {
            entry.config.metadata.generateName = `nc-${ prefix }-`;
          }
          const neu = await entry.config.save();

          entry.config = neu;
          entry.pool.nodeConfigRef.name = neu.metadata.name;
          entry.create = false;
        }

        if ( !entry.pool.hostnamePrefix ) {
          entry.pool.hostnamePrefix = `${ prefix }-`;
        }

        finalPools.push(entry.pool);
      }

      this.value.spec.rkeConfig.nodePools = finalPools;
    },

    async cleanupNodePools() {
      for ( const entry of this.nodePools ) {
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
    @finish="save"
    @error="e=>errors = e"
  >
    <div v-if="needCredential" class="row">
      <div class="col" :class="{'span-6': !!credentialId, 'span-12': !credentialId}">
        <SelectCredential
          v-model="credentialId"
          :mode="mode"
          :provider="provider"
          :cancel="cancelCredential"
        />
      </div>
    </div>
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

      <template v-if="hasNodePools">
        <div class="clearfix">
          <h2 v-t="'cluster.tabs.nodePools'" class="pull-left" />
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
          @addTab="addNodePool"
          @removeTab="removeNodePool($event)"
        >
          <Tab v-for="obj in nodePools" :key="obj.id" :name="obj.id" :label="obj.pool.name || '(Not Named)'" :show-header="false">
            <NodePool
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
    </div>

    <h2 v-t="'cluster.tabs.cluster'" />
    <Tabbed :side-tabs="true">
      <Tab name="basic" label-key="cluster.tabs.basic" :weight="10" @active="if ( $refs.cloudProvider ) $refs.cloudProvider.refresh()">
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
              :options="selectedVersion.serverArgs.cni.options"
              label="Container Network Provider"
            />
          </div>
          <div class="col" :class="{'span-4': showCni, 'span-6': !showCni}">
            <LabeledSelect
              v-model="agentConfig['cloud-provider-name']"
              :mode="mode"
              :options="selectedVersion.agentArgs['cloud-provider-name'].options"
              label="Cloud Provider"
            />
          </div>
        </div>

        <template v-if="showCloudConfigYaml">
          <div class="spacer" />

          <div class="col span-12">
            <h3>Cloud Provider Config</h3>
            <YamlEditor
              ref="cloudProvider"
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
            <div v-if="selectedVersion.serverArgs['secrets-encryption']">
              <Checkbox v-model="serverConfig['secrets-encryption']" :mode="mode" label="Encrypt Secrets" />
            </div>
            <div><Checkbox v-model="value.spec.enableNetworkPolicy" :mode="mode" label="Project Network Isolation" /></div>
            <div v-if="selectedVersion.agentArgs.selinux">
              <Checkbox v-model="agentConfig.selinux" :mode="mode" label="SELinux" />
            </div>
          </div>
        </div>
        <div class="row">
        </div>

        <div class="spacer" />

        <div v-if="selectedVersion.serverArgs.disable" class="row">
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

        <div class="spacer" />
      </Tab>

      <Tab name="networking" label-key="cluster.tabs.networking" :weight="9">
        <div v-if="selectedVersion.serverArgs['service-node-port-range']" class="row mb-20">
          <div class="col span-6">
            <LabeledInput v-model="serverConfig['service-node-port-range']" :mode="mode" label="NodePort Service Port Range" />
          </div>
        </div>

        <div class="row mb-20">
          <div v-if="selectedVersion.serverArgs['cluster-cidr']" class="col span-6">
            <LabeledInput v-model="serverConfig['cluster-cidr']" :mode="mode" label="Cluster CIDR" />
          </div>
          <div v-if="selectedVersion.serverArgs['service-cidr']" class="col span-6">
            <LabeledInput v-model="serverConfig['service-cidr']" :mode="mode" label="Service CIDR" />
          </div>
        </div>

        <div class="row mb-20">
          <div v-if="selectedVersion.serverArgs['cluster-dns']" class="col span-6">
            <LabeledInput v-model="serverConfig['cluster-dns']" :mode="mode" label="Cluster DNS" />
          </div>
          <div v-if="selectedVersion.serverArgs['cluster-domain']" class="col span-6">
            <LabeledInput v-model="serverConfig['cluster-domain']" :mode="mode" label="Cluster Domain" />
          </div>
        </div>

        <div v-if="selectedVersion.serverArgs['tls-san']" class="row mb-20">
          <div class="col span-6">
            <ArrayList :mode="mode" :value="serverConfig['tls-san']" title="TLS Alternate Names" />
          </div>
        </div>
      </Tab>

      <Tab name="upgrade" label-key="cluster.tabs.upgrade" :weight="8">
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

      <Tab name="advanced" label-key="cluster.tabs.advanced" :weight="-1" @active="$refs.additionalManifest.refresh()">
        <template v-if="selectedVersion.serverArgs.profile || selectedVersion.agentArgs.profile">
          <h3>CIS Profile Validation</h3>
          <div class="row">
            <div v-if="selectedVersion.serverArgs.profile" class="col span-6">
              <LabeledSelect
                v-model="serverConfig.profile"
                :mode="mode"
                :options="selectedVersion.serverArgs.profile.options"
                label="Server CIS Profile"
              />
            </div>
            <div v-if="selectedVersion.agentArgs.profile" class="col span-6">
              <LabeledSelect
                v-model="agentConfig.profile"
                :mode="mode"
                :options="selectedVersion.agentArgs.profile.options"
                label="Worker CIS Profile"
              />
            </div>
          </div>
        </template>

        <div class="spacer" />

        <div v-if="selectedVersion.agentArgs['protect-kernel-defaults']" class="row">
          <div class="col span-12">
            <Checkbox v-model="agentConfig['protect-kernel-defaults']" :mode="mode" label="Raise error if kernel parameters are different than the expected kubelet defaults." />
          </div>
        </div>

        <div class="spacer" />

        <div class="row">
          <div class="col span-6">
            <ArrayList v-if="selectedVersion.agentArgs['kubelet-arg']" :mode="mode" :value="agentConfig['kubelet-arg']" title="Additional Kubelet Args" class="mb-20" />
            <ArrayList v-if="selectedVersion.serverArgs['kube-controller-manager-arg']" :mode="mode" :value="serverConfig['kube-controller-manager-arg']" title="Additional Controller Manager Args" class="mb-20" />
          </div>
          <div class="col span-6">
            <ArrayList v-if="selectedVersion.serverArgs['kube-apiserver-arg']" :mode="mode" :value="serverConfig['kube-apiserver-arg']" title="Additional API Server Args" class="mb-20" />
            <ArrayList v-if="selectedVersion.serverArgs['kube-scheduler-arg']" :mode="mode" :value="serverConfig['kube-scheduler-arg']" title="Additional Scheduler Args" />
          </div>
        </div>

        <div class="spacer" />

        <div>
          <h3>
            Additional Manifest
            <i v-tooltip="'Additional Kubernetes Manifet YAML to be applied to the cluster on startup.'" class="icon icon-info" />
          </h3>
          <YamlEditor
            ref="additionalManifest"
            v-model="rkeConfig.additionalManifest"
            :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
            initial-yaml-values="# Additional Manifest YAML"
            class="yaml-editor"
          />
        </div>
      </Tab>

      <ACE v-model="value" :mode="mode" />
      <AgentEnv v-model="value" :mode="mode" />
      <Labels v-model="value" :mode="mode" />

      <Tab name="TBD" :weight="-2">
        <div><b>??</b></div>
        <ul>
          <li>Snapshot Backups</li>
          <li>Private Registry</li>
          <li>CNI MTU</li>
          <li>Ingress Default Backend</li>
        </ul>

        <div><b>ServerArgs:</b></div>
        <ul>
          <li>audit-policy-file</li>
          <li>etcd-disabled-snapshots</li>
          <li>etcd-expose-metrics</li>
          <li>etcd-snapshot-dir</li>
          <li>etcd-snapshot-name</li>
          <li>etcd-snapshot-retention</li>
          <li>etcd-snapshot-schedule-cron</li>
        </ul>
        <div><b>AgentArgs:</b></div>
        <ul>
          <li>audit-policy-file</li>
          <li>system-default-registry</li>
        </ul>
      </Tab>
    </Tabbed>

    <Banner v-if="multipleAgentConfigs" color="warning" label="This cluster has multiple workerConfigs. This form does only manages the first one; use the YAML editor to manage the full configuration." />
    <Banner v-if="unsupportedAgentConfig" color="warning" label="This cluster contains a workerConfig which this form does not fully support; use the YAML editor to manage the full configuration." />

    <template v-if="needCredential && !credentialId" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
