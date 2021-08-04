<script>
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { NORMAN, SECRET } from '@/config/types';
import { AGE_NORMAN, DESCRIPTION, NAME_UNLINKED } from '@/config/table-headers';
import { CLOUD_CREDENTIAL, _FLAGGED } from '@/config/query-params';

export default {
  components: {
    Loading, ResourceTable, Masthead
  },

  async fetch() {
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });
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
        NAME_UNLINKED,
        {
          name:        'apikey',
          label:       'API Key',
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
        query: { [CLOUD_CREDENTIAL]: _FLAGGED }
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
      type-display="Cloud Credentials"
    />

    <ResourceTable :schema="schema" :rows="rows" :headers="headers" :namespaced="false" group-by="providerDisplay">
      <template #cell:apikey="{row}">
        <span v-if="row.publicData" v-html="row.publicData" />
        <span v-else class="text-muted">&mdash;</span>
      </template>
    </ResourceTable>
  </div>
</template>
