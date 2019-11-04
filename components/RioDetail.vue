<script>
import CreateEditView from '@/mixins/create-edit-view';
import ResourceYaml from '@/components/ResourceYaml';
import { FRIENDLY } from '@/config/friendly';
import {
  MODE, _VIEW, _EDIT, EDIT_YAML, _FLAGGED
} from '@/config/query-params';

export async function asyncData({ store, params, route }) {
  const { resource, namespace, id } = params;
  const type = FRIENDLY[resource].type;
  const asYaml = route.query[EDIT_YAML] === _FLAGGED;
  const schema = store.getters['cluster/schemaFor'](type);

  let fqid = id;

  if ( schema.attributes.namespaced ) {
    fqid = `${ namespace }/${ fqid }`;
  }

  const obj = await store.dispatch('cluster/find', { type, id: fqid });
  const model = await store.dispatch('cluster/clone', obj);
  const view = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

  const out = {
    asYaml,
    resource,
    model,
    yaml:          view.data,
    originalModel: obj
  };

  return out;
}

export const watchQuery = [MODE, EDIT_YAML];

export default {
  components: { ResourceYaml },
  mixins:     { CreateEditView },

  props: {
    asyncData: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const mode = this.$route.query.mode || _VIEW;

    return {
      mode,
      ...this.asyncData
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    type() {
      return FRIENDLY[this.resource].type;
    },

    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    },

    doneParams() {
      return this.$route.params;
    },

    parentLink() {
      const name = this.doneRoute;
      const params = this.donneParams;
      const out = this.$router.resolve({ name, params }).href;

      return out;
    },

    cruComponent() {
      return () => import(`@/components/cru/${ this.type }`);
    },

    typeDisplay() {
      return FRIENDLY[this.resource].singular;
    },
  },

  methods: {
    showActions() {
      this.$store.commit('selection/show', {
        resources: this.originalModel,
        elem:      this.$refs.actions,
      });
    },
  }
};
</script>

<template>
  <div>
    <ResourceYaml
      v-if="asYaml"
      :obj="model"
      :value="yaml"
      :done-route="doneRoute"
      :parent-route="doneRoute"
      :parent-params="doneParams"
    />
    <template v-else>
      <header>
        <h1 v-trim-whitespace>
          <span v-if="isEdit">Edit</span>
          <nuxt-link v-trim-whitespace :to="parentLink">
            {{ typeDisplay }}
          </nuxt-link>: {{ originalModel.nameDisplay }}
        </h1>
        <div v-if="isView" class="actions">
          <button ref="actions" class="btn btn-sm bg-primary actions" @click="showActions">
            <i class="icon icon-actions" />
          </button>
        </div>
      </header>
      <component
        :is="cruComponent"
        v-model="model"
        :original-value="originalModel"
        :done-route="doneRoute"
        :done-params="doneParams"
        :parent-route="doneRoute"
        :parent-params="doneParams"
        :namespace-suffix-on-create="true"
        :type-label="typeDisplay"
        :mode="mode"
      />
    </template>
  </div>
</template>
