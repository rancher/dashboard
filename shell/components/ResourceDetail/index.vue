<script>
import CreateEditView from '@shell/mixins/create-edit-view/impl';
import Loading from '@shell/components/Loading';
import ResourceYaml from '@shell/components/ResourceYaml';
import {
  _VIEW, _EDIT, _CLONE, _IMPORT, _STAGE, _CREATE,
  AS, _YAML, _DETAIL, _CONFIG, _GRAPH, PREVIEW, MODE,
} from '@shell/config/query-params';
import { FLEET, SCHEMA } from '@shell/config/types';
import { createYaml } from '@shell/utils/create-yaml';
import Masthead from '@shell/components/ResourceDetail/Masthead';
import DetailTop from '@shell/components/DetailTop';
import { clone, diff } from '@shell/utils/object';
import IconMessage from '@shell/components/IconMessage';
import ForceDirectedTreeChart from '@shell/components/fleet/ForceDirectedTreeChart';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { stringify } from '@shell/utils/error';
import { Banner } from '@components/Banner';

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

async function getYaml(store, model) {
  let yaml;
  const opt = { headers: { accept: 'application/yaml' } };

  if ( model.hasLink('view') ) {
    yaml = (await model.followLink('view', opt)).data;
  }

  return model.cleanForDownload(yaml);
}

