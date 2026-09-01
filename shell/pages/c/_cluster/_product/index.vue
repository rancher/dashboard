<script>
export default {
  computed: {
    product() {
      return this.$route.params.product;
    }
  }
};
</script>

<template>
  <div>
    Default dashboard for {{ product }}
  </div>
</template>
