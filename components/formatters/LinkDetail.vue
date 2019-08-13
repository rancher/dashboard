<script>

export default {
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    }
  },
};
</script>

<template>
  <span>
    <nuxt-link :to="row.id">
      {{ row.displayName }}
    </nuxt-link>
  </span>
</template>