export default {
  emits: ['input'],

  components: {
    Loading,
    DetailTop,
    ForceDirectedTreeChart,
    ResourceYaml,
    Masthead,
    IconMessage,
    Banner
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

    flexContent: {
      type:    Boolean,
      default: false,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'resource-details'
    },
    errorsMap: {
      type:    Object,
      default: null
    },
  },

  async fetch() {
    const store = this.$store;
    const route = this.$route;
    const params = route.params;
    let resourceType = this.resourceOverride || params.resource;

    const inStore = this.storeOverride || store.getters['currentStore'](resourceType);
    const realMode = this.realMode;

    // eslint-disable-next-line prefer-const
    let { namespace, id } = params;

    // There are 6 "real" modes that can be put into the query string
    // These are mapped down to the 3 regular page "mode"s that create-edit-view components
    // know about:  view, edit, create (stage, import and clone become "create")
    const mode = ([_CLONE, _IMPORT, _STAGE].includes(realMode) ? _CREATE : realMode);

    const getGraphConfig = store.getters['type-map/hasGraph'](resourceType);
    const hasGraph = !!getGraphConfig;
    const hasCustomDetail = store.getters['type-map/hasCustomDetail'](resourceType, id);
    const hasCustomEdit = store.getters['type-map/hasCustomEdit'](resourceType, id);

    const schemas = store.getters[`${ inStore }/all`](SCHEMA);

    // As determines what component will be rendered
    const requested = route.query[AS];
    let as;
    let notFound = false;

    if ( mode === _VIEW && hasCustomDetail && (!requested || requested === _DETAIL) ) {
      as = _DETAIL;
    } else if ( mode === _VIEW && hasGraph && requested === _GRAPH) {
      as = _GRAPH;
    } else if ( hasCustomEdit && (!requested || requested === _CONFIG) ) {
      as = _CONFIG;
    } else {
      as = _YAML;
    }

    this.as = as;

    const options = store.getters[`type-map/optionsFor`](resourceType);

    this.showMasthead = [_CREATE, _EDIT].includes(mode) ? options.resourceEditMasthead : true;
    const canViewYaml = options.canYaml;

    if ( options.resource ) {
      resourceType = options.resource;
    }

    const schema = store.getters[`${ inStore }/schemaFor`](resourceType);
    let model, initialModel, liveModel, yaml;

    if ( realMode === _CREATE || realMode === _IMPORT ) {
      if ( !namespace ) {
        namespace = store.getters['defaultNamespace'];
      }

      const data = { type: resourceType };

      if ( schema?.attributes?.namespaced ) {
        data.metadata = { namespace };
      }

      liveModel = await store.dispatch(`${ inStore }/create`, data);
      initialModel = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
      model = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });

      if (model.forceYaml === true) {
        as = _YAML;
        this.as = as;
      }

      if ( as === _YAML ) {
        if (schema?.fetchResourceFields) {
          // fetch resourceFields for createYaml
          await schema.fetchResourceFields();
        }

        yaml = createYaml(schemas, resourceType, data);
      }
    } else {
      if ( as === _GRAPH ) {
        const graphSchema = await checkSchemasForFindAllHash({
          cluster: {
            inStoreType: 'management',
            type:        FLEET.CLUSTER
          },
          bundle: {
            inStoreType: 'management',
            type:        FLEET.BUNDLE,
            opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
          },

          bundleDeployment: {
            inStoreType: 'management',
            type:        FLEET.BUNDLE_DEPLOYMENT
          }

        }, this.$store);

        this.canViewChart = graphSchema.cluster && graphSchema.bundle && graphSchema.bundleDeployment;
      }

      let fqid = id;

      if ( schema.attributes?.namespaced && namespace ) {
        fqid = `${ namespace }/${ fqid }`;
      }

      try {
        liveModel = await store.dispatch(`${ inStore }/find`, {
          type: resourceType,
          id:   fqid,
          opt:  { watch: true }
        });
      } catch (e) {
        if (e.status === 404 || e.status === 403) {
          store.dispatch('loadingError', new Error(this.t('nav.failWhale.resourceIdNotFound', { resource: resourceType, fqid }, true)));
        }
        liveModel = {};
        notFound = fqid;
      }

      try {
        if (realMode === _VIEW) {
          model = liveModel;
        } else {
          model = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });
        }
        initialModel = await store.dispatch(`${ inStore }/clone`, { resource: liveModel });

        if ( as === _YAML ) {
          yaml = await getYaml(this.$store, liveModel);
        }
      } catch (e) {
        this.errors.push(e);
      }
      if ( as === _YAML ) {
        try {
          yaml = await getYaml(this.$store, liveModel);
        } catch (e) {
          this.errors.push(e);
        }
      }

      if ( as === _GRAPH ) {
        this.chartData = liveModel;
      }

      if ( [_CLONE, _IMPORT, _STAGE].includes(realMode) ) {
        model.cleanForNew();
        yaml = model.cleanYaml(yaml, realMode);
      }
    }

    // Ensure common properties exists
    try {
      model = await store.dispatch(`${ inStore }/cleanForDetail`, model);
    } catch (e) {
      this.errors.push(e);
    }

    const out = {
      hasGraph,
      getGraphConfig,
      hasCustomDetail,
      hasCustomEdit,
      canViewYaml,
      resourceType,
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
      chartData:       null,
      resourceSubtype: null,

      // Set by fetch
      hasGraph:        null,
      hasCustomDetail: null,
      hasCustomEdit:   null,
      resourceType:    null,
      asYaml:          null,
      yaml:            null,
      liveModel:       null,
      initialModel:    null,
      mode:            null,
      as:              null,
      value:           null,
      model:           null,
      notFound:        null,
      canViewChart:    true,
      canViewYaml:     null,
      errors:          []
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

    isGraph() {
      return this.as === _GRAPH;
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
    hasErrors() {
      return this.errors?.length && Array.isArray(this.errors);
    },
    mappedErrors() {
      return !this.errors ? {} : this.errorsMap || this.errors.reduce((acc, error) => ({
        ...acc,
        [error]: {
          message: error?.data?.message || error,
          icon:    null
        }
      }), {});
    },
  },

  watch: {
    '$route'(current, prev) {
      if (current.name !== prev.name) {
        return;
      }
      const neu = clone(current.query);
      const old = clone(prev.query);

      delete neu[PREVIEW];
      delete old[PREVIEW];

      if ( !this.isView ) {
        delete neu[AS];
        delete old[AS];
      }

      const queryDiff = Object.keys(diff(neu, old));

      if (queryDiff.includes(MODE) || queryDiff.includes(AS)) {
        this.$fetch();
      }
    },

    // Auto refresh YAML when the model changes
    async 'value.metadata.resourceVersion'(a, b) {
      if ( this.mode === _VIEW && this.as === _YAML && a && b && a !== b) {
        this.yaml = await getYaml(this.$store, this.liveModel);
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

    // FIXME: These aren't right... signature is (rawType, subType).. not (rawType, resourceId)
    // Remove id? How does subtype get in (cluster/node)
    this.detailComponent = this.$store.getters['type-map/importDetail'](detailResource, id);
    this.editComponent = this.$store.getters['type-map/importEdit'](editResource, id);
  },

  methods: {
    stringify,
    setSubtype(subtype) {
      this.resourceSubtype = subtype;
    },

    keyAction(act) {
      const m = this.liveModel;

      if ( m?.[act] ) {
        m[act]();
      }
    },
    closeError(index) {
      this.errors = this.errors.filter((_, i) => i !== index);
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending || notFound" />
  <div v-else>
    <Masthead
      v-if="showMasthead"
      :resource="resourceType"
      :value="liveModel"
      :mode="mode"
      :real-mode="realMode"
      :as="as"
      :has-graph="hasGraph"
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
    <div
      v-if="hasErrors"
      id="cru-errors"
      class="cru__errors"
    >
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :data-testid="`error-banner${i}`"
        :label="stringify(mappedErrors[err].message)"
        :icon="mappedErrors[err].icon"
        :closable="true"
        @close="closeError(i)"
      />
    </div>

    <ForceDirectedTreeChart
      v-if="isGraph && canViewChart"
      :data="chartData"
      :fdc-config="getGraphConfig"
    />

    <ResourceYaml
      v-else-if="isYaml"
      ref="resourceyaml"
      :value="value"
      :mode="mode"
      :yaml="yaml"
      :offer-preview="offerPreview"
      :done-route="doneRoute"
      :done-override="value ? value.doneOverride : null"
      @update:value="$emit('input', $event)"
      @error="e=>errors.push(e)"
    />

    <component
      :is="showComponent"
      v-else
      ref="comp"
      v-model:value="value"
      v-bind="$data"
      :done-params="doneParams"
      :done-route="doneRoute"
      :mode="mode"
      :initial-value="initialModel"
      :live-value="liveModel"
      :real-mode="realMode"
      :class="{'flex-content': flexContent}"
      @update:value="$emit('input', $event)"
      @set-subtype="setSubtype"
    />

    <button
      v-if="isView"
      v-shortkey.once="['shift','d']"
      :data-testid="componentTestid + '-detail'"
      class="hide"
      @shortkey="keyAction('goToDetail')"
    />
    <button
      v-if="isView"
      v-shortkey.once="['shift','c']"
      :data-testid="componentTestid + '-config'"
      class="hide"
      @shortkey="keyAction('goToViewConfig')"
    />
    <button
      v-if="isView"
      v-shortkey.once="['shift','y']"
      :data-testid="componentTestid + '-yaml'"
      class="hide"
      @shortkey="keyAction('goToViewYaml')"
    />
    <button
      v-if="isView"
      v-shortkey.once="['shift','e']"
      :data-testid="componentTestid + '-edit'"
      class="hide"
      @shortkey="keyAction('goToEdit')"
    />
  </div>
</template>

<style lang='scss' scoped>
.flex-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
</style>
