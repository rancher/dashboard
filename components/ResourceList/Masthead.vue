<script>
import Favorite from '@/components/nav/Favorite';

export default {
  components: { Favorite },
  props:      {
    resource: {
      type:     String,
      required: true
    },
    typeDisplay: {
      type:    String,
      default: ''
    },
    isCreatable: {
      type:    Boolean,
      default: false
    },
    isYamlCreatable: {
      type:    Boolean,
      default: false,
    },
    createLocation: {
      type:    Object,
      default: null
    },
    yamlCreateLocation: {
      type:    Object,
      default: null
    }
  },

  computed: {},
  methods:  {}
};
</script>

<template>
  <header>
    <h1>
      {{ typeDisplay }} <Favorite :resource="resource" />
    </h1>
    <div class="actions">
      <nuxt-link
        v-if="isYamlCreatable"
        :to="yamlCreateLocation"
        tag="button"
        type="button"
        class="btn bg-primary mr-10"
      >
        {{ t('resourceList.head.createFromYaml') }}
      </nuxt-link>
      <nuxt-link
        v-if="isCreatable"
        :to="createLocation"
        tag="button"
        type="button"
        class="btn bg-primary"
      >
        {{ t('resourceList.head.create') }}
      </nuxt-link>
    </div>
  </header>
</template>

<style lang='scss'>
</style>
