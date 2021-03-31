<script>
export default {
  props: {
    title: {
      type:    String,
      default: null,
    },
  },
};
</script>

<template>
  <div class="simple-box" v-on="$listeners">
    <h2 v-if="title">
      {{ title }}
    </h2>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss">
.simple-box {
  $padding: 15px;

  border-radius: 6px;
  background: var(--simple-box-bg) 0% 0% no-repeat padding-box;
  box-shadow: 0px 0px 10px var(--simple-box-shadow);
  border: 1px solid var(--simple-box-border);
  padding: $padding;

  h2 {
    line-height: 24px;
    font-size: 18px;
    border-bottom: 1px solid var(--simple-box-divider);
    padding-bottom: $padding;
    margin: 0 -15px 10px -15px;
    padding: 0 15px 15px 15px;
  }

  .content {
    padding: $padding;
  }

  .sortable-table {
    border: solid thin var(--border);
    box-shadow: none;
  }
}
</style>
