<script>
import { cleanForNew } from '@/plugins/steve/normalize';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceYaml from '@/components/ResourceYaml';
import {
  MODE, _VIEW, _EDIT, _CLONE, _STAGE,
  EDIT_YAML, _FLAGGED, _CREATE
} from '@/config/query-params';
import { NAMESPACE } from '@/config/types';
import {
  singularLabelFor,
  hasCustomDetail as _hasCustomDetail,
  hasCustomEdit as _hasCustomEdit,
  importDetail, importEdit
} from '@/utils/customized';

// Components can't have asyncData, only pages.
// So you have to call this in the page and pass it in as a prop.
export async function asyncData(ctx) {
  const { store, params, route } = ctx;
  const { resource, namespace, id } = params;

  const hasCustomDetail = _hasCustomDetail(resource);
  const hasCustomEdit = _hasCustomEdit(resource);

  // There are 5 "real" modes: view, create, edit, stage, clone
  // which later map to 3 logical/page modes: view, create, edit (stage and clone are "create")
  const realMode = route.query.mode || _VIEW;
  const schema = store.getters['cluster/schemaFor'](resource);

  let fqid = id;

  if ( schema.attributes.namespaced && namespace ) {
    fqid = `${ namespace }/${ fqid }`;
  }

  const obj = await store.dispatch('cluster/find', { type: resource, id: fqid });

  const forNew = realMode === _CLONE || realMode === _STAGE;
  const model = await store.dispatch('cluster/clone', { resource: obj });

  if ( forNew ) {
    cleanForNew(model);
  }

  if ( model.applyDefaults ) {
    model.applyDefaults(ctx, realMode);
  }

  let mode = realMode;

  if ( realMode === _STAGE || realMode === _CLONE ) {
    mode = _CREATE;
  }

  const asYaml = (route.query[EDIT_YAML] === _FLAGGED) || (mode === _VIEW && !hasCustomDetail) || (mode !== _VIEW && !hasCustomEdit);
  let yaml = null;

  if ( asYaml ) {
    const link = obj.hasLink('rioview') ? 'rioview' : 'view';

    yaml = (await obj.followLink(link, { headers: { accept: 'application/yaml' } })).data;
  }

  /*******
   * Important: these need to be declared below as props too
   *******/
  const out = {
    hasCustomDetail,
    hasCustomEdit,
    schema,
    resource,
    model,
    asYaml,
    yaml,
    originalModel: obj,
    mode,
    realMode
  };
  /*******
   * Important: these need to be declared below as props too
   *******/

  return out;
}

export const watchQuery = [MODE, EDIT_YAML];

export default {
  components: { ResourceYaml },
  mixins:     { CreateEditView },

  props: {
    hasCustomDetail: {
      type:    Boolean,
      default: null,
    },
    hasCustomEdit: {
      type:    Boolean,
      default: null,
    },
    schema: {
      type:    Object,
      default: null,
    },
    resource: {
      type:    String,
      default: null,
    },
    model: {
      type:    Object,
      default: null,
    },
    asYaml: {
      type:    Boolean,
      default: null,
    },
    yaml: {
      type:    String,
      default: null,
    },
    originalModel: {
      type:    Object,
      default: null,
    },
    mode: {
      type:    String,
      default: null
    },
    realMode: {
      type:    String,
      default: null
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
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
      const params = this.doneParams;
      const out = this.$router.resolve({ name, params }).href;

      return out;
    },

    showComponent() {
      if ( this.isView && this.hasCustomDetail ) {
        return importDetail(this.resource);
      } else if ( !this.isView && this.hasCustomEdit ) {
        return importEdit(this.resource);
      }

      return null;
    },

    typeDisplay() {
      return singularLabelFor(this.schema);
    },

    namespaceSuffixOnCreate() {
      return this.resource !== NAMESPACE;
    }
  },

  methods: {
    showActions() {
      this.$store.commit('actionMenu/show', {
        resources: this.originalModel,
        elem:      this.$refs.actions,
      });
    },

    goBack() {
      window.history.length > 1 ? this.$router.go(-1) : this.$router.push('/');
    }
  }
};
</script>

<template>
  <div>
    <template v-if="asYaml">
      <ResourceYaml
        :obj="model"
        :value="yaml"
        :done-route="doneRoute"
        :parent-route="doneRoute"
        :parent-params="doneParams"
      />
    </template>
    <template v-else>
      <header>
        <h1 v-trim-whitespace>
          <span v-if="realMode === 'edit'">Edit {{ typeDisplay }}:&nbsp;</span>
          <span v-else-if="realMode === 'stage'">Stage from {{ typeDisplay }}:&nbsp;</span>
          <span v-else-if="realMode === 'clone'">Clone from {{ typeDisplay }}:&nbsp;</span>
          <nuxt-link
            v-else
            v-trim-whitespace
            :to="parentLink"
          >
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
        :is="showComponent"
        v-model="model"
        :original-value="originalModel"
        :done-route="doneRoute"
        :done-params="doneParams"
        :parent-route="doneRoute"
        :parent-params="doneParams"
        :namespace-suffix-on-create="namespaceSuffixOnCreate"
        :type-label="typeDisplay"
        :mode="mode"
      />
    </template>
  </div>
</template>

<style lang='scss' scoped>
  .flat {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    & th{
      padding-bottom: 1rem;
      text-align: left;
      font-weight: normal;
      color: var(--secondary);
    }

    & :not(THEAD) tr{
      border-bottom: 1px solid var(--border);

      & td {
        padding: 10px 0 10px 0;
      }
    }
    & tr td:last-child, th:last-child{
      text-align: right;
    }

    & tr td:first-child, th:first-child{
      text-align: left;
      margin-left: 15px;
    }

    & .click-row a{
      color: var(--input-text);
    }

    & .click-row:hover{
      @extend .faded;
    }

    & .faded {
      opacity: 0.5
    }
  }
  .detail-top{
    display: flex;
    height: 75px;

    & > * {
      margin-right: 20px;
      padding: 10px 0 10px 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      &:not(:last-child){
      border-right: 1px solid var(--border);
      }

      & >:not(:first-child){
        color: var(--input-label);
        padding: 3px;
      }
    }
  }
</style>
