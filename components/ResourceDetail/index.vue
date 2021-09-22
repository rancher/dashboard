<script>
import CreateEditView from '@/mixins/create-edit-view/impl';
import Loading from '@/components/Loading';
import ResourceYaml from '@/components/ResourceYaml';
import {
  _VIEW, _EDIT, _CLONE, _IMPORT, _STAGE, _CREATE,
  AS, _YAML, _DETAIL, _CONFIG, PREVIEW, MODE,
} from '@/config/query-params';
import { SCHEMA } from '@/config/types';
import { createYaml } from '@/utils/create-yaml';
import Masthead from '@/components/ResourceDetail/Masthead';
import DetailTop from '@/components/DetailTop';
import { clone, diff } from '@/utils/object';
import IconMessage from '@/components/IconMessage';

function modeFor(route) {
  if ( route.query?.mode === _IMPORT ) {
    return _IMPORT;
  }

  if ( route.params?.id ) {
    return route.query.mode || _VIEW;
  } else {
    return _CREATE;
  }
}

async function getYaml(model) {
  let yaml;
  const opt = { headers: { accept: 'application/yaml' } };

  if ( model.hasLink('view') ) {
    yaml = (await model.followLink('view', opt)).data;
  }

  return yaml;
}

export default {
  components: {
    Loading,
    DetailTop,
    ResourceYaml,
    Masthead,
    IconMessage,
  },

  mixins: [CreateEditView],

  props: {
    storeOverride: {
      type:    String,
      default: null,
    },

    resourceOverride: {
      type:    String,
      default: null,
    },

    parentRouteOverride: {
      type:    String,
      default: null,
    },
  },
  async fetch() {
    const store = this.$store;
    const route = this.$route;
    const params = route.params;
    const inStore = this.storeOverride || store.getters['currentStore'](params.resource);
    const realMode = this.realMode;

    // eslint-disable-next-line prefer-const
    let { namespace, id } = params;
    let resource = this.resourceOverride || params.resource;

    // There are 6 "real" modes that can be put into the query string
    // These are mapped down to the 3 regular page "mode"s that create-edit-view components
    // know about:  view, edit, create (stage, import and clone become "create")
    const mode = ([_CLONE, _IMPORT, _STAGE].includes(realMode) ? _CREATE : realMode);

    const hasCustomDetail = store.getters['type-map/hasCustomDetail'](resource, id);
    const hasCustomEdit = store.getters['type-map/hasCustomEdit'](resource, id);
    const schemas = store.getters[`${ inStore }/all`](SCHEMA);

    // As determines what component will be rendered
    const requested = route.query[AS];
    let as;
    let notFound = false;

    if ( mode === _VIEW && hasCustomDetail && (!requested || requested === _DETAIL) ) {
      as = _DETAIL;
    } else if ( hasCustomEdit && (!requested || requested === _CONFIG) ) {
      as = _CONFIG;
    } else {
      as = _YAML;
    }

    this.as = as;

    const options = store.getters[`type-map/optionsFor`](resource);

    if ( options.resource ) {
      resource = options.resource;
    }

    const schema = store.getters[`${ inStore }/schemaFor`](resource);
    let originalModel, model, yaml;

    if ( realMode === _CREATE || realMode === _IMPORT ) {
      if ( !namespace ) {
        namespace = store.getters['defaultNamespace'];
      }

      const data = { type: resource };

      if ( schema?.attributes?.namespaced ) {
        data.metadata = { namespace };
      }

      originalModel = await store.dispatch(`${ inStore }/create`, data);
      // Dissassociate the original model & model. This fixes `Create` after refreshing page with SSR on
      model = await store.dispatch(`${ inStore }/clone`, { resource: originalModel });

      if ( as === _YAML ) {
        yaml = createYaml(schemas, resource, data);
      }
    } else {
      let fqid = id;

      if ( schema.attributes?.namespaced && namespace ) {
        fqid = `${ namespace }/${ fqid }`;
      }

      try {
        originalModel = await store.dispatch(`${ inStore }/find`, {
          type: resource,
          id:   fqid,
          opt:  { watch: true }
        });
      } catch (e) {
        originalModel = {};
        notFound = fqid;
      }

      if (realMode === _VIEW) {
        model = originalModel;
      } else {
        model = await store.dispatch(`${ inStore }/clone`, { resource: originalModel });
      }

      if ( as === _YAML ) {
        yaml = await getYaml(originalModel);
      }

      if ( [_CLONE, _IMPORT, _STAGE].includes(realMode) ) {
        model.cleanForNew();
        yaml = model.cleanYaml(yaml, realMode);
      }
    }

    // Ensure common properties exists
    model = await store.dispatch(`${ inStore }/cleanForDetail`, model);

    const out = {
      hasCustomDetail,
      hasCustomEdit,
      resource,
      as,
      yaml,
      originalModel,
      mode,
      value: model,
      notFound,
    };

    for ( const key in out ) {
      this[key] = out[key];
    }

    if ( this.mode === _CREATE ) {
      this.value.applyDefaults(this, realMode);
    }
  },

  data() {
    return {
      resourceSubtype: null,

      // Set by fetch
      hasCustomDetail: null,
      hasCustomEdit:   null,
      resource:        null,
      asYaml:          null,
      yaml:            null,
      originalModel:   null,
      mode:            null,
      as:              null,
      value:           null,
      model:           null,
      notFound:        null,
    };
  },

  computed: {
    realMode() {
      // There are 5 "real" modes that you can start in: view, edit, create, stage, clone
      const realMode = modeFor(this.$route);

      return realMode;
    },

    isView() {
      return this.mode === _VIEW;
    },

    isYaml() {
      return this.as === _YAML;
    },

    isDetail() {
      return this.as === _DETAIL;
    },

    offerPreview() {
      return this.as === _YAML && [_EDIT, _CLONE, _IMPORT, _STAGE].includes(this.mode);
    },

    showComponent() {
      switch ( this.as ) {
      case _DETAIL: return this.detailComponent;
      case _CONFIG: return this.editComponent;
      }

      return null;
    },
  },

  watch: {
    '$route.query'(inNeu, inOld) {
      const neu = clone(inNeu);
      const old = clone(inOld);

      delete neu[PREVIEW];
      delete old[PREVIEW];

      if ( !this.isView ) {
        delete neu[AS];
        delete old[AS];
      }

      const queryDiff = Object.keys(diff(neu, old));

      if ( queryDiff.includes(MODE) || queryDiff.includes(AS)) {
        this.$fetch();
      }
    },

    // Auto refresh YAML when the model changes
    async 'value.metadata.resourceVersion'(a, b) {
      if ( this.mode === _VIEW && this.as === _YAML && a && b && a !== b) {
        this.yaml = await getYaml(this.originalModel);
      }
    }
  },

  created() {
    // eslint-disable-next-line prefer-const
    const id = this.$route.params.id;
    const resource = this.resourceOverride || this.$route.params.resource;
    const options = this.$store.getters[`type-map/optionsFor`](resource);

    const detailResource = options.resourceDetail || options.resource || resource;
    const editResource = options.resourceEdit || options.resource || resource;

    this.detailComponent = this.$store.getters['type-map/importDetail'](detailResource, id);
    this.editComponent = this.$store.getters['type-map/importEdit'](editResource, id);
  },

  methods: {
    setSubtype(subtype) {
      this.resourceSubtype = subtype;
    },

    keyAction(act) {
      const m = this.originalModel;

      if ( m?.[act] ) {
        m[act]();
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="notFound">
    <IconMessage icon="icon-warning">
      <template v-slot:message>
        {{ t('generic.notFound') }}
        <div>
          <div>{{ t('generic.type') }}: {{ resource }}</div>
          <div>{{ t('generic.id') }}: {{ notFound }}</div>
        </div>
      </template>
    </IconMessage>
  </div>
  <div v-else>
    <Masthead
      :resource="resource"
      :value="originalModel"
      :mode="mode"
      :real-mode="realMode"
      :as="as"
      :has-detail="hasCustomDetail"
      :has-edit="hasCustomEdit"
      :resource-subtype="resourceSubtype"
      :parent-route-override="parentRouteOverride"
      :store-override="storeOverride"
    >
      <DetailTop
        v-if="isView && isDetail"
        :value="originalModel"
      />
    </Masthead>

    <ResourceYaml
      v-if="isYaml"
      ref="resourceyaml"
      v-model="value"
      :mode="mode"
      :yaml="yaml"
      :offer-preview="offerPreview"
      :done-route="doneRoute"
      :done-override="value.doneOverride"
    />

    <component
      :is="showComponent"
      v-else
      ref="comp"
      v-model="value"
      v-bind="_data"
      :done-params="doneParams"
      :done-route="doneRoute"
      :mode="mode"
      :original-value="originalModel"
      :real-mode="realMode"
      @set-subtype="setSubtype"
    />

    <button v-if="isView" v-shortkey.once="['d']" class="hide" @shortkey="keyAction('goToDetail')" />
    <button v-if="isView" v-shortkey.once="['c']" class="hide" @shortkey="keyAction('goToViewConfig')" />
    <button v-if="isView" v-shortkey.once="['y']" class="hide" @shortkey="keyAction('goToViewYaml')" />
    <button v-if="isView" v-shortkey.once="['e']" class="hide" @shortkey="keyAction('goToEdit')" />
  </div>
</template>
