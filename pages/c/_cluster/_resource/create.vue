<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA } from '@/config/types';
import { singularLabelFor } from '@/config/nav-cluster';

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    },

    hasComponent() {
      try {
        require.resolve(`@/edit/${ this.resource }`);

        return true;
      } catch (e) {
        return false;
      }
    },

    showComponent() {
      return () => import(`@/edit/${ this.resource }`);
    },

    typeDisplay() {
      return singularLabelFor(this.schema);
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

    const model = await ctx.store.dispatch('cluster/create', data);
    const yaml = createYaml(schemas, resource, data);

    return {
      resource, model, yaml, schema
    };
  }
};
</script>

<template>
  <div v-if="hasComponent">
    <header>
      <h1>
        Create <nuxt-link :to="parentLink">
          {{ typeDisplay }}
        </nuxt-link>
      </h1>
    </header>
    <component
      :is="showComponent"
      :done-route="doneRoute"
      mode="create"
      :value="model"
    />
  </div>
  <ResourceYaml v-else :obj="model" :value="yaml" :done-route="doneRoute" :for-create="true" />
</template>
