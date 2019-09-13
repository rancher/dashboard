<script>
import ResourceTable from '@/components/ResourceTable';
import { CONFIG_MAP, SECRET, RIO } from '@/utils/types';
import { STATE, NAME, NAMESPACE, CREATED } from '@/utils/table-headers';

const KEYS = {
  name:      'keys',
  label:     'Keys',
  sort:      false,
  value:     'keysDisplay',
};

export const FRIENDLY = {
  'config-maps': {
    singular: 'Config Map',
    plural:   'Config Maps',
    type:     CONFIG_MAP,
    headers:  [
      STATE,
      NAME,
      NAMESPACE,
      KEYS,
      CREATED
    ],
  },
  'external-services': {
    singular: 'External Service',
    plural:   'External Services',
    type:     RIO.EXTERNAL_SERVICE
  },
  'public-domains': {
    singular: 'Public Domain',
    plural:   'Public Domains',
    type:     RIO.PUBLIC_DOMAIN
  },
  riofiles: {
    singular: 'Riofile',
    plural:   'Riofiles',
    type:     RIO.RIOFILE
  },
  routers: {
    singular: 'Router',
    plural:   'Routers',
    type:     RIO.ROUTER
  },
  secrets: {
    singular: 'Secret',
    plural:   'Secrets',
    type:     SECRET,
    headers:  [
      STATE,
      NAME,
      NAMESPACE,
      {
        name:  'type',
        label: 'Type',
        value: 'typeDisplay',
      },
      KEYS,
      CREATED
    ],
  },
};

export default {
  components: { ResourceTable },

  validate({ params, query, store }) {
    return !!FRIENDLY[params.resource];
  },

  computed: {
    typeDisplay() {
      return FRIENDLY[this.resource].plural;
    },

    schema() {
      return this.$store.getters['v1/schemaFor'](this.type);
    },

    headers() {
      return FRIENDLY[this.resource].headers;
    },
  },

  asyncData(ctx) {
    const resource = ctx.params.resource;
    const type = FRIENDLY[resource].type;

    return ctx.store.dispatch('v1/findAll', { type }).then((rows) => {
      return {
        resource,
        type,
        rows
      };
    });
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        {{ typeDisplay }}
      </h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <ResourceTable :schema="schema" :rows="rows" :headers="headers" />
  </div>
</template>
