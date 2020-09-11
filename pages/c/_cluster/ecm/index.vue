<script>

export default {
  layout: 'plain',

  mounted() {
    const link = this.$store.getters['backToRancherLink'];

    window.location.href = link;
  }
};
</script>

<template>
  <div>Redirecting...</div>
</template>
