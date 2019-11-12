<script>
import { cleanForNew } from '@/plugins/norman/normalize';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceYaml from '@/components/ResourceYaml';
import { FRIENDLY } from '@/config/friendly';
import {
  MODE, _VIEW, _EDIT, _CLONE, _STAGE,
  EDIT_YAML, _FLAGGED, _CREATE
} from '@/config/query-params';

// Components can't have asyncData, only pages.
// So you have to call this in the page and pass it in as a prop.
export async function asyncData(ctx) {
  const { store, params, route } = ctx;
  const { resource, namespace, id } = params;
  const friendly = FRIENDLY[resource];
  const type = friendly.type;
  const asYaml = route.query[EDIT_YAML] === _FLAGGED;
  const mode = route.query[MODE];
  const schema = store.getters['cluster/schemaFor'](type);

  let fqid = id;

  if ( schema.attributes.namespaced ) {
    fqid = `${ namespace }/${ fqid }`;
  }

  const obj = await store.dispatch('cluster/find', { type, id: fqid });

  let yaml = null;

  if ( asYaml ) {
    yaml = await obj.followLink('view', { headers: { accept: 'application/yaml' } }).data;
  }

  const forNew = mode === _CLONE || mode === _STAGE;
  const model = await store.dispatch('cluster/clone', { resource: obj });

  if ( friendly.applyDefaults ) {
    friendly.applyDefaults(ctx, model, mode);
  }

  if ( forNew ) {
    cleanForNew(model);
  }

  const out = {
    asYaml,
    resource,
    model,
    yaml,
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
    return { ...this.asyncData };
  },

  computed: {
    // In the beginning, there was 20 bits of address-space, and it was... adequate.  Please enable your A20 handler now.
    realMode() {
      return this.$route.query.mode || _VIEW;
    },

    mode() {
      if ( this.realMode === _STAGE || this.realMode === _CLONE ) {
        return _CREATE;
      }

      return this.realMode;
    },

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
      if ( this.isView && FRIENDLY[this.resource].hasDetail ) {
        return () => import(`@/components/detail/${ this.type }`);
      }

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
          <span v-if="realMode === 'edit'">Edit {{ typeDisplay }}:&nbsp;</span>
          <span v-else-if="realMode === 'stage'">Stage from {{ typeDisplay }}:&nbsp;</span>
          <span v-else-if="realMode === 'clone'">Clone from {{ typeDisplay }}:&nbsp;</span>
          <nuxt-link v-else v-trim-whitespace :to="parentLink">
            {{ typeDisplay }}:&nbsp;
          </nuxt-link>{{ originalModel.nameDisplay }}
        </h1>
        <div v-if="isView" class="actions">
          <button ref="actions" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
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
        :real-mode="realMode"
      />
    </template>
  </div>
</template>
