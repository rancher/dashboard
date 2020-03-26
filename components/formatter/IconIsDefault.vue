<script>
export default {
  props: {
    /**
     * Object containing keys to validate presence of
     * @model
     */
    row: {
      type:     Object,
      required: true
    },
    /**
     * KV Pair containing the key to reference in the row
     */
    col: {
      type:     Object,
      default: () => {}
    },
  },
};
</script>

<template>
  <span v-if="row[col.value]">
    <span>
      <i class="icon icon-2x icon-checkmark" />
    </span>
  </span>
  <span v-else>
    <span>
      <i class="icon icon-2x icon-x" />
    </span>
  </span>
</template>
