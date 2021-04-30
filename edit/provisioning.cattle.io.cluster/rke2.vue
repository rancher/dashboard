<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';
import BadgeState from '@/components/BadgeState';
import { SECRET } from '@/config/types';
import { nlToBr } from '@/utils/string';
import { clone, set } from '@/utils/object';
import { sortable } from '@/utils/version';
import { sortBy } from '@/utils/sort';
import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';
import { _CREATE } from '@/config/query-params';
import { findBy, removeObject } from '@/utils/array';
import SelectCredential from './SelectCredential';
import NodePool from './NodePool';
import Labels from './Labels';
import AgentEnv from './AgentEnv';

export default {
  components: {
    NameNsDescription,
    CruResource,
    Loading,
    Tabbed,
    Tab,
    SelectCredential,
    LabeledSelect,
    NodePool,
    BadgeState,
    AgentEnv,
    Labels,
    LabeledInput,
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

    if ( !this.value.spec.rkeConfig?.controlPlaneConfig ) {
      set(this.value.spec, 'rkeConfig.controlPlaneConfig', {});
    }

    this.controlConfig = this.value.spec.rkeConfig.controlPlaneConfig;

    if ( !this.value.spec.rkeConfig?.workerConfig?.length ) {
      set(this.value.spec, 'rkeConfig.workerConfig', [{}]);
    }

    this.workerConfig = this.value.spec.rkeConfig.workerConfig[0];
    this.workerConfigSupported = this.value.spec.rkeConfig.workerConfig.length === 1 && !this.workerConfig.machineLabelSelector;

    if ( this.selectedVersion ) {
      for ( const k in this.selectedVersion.serverArgs ) {
        set(this.controlConfig, k, this.controlConfig[k] || this.selectedVersion.serverArgs[k].default || null);
      }
      for ( const k in this.selectedVersion.agentArgs ) {
        set(this.workerConfig, k, this.workerConfig[k] || this.selectedVersion.agentArgs[k].default || null);
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
      nodeComponent:         null,
      credentialId:          null,
      credential:            null,
      nodePools:             null,
      rke2Versions:          null,
      k3sVersions:           null,
      workerConfigSupported: null,
      workerConfig:          null,
      controlConfig:         null,
    };
  },

  computed: {
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

    selectedVersion() {
      const str = this.value.spec.kubernetesVersion;

      if ( !str ) {
        return;
      }

      return findBy(this.versionOptions, 'value', str);
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
    }
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
            type: `provisioning.cattle.io.${ pool.nodeConfig.kind.toLowerCase() }`,
            id:   `${ this.value.metadata.namespace }/${ pool.nodeConfig.name }`,
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
          <div class="pull-right">
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
          :show-tabs-add-remove="true"
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
      <Tab name="basic" label-key="cluster.tabs.basic" :weight="10">
        <LabeledSelect
          v-model="value.spec.kubernetesVersion"
          :options="versionOptions"
          label-key="cluster.kubernetesVersion.label"
        />
        <ul>
          <li>Cloud Provider</li>
          <li>Windows Support</li>
        </ul>
      </Tab>
      <Tab name="server" label="Server Args" :weight="10">
        <LabeledInput v-model="controlConfig['cluster-cidr']" label="Cluster CIDR" />
        <LabeledInput v-model="controlConfig['service-cidr']" label="Service CIDR" />
        <LabeledInput v-model="controlConfig['cluster-dns']" label="Cluster DNS" />
        <LabeledInput v-model="controlConfig['cluster-domain']" label="Cluster Domain" />
        <!-- :options="selectedVersion.serverArgs.cni.options" -->
        <LabeledSelect
          v-model="controlConfig.cni"
          :options="[]"
          label="Container Networking Interface Provider"
        />
        <ul>
          <li>audit-policy-file</li>
          <li>disable: <span v-if="false">{{ selectedVersion.serverArgs.disable.options.join(", ") }}</span></li>
          <li>etcd-disabled-snapshots</li>
          <li>etcd-expose-metrics</li>
          <li>etcd-snapshot-dir</li>
          <li>etcd-snapshot-name</li>
          <li>etcd-snapshot-retention</li>
          <li>etcd-snapshot-schedule-cron</li>
          <li>kube-apiserver-arg[]</li>
          <li>kube-controller-manager-arg[]</li>
          <li>kube-scheduler-arg[]</li>
          <li>profile: <span v-if="false">{{ selectedVersion.profile.options.join(", ") }}</span></li>
          <li>secrets-encryption</li>
          <li>tls-san[]</li>
        </ul>
      </Tab>

      <Tab name="networking" label-key="cluster.tabs.networking" :weight="9">
        <ul>
          <li>Network Provider</li>
          <li>Project Network Isolation</li>
          <li>CNI MTU</li>
          <li>Ingress Enabled</li>
          <li>Ingress Default Backend</li>
          <li>Node Port Range</li>
        </ul>
      </Tab>
      <Tab name="advanced" label-key="cluster.tabs.advanced" :weight="8">
        <ul>
          <li>PSPs</li>
          <li>Docker Version</li>
          <li>Docker Root Dir</li>
          <li>Snapshot Backups</li>
          <li>Secrets Encryption</li>
          <li>CIS Scan Schedule</li>
          <li>Max Unavailable / Drain nodes</li>
          <li>Authorized Cluster Endpoint</li>
          <li>Private Registry</li>
        </ul>
      </Tab>
      <AgentEnv v-model="value" :mode="mode" />
      <Labels v-model="value" :mode="mode" />
    </Tabbed>

    <template v-if="needCredential && !credentialId" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
