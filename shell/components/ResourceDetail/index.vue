<script>
import CreateEditView from '@shell/mixins/create-edit-view/impl';
import Loading from '@shell/components/Loading';
import ResourceYaml from '@shell/components/ResourceYaml';
import {
  _VIEW, _EDIT, _CLONE, _IMPORT, _STAGE, _CREATE,
  AS, _YAML, _DETAIL, _CONFIG, PREVIEW, MODE,
} from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml } from '@shell/utils/create-yaml';
import Masthead from '@shell/components/ResourceDetail/Masthead';
import DetailTop from '@shell/components/DetailTop';
import { clone, diff } from '@shell/utils/object';
import IconMessage from '@shell/components/IconMessage';

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

    this.showMasthead = [_CREATE, _EDIT].includes(mode) ? options.resourceEditMasthead : true;
    const canViewYaml = options.canYaml;

    if ( options.resource ) {
      resource = options.resource;
    }

    const schema = store.getters[`${ inStore }/schemaFor`](resource);
    let model, initialModel, liveModel, yaml;

    if ( realMode === _CREATE || realMode === _IMPORT ) {
      if ( !namespace ) {
        namespace = store.getters['defaultNamespace'];
      }

      const data = { type: resource };

      if ( schema?.attributes?.namespaced ) {
        data.metadata = { namespace };
      }

      liveModel = await store.dispatch(`${ inStore }/create`, data);
      initialModel = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
      model = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });

      if ( as === _YAML ) {
        yaml = createYaml(schemas, resource, data);
      }
    } else {
      let fqid = id;

      if ( schema.attributes?.namespaced && namespace ) {
        fqid = `${ namespace }/${ fqid }`;
      }

      try {
        liveModel = await store.dispatch(`${ inStore }/find`, {
          type: resource,
          id:   fqid,
          opt:  { watch: true }
        });
      } catch (e) {
        liveModel = {};
        notFound = fqid;
      }

      if (realMode === _VIEW) {
        model = liveModel;
      } else {
        model = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
      }

      initialModel = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });

      if ( as === _YAML ) {
        yaml = await getYaml(liveModel);
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
      canViewYaml,
      resource,
      as,
      yaml,
      initialModel,
      liveModel,
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
      liveModel:       null,
      initialModel:    null,
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
        this.yaml = await getYaml(this.liveModel);
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

    // TODO: RC These aren't right... signature is (rawType, subType).. not (rawType, resourceId)
    // Remove id? How does subtype get in (cluster/node)
    this.detailComponent = this.$store.getters['type-map/importDetail'](detailResource, id);
    this.editComponent = this.$store.getters['type-map/importEdit'](editResource, id);
  },

  methods: {
    setSubtype(subtype) {
      this.resourceSubtype = subtype;
    },

    keyAction(act) {
      const m = this.liveModel;

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
      v-if="showMasthead"
      :resource="resource"
      :value="liveModel"
      :mode="mode"
      :real-mode="realMode"
      :as="as"
      :has-detail="hasCustomDetail"
      :has-edit="hasCustomEdit"
      :can-view-yaml="canViewYaml"
      :resource-subtype="resourceSubtype"
      :parent-route-override="parentRouteOverride"
      :store-override="storeOverride"
    >
      <DetailTop
        v-if="isView && isDetail"
        :value="liveModel"
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
      :initial-value="initialModel"
      :live-value="liveModel"
      :real-mode="realMode"
      @set-subtype="setSubtype"
    />

    <button v-if="isView" v-shortkey.once="['d']" class="hide" @shortkey="keyAction('goToDetail')" />
    <button v-if="isView" v-shortkey.once="['c']" class="hide" @shortkey="keyAction('goToViewConfig')" />
    <button v-if="isView" v-shortkey.once="['y']" class="hide" @shortkey="keyAction('goToViewYaml')" />
    <button v-if="isView" v-shortkey.once="['e']" class="hide" @shortkey="keyAction('goToEdit')" />
  </div>
</template>
