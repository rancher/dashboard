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
  <nuxt-link v-if="value.url" :to="value.url">
    {{ value.text || value.url }}
  </nuxt-link>
  <span v-else>{{ value.text }}</span>
</template>
