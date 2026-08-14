<script>
import CreateEditView from '@shell/mixins/create-edit-view/impl';
import Loading from '@shell/components/Loading';
import ResourceYaml from '@shell/components/ResourceYaml';
import {
  _VIEW, _EDIT, _CLONE, _IMPORT, _STAGE, _CREATE,
  AS, _YAML, _DETAIL, _CONFIG, PREVIEW, MODE,
} from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml, createYamlWithOptions } from '@shell/utils/create-yaml';
import Masthead from '@shell/components/ResourceDetail/Masthead';
import DetailTop from '@shell/components/DetailTop';
import { clone, diff } from '@shell/utils/object';
import IconMessage from '@shell/components/IconMessage';
import { stringify } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import FailWhale from '@shell/components/FailWhale';
import { useResourceDetailPageProvider } from '@shell/composables/resourceDetail';
import ResourceTemplateUtils from '@shell/utils/resource-template';

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
    ResourceYaml,
    Masthead,
    IconMessage,
    Banner,
    FailWhale,
  },

  mixins: [CreateEditView],

  // Lets a CruResource nested arbitrarily deep inside whatever custom edit component
  // showComponent resolves to (see registerCruResource below) register itself, since it's a
  // sibling of the Masthead template selector, not reachable via $refs. Also lets the
  // ResourceTemplateSelector itself (nested inside Masthead) register a reset function, so it
  // can be cleared once onTemplateSelected's chosen action has actually finished.
  provide() {
    return {
      registerCruResource:      this.registerCruResource,
      registerTemplateSelector: this.registerTemplateSelector,
    };
  },

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

    const hasCustomDetail = store.getters['type-map/hasCustomDetail'](resourceType, id);
    const hasCustomEdit = store.getters['type-map/hasCustomEdit'](resourceType, id);

    const schemas = store.getters[`${ inStore }/all`](SCHEMA);

    // As determines what component will be rendered
    const requested = route.query[AS];
    let as;
    let notFound = false;

    if ( mode === _VIEW && hasCustomDetail && (!requested || requested === _DETAIL) ) {
      as = _DETAIL;
      useResourceDetailPageProvider();
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

    // If the resource type (e.g. CRD) is gone, render the error in-context (in
    // place of the details) rather than redirecting to the global fail-whale
    // page, so the side menu and cluster context are retained.
    if ( !schema && realMode !== _CREATE && realMode !== _IMPORT ) {
      this.resourceNotFoundError = new Error(this.t('nav.failWhale.resourceNotFound', { resource: resourceType }, true));

      return;
    }

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
      let fqid = id;

      if ( schema?.attributes?.namespaced && namespace ) {
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
          // Render the error in-context (in place of the details) rather than
          // redirecting to the global fail-whale page, so the side menu and
          // cluster context are retained (e.g. after the resource has been
          // deleted but the user still has a preference/URL pointing at it).
          this.resourceNotFoundError = new Error(this.t('nav.failWhale.resourceIdNotFound', { resource: resourceType, fqid }, true));

          return;
        }
        console.info(`Could not find '${ resourceType }' with id '${ id }''`, e); // eslint-disable-line no-console
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
        console.warn(`Could not set 'model' for '${ resourceType }' with id '${ id }''`, e); // eslint-disable-line no-console
        this.errors.push(e);
      }
      if ( as === _YAML ) {
        try {
          yaml = await getYaml(this.$store, liveModel);
        } catch (e) {
          this.errors.push(e);
        }
      }

      if ( [_CLONE, _IMPORT, _STAGE].includes(realMode) ) {
        model?.cleanForNew();
        yaml = model?.cleanYaml(yaml, realMode);
      }
    }

    // Ensure common properties exists
    try {
      model = await store.dispatch(`${ inStore }/cleanForDetail`, model || {});
    } catch (e) {
      this.errors.push(e);
    }

    const out = {
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
      this.value?.applyDefaults(this, realMode);
    }

    // Consume anything staged by onTemplateSelected() (below) ahead of the page reload that
    // action triggers. Runs after applyDefaults so the staged values win over any defaults just
    // applied. No-op when nothing is staged.
    const staged = ResourceTemplateUtils.consumeStagedFormApply();

    if ( staged && this.value ) {
      try {
        ResourceTemplateUtils.applyStagedFormApply(this.value, staged);
      } catch (e) {
        this.errors.push(e);
      }
    }
  },
  data() {
    return {
      resourceSubtype: null,

      // Set by fetch
      hasCustomDetail:       null,
      hasCustomEdit:         null,
      resourceType:          null,
      asYaml:                null,
      yaml:                  null,
      liveModel:             null,
      initialModel:          null,
      mode:                  null,
      as:                    null,
      value:                 null,
      model:                 null,
      notFound:              null,
      canViewYaml:           null,
      errors:                [],
      // When set, the resource type or the specific resource could not be
      // found. The error is rendered in-context (in place of the details)
      // instead of redirecting to the fail-whale page.
      resourceNotFoundError: null,

      // Registered by a nested CruResource (see provide() above), when the currently-showing
      // custom edit component uses one. Null for resource types whose custom edit component
      // doesn't embed CruResource.
      cruResource: null,

      // Registered by the ResourceTemplateSelector nested inside Masthead (see provide() above).
      templateSelectorReset: null,

      // Bumped to force the custom edit component below to fully unmount/remount after a
      // template is applied to the form (see onTemplateSelected) - a plain $fetch() alone
      // refreshes this component's own data (value/liveModel/etc), but many custom edit
      // components copy props into local state on creation and won't react to that data being
      // replaced out from under an already-mounted instance.
      formRemountKey: 0,
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
    isFullPageOverride() {
      return this.isView && this.value?.fullDetailPageOverride && !this.isYaml;
    }
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
    this.configureResource();
  },

  methods: {
    stringify,

    setSubtype(subtype) {
      this.resourceSubtype = subtype;
    },

    /**
     * Generate yaml for the resource currently being edited, the same way CruResource.vue's
     * createResourceYaml() does (createYamlWithOptions is the same utility, just called with
     * this.value/this.resourceType instead of a form-owned resource/type pair).
     */
    async currentValueYaml() {
      const inStore = this.storeOverride || this.$store.getters['currentStore'](this.resourceType);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const schema = this.$store.getters[`${ inStore }/schemaFor`](this.resourceType);
      const clonedResource = clone(this.value);

      if (schema?.fetchResourceFields) {
        await schema.fetchResourceFields();
      }

      return createYamlWithOptions(schemas, this.resourceType, clonedResource);
    },

    /**
     * Whatever yaml the user is currently looking at, regardless of which of the three possible
     * views is showing - this component's own top-level yaml view, a custom edit form's own
     * nested yaml view (via CruResource), or a custom edit form still in plain form view. Used by
     * onSaveTemplate() below (ResourceTemplateSelector's Save button) - reading back the live,
     * possibly hand-edited yaml text where one is already showing, rather than only ever
     * regenerating fresh from the resource, mirrors what "Save as Template" already does for an
     * existing saved resource (it saves whatever's in that dialog's own yaml editor, not a fresh
     * re-fetch).
     */
    async currentEditYaml() {
      if (this.isYaml) {
        return this.$refs.resourceyaml?.currentYaml ?? this.yaml;
      }

      if (this.cruResource) {
        return this.cruResource.currentEditYaml();
      }

      return this.currentValueYaml();
    },

    /**
     * Registered/unregistered by a nested CruResource, if the currently-showing custom edit
     * component uses one (see provide() above and CruResource.vue's mounted/beforeUnmount).
     */
    registerCruResource(instance) {
      this.cruResource = instance;
    },

    /**
     * Registered/unregistered by the ResourceTemplateSelector nested inside Masthead (see
     * provide() above).
     */
    registerTemplateSelector(reset) {
      this.templateSelectorReset = reset;
    },

    /**
     * Triggered by ResourceTemplateSelector in the page Masthead (@apply-template).
     */
    onTemplateSelected(configMap) {
      const inStore = this.storeOverride || this.$store.getters['currentStore'](this.resourceType);

      if (this.isYaml) {
        // Already showing yaml directly (no custom form component involved) - apply immediately,
        // no reload needed, since this component owns `value`/`yaml` directly.
        this.$store.dispatch(`${ inStore }/promptModal`, {
          component:      'GenericPrompt',
          componentProps: {
            title:       this.t('resourceTemplateSelector.confirmTitle'),
            body:        this.t('resourceTemplateSelector.confirmBodyYaml'),
            applyMode:   'apply',
            applyAction: async() => {
              const yaml = ResourceTemplateUtils.applyTemplate(this.value, configMap);

              this.yaml = yaml;
              this.$refs.resourceyaml?.applyTemplateYaml(yaml);
            },
            // GenericPrompt calls this with `true` after a successful apply and `false` on
            // Cancel - either way the modal is done with the selection, so reset it regardless
            // of outcome (rather than only on success), otherwise Cancel leaves a stale-looking
            // selection behind with nothing having actually happened.
            confirm: () => this.templateSelectorReset?.(),
          },
        });

        return;
      }

      // Showing the custom edit component/form. Its internals aren't reliably reachable from
      // here - many custom edit components copy props into local state on creation and won't
      // react to the resource object being mutated later - so "apply to form" stages the
      // template (and the form's current in-progress edits), then re-runs this component's own
      // fetch() (the same fetch() a full page load would run - it consumes the staged payload at
      // its very end, see consumeStagedFormApply there) via $fetch(), and once that's done, bumps
      // formRemountKey to force the custom edit component to unmount/remount against the fresh
      // `value`/`initialModel`/`liveModel` $fetch() just produced. This gets the same
      // guaranteed-fresh-mount result a full `window.location.reload()` gave (still needed,
      // since just letting the existing instance react to a replaced `value` prop is exactly the
      // unreliable case described above), without an actual browser navigation - $fetch() shows
      // the ordinary <Loading> state while it runs, the same experience as first navigating to
      // this page, rather than a jarring full-page flash.
      //
      // "apply to yaml" is different: it doesn't need to write into the live form at all, it
      // needs to trigger the form's own "Edit as YAML" toggle (CruResource.vue's showAsForm/
      // resourceYaml) with the template merged in - the exact same view the user gets from
      // clicking that button themselves, not some separate view owned by this component. That
      // toggle lives on whatever CruResource is nested inside the custom edit component, which
      // this component has no direct $refs path to - so it's reached via the registerCruResource
      // registration above instead. Falls back to switching this component's own `as`/`yaml`
      // (the same mechanism used for the isYaml-true branch above) only for the rare custom edit
      // component that doesn't embed a CruResource at all.
      this.$store.dispatch(`${ inStore }/promptModal`, {
        component:      'GenericPrompt',
        componentProps: {
          title:       this.t('resourceTemplateSelector.confirmTitle'),
          body:        this.t('resourceTemplateSelector.confirmBodyForm'),
          applyMode:   'applyToForm',
          applyAction: async() => {
            const currentYaml = await this.currentValueYaml();

            ResourceTemplateUtils.stageFormApply(currentYaml, configMap);
            // $fetch() only replaces the fields it reassigns (see fetch()'s `out` object above) -
            // `errors` isn't one of them, so clear it explicitly to match what a real page load
            // would start with.
            this.errors = [];
            await this.$fetch();
            this.formRemountKey++;
          },
          secondaryApplyMode:   'applyToYaml',
          secondaryApplyAction: async() => {
            if (this.cruResource) {
              await this.cruResource.applyTemplate(configMap);

              return;
            }

            const currentYaml = await this.currentValueYaml();

            this.yaml = ResourceTemplateUtils.mergeTemplateOntoYaml(currentYaml, configMap);
            this.as = _YAML;
            await this.$router.applyQuery({ [AS]: _YAML });
          },
          // See the isYaml-true branch above for why this fires on both success and Cancel.
          confirm: () => this.templateSelectorReset?.(),
        },
      });
    },

    /**
     * Triggered by ResourceTemplateSelector's Save button in the page Masthead
     * (@save-template) - lets the user save the resource they're currently creating/editing as
     * a template before it's ever been saved for real, reusing the exact same dialog the
     * per-resource "Save as Template" action opens (steve-class.js's saveAsTemplate()). That
     * dialog normally fetches a resource's current yaml from the server via followLink('view'),
     * which only works for a resource that's actually been saved - so this passes the
     * currently-showing yaml (see currentEditYaml() above) directly instead, via the dialog's
     * optional initialYaml prop.
     */
    async onSaveTemplate() {
      const inStore = this.storeOverride || this.$store.getters['currentStore'](this.resourceType);
      const initialYaml = await this.currentEditYaml();

      // PromptModal.vue only special-cases a handful of top-level modalData keys (resources,
      // modalWidth, etc.) - anything else the target component needs (initialYaml here) has to
      // go through componentProps, which it v-binds generically.
      this.$store.dispatch(`${ inStore }/promptModal`, {
        component:      'SaveAsTemplateDialog',
        resources:      [this.value],
        modalWidth:     '750px',
        componentProps: { initialYaml },
      });
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
    onYamlError(err) {
      this.errors = [];
      const errors = Array.isArray(err) ? err : [err];

      errors.forEach((e) => {
        if (this.errors.indexOf(e) === -1) {
          this.errors.push(e);
        }
      });
    },
    /**
     * Initializes the resource components based on the provided user and
     * resource override.
     *
     * Configures the detail and edit components for a resource based on the
     * user's ID and the specified resource.
     *
     * @param {Object} user - The user object containing user-specific
     * information.
     * @param {string|null} resourceOverride - An optional resource override
     * string. If not provided, the method will use the default resource from
     * the route parameters or the instance's resourceOverride property.
     */
    configureResource(userId = '', resourceOverride = null) {
      const id = userId || this.$route.params.id;
      const resource = resourceOverride || this.resourceOverride || this.$route.params.resource;
      const options = this.$store.getters[`type-map/optionsFor`](resource);

      const detailResource = options.resourceDetail || options.resource || resource;
      const editResource = options.resourceEdit || options.resource || resource;

      // FIXME: These aren't right... signature is (rawType, subType).. not (rawType, resourceId)
      // Remove id? How does subtype get in (cluster/node)
      this.detailComponent = this.$store.getters['type-map/importDetail'](detailResource, id);
      this.editComponent = this.$store.getters['type-map/importEdit'](editResource, id);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending || notFound" />
  <FailWhale
    v-else-if="resourceNotFoundError"
    :error="resourceNotFoundError"
  />
  <component
    :is="showComponent"
    v-else-if="isFullPageOverride"
    v-model:value="value"
    v-ui-context="{ icon: 'icon-folder', value: value.name, tag: value.kind?.toLowerCase(), description: value.kind }"
    v-bind="$data"
    :done-params="doneParams"
    :done-route="doneRoute"
    :mode="mode"
    :initial-value="initialModel"
    :live-value="liveModel"
    :real-mode="realMode"
    :class="{'flex-content': flexContent}"
    :resource-errors="errors"
    @update:value="$emit('input', $event)"
    @set-subtype="setSubtype"
  />
  <div v-else>
    <Masthead
      v-if="showMasthead"
      v-ui-context="{ icon: 'icon-folder', value: liveModel.name, tag: liveModel.kind?.toLowerCase(), description: liveModel.kind }"
      :resource="resourceType"
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
      @apply-template="onTemplateSelected"
      @save-template="onSaveTemplate"
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
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
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

    <ResourceYaml
      v-if="isYaml"
      ref="resourceyaml"
      :value="value"
      :mode="mode"
      :yaml="yaml"
      :offer-preview="offerPreview"
      :done-route="doneRoute"
      :done-override="value ? value.doneOverride : null"
      :show-errors="false"
      @update:value="$emit('input', $event)"
      @error="onYamlError"
    />

    <component
      :is="showComponent"
      v-else
      :key="formRemountKey"
      ref="comp"
      v-model:value="value"
      v-ui-context="{ icon: 'icon-folder', value: value.name, tag: value.kind?.toLowerCase(), description: value.kind }"
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
.cru__errors {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--header-bg);
}
</style>
