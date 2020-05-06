<script>
export default {
  props:
    {
      value: {
        type:     Object,
        required: true
      }
    }
};
</script>

<template>
  <a v-if="value.url && value.options && (value.options.rel || value.options.target)" :href="value.url" :rel="value.options.rel" :target="value.options.target">
    {{ value.text || value.url }}
  </a>
  <nuxt-link v-else-if="value.url" :to="value.url">
    {{ value.text || value.url }}
  </nuxt-link>
  <span v-else>{{ value.text }}</span>
</template>
