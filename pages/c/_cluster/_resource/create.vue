<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA, WORKLOAD } from '@/config/types';
import { FRIENDLY } from '@/config/friendly';
import { get } from '@/utils/object';

export default {
  components: { ResourceYaml },

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    },

    showComponent() {
      return () => import(`@/edit/${ this.type }`);
    },

    typeDisplay() {
      return get(FRIENDLY[this.type], 'singular');
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
    const data = { type: resource };
    let value;

    if (resource !== 'workload') {
      const schema = ctx.store.getters['cluster/schemaFor'](resource);

      value = createYaml(schemas, resource, data);
      if ( schema.attributes.namespaced ) {
        data.metadata = { namespace };
      }
    }
    const obj = await ctx.store.dispatch('cluster/create', data);
    let type = obj.type;

    const workloadTypes = Object.values(WORKLOAD);

    if (workloadTypes.includes(resource)) {
      type = 'workload';
    }

    return {
      obj, value, type
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
