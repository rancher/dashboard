<script>
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import CopyCode from '@/components/CopyCode';
import Tab from '@/components/Tabbed/Tab';
import { allHash } from '@/utils/promise';
import { CAPI, MANAGEMENT, NORMAN } from '@/config/types';
import {
  STATE, NAME as NAME_COL, AGE, AGE_NORMAN, STATE_NORMAN, ROLES,
} from '@/config/table-headers';
import CustomCommand from '@/edit/provisioning.cattle.io.cluster/CustomCommand';
import AsyncButton from '@/components/AsyncButton.vue';

export default {
  components: {
    Loading,
    ResourceTable,
    ResourceTabs,
    SortableTable,
    Tab,
    CopyCode,
    CustomCommand,
    AsyncButton,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    await this.value.waitForProvisioner();
    const hash = {};

    if (this.value.isImported || this.value.isRke1) {
      // Cluster isn't compatible with machines/machineDeployments, show nodes/node pools instead

      hash.allNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      hash.allNodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    } else {
      hash.machineDeployments = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT });
      hash.machines = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if (this.value.isImported || this.value.isCustom) {
      hash.clusterToken = this.value.getOrCreateToken();
    } else if (!this.value.isRke2 ) {
      // These are needed to resolve references in the mgmt cluster -> node pool -> node template to figure out what provider the cluster is using
      // so that the edit iframe for ember pages can go to the right place.
      hash.rke1NodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      hash.rke1NodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.value.isRke1 && this.$store.getters['isRancher'] ) {
      hash.etcdBackups = this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP });
    }

    const res = await allHash(hash);

    this.allMachines = res.machines || [];
    this.allMachineDeployments = res.machineDeployments || [];

    this.allNodes = res.allNodes || [];
    this.allNodePools = res.allNodePools || [];

    this.clusterToken = res.clusterToken;
    this.etcdBackups = res.etcdBackups;

    const machineDeloymentTemplateType = res.machineDeployments?.[0]?.templateType;

    if (machineDeloymentTemplateType) {
      await this.$store.dispatch('management/findAll', { type: machineDeloymentTemplateType });
    }
  },

  data() {
    return {
      allMachines:           [],
      allMachineDeployments: [],

      mgmtNodeSchema:        this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE),
      machineSchema:  this.$store.getters[`management/schemaFor`]( CAPI.MACHINE),

      allNodes:     [],
      allNodePools: [],

      clusterToken: null,
      etcdBackups:  null,

    };
  },

  computed: {
    defaultTab() {
      if (this.showRegistration && !this.machines?.length) {
        return 'registration';
      }

      if (this.showMachines) {
        return 'machine-pools';
      }

      if (this.showNodes) {
        return 'node-pools';
      }

      return '';
    },

    fakeMachines() {
      // When a deployment has no machines it's not shown.... so add a fake machine to it
      // This is a catch all scenario seen in older node pool world but not deployments
      const emptyDeployments = this.allMachineDeployments.filter(x => x.spec.clusterName === this.value.metadata.name && x.spec.replicas === 0);

      return emptyDeployments.map(d => ({
        poolId:       d.id,
        mainRowKey: 'isFake',
        pool:       d,
      }));
    },

    machines() {
      const machines = this.allMachines.filter((x) => {
        if ( x.metadata?.namespace !== this.value.metadata.namespace ) {
          return false;
        }

        return x.spec?.clusterName === this.value.metadata.name;
      });

      return [...machines, ...this.fakeMachines];
    },

    nodes() {
      const nodes = this.allNodes.filter(x => x.mgmtClusterId === this.value.mgmtClusterId);

      return [...nodes, ...this.fakeNodes];
    },

    fakeNodes() {
      // When a pool has no nodes it's not shown.... so add a fake node to it
      const emptyNodePools = this.allNodePools.filter(x => x.spec.clusterName === this.value.mgmtClusterId && x.spec.quantity === 0);

      return emptyNodePools.map(np => ({
        spec:       { nodePoolName: np.id.replace('/', ':') },
        mainRowKey: 'isFake',
        pool:       np,
      }));
    },

    showMachines() {
      return this.value.isRke2 || !!this.machines.length;
    },

    showNodes() {
      return !this.showMachines && !!this.nodes.length;
    },

    showSnapshots() {
      return this.value.isRke2 || this.value.isRke1;
    },

    machineHeaders() {
      return [
        STATE,
        NAME_COL,
        {
          name:          'node-name',
          labelKey:      'tableHeaders.machineNodeName',
          sort:          'status.nodeRef.name',
          value:         'status.nodeRef.name',
          formatter:     'LinkDetail',
          formatterOpts: { reference: 'kubeNodeDetailLocation' }
        },
        ROLES,
        AGE,
      ];
    },

    mgmtNodeSchemaHeaders() {
      return [
        STATE, NAME_COL,
        {
          name:          'node-name',
          labelKey:      'tableHeaders.machineNodeName',
          sort:          'kubeNodeName',
          value:         'kubeNodeName',
          formatter:     'LinkDetail',
          formatterOpts: { reference: 'kubeNodeDetailLocation' }
        },
        ROLES,
        AGE
      ];
    },

    rke1Snapshots() {
      const mgmtId = this.value.mgmt?.id;

      if ( !mgmtId ) {
        return [];
      }

      return (this.etcdBackups || []).filter(x => x.clusterId === mgmtId);
    },

    rke2Snapshots() {
      return this.value.etcdSnapshots;
    },

    rke1SnapshotHeaders() {
      return [
        STATE_NORMAN,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
        },
        {
          name:     'version',
          labelKey: 'tableHeaders.version',
          value:    'status.kubernetesVersion',
          sort:     'status.kubernetesVersion',
          width:    150,
        },
        { ...AGE_NORMAN, canBeVariable: true },
        {
          name:      'manual',
          labelKey:  'tableHeaders.manual',
          value:     'manual',
          formatter: 'Checked',
          sort:      ['manual'],
          align:     'center',
          width:     50,
        },
      ];
    },

    rke2SnapshotHeaders() {
      return [
        STATE_NORMAN,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
        },
        {
          name:      'size',
          labelKey:  'tableHeaders.size',
          value:     'size',
          sort:      'size',
          formatter: 'Si',
          width:     150,
        },
        {
          ...AGE,
          value:         'createdAt',
          sort:          'createdAt:desc',
          canBeVariable: true
        },
      ];
    },

    showRegistration() {
      if ( !this.clusterToken ) {
        return false;
      }

      if ( this.value.isImported ) {
        return !this.value.mgmt?.isReady;
      }

      if ( this.value.isCustom ) {
        return true;
      }

      return false;
    },

    isClusterReady() {
      return this.value.mgmt?.isReady;
    }
  },

  watch: {
    showNodes(neu) {
      if (neu) {
        this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
      }
    }
  },

  mounted() {
    window.c = this;
  },

  methods: {
    async takeSnapshot(btnCb) {
      try {
        await this.value.takeSnapshot();

        // Give the change event some time to show up
        setTimeout(() => {
          btnCb(true);
        }, 1000);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error creating snapshot', err });
        btnCb(false);
      }
    },

    showPoolAction(event, pool) {
      this.$store.commit(`action-menu/show`, {
        resources: [pool],
        elem:      event.target
      });
    },
    showPoolActionButton(pool) {
      return !!pool.availableActions?.length;
    },

  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else v-model="value" :default-tab="defaultTab">
    <Tab v-if="showMachines" name="machine-pools" :label-key="value.isCustom ? 'cluster.tabs.machines' : 'cluster.tabs.machinePools'" :weight="3">
      <ResourceTable
        :rows="machines"
        :schema="machineSchema"
        :headers="machineHeaders"
        default-sort-by="name"
        :groupable="false"
        :group-by="value.isCustom ? null : 'poolId'"
        group-ref="pool"
        :group-sort="['pool.nameDisplay']"
      >
        <template #main-row:isFake="{fullColspan}">
          <tr class="main-row">
            <td :colspan="fullColspan" class="no-entries">
              {{ t('node.list.noNodes') }}
            </td>
          </tr>
        </template>

        <template #group-by="{group}">
          <div class="pool-row" :class="{'has-description':group.ref && group.ref.template}">
            <div v-trim-whitespace class="group-tab">
              <div v-if="group && group.ref" v-html="group.ref.groupByPoolShortLabel" />
              <div v-else v-html="t('resourceTable.groupLabel.notInANodePool')">
              </div>
              <div v-if="group.ref && group.ref.template" class="description text-muted text-small">
                {{ group.ref.providerDisplay }} &ndash;  {{ group.ref.providerLocation }} / {{ group.ref.providerSize }} ({{ group.ref.providerName }})
              </div>
            </div>
            <div v-if="group.ref" class="right mr-45">
              <template v-if="value.hasLink('update')">
                <button v-tooltip="t('node.list.scaleDown')" :disabled="group.ref.spec.replicas < 2" type="button" class="btn btn-sm role-secondary" @click="group.ref.scalePool(-1)">
                  <i class="icon icon-sm icon-minus" />
                </button>
                <button v-tooltip="t('node.list.scaleUp')" type="button" class="btn btn-sm role-secondary ml-10" @click="group.ref.scalePool(1)">
                  <i class="icon icon-sm icon-plus" />
                </button>
              </template>
            </div>
          </div>
        </template>
      </ResourceTable>
    </Tab>
    <Tab v-else-if="showNodes" name="node-pools" :label-key="value.isCustom ? 'cluster.tabs.nodes' : 'cluster.tabs.nodePools'" :weight="3">
      <ResourceTable
        :schema="mgmtNodeSchema"
        :headers="mgmtNodeSchemaHeaders"
        :rows="nodes"
        :groupable="false"
        :group-by="value.isCustom ? null : 'spec.nodePoolName'"
        group-ref="pool"
        :group-sort="['pool.nameDisplay']"
      >
        <template #main-row:isFake="{fullColspan}">
          <tr class="main-row">
            <td :colspan="fullColspan" class="no-entries">
              {{ t('node.list.noNodes') }}
            </td>
          </tr>
        </template>

        <template #group-by="{group}">
          <div class="pool-row" :class="{'has-description':group.ref && group.ref.nodeTemplate}">
            <div v-trim-whitespace class="group-tab">
              <div v-if="group.ref" v-html="t('resourceTable.groupLabel.nodePool', { name: group.ref.spec.hostnamePrefix, count: group.rows.length}, true)">
              </div>
              <div v-else v-html="t('resourceTable.groupLabel.notInANodePool')">
              </div>
              <div v-if="group.ref && group.ref.nodeTemplate" class="description text-muted text-small">
                {{ group.ref.providerDisplay }} &ndash;  {{ group.ref.providerLocation }} / {{ group.ref.providerSize }} ({{ group.ref.providerName }})
              </div>
            </div>
            <div v-if="group.ref" class="right">
              <template v-if="group.ref.hasLink('update')">
                <button v-tooltip="t('node.list.scaleDown')" :disabled="group.ref.spec.quantity < 2" type="button" class="btn btn-sm role-secondary" @click="group.ref.scalePool(-1)">
                  <i class="icon icon-sm icon-minus" />
                </button>
                <button v-tooltip="t('node.list.scaleUp')" type="button" class="btn btn-sm role-secondary ml-10" @click="group.ref.scalePool(1)">
                  <i class="icon icon-sm icon-plus" />
                </button>
              </template>

              <button type="button" class="project-action btn btn-sm role-multi-action actions mr-5 ml-15" :class="{invisible: !showPoolActionButton(group.ref)}" @click="showPoolAction($event, group.ref)">
                <i class="icon icon-actions" />
              </button>
            </div>
          </div>
        </template>
      </ResourceTable>
    </Tab>

    <Tab v-if="showRegistration" name="registration" label="Registration" :weight="2">
      <CustomCommand v-if="value.isCustom" :cluster-token="clusterToken" :cluster="value" />
      <template v-else>
        <h4 v-html="t('cluster.import.commandInstructions', null, true)" />
        <CopyCode class="m-10 p-10">
          {{ clusterToken.command }}
        </CopyCode>

        <h4 class="mt-10" v-html="t('cluster.import.commandInstructionsInsecure', null, true)" />
        <CopyCode class="m-10 p-10">
          {{ clusterToken.insecureCommand }}
        </CopyCode>

        <h4 class="mt-10" v-html="t('cluster.import.clusterRoleBindingInstructions', null, true)" />
        <CopyCode class="m-10 p-10">
          {{ t('cluster.import.clusterRoleBindingCommand', null, true) }}
        </CopyCode>
      </template>
    </Tab>

    <Tab v-if="showSnapshots" name="snapshots" label="Snapshots" :weight="1">
      <SortableTable
        :headers="value.isRke1 ? rke1SnapshotHeaders : rke2SnapshotHeaders"
        default-sort-by="age"
        :table-actions="value.isRke1"
        :rows="value.isRke1 ? rke1Snapshots : rke2Snapshots"
        :search="false"
      >
        <template #header-right>
          <AsyncButton
            mode="snapshot"
            class="btn role-primary"
            :disabled="!isClusterReady"
            @click="takeSnapshot"
          />
        </template>
      </SortableTable>
    </Tab>
  </ResourceTabs>
</template>

<style lang='scss' scoped>
.main-row .no-entries {
  text-align: center;
}
.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.has-description {
    .group-tab {
      &, &::after {
          height: 50px;
      }

      &::after {
          right: -20px;
      }

      .description {
          margin-top: -20px;
      }
    }
  }
}

</style>
