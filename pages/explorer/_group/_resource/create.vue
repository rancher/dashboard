<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA } from '@/config/types';
import { FRIENDLY } from '@/config/friendly';
import { get } from '@/utils/object';

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    },
    cruComponent() {
      return () => import(`@/components/cru/${ this.obj.type }`);
    },
    typeDisplay() {
      return get(FRIENDLY[this.obj.type], 'singular');
    },
    parentLink() {
      const name = this.doneRoute;
      const params = this.$route.params;
      const out = this.$router.resolve({ name, params }).href;

      return out;
    },
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
  <div v-if="cruComponent">
    <header>
      <h1>
        Create <nuxt-link :to="parentLink">
          {{ typeDisplay }}
        </nuxt-link>
      </h1>
    </header>
    <component
      :is="cruComponent"
      :done-route="doneRoute"
      mode="create"
      :value="obj"
    />
  </div>
  <div v-else>
    <ResourceYaml :obj="obj" :value="value" :done-route="doneRoute" :for-create="true" />
  </div>
</template>
