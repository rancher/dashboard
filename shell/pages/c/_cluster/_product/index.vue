<script>
export default {
  data() {
    // Set ready to false initially, so we don't render anything until after we have checked for a redirect
    return { ready: false };
  },

  beforeCreate() {
    // Lookup the product to see if it has a default page or resource
    const product = this.$store.getters['currentProduct']

    if (product?.to) {
      const destination = this.$router.resolve(product.to);

      if (destination?.fullPath !== this.$route.fullPath) {
        return this.$router.replace(product.to);
      }
    }

    this.ready = true;
  },

  computed: {
    product() {
      return this.$route.params.product;
    }
  }
};
</script>

<template>
  <div v-if="ready">
    Default view for {{ product }}
  </div>
</template>
