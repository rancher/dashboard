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
    <router-link :to="row.detailLocation">
      {{ value }}
    </router-link>
    <br>
    <span class="text-small text-muted">
      {{ row.imageDisplay }}
    </span>
  </span>
</template>
