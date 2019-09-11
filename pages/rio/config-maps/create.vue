<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA, CONFIG_MAP } from '@/utils/types';

const RESOURCE = CONFIG_MAP;

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    }
  },

  async asyncData(ctx) {
    const schemas = ctx.store.getters['v1/all'](SCHEMA);
    const data = { type: RESOURCE };

    const obj = await ctx.store.dispatch('v1/create', data);
    const value = createYaml(schemas, RESOURCE, data);

    return { obj, value };
  }
};
</script>

<template>
  <div>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" :for-create="true" />
  </div>
</template>
