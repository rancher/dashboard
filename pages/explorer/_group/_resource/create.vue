<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA } from '@/config/types';

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-create$/, '');

      return name;
    }
  },

  async asyncData(ctx) {
    const { resource, namespace } = ctx.params;
    const schemas = ctx.store.getters['cluster/all'](SCHEMA);
    const schema = ctx.store.getters['cluster/schemaFor'](resource);
    const data = { type: resource };

    if ( schema.attributes.namespaced ) {
      data.metadata = { namespace };
    }

    const obj = await ctx.store.dispatch('cluster/create', data);
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
