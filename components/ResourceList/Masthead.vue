<script>
import { mapGetters } from 'vuex';
import Favorite from '@/components/nav/Favorite';
import TypeDescription from '@/components/TypeDescription';
import { get } from '@/utils/object';
import { AS, _YAML } from '@/config/query-params';

export default {
  components: {
    Favorite,
    TypeDescription,
  },
  props: {
    resource: {
      type:     String,
      required: true,
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
  },

  data() {
    const params = { ...this.$route.params };
    const resource = params.resource;

    const formRoute = { name: `${ this.$route.name }-create`, params };

    const hasEditComponent = this.$store.getters['type-map/hasCustomEdit'](resource);

    const yamlRoute = {
      name:  `${ this.$route.name }-create`,
      params,
      query: { [AS]: _YAML },
    };

    return {
      formRoute,
      yamlRoute,
      hasEditComponent,
    };
  },

  computed: {
    get,
    ...mapGetters(['isExplorer']),

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

      return this.schema && this._isCreatable && this.$store.getters['type-map/optionsFor'](this.$route.params.resource).canYaml;
    },

    _isCreatable() {
      // Does not take into account hasEditComponent, such that _isYamlCreatable works
      if ( this.isCreatable !== null) {
        return this.isCreatable;
      }

      // blocked-post means you can post through norman, but not through steve.
      if ( this.schema && !this.schema?.collectionMethods.find(x => ['blocked-post', 'post'].includes(x.toLowerCase())) ) {
        return false;
      }

      return this.$store.getters['type-map/optionsFor'](this.$route.params.resource).isCreatable;
    },

    _createLocation() {
      return this.createLocation || this.formRoute;
    },

    _yamlCreateLocation() {
      return this.yamlCreateLocation || this.yamlRoute;
    }

  },
};
</script>

<template>
  <header>
    <TypeDescription :resource="resource" />
    <div class="title">
      <h1 class="m-0">
        {{ _typeDisplay }} <Favorite v-if="isExplorer" :resource="resource" />
      </h1>
    </div>
    <div class="actions-container">
      <div class="actions">
        <slot name="extraActions">
        </slot>

        <n-link
          v-if="hasEditComponent && _isCreatable"
          :to="_createLocation"
          class="btn role-primary"
        >
          {{ t("resourceList.head.create") }}
        </n-link>
        <n-link
          v-else-if="_isYamlCreatable"
          :to="_yamlCreateLocation"
          class="btn role-primary"
        >
          {{ t("resourceList.head.createFromYaml") }}
        </n-link>
      </div>
    </div>
  </header>
</template>
