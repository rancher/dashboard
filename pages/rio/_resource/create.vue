<script>
import demos from '@/config/demos';
import { FRIENDLY } from '@/config/friendly';
import { _CREATE } from '@/config/query-params';

export default {
  name: 'RioResourceCreate',

  // mixins:   { CreateEditView },
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
    const { route } = ctx;
    const { resource } = ctx.params;
    const friendly = FRIENDLY[resource];
    const type = friendly.type;

    const schema = ctx.store.getters['cluster/schemaFor'](type);

    const metadata = { annotations: {} };

    if ( schema.attributes.namespaced ) {
      metadata.namespace = '';
    }

    let spec = {};

    if (ctx.query.demo) {
      spec = demos[ctx.query.demo].spec;
    }

    const data = {
      type,
      kind:       schema.attributes.kind,
      apiVersion: `${ schema.attributes.group }/${ schema.attributes.version }`,
      metadata,
      spec
    };

    const model = await ctx.store.dispatch('cluster/create', data);

    if ( friendly.applyDefaults ) {
      friendly.applyDefaults(ctx, model, _CREATE);
    }

    return {
      isDemo: !!ctx.query.demo,
      resource,
      schema,
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
      :namespace-suffix-on-create="schema.attributes.namespaced"
      :type-label="typeDisplay"
      mode="create"
      :is-demo="isDemo"
    >
    </component>
  </div>
</template>
