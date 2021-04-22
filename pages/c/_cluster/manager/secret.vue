<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { SECRET } from '@/config/types';
import { AGE, NAME, STATE } from '@/config/table-headers';
import { CLOUD_CREDENTIAL, _FLAGGED } from '@/config/query-params';

export default {
  components: { ResourceTable, Masthead },

  async fetch() {
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });
  },

  data() {
    return {
      allSecrets: [],
      resource:        SECRET,
      schema:          this.$store.getters['management/schemaFor'](SECRET),
    };
  },

  computed: {
    rows() {
      return this.allSecrets.filter(x => x.isCloudCredential);
    },

    headers() {
      return [
        STATE,
        NAME,
        {
          name:        'provider',
          label:       'Provider',
          value:       'cloudCredentialProviderDisplay',
          sort:        'cloudCredentialProviderDisplay',
          search:      'cloudCredentialProviderDisplay',
          dashIfEmpty: true,
        },
        {
          name:        'apikey',
          label:       'API Key',
          value:       'cloudCredentialPublicData',
          sort:        'cloudCredentialPublicData',
          search:      'cloudCredentialPublicData',
          dashIfEmpty: true,
        },
        AGE
      ];
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
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
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      type-display="Cloud Credentials"
    />

    <ResourceTable :schema="schema" :rows="rows" :headers="headers" :namespaced="false">
      <template #cell:apikey="{row}">
        <span v-html="row.cloudCredentialPublicData" />
      </template>
    </ResourceTable>
  </div>
</template>
