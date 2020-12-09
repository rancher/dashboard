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
};
</script>

<template>
  <header>
    <TypeDescription :resource="resource" />
    <div class="title">
      <h1 class="m-0">
        {{ typeDisplay }} <Favorite v-if="isExplorer" :resource="resource" />
      </h1>
    </div>
    <div class="actions-container">
      <div class="actions">
        <n-link
          v-if="isCreatable"
          :to="createLocation"
          class="btn role-primary"
        >
          {{ t("resourceList.head.create") }}
        </n-link>
        <n-link
          v-else-if="isYamlCreatable"
          :to="yamlCreateLocation"
          class="btn role-primary"
        >
          {{ t("resourceList.head.createFromYaml") }}
        </n-link>
      </div>
    </div>
  </header>
</template>
