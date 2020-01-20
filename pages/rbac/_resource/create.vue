<script>
import { FRIENDLY } from '@/config/friendly';
import { _CREATE } from '@/config/query-params';

/**
 * Create view for RBAC Role Resource
   @displayName RBAC Role Create
 */
export default {
  name: 'RBACResourceCreate',

  provide() {
    return { realMode: 'create' };
  },

  computed: {
    /**
     * Returns the route the user should be redirected to when done
     */
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    },
    /**
     * Returns the route params
     */
    doneParams() {
      return this.$route.params;
    },
    /**
     * Imports the correct edit component
     */
    cruComponent() {
      return () => import(`@/edit/${ this.type }`);
    },
    /**
     * Returns friendly type (singlar)
     */
    typeDisplay() {
      return FRIENDLY[this.resource].singular;
    },
    /**
     * Returns full parent link including params
     */
    parentLink() {
      const name = this.doneRoute;
      const params = this.doneParams;
      const out = this.$router.resolve({ name, params }).href;

      return out;
    },
  },

  async asyncData(ctx) {
    const { resource } = ctx.params;
    const friendly = FRIENDLY[resource];
    const type = friendly.type;

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
    };

    const model = await ctx.store.dispatch('cluster/create', data);

    if ( friendly.applyDefaults ) {
      friendly.applyDefaults(ctx, model, _CREATE);
    }

    return {
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
    >
    </component>
  </div>
</template>
