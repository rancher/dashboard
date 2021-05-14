<script>
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import CopyCode from '@/components/CopyCode';
import Tab from '@/components/Tabbed/Tab';
import { allHash } from '@/utils/promise';
import { CAPI, MANAGEMENT } from '@/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import CustomCommand from '@/edit/provisioning.cattle.io.cluster/CustomCommand';

export default {
  components: {
    Loading,
    ResourceTabs,
    SortableTable,
    Tab,
    CopyCode,
    CustomCommand
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
      hash.nodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    const res = await allHash(hash);

    this.allMachines = res.machines;
    this.clusterToken = res.clusterToken;
  },

  data() {
    return {
      allMachines:  null,
      clusterToken: null
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
        AGE,
      ];
    },

    showRke1Pools() {
      return this.value.mgmt?.nodePools?.length > 0;
    },

    showSnapshots() {
      return true;
    }
  },

  mounted() {
    window.c = this;
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else v-model="value" :default-tab="defaultTab">
    <Tab v-if="value.isRke2 || showRke1Pools" name="node-pools" label-key="cluster.tabs.nodePools" :weight="3">
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
            Node Pool: None
          </div>
        </template>
      </SortableTable>
      <div v-else>
        RKE 1 node pools...
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

    <Tab v-if="showSnapshots" name="snapshots" label="etcd Snapshots" :weight="1">
      etcd snapshots...
    </Tab>
  </ResourceTabs>
</template>
