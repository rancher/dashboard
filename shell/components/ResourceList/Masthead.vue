<script>
import { mapGetters } from 'vuex';
import Favorite from '@shell/components/nav/Favorite';
import TypeDescription from '@shell/components/TypeDescription';
import { RcButton } from '@components/RcButton';
import { get } from '@shell/utils/object';
import { AS, _YAML } from '@shell/config/query-params';
import { isProductPrefixedTopLevel } from '@shell/utils/extension-product-routing';
import ResourceLoadingIndicator from './ResourceLoadingIndicator';
import TabTitle from '@shell/components/TabTitle';

/**
 * Resource List Masthead component.
 */
export default {

  name: 'MastheadResourceList',

  components: {
    Favorite,
    RcButton,
    TypeDescription,
    ResourceLoadingIndicator,
    TabTitle
  },
  props: {
    resource: {
      type:     String,
      required: true,
    },
    favoriteResource: {
      type:    String,
      default: null
    },
    schema: {
      type:    Object,
      default: null,
    },
    typeDisplay: {
      type:    String,
      default: null,
    },
    isCreatable: {
      type:    Boolean,
      default: null,
    },
    isYamlCreatable: {
      type:    Boolean,
      default: null,
    },
    createLocation: {
      type:    Object,
      default: null,
    },
    yamlCreateLocation: {
      type:    Object,
      default: null,
    },
    createButtonLabel: {
      type:    String,
      default: null
    },
    loadResources: {
      type:    Array,
      default: () => []
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    showIncrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    showFavorite: {
      type:    Boolean,
      default: true
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'masthead'
    }
  },

  computed: {
    get,
    ...mapGetters(['isExplorer', 'currentCluster']),

    createRouteName() {
      return `${ this.$route.name }-create`;
    },

    /**
     * Has an extension registered the current product as a product-prefixed top level product?
     * Those route from the product root, so the create route has to be built differently from
     * the one a core resource list uses.
     *
     * The `$extension` read stays guarded. When this component is bundled into an extension
     * running on Rancher 2.11-2.13 the host only injects `$plugin`, and the compat shim in
     * `@shell/pkg/auto-import` runs while extensions load - which is before `vueApp.mount()`,
     * so its first attempt finds no `__vue_app__` and it falls back to a 100ms poll. A render
     * that lands inside that window still sees no `$extension`. Falling through to `{}` is the
     * right answer there: with no plugins to inspect there is no override, which is also what
     * a Rancher without V2 product registration needs.
     */
    overrideCreateLocationByExtension() {
      const plugins = this.$extension?.getPlugins?.() || {};
      const productId = this.$store.getters['productId'];
      // Last match wins, matching the original forEach
      const pluginName = Object.keys(plugins).filter((key) => plugins[key]?.productNames?.includes(productId)).pop();

      return isProductPrefixedTopLevel(plugins[pluginName], productId);
    },

    formRoute() {
      const params = { ...this.$route.params };

      if (this.overrideCreateLocationByExtension) {
        return { name: this.createRouteName, params: { ...params, product: this.$store.getters['productId'] } };
      }

      return { name: this.createRouteName, params };
    },

    yamlRoute() {
      return {
        name:   this.createRouteName,
        params: { ...this.$route.params },
        query:  { [AS]: _YAML },
      };
    },

    hasEditComponent() {
      return this.$store.getters['type-map/hasCustomEdit'](this.resource);
    },

    resourceName() {
      if (this.schema) {
        return this.$store.getters['type-map/labelFor'](this.schema);
      }

      return this.resource;
    },

    _typeDisplay() {
      if ( this.typeDisplay !== null) {
        return this.typeDisplay;
      }

      if ( !this.schema ) {
        return '?';
      }

      return this.$store.getters['type-map/labelFor'](this.schema, 99);
    },

    _isYamlCreatable() {
      if ( this.isYamlCreatable !== null) {
        return this.isYamlCreatable;
      }

      return this.schema && this._isCreatable && this.$store.getters['type-map/optionsFor'](this.resource).canYaml;
    },

    _isCreatable() {
      // Does not take into account hasEditComponent, such that _isYamlCreatable works
      if ( this.isCreatable !== null) {
        return this.isCreatable;
      }

      // blocked-post means you can post through norman, but not through steve.
      if ( this.schema && this.schema?.collectionMethods && !this.schema?.collectionMethods.find((x) => ['blocked-post', 'post'].includes(x.toLowerCase())) ) {
        return false;
      }

      return this.$store.getters['type-map/optionsFor'](this.resource).isCreatable;
    },

    _createLocation() {
      return this.overrideCreateLocationByExtension ? this.formRoute : this.createLocation || this.formRoute;
    },

    _yamlCreateLocation() {
      return this.yamlCreateLocation || this.yamlRoute;
    },

    _createButtonlabel() {
      const overrideLabel = this.$store.getters['type-map/optionsFor'](this.resource).listCreateButtonLabelKey;

      if (overrideLabel) {
        return this.t(overrideLabel);
      }

      return this.createButtonLabel || this.t('resourceList.head.create');
    },
  }
};
</script>

<template>
  <header class="with-subheader">
    <slot name="typeDescription">
      <TypeDescription :resource="resource" />
    </slot>
    <div class="title">
      <h1 class="m-0">
        <TabTitle>{{ _typeDisplay }}</TabTitle> <Favorite
          v-if="isExplorer && showFavorite"
          :resource="favoriteResource || resource"
        />
      </h1>
      <ResourceLoadingIndicator
        v-if="showIncrementalLoadingIndicator"
        :resources="loadResources"
        :indeterminate="loadIndeterminate"
      />
    </div>
    <div class="sub-header">
      <slot name="subHeader">
        <!--Slot content-->
      </slot>
    </div>
    <div class="actions-container">
      <slot name="actions">
        <div class="actions">
          <slot name="extraActions" />

          <slot name="createButton">
            <RcButton
              v-if="hasEditComponent && _isCreatable"
              variant="primary"
              size="large"
              :data-testid="componentTestid+'-create'"
              :to="_createLocation"
            >
              {{ _createButtonlabel }}
            </RcButton>
            <RcButton
              v-else-if="_isYamlCreatable"
              variant="primary"
              size="large"
              :data-testid="componentTestid+'-create-yaml'"
              :to="_yamlCreateLocation"
            >
              {{ t("resourceList.head.createFromYaml") }}
            </RcButton>
          </slot>
        </div>
      </slot>
    </div>
  </header>
</template>

<style lang="scss" scoped>
  .title {
    align-items: center;
    display: flex;
    h1 {
      margin: 0;
    }
  }

  header {
    margin-bottom: 20px;
  }

  header.with-subheader {
    grid-template-areas:
      'type-banner type-banner'
      'title actions'
      'sub-header sub-header'
      'state-banner state-banner';
    margin-bottom: 24px;
  }

  .sub-header {
    grid-area: sub-header;

    a {
      display: inline-block;
    }
  }
</style>
