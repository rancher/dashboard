<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA } from '@/utils/types';

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/(\/namespace)?\/create$/, '');

      return name;
    }
  },

  async asyncData(ctx) {
    const { resource, namespace } = ctx.params;
    const schemas = ctx.store.getters['v1/all'](SCHEMA);
    const schema = ctx.store.getters['v1/schemaFor'](resource);
    const data = { type: resource };

    if ( schema.attributes.namespaced ) {
      data.metadata = { namespace };
    }

    const obj = await ctx.store.dispatch('v1/create', data);
    const value = createYaml(schemas, resource, data);

    return { obj, value };
  }
};
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" :for-create="true" />
  </div>
</template>
