<script>
import ResourceTable from '@shell/components/ResourceTable';
import { HCI } from '../../../types';
import { STATE, NAME } from '@shell/config/table-headers';
export default {
  name: 'ListPciDevices',

  components: { ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },

  },
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.PCI_CLAIM });
  },

  data() {
    const isSingleProduct = this.$store.getters['isSingleProduct'];
    const headers = [
      { ...STATE },
      NAME,
      {
        name:          'description',
        labelKey:      'tableHeaders.description',
        value:         'status.description',
        sort:     ['status.description']
      },
      {
        name:          'node',
        labelKey:      'tableHeaders.node',
        value:         'status.nodeName',
        sort:     ['status.nodeName']
      },
      {
        name:  'address',
        label: 'Address',
        value: 'status.address',
        sort:  ['status.address']
      },
      {
        name:  'vendorid',
        label: 'Vendor ID',
        value: 'status.vendorId',
        sort:  ['status.vendorId', 'status.deviceId']
      },
      {
        name:  'deviceid',
        label: 'Device ID',
        value: 'status.deviceId',
        sort:  ['status.deviceId', 'status.vendorId']
      },

    ];

    if (!isSingleProduct) {
      headers.push( {
        name:  'claimed',
        label: 'Claimed By',
        value: 'passthroughClaim.userName',
        sort:  ['passthroughClaim.userName'],

      });
    }

    return { headers };
  },

  methods: {
    enableGroup(rows = []) {
      rows.forEach((row) => {
        if (!row.passthroughClaim) {
          row.enablePassthrough();
        }
      });
    },
    disableGroup(rows = []) {
      rows.forEach((row) => {
        if (row.passthroughClaim) {
          row.disablePassthrough();
        }
      });
    },
    groupIsAllEnabled(rows = []) {
      return !rows.find(device => !device.passthroughClaim);
    }
  }
};
</script>

<template>
  <ResourceTable :headers="headers" :schema="schema" :rows="rows">
    <template #group-by="{group}">
      <div :ref="group.key" v-trim-whitespace class="group-tab">
        <button v-if="groupIsAllEnabled(group.rows)" type="button" class="btn btn-sm role-secondary mr-5" @click="e=>{disableGroup(group.rows); e.target.blur()}">
          {{ t('harvester.pci.disableGroup') }}
        </button>
        <button v-else type="button" class="btn btn-sm role-secondary mr-5" @click="e=>{enableGroup(group.rows); e.target.blur()}">
          {{ t('harvester.pci.enableGroup') }}
        </button>
        <span v-html="group.key" />
      </div>
    </template>
    <template #cell:claimed="{row}">
      <span v-if="row.isEnabled">{{ row.claimedBy }}</span>
      <span v-else class="text-muted">&mdash;</span>
    </template>
  </ResourceTable>
</template>
