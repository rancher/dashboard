<script>
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
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

    this.allMachines = hash.machines;
  },

  data() {
    return { allMachines: null };
  },

  computed: {
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
  <ResourceTabs v-else v-model="value">
    <Tab name="node-pools" label="Nodes">
      <SortableTable
        :rows="machines"
        :headers="machineHeaders"
        :table-actions="false"
        key-field="key"
        default-sort-by="name"
        group-by="poolId"
        group-ref="pool"
        group-sort="pool.nameDisplay"
      >
        <template #group-by="{group}">
          <div v-if="group && group.ref" class="group-tab" v-html="group.ref.groupByPoolLabel" />
          <div v-else v-trim-whitespace class="group-tab">
            Node Pool: None
          </div>
        </template>
      </SortableTable>
    </Tab>
  </ResourceTabs>
</template>
