<script>
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'DetailTopComponent',
  components: { Banner },
  data() {
    return { key: 'asdasd' };
  }
};
</script>

<template>
  <div>
    <br>
    <Banner
      color="warning"
    >
      This is an example on DetailTop
    </Banner>
  </div>
</template>

<style lang="scss" scoped>

</style>
