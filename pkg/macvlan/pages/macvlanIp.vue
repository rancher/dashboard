<script>
import { mapGetters } from 'vuex';
import { SCHEMA } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import { MACVLAN_IP_PRODUCT_NAME } from '../config/macvlan-types';

const schema = {
  id:         'macvlanIp',
  type:       SCHEMA,
  attributes: {
    kind:       'MacvlanIp',
    namespaced: false
  },
  metadata: { name: 'macvlanIp' },
};

export default {
  name:       'ListMacvlanIp',
  components: { ResourceTable },
  data() {
    const perPage = this.getPerPage();

    return {
      resource: MACVLAN_IP_PRODUCT_NAME,
      schema,
      perPage,
    };
  },
  fetch() {
    const { currentCluster, perPage } = this;

    this.$store.dispatch('macvlan/loadMacvlanIps', {
      cluster: currentCluster?.id,
      query:   {
        labelSelector: { subnet: this.$route.params?.id },
        limit:         perPage
      }
    });
  },

  computed: {
    ...mapGetters(['currentCluster']),
    loading() {
      return !this.currentCluster;
    },
    rows() {
      return this.$store.getters['macvlan/macvlanIpList'].map((item) => {
        return Object.assign(item, {
          ipType:       item.metadata.labels['macvlan.panda.io/macvlanIpType'],
          workloadName: this.getWorkloadName(item.metadata.name, item.metadata.labels['workload.user.cattle.io/workloadselector']),
          projectId:    item.metadata.labels['field.cattle.io/projectId'],
          nameDisplay:  item.metadata.name,
        });
      });
    },
    headers() {
      return [
        {
          name:     'name',
          labelKey: 'tableHeaders.name',
          value:    'metadata.name',
          sort:     'metadata.name',
        },
        {
          name:     'subnet',
          labelKey: 'macvlan.macvlanIp.tableHeaders.subnet',
          value:    'spec.subnet',
          sort:     'spec.subnet',
        },
        {
          name:     'namespace',
          labelKey: 'tableHeaders.namespace',
          value:    'metadata.namespace',
          sort:     'metadata.namespace',
        },
        {
          name:     'address',
          labelKey: 'macvlan.macvlanIp.tableHeaders.address',
          value:    'spec.cidr',
          sort:     'spec.cidr',
        },
        {
          name:     'ipType',
          labelKey: 'macvlan.macvlanIp.tableHeaders.ipType',
          value:    'ipType',
          sort:     'ipType',
          width:    70,
        },
        {
          name:     'mac',
          labelKey: 'macvlan.macvlanIp.tableHeaders.mac',
          value:    'spec.mac',
          sort:     'spec.mac',
        },
        {
          name:     'podId',
          labelKey: 'macvlan.macvlanIp.tableHeaders.podId',
          value:    'spec.podId',
          sort:     'spec.podId',
        },
        {
          name:     'workload',
          labelKey: 'macvlan.macvlanIp.tableHeaders.workload',
          value:    'workloadName',
          sort:     'workloadName',
        },
      ];
    },
  },
  methods: {
    getPerPage() {
      // perPage can not change while the list is displayed
      let out = this.rowsPerPage || 0;

      if ( out <= 0 ) {
        out = parseInt(this.$store.getters['prefs/get'](ROWS_PER_PAGE), 10) || 0;
      }

      // This should ideally never happen, but the preference value could be invalid, so return something...
      if ( out <= 0 ) {
        out = 10;
      }

      return out;
    },
    getWorkloadName(name, workloadselector) {
      const nameArr = name.split('-');
      const workloadselectorArr = workloadselector.split('-');
      let workloadArr = [];
      const workloadArrName = [];
      const workloadArrSelect = [];

      for (let i = 0; i < workloadselectorArr.length; i++) {
        if (nameArr[i] === undefined) {
          return workloadArr.length ? workloadArr.join('-') : '';
        }
        workloadArrName.push(nameArr[i]);
        workloadArrSelect.unshift(workloadselectorArr[workloadselectorArr.length - i - 1]);

        if (workloadArrName.join('-') === workloadArrSelect.join('-')) {
          workloadArr = JSON.parse(JSON.stringify(workloadArrName));
        }
      }

      return workloadArr.length ? workloadArr.join('-') : '';
    }
  },
};
</script>
<template>
  <div>
    <div class="title">
      <h1 class="mt-10">
        Macvlan IPs
      </h1>
    </div>
    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      :rows="rows"
      :groupable="false"
      :schema="schema"
      key-field="_key"
      :loading="loading"
      :table-actions="false"
      :row-actions="false"
      v-on="$listeners"
    >
      <template #cell:ipType="{row}">
        <span>{{ t(`macvlan.macvlanIp.ipType.${row.ipType}`) }}</span>
      </template>
    </ResourceTable>
  </div>
</template>
