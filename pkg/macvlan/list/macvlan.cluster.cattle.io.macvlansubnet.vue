<script>
import { mapGetters } from 'vuex';
import { CATALOG } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { MACVLAN_PRODUCT_NAME, MACVLAN_CHARTS } from '../config/macvlan-types';

export default {
  name:       'ListMacvlan',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
    resource: {
      type:     String,
      required: true,
    },
  },
  async fetch() {
    try {
      this.existing = await this.$store.dispatch('cluster/find', {
        type: CATALOG.APP,
        id:   `${ MACVLAN_CHARTS.NAMESPACE }/${ MACVLAN_CHARTS.APP_NAME }`,
      });
    } catch (e) {
      this.$router.push({ name: `${ MACVLAN_PRODUCT_NAME }-c-cluster-resource-install` });
      this.existing = null;
    }

    await this.$fetchType(this.resource);
  },

  data() {
    return { existing: null };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    headers() {
      return [
        {
          name:      'name',
          labelKey:  'tableHeaders.name',
          value:     'nameDisplay',
          sort:      'nameDisplay',
          width:     120,
          formatter: 'MacvlanName'
        },
        {
          name:      'project',
          labelKey:  'tableHeaders.project',
          value:     'project',
          width:     100,
          formatter: 'MacvlanProject'
        },
        {
          name:     'master',
          labelKey: 'macvlan.tableHeaders.master',
          value:    'spec.master',
          width:    120
        },
        {
          name:     'vlan',
          labelKey: 'macvlan.tableHeaders.vlan',
          value:    'spec.vlan',
          width:    70
        },
        {
          name:     'cidr',
          labelKey: 'macvlan.tableHeaders.cidr',
          value:    'spec.cidr',
          width:    120
        },
        {
          name:      'ipRange',
          labelKey:  'macvlan.tableHeaders.ipRange',
          value:     'spec.ranges',
          width:     260,
          formatter: 'MacvlanIpRange'
        },
        {
          name:      'customRoute',
          labelKey:  'macvlan.tableHeaders.route',
          value:     'spec.routes',
          width:     150,
          formatter: 'MacvlanRoute'
        },
        {
          name:     'gateway',
          labelKey: 'macvlan.tableHeaders.gateway',
          value:    'spec.gateway',
          width:    120
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
  }
};
</script>
<template>
  <div>
    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      :rows="rows"
      :groupable="false"
      :schema="schema"
      key-field="_key"
      :loading="loading"
      v-on="$listeners"
    />
  </div>
</template>
