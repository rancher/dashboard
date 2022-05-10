<script>
export default {
  props:  {
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
};
</script>

<template>
  <a v-if="row.isUrl" rel="nofollow noopener noreferrer" target="_blank" :href="`${row.fullPath}`">{{ row.fullPath }}</a>
  <span v-else>{{ row.fullPath }}</span>
</template>
