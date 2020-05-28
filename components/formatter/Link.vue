<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    const defaultOptions = {
      rel:    'nofollow noopener noreferrer',
      target: '_blank'
    };

    return { options: this.value.options || defaultOptions };
  }
};
</script>

<template>
  <nuxt-link v-if="options === 'internal' && value.url" :to="value.url">
    {{ value.text || value.url }}
  </nuxt-link>
  <a v-else-if="value.url && (options.rel || options.target)" :href="value.url" :rel="options.rel" :target="options.target">
    {{ value.text || value.url }}
  </a>
  <span v-else>{{ value.text }}</span>
</template>
