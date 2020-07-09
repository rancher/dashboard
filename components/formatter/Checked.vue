<script>

export default {
  props:      {
    value: {
      type:    Boolean,
      default: true
    },
  }
};
</script>

<template>
  <span>
    <span v-if="value">
      <span>
        <i class="icon icon-lg icon-checkmark" />
      </span>
    </span>
    <span v-else>
      <span>
        <i class="icon icon-lg icon-x" />
      </span>
    </span>
  </span>
</template>
