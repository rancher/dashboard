<script>
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import CopyCode from '@/components/CopyCode';
import Tab from '@/components/Tabbed/Tab';
import { allHash } from '@/utils/promise';
import { CAPI } from '@/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';

export default {
  components: {
    Loading,
    ResourceTabs,
    SortableTable,
    Tab,
    CopyCode
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
    const hash = await allHash({
      machineDeployments: this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT }),
      machines:           this.$store.dispatch('management/findAll', { type: CAPI.MACHINE })
    });

    if ( this.value.isImported ) {
      hash.clusterToken = await this.value.getOrCreateToken();
    }

    this.allMachines = hash.machines;
    this.clusterToken = hash.clusterToken;
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
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else v-model="value" :default-tab="defaultTab">
    <Tab name="node-pools" label-key="cluster.tabs.nodePools">
      <SortableTable
        :rows="machines"
        :headers="machineHeaders"
        :table-actions="false"
        :search="false"
        key-field="key"
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
    </Tab>
    <Tab v-if="clusterToken" name="registration" label="Registration">
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
    </Tab>
  </ResourceTabs>
</template>
