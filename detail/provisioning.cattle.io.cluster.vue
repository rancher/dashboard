<script>
import Loading from '@/components/Loading';
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
    const hash = {
      machineDeployments: this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT }),
      machines:           this.$store.dispatch('management/findAll', { type: CAPI.MACHINE })
    };

    if ( this.value.isImported || this.value.isCustom ) {
      hash.clusterToken = this.value.getOrCreateToken();
    } else if ( !this.value.isRke2 ) {
      // These are needed to resolve references in the mgmt cluster -> node pool -> node template to figure out what provider the cluster is using
      // so that the edit iframe for ember pages can go to the right place.
      hash.rke1NodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      hash.rke1NodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.value.isRke1 && this.$store.getters['isRancher'] ) {
      hash.etcdBackups = this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP });
    }

    const res = await allHash(hash);

    this.allMachines = res.machines;
    this.clusterToken = res.clusterToken;
    this.etcdBackups = res.etcdBackups;
  },

  data() {
    return {
      allMachines:  null,
      clusterToken: null,
      etcdBackups:  null,
    };
  },

  computed: {
    defaultTab() {
      if ( this.clusterToken && !this.machines.length ) {
        return 'registration';
      }

      return 'node-pools';
    },

    machines() {
      return (this.allMachines || []).filter((x) => {
        if ( x.metadata?.namespace !== this.value.metadata.namespace ) {
          return false;
        }

        return x.spec?.clusterName === this.value.metadata.name;
      });
    },

    machineHeaders() {
      return [
        STATE,
        NAME_COL,
        ROLES,
        {
          name:      'node-name',
          labelKey:  'tableHeaders.machineNodeName',
          sort:      'status.nodeRef.name',
          value:     'status.nodeRef.name',
        },
        AGE,
      ];
    },

    showRke1Pools() {
      return this.value.mgmt?.machinePools?.length > 0;
    },

    showSnapshots() {
      return this.value.isRke2 || this.value.isRke1;
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
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else v-model="value" :default-tab="defaultTab">
    <Tab v-if="value.isRke2 || showRke1Pools" name="node-pools" label-key="cluster.tabs.machinePools" :weight="3">
      <SortableTable
        v-if="value.isRke2"
        :rows="machines"
        :headers="machineHeaders"
        :table-actions="false"
        :search="false"
        default-sort-by="name"
        group-by="poolId"
        group-ref="pool"
        :group-sort="['pool.nameDisplay']"
      >
        <template #group-by="{group}">
          <div v-if="group && group.ref" class="group-tab" v-html="group.ref.groupByPoolShortLabel" />
          <div v-else v-trim-whitespace class="group-tab">
            Machine Pool: None
          </div>
        </template>
        <template #cell:node-name="cell">
          <span v-if="cell.value && value.mgmt">
            <n-link :to="{name: 'c-cluster-product-resource-id', params: { cluster: value.mgmt.id, product: 'explorer', resource: 'node', id: cell.value}}">
              {{ cell.value }}
            </n-link>
          </span>
          <span v-else class="text-muted">&mdash;</span>
        </template>
      </SortableTable>
      <div v-else-if="showRke1Pools">
        {{ JSON.stringify(value.mgmt.machinePools) }}
      </div>
    </Tab>

    <Tab v-if="clusterToken" name="registration" label="Registration" :weight="2">
      <CustomCommand v-if="value.isCustom" :cluster-token="clusterToken" />
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
          <AsyncButton mode="snapshot" class="btn role-primary" @click="takeSnapshot" />
        </template>
      </SortableTable>
    </Tab>
  </ResourceTabs>
</template>
