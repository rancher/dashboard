<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { NORMAN, SECRET } from '@shell/config/types';
import {
  AGE_NORMAN,
  DESCRIPTION,
  ID_UNLINKED,
  NAME_UNLINKED,
} from '@shell/config/table-headers';
import { allHash } from 'utils/promise';

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead,
  },

  async fetch() {
    const promises = {};

    if (this.$store.getters['management/schemaFor'](SECRET) && !this.$store.getters[`cluster/paginationEnabled`](SECRET)) {
      // Having secrets allows showing the public portion of more types but not all users can see them.
      promises.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }
    promises.allCredentials = this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

    const hash = await allHash(promises);

    this.allCredentials = hash.allCredentials;
  },

  data() {
    return {
      allCredentials: null,
      resource:       NORMAN.CLOUD_CREDENTIAL,
      schema:         this.$store.getters['rancher/schemaFor'](NORMAN.CLOUD_CREDENTIAL),
      groupOptions:   [{
        tooltipKey: 'resourceTable.groupBy.none',
        icon:       'icon-list-flat',
        value:      'none',
      }, {
        tooltipKey: 'manager.cloudCredentials.list.groupBy.provider',
        hideColumn: 'provider',
        icon:       'icon-folder',
        value:      'providerDisplay',
        field:      'providerDisplay',
      }],
    };
  },

  computed: {
    rows() {
      return this.allCredentials || [];
    },

    headers() {
      return [
        ID_UNLINKED,
        NAME_UNLINKED,
        {
          name:      'apikey',
          labelKey:  'tableHeaders.apikey',
          value:     'publicData',
          sort:      'publicData',
          search:    'publicData',
          formatter: 'CloudCredPublicData',
        }, {
          name:     'provider',
          labelKey: 'manager.cloudCredentials.list.headers.provider',
          value:    'providerDisplay',
          sort:     'providerDisplay',
          search:   'providerDisplay',
        },
        DESCRIPTION,
        AGE_NORMAN
      ];
    },

    createLocation() {
      return {
        name:   'c-cluster-manager-cloudCredential-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource,
        },
      };
    },
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      :type-display="t('manager.cloudCredentials.label')"
    />

    <ResourceTable
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :namespaced="false"
      :group-options="groupOptions"
    >
      <template #cell:id="{row}">
        {{ row.id.replace('cattle-global-data:', '') }}
      </template>
    </ResourceTable>
  </div>
</template>
