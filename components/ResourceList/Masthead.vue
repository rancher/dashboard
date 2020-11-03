<script>
import { mapGetters } from 'vuex';
import Favorite from '@/components/nav/Favorite';
import TypeDescription from '@/components/TypeDescription';
import { get } from '@/utils/object';

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
      default: '',
    },
    isCreatable: {
      type:    Boolean,
      default: false,
    },
    isYamlCreatable: {
      type:    Boolean,
      default: false,
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

  computed: {
    get,
    ...mapGetters(['isExplorer']),

    resourceName() {
      if (this.schema) {
        return this.$store.getters['type-map/labelFor'](this.schema);
      }

      return this.resource;
    },
  },

  methods: {
    createButtonOptions() {
      const { isCreatable, isYamlCreatable } = this;

      if (isCreatable || isYamlCreatable) {
        if (isCreatable) {
          return this.t('resourceList.head.create');
        } else if (!isCreatable && isYamlCreatable) {
          return this.t('resourceList.head.createFromYaml');
        } else {
          return this.t('resourceList.head.create');
        }
      }
    },
    dropdownOptions() {
      return [
        {
          label:    this.t('resourceList.head.createResource', { resourceName: this.resourceName }),
          to:       this.createLocation,
          disabled: !this.isCreatable,
        },
        {
          label:    this.t('resourceList.head.createFromYaml'),
          to:       this.yamlCreateLocation,
          disabled: !this.isYamlCreatable,
        },
      ];
    },
    menuAction(option) {
      if (!option?.disabled) {
        this.$router.push(option.to);
      }
    },
  },
};
</script>

<template>
  <header>
    <TypeDescription :resource="resource" />
    <h1>
      {{ typeDisplay }} <Favorite v-if="isExplorer" :resource="resource" />
    </h1>
    <div class="actions">
      <nuxt-link
        v-if="isCreatable"
        :to="createLocation"
        class="btn role-primary"
      >
        {{ t('resourceList.head.create') }}
      </nuxt-link>
      <nuxt-link
        v-if="isYamlCreatable"
        :to="yamlCreateLocation"
        class="btn role-primary"
      >
        {{ t('resourceList.head.createFromYaml') }}
      </nuxt-link>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.actions {
  grid-column: max-content;
}
</style>
