<script>
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import ResourceTable from '@shell/components/ResourceTable';

import { HCI } from '../types';
import { SCHEMA } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { STATE, AGE, NAME, NAMESPACE } from '@shell/config/table-headers';

const schema = {
  id:         HCI.VM_SNAPSHOT,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.VM_SNAPSHOT,
    namespaced: true
  },
  metadata: { name: HCI.VM_SNAPSHOT },
};

export default {
  name:       'HarvesterListVMSnapshot',
  components: {
    ResourceTable, Loading, Masthead
  },

  async fetch() {
    const hash = await allHash({
      vms:      this.$store.dispatch('harvester/findAll', { type: HCI.VM }),
      rows:     this.$store.dispatch('harvester/findAll', { type: HCI.BACKUP }),
    });

    const schema = this.$store.getters['harvester/schemaFor'](HCI.BACKUP);

    if (!schema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: HCI.VM_SNAPSHOT, isCreatable: false });
    }

    this.rows = hash.rows;
  },

  data() {
    const params = { ...this.$route.params };

    const resource = params.resource;

    return {
      rows: [],
      resource,
    };
  },

  computed: {
    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:      'targetVM',
          labelKey:  'tableHeaders.targetVm',
          value:     'attachVM',
          align:     'left',
          formatter: 'AttachVMWithName'
        },
        {
          name:      'readyToUse',
          labelKey:  'tableHeaders.readyToUse',
          value:     'status.readyToUse',
          align:     'left',
          formatter: 'Checked',
        },
        AGE
      ];
    },

    schema() {
      return schema;
    },

    typeDisplay() {
      return this.$store.getters['type-map/labelFor'](schema, 99);
    },

    filterdRows() {
      return this.rows.filter(R => R.spec?.type !== 'backup');
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="null"
      :resource="resource"
      :type-display="typeDisplay"
      :create-button-label="t('harvester.vmSnapshot.createText')"
    />

    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      :groupable="true"
      :rows="filterdRows"
      :schema="schema"
      key-field="_key"
      default-sort-by="age"
      v-on="$listeners"
    >
      <template #col:name="{row}">
        <td>
          <span>
            <n-link
              v-if="row.status && row.status.source"
              :to="row.detailLocation"
            >
              {{ row.nameDisplay }}
            </n-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </span>
        </td>
      </template>
    </resourcetable>
  </div>
</template>
