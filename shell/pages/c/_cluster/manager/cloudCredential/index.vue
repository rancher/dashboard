<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { NORMAN, SECRET } from '@shell/config/types';
import { AGE_NORMAN, DESCRIPTION, ID_UNLINKED, NAME_UNLINKED } from '@shell/config/table-headers';

export default {
  components: {
    Loading, ResourceTable, Masthead
  },

  async fetch() {
    if ( this.$store.getters['management/schemaFor'](SECRET) ) {
      // Having secrets allows showing the public portion of more types but not all users can see them.
      await this.$store.dispatch('management/findAll', { type: SECRET });
    }

    this.allCredentials = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
  },

  data() {
    return {
      allCredentials: null,
      resource:       NORMAN.CLOUD_CREDENTIAL,
      schema:         this.$store.getters['rancher/schemaFor'](NORMAN.CLOUD_CREDENTIAL),
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
          name:        'apikey',
          labelKey:    'tableHeaders.apikey',
          value:       'publicData',
          sort:        'publicData',
          search:      'publicData',
          dashIfEmpty: true,
        },
        DESCRIPTION,
        AGE_NORMAN,
      ];
    },

    createLocation() {
      return {
        name:   'c-cluster-manager-cloudCredential-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
      };
    },
  },

  mounted() {
    window.c = this;
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

    <ResourceTable :schema="schema" :rows="rows" :headers="headers" :namespaced="false" group-by="providerDisplay">
      <template #cell:id="{row}">
        {{ row.id.replace('cattle-global-data:','') }}
      </template>
      <template #cell:apikey="{row}">
        <span v-if="row.publicData" v-html="row.publicData" />
        <span v-else class="text-muted">&mdash;</span>
      </template>
    </ResourceTable>
  </div>
</template>
