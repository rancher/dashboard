<script>
import { FRIENDLY } from '@/config/friendly';

export default {
  name: 'RioResourceCreate',

  mixins:   { CreateEditView },
  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    },

    doneParams() {
      return this.$route.params;
    },

    cruComponent() {
      return () => import(`@/components/cru/${ this.type }`);
    },

    typeDisplay() {
      return FRIENDLY[this.resource].singular;
    },

    parentLink() {
      const name = this.doneRoute;
      const params = this.doneParams;
      const out = this.$router.resolve({ name, params }).href;

      return out;
    },
  },

  async asyncData(ctx) {
    const { resource } = ctx.params;
    const mapping = FRIENDLY[resource];
    const type = mapping.type;

    const schema = ctx.store.getters['cluster/schemaFor'](type);

    const metadata = { annotations: {} };

    if ( schema.attributes.namespaced ) {
      metadata.namespace = '';
    }

    const data = {
      type,
      kind:       schema.attributes.kind,
      apiVersion: `${ schema.attributes.group }/${ schema.attributes.version }`,
      metadata,
      data:       {},
    };

    const model = await ctx.store.dispatch('cluster/create', data);

    return {
      resource,
      type,
      model,
    };
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        Create <nuxt-link :to="parentLink">
          {{ typeDisplay }}
        </nuxt-link>
      </h1>
    </header>
    <component
      :is="cruComponent"
      v-model="model"
      :done-route="doneRoute"
      :done-params="doneParams"
      :namespace-suffix-on-create="true"
      :type-label="typeDisplay"
      mode="create"
    />
  </div>
</template>
