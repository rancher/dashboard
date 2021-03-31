<script>
import BannerGraphic from '@/components/BannerGraphic';
import IndentedPanel from '@/components/IndentedPanel';

export default {
  layout: 'home',

  components:      {
    BannerGraphic,
    IndentedPanel,
  },
};

</script>
<template>
  <div class="home-page">
    <BannerGraphic :small="true" title="Welcome to Rancher" />
    <IndentedPanel class="mt-20">
      <h1>Insert Home Page Here</h1>
    </IndentedPanel>
  </div>
</template>
<style lang="scss">
.home-page {
  .search {
    background-color: transparent;
    padding: 8px;
  }
}
</style>
