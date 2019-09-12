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
    },
    col: {
      type:     Object,
      required: true
    },
  },
};
</script>

<template>
  <span>
    <nuxt-link :to="row.id" append>
      {{ row.nameDisplay }}
    </nuxt-link>
  </span>
</template>
