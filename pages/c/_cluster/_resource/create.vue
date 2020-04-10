<script>
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA } from '@/config/types';
import { EDIT_YAML, _FLAGGED } from '@/config/query-params';

export default {
  components: { ResourceYaml },

  data() {
    if (this.hasCustomEdit) {
      this.$store.getters['type-map/importEdit'](this.resource)().then((component) => {
        this.importedEditComponent = component.default;
      });
    }

    return { importedEditComponent: null };
  },

  computed:   {
    doneRoute() {
      const name = this.$route.name.replace(/-create$/, '');

      return name;
    },

    showComponent() {
      return this.$store.getters['type-map/importEdit'](this.resource);
    },

    doneEditOverride() {
      return this.importedEditComponent?.doneOverride
        ? this.importedEditComponent?.doneOverride.bind(this)
        : null;
    },

    typeDisplay() {
      return this.$store.getters['type-map/singularLabelFor'](this.schema);
    },
  },

  async asyncData(ctx) {
    const { route, store } = ctx;
    const resource = ctx.params.resource;
    const namespace = ctx.params.namespace || store.getters['defaultNamespace'];
    const schemas = store.getters['cluster/all'](SCHEMA);
    const schema = store.getters['cluster/schemaFor'](resource);
    const data = { type: resource };

    if ( schema.attributes.namespaced ) {
      data.metadata = { namespace };
    }

    const model = await store.dispatch('cluster/create', data);
    const yaml = createYaml(schemas, resource, data);

    const hasCustomEdit = store.getters['type-map/hasCustomEdit'](resource);

    const asYaml = (route.query[EDIT_YAML] === _FLAGGED) || !hasCustomEdit;

    return {
      schema,
      resource,
      model,
      yaml,
      asYaml,
      hasCustomEdit
    };
  }
};
</script>

<template>
  <ResourceYaml v-if="asYaml" :obj="model" :value="yaml" :done-route="doneRoute" :for-create="true" />
  <div v-else>
    <header>
      <h1>
        OLD Create {{ typeDisplay }}
      </h1>
    </header>
    <component
      :is="showComponent"
      :done-route="doneRoute"
      mode="create"
      :value="model"
      :obj="model"
      :yaml="yaml"
      :done-override="doneEditOverride"
    />
  </div>
</template>
