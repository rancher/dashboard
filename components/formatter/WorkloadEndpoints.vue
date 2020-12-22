<script>
export default {
  props: {
    value: {
      type:     String,
      required: true
    }
  },

  data() {
    const endpoints = this.value.split(',');

    return { endpoints };
  }
};
</script>

<template>
  <span>
    <template v-for="endpoint in endpoints">
      <a :key="endpoint" rel="nofollow noopener noreferrer" target="_blank" :href="`//${endpoint}`">{{ endpoint }}</a>
      <br :key="endpoint" />
    </template>
  </span>
</template>
