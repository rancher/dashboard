<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import Tabbed from '@/components/Tabbed';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';
import BadgeState from '@/components/BadgeState';
import Tab from '@/components/Tabbed/Tab';
import { MANAGEMENT, SECRET } from '@/config/types';
import { nlToBr } from '@/utils/string';
import { clone, set } from '@/utils/object';
import { sortable } from '@/utils/version';
import { sortBy } from '@/utils/sort';
import { DEFAULT_WORKSPACE } from '@/models/rancher.cattle.io.cluster';
import { _CREATE } from '@/config/query-params';
import { removeObject } from '@/utils/array';
import SelectCredential from './SelectCredential';
import NodePool from './NodePool';

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
    const setting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'k8s-version-to-images' });

    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });
    this.versions = Object.keys(JSON.parse(setting.value));

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }

    if ( !this.value.spec.kubernetesVersion ) {
      set(this.value.spec, 'kubernetesVersion', this.versionOptions[0].value);
    }

    if ( !this.value.spec.rkeConfig ) {
      set(this.value.spec, 'rkeConfig', {});
    }

    await this.initNodePools(this.value.spec.rkeConfig.nodePools);
    if ( this.mode === _CREATE && !this.nodePools.length ) {
      await this.addNodePool();
    }
  },

  data() {
    return {
      lastIdx:       0,
      allSecrets:     null,
      nodeComponent:  null,
      credentialId:   null,
      credential:     null,
      nodePools:      null,
    };
  },

  computed: {
    versionOptions() {
      try {
        const out = sortBy((this.versions || []).map((v) => {
          return {
            label: v,
            value: v,
            sort:  sortable(v)
          };
        }), 'sort:desc');

        // @TODO add existing version on edit if it's missing

        return out;
      } catch (err) {
        this.$store.dispatch('growl/fromError', { err });

        return [];
      }
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

      const schema = this.$store.getters['management/schemaFor'](`rancher.cattle.io.${ this.provider }config`);

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
            type: `rancher.cattle.io.${ pool.nodeConfig.kind.toLowerCase() }`,
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
          nodeConfig:       {
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
          entry.pool.nodeConfig.name = neu.metadata.name;
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
      return !!this.credentialId;
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

      <div class="clearfix">
        <h2 class="pull-left">
          Node Pools
        </h2>
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
        v-if="hasNodePools"
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

      <h2>Cluster Configuration</h2>
      <Tabbed :side-tabs="true">
        <Tab name="cluster" label="Basics" :weight="10">
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
        <Tab name="networking" label="Networking" :weight="9">
          <ul>
            <li>Network Provider</li>
            <li>Project Network Isolation</li>
            <li>CNI MTU</li>
            <li>Ingress Enabled</li>
            <li>Ingress Default Backend</li>
            <li>Node Port Range</li>
          </ul>
        </Tab>
        <Tab name="advanced" label="Advanced" :weight="8">
          <ul>
            <li>PSPs</li>
            <li>Docker Version</li>
            <li>Docker Root Dir</li>
            <li>Snapshot Backups</li>
            <li>Secrets Encryption</li>
            <li>CIS Scan Schedule</li>
            <li>Max Unavailable / Drain nodes</li>
            <li>Agent Env Vars</li>
            <li>Authorized Cluster Endpoint</li>
            <li>Private Registry</li>
          </ul>
        </Tab>
      </Tabbed>
    </div>

    <template v-if="needCredential && !credentialId" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
