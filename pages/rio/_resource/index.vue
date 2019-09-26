<script>
import ResourceTable from '@/components/ResourceTable';
import { CONFIG_MAP, SECRET, RIO } from '@/utils/types';
import { STATE, NAMESPACE_NAME, CREATED } from '@/utils/table-headers';

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
      NAMESPACE_NAME,
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
  cd: {
    singular: 'Continuous Deployment',
    plural:   'Continuous Deployments',
    type:     RIO.CONTINUOUS_DEPLOYMENT
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
      NAMESPACE_NAME,
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

export const TO_FRIENDLY = {};
Object.keys(FRIENDLY).forEach((key) => {
  const entry = FRIENDLY[key];

  entry.resource = key;

  TO_FRIENDLY[entry.type] = entry;
});

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
      return this.$store.getters['cluster/schemaFor'](this.type);
    },

    headers() {
      return FRIENDLY[this.resource].headers;
    },
  },

  asyncData(ctx) {
    const resource = ctx.params.resource;
    const type = FRIENDLY[resource].type;

    return ctx.store.dispatch('cluster/findAll', { type }).then((rows) => {
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
