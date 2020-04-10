<script>
import { cleanForNew } from '@/plugins/steve/normalize';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceYaml from '@/components/ResourceYaml';
import {
  MODE, _VIEW, _EDIT, _CLONE, _STAGE, _PREVIEW,
  EDIT_YAML, _FLAGGED, _CREATE, PREVIEW
} from '@/config/query-params';

// Components can't have asyncData, only pages.
// So you have to call this in the page and pass it in as a prop.
export async function asyncData(ctx) {
  const { store, params, route } = ctx;
  const { resource, namespace, id } = params;

  const hasCustomDetail = store.getters['type-map/hasCustomDetail'](resource);
  const hasCustomEdit = store.getters['type-map/hasCustomEdit'](resource);

  // There are 5 "real" modes that you can start in: view, edit, create, stage, clone
  // These are mapped down to the 3 regular page modes that create-edit-view components
  //  know about:  view, edit, create (stage and clone become "create")
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

  const link = obj.hasLink('rioview') ? 'rioview' : 'view';

  yaml = (await obj.followLink(link, { headers: { accept: 'application/yaml' } })).data;

  /*******
   * Important: these need to be declared below as props too if you want to use them
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
   * Important: these need to be declared below as props too if you want to use them
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

  data() {
    if (this.hasCustomDetail) {
      this.$store.getters['type-map/importDetail'](this.resource)().then((component) => {
        this.importedDetailComponent = component.default;
      });
    }

    if (this.hasCustomEdit) {
      this.$store.getters['type-map/importEdit'](this.resource)().then((component) => {
        this.importedEditComponent = component.default;
      });
    }

    return {
      isCustomYamlEditor:      false,
      currentValue:            this.value,
      detailComponent:         this.$store.getters['type-map/importDetail'](this.resource),
      importedDetailComponent: null,
      editComponent:           this.$store.getters['type-map/importEdit'](this.resource),
      importedEditComponent:   null,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    offerPreview() {
      return [_EDIT, _CLONE, _STAGE].includes(this.mode);
    },

    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    },

    doneParams() {
      return this.$route.params;
    },

    showComponent() {
      if ( this.isView && this.hasCustomDetail ) {
        return this.detailComponent;
      } else if ( !this.isView && this.hasCustomEdit ) {
        return this.editComponent;
      }

      return null;
    },

    h1() {
      const typeLink = this.$router.resolve({
        name:   this.doneRoute,
        params: this.$route.params
      }).href;

      const out = this.$store.getters['i18n/t'](`resourceDetail.header.${ this.realMode }`, {
        typeLink,
        type: this.$store.getters['type-map/singularLabelFor'](this.schema),
        name: this.originalModel?.nameDisplay,
      });

      return out;
    },
  },

  methods: {
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.originalModel,
        elem:      this.$refs.actions,
      });
    },
  }
};
</script>

<template>
  <div>
    <header>
      <h1 v-html="h1" />
      <div v-if="isView" class="actions">
        <button ref="actions" aria-haspopup="true" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <template v-if="asYaml">
      <ResourceYaml
        :obj="model"
        :mode="mode"
        :value="yaml"
        :offer-preview="offerPreview"
        :done-route="doneRoute"
      />
    </template>
    <template v-else>
      <component
        :is="showComponent"
        v-model="model"
        :original-value="originalModel"
        :done-route="doneRoute"
        :done-params="doneParams"
        :mode="mode"
        :real-mode="realMode"
        :value="model"
        :obj="model"
        :yaml="yaml"
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
    flex-wrap: wrap;
    background: var(--box-bg);
    border: solid thin var(--border);
    border-radius: var(--border-radius);

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
