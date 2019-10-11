<script>
import CreateEditView from '@/mixins/create-edit-view';
import { FRIENDLY } from '~/pages/rio/_resource';

export default {
  name: 'RioResourceCreate',

  mixins: { CreateEditView },

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

    const metadata = { anotations: {} };

    if ( schema.attributes.namespaced ) {
      metadata.namespace = '';
    }

    const data = {
      type,
      metadata,
      data: {},
    };

    let model;

    if ( mapping.newModel ) {
      model = mapping.newModel(ctx, data);
    } else {
      model = await ctx.store.dispatch('cluster/create', data);
    }

    return {
      resource,
      type,
      model,
    };
  }
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
